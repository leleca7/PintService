import 'server-only';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import type { DataSource } from '@/lib/dashboard-data';
import { normalizeOperationalStage } from '@/lib/operation-stages';
import type { PartsStatus } from '@/lib/parts-data';

export type EntryQueueStatus = 'Aguardando' | 'Contato realizado' | 'Confirmado' | 'Movido para Produção' | 'Cancelado';

export type EntryQueueItem = {
  id: string;
  placa: string;
  modelo: string;
  clienteNome: string;
  telefone: string;
  origem: string;
  seguradora: string;
  dataAutorizacao: string;
  prioridadeManual: number | null;
  status: EntryQueueStatus;
  dataEntradaCombinada: string | null;
  observacoes: string;
  posicaoFila: number;
  diasAguardando: number;
  podeEntrarHoje: boolean;
  dataSugerida: string | null;
  sugestaoConfiavel: boolean;
  statusPecas: PartsStatus;
  pecasRecebidas: number;
  pecasTotal: number;
  liberadoEntrada: boolean;
};

export type EntryAgendaItem = Pick<EntryQueueItem,
  'id' | 'placa' | 'modelo' | 'clienteNome' | 'origem' | 'seguradora' | 'status' | 'dataEntradaCombinada' | 'observacoes'
>;

export type EntryQueueData = {
  source: DataSource;
  queue: EntryQueueItem[];
  agenda: EntryAgendaItem[];
  capacidadeDesmontagem: number;
  emDesmontagem: number;
  vagasHoje: number;
  previsoesValidas: number;
  canManage: boolean;
  error?: string;
};

function dateOnly(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function todayInBahia() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function daysBetween(start: string, end: string) {
  const startMs = Date.parse(`${start}T12:00:00Z`);
  const endMs = Date.parse(`${end}T12:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;
  return Math.max(0, Math.floor((endMs - startMs) / 86_400_000));
}

function derivePartsStatus(orderCount: number, total: number, recebidas: number): PartsStatus {
  if (orderCount === 0) return 'Sem Pedido';
  if (recebidas === 0) return 'Nenhuma Recebida';
  if (total > 0 && recebidas < total) return 'Parcial';
  if (total > 0 && recebidas >= total) return 'Completo';
  return 'Nenhuma Recebida';
}

export async function getEntryQueueData(): Promise<EntryQueueData> {
  const empty: EntryQueueData = {
    source: 'demo', queue: [], agenda: [], capacidadeDesmontagem: 0, emDesmontagem: 0,
    vagasHoje: 0, previsoesValidas: 0, canManage: false,
  };
  if (!isDatabaseConfigured()) return empty;

  try {
    const user = await getCurrentAppUser();
    if (!user?.ativo || !userHasPermission(user, 'gerenciar_fila_entrada')) {
      return { ...empty, source: 'error', error: 'Acesso à fila de entrada não autorizado.' };
    }

    const sql = getDb();
    const [queueRows, capacityRows, vehicleRows, partsRows] = await Promise.all([
      sql`
        SELECT id, placa, modelo, cliente_nome, telefone, origem, seguradora, data_autorizacao,
               prioridade_manual, status, data_entrada_combinada, observacoes, criado_em
        FROM fila_entrada
        WHERE status NOT IN ('Movido para Produção','Cancelado')
        ORDER BY (prioridade_manual IS NULL) ASC, prioridade_manual ASC NULLS LAST,
                 data_autorizacao ASC, criado_em ASC
      `,
      sql`SELECT capacidade_maxima FROM capacidade_fases WHERE fase = 'Desmontagem' LIMIT 1`,
      sql`SELECT setor, previsao_saida FROM veiculos WHERE data_saida_real IS NULL`,
      sql`
        SELECT c.fila_entrada_id, c.placa, c.liberado_entrada,
               COUNT(DISTINCT p.id) FILTER (WHERE p.status <> 'Cancelado')::int AS pedidos_ativos,
               COALESCE(SUM(i.quantidade) FILTER (WHERE p.status <> 'Cancelado'), 0)::int AS total,
               COALESCE(SUM(i.quantidade_recebida) FILTER (WHERE p.status <> 'Cancelado'), 0)::int AS recebidas
        FROM controle_pecas c
        LEFT JOIN pedidos_pecas p ON p.controle_pecas_id = c.id
        LEFT JOIN itens_pedido_pecas i ON i.pedido_id = p.id
        WHERE c.encerrado_em IS NULL
        GROUP BY c.id, c.fila_entrada_id, c.placa, c.liberado_entrada
      `,
    ]);

    const partsByQueue = new Map<string, any>();
    const partsByPlate = new Map<string, any>();
    for (const row of partsRows) {
      if (row.fila_entrada_id) partsByQueue.set(String(row.fila_entrada_id), row);
      partsByPlate.set(String(row.placa ?? '').toUpperCase(), row);
    }

    const today = todayInBahia();
    const capacidadeDesmontagem = Number(capacityRows[0]?.capacidade_maxima ?? 0);
    const dismantling = vehicleRows.filter((row: any) => normalizeOperationalStage(String(row.setor ?? '')) === 'Desmontagem');
    const emDesmontagem = dismantling.length;
    const saldoVagas = capacidadeDesmontagem - emDesmontagem;
    const vagasHoje = Math.max(0, saldoVagas);
    const releaseDates = dismantling
      .map((row: any) => dateOnly(row.previsao_saida))
      .filter((value): value is string => Boolean(value && value >= today))
      .sort((a, b) => a.localeCompare(b));

    const queue: EntryQueueItem[] = queueRows.map((row: any, index: number) => {
      const posicaoFila = index + 1;
      const podeEntrarHoje = posicaoFila <= vagasHoje;
      let dataSugerida: string | null = null;
      let sugestaoConfiavel = false;

      if (podeEntrarHoje) {
        dataSugerida = today;
        sugestaoConfiavel = true;
      } else {
        const saidasNecessarias = posicaoFila - saldoVagas;
        dataSugerida = releaseDates[saidasNecessarias - 1] ?? null;
        sugestaoConfiavel = Boolean(dataSugerida);
      }

      const dataAutorizacao = dateOnly(row.data_autorizacao) ?? today;
      const parts = partsByQueue.get(String(row.id)) ?? partsByPlate.get(String(row.placa ?? '').toUpperCase());
      const pedidosAtivos = Number(parts?.pedidos_ativos ?? 0);
      const pecasTotal = Number(parts?.total ?? 0);
      const pecasRecebidas = Number(parts?.recebidas ?? 0);

      return {
        id: String(row.id),
        placa: String(row.placa ?? ''),
        modelo: String(row.modelo ?? ''),
        clienteNome: String(row.cliente_nome ?? ''),
        telefone: String(row.telefone ?? ''),
        origem: String(row.origem ?? ''),
        seguradora: String(row.seguradora ?? ''),
        dataAutorizacao,
        prioridadeManual: row.prioridade_manual == null ? null : Number(row.prioridade_manual),
        status: String(row.status ?? 'Aguardando') as EntryQueueStatus,
        dataEntradaCombinada: dateOnly(row.data_entrada_combinada),
        observacoes: String(row.observacoes ?? ''),
        posicaoFila,
        diasAguardando: daysBetween(dataAutorizacao, today),
        podeEntrarHoje,
        dataSugerida,
        sugestaoConfiavel,
        statusPecas: derivePartsStatus(pedidosAtivos, pecasTotal, pecasRecebidas),
        pecasRecebidas,
        pecasTotal,
        liberadoEntrada: Boolean(parts?.liberado_entrada),
      };
    });

    const agenda: EntryAgendaItem[] = queue
      .filter((item) => Boolean(item.dataEntradaCombinada))
      .sort((a, b) => String(a.dataEntradaCombinada).localeCompare(String(b.dataEntradaCombinada)))
      .map(({ id, placa, modelo, clienteNome, origem, seguradora, status, dataEntradaCombinada, observacoes }) => ({
        id, placa, modelo, clienteNome, origem, seguradora, status, dataEntradaCombinada, observacoes,
      }));

    return {
      source: 'live',
      queue,
      agenda,
      capacidadeDesmontagem,
      emDesmontagem,
      vagasHoje,
      previsoesValidas: releaseDates.length,
      canManage: true,
    };
  } catch (error) {
    console.error('Falha ao carregar fila de entrada:', error);
    return {
      ...empty,
      source: 'error',
      error: error instanceof Error ? error.message : 'Falha ao carregar fila de entrada.',
    };
  }
}

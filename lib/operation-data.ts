import 'server-only';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import type { DataSource } from '@/lib/dashboard-data';

export type OperationalVehicle = {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  cliente: string;
  seguradora: string;
  etapa: string;
  status: string;
  dataEntrada: string | null;
  previsaoSaida: string | null;
  responsavel: string;
  prioridade: number | null;
  observacoes: string;
  ultimaAtualizacao: string | null;
};

export type OperationData = {
  source: DataSource;
  error?: string;
  vehicles: OperationalVehicle[];
};

function dateOnly(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function iso(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export async function getOperationData(): Promise<OperationData> {
  if (!isDatabaseConfigured()) return { source: 'demo', vehicles: [] };

  try {
    const user = await getCurrentAppUser();
    if (!user?.ativo) return { source: 'error', error: 'Usuário sem perfil ativo.', vehicles: [] };

    const sql = getDb();
    const canSeeAll = userHasPermission(user, 'ver_todos_veiculos');
    const sector = user.setor ?? '';

    const rows = canSeeAll
      ? await sql`
          SELECT v.id, v.placa, v.modelo, v.cor, v.seguradora, v.setor, v.status,
                 v.data_entrada, v.previsao_saida, v.prioridade, v.observacoes,
                 v.ultima_atualizacao, c.nome AS cliente_nome, f.nome AS responsavel_nome
          FROM veiculos v
          LEFT JOIN clientes c ON c.id = v.cliente_id
          LEFT JOIN funcionarios f ON f.id = v.responsavel_id
          WHERE v.data_saida_real IS NULL
          ORDER BY v.prioridade ASC NULLS LAST, v.data_entrada ASC NULLS LAST, v.ultima_atualizacao ASC
        `
      : await sql`
          SELECT v.id, v.placa, v.modelo, v.cor, v.seguradora, v.setor, v.status,
                 v.data_entrada, v.previsao_saida, v.prioridade, v.observacoes,
                 v.ultima_atualizacao, c.nome AS cliente_nome, f.nome AS responsavel_nome
          FROM veiculos v
          LEFT JOIN clientes c ON c.id = v.cliente_id
          LEFT JOIN funcionarios f ON f.id = v.responsavel_id
          WHERE v.data_saida_real IS NULL
            AND lower(coalesce(v.setor, '')) = lower(${sector})
          ORDER BY v.prioridade ASC NULLS LAST, v.data_entrada ASC NULLS LAST, v.ultima_atualizacao ASC
        `;

    return {
      source: 'live',
      vehicles: rows.map((row: any) => ({
        id: String(row.id),
        placa: String(row.placa ?? ''),
        modelo: String(row.modelo ?? 'Veículo'),
        cor: String(row.cor ?? ''),
        cliente: String(row.cliente_nome ?? 'Cliente não informado'),
        seguradora: String(row.seguradora ?? ''),
        etapa: String(row.setor ?? ''),
        status: String(row.status ?? ''),
        dataEntrada: dateOnly(row.data_entrada),
        previsaoSaida: dateOnly(row.previsao_saida),
        responsavel: String(row.responsavel_nome ?? ''),
        prioridade: row.prioridade == null ? null : Number(row.prioridade),
        observacoes: String(row.observacoes ?? ''),
        ultimaAtualizacao: iso(row.ultima_atualizacao),
      })),
    };
  } catch (error) {
    console.error('Falha ao carregar modo operação:', error);
    return { source: 'error', error: error instanceof Error ? error.message : 'Falha ao carregar operação.', vehicles: [] };
  }
}

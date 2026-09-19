import 'server-only';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import type { DataSource } from '@/lib/dashboard-data';

export type PostDeliveryPendingItem = {
  id: string;
  vehicleId: string;
  placa: string;
  modelo: string;
  cliente: string;
  telefone: string;
  descricao: string;
  status: string;
  fornecedor: string;
  numeroPedido: string;
  previsao: string | null;
  responsavelId: string | null;
  responsavel: string;
  criadoEm: string | null;
  atualizadoEm: string | null;
};

export type PostDeliveryPendingData = {
  source: DataSource;
  items: PostDeliveryPendingItem[];
  error?: string;
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

export async function getPostDeliveryPendingData(): Promise<PostDeliveryPendingData> {
  if (!isDatabaseConfigured()) return { source: 'demo', items: [] };
  try {
    const user = await getCurrentAppUser();
    if (!user?.ativo || !userHasPermission(user, 'atualizar_operacao_veiculos')) {
      return { source: 'error', items: [], error: 'Acesso ao pós-entrega não autorizado.' };
    }

    const sql = getDb();
    const rows = await sql`
      SELECT p.id, p.veiculo_id, p.descricao, p.status, p.fornecedor, p.numero_pedido,
             p.previsao, p.responsavel_id, p.criado_em, p.atualizado_em,
             v.placa, v.modelo, c.nome AS cliente_nome, c.telefone,
             f.nome AS responsavel_nome
      FROM pendencias_pos_entrega p
      JOIN veiculos v ON v.id = p.veiculo_id
      LEFT JOIN clientes c ON c.id = p.cliente_id
      LEFT JOIN funcionarios f ON f.id = p.responsavel_id
      WHERE p.status NOT IN ('resolvida','cancelada')
      ORDER BY
        CASE p.status
          WHEN 'aguardando_agendamento' THEN 0
          WHEN 'aberta' THEN 1
          WHEN 'aguardando_peca' THEN 2
          ELSE 3
        END,
        p.previsao ASC NULLS LAST,
        p.criado_em ASC
    `;

    const items = rows
      .filter((row: any) => user.perfil !== 'funcionario' || !row.responsavel_id || String(row.responsavel_id) === String(user.funcionarioId ?? ''))
      .map((row: any): PostDeliveryPendingItem => ({
        id: String(row.id),
        vehicleId: String(row.veiculo_id),
        placa: String(row.placa ?? ''),
        modelo: String(row.modelo ?? 'Veículo'),
        cliente: String(row.cliente_nome ?? 'Cliente não informado'),
        telefone: String(row.telefone ?? ''),
        descricao: String(row.descricao ?? ''),
        status: String(row.status ?? 'aberta'),
        fornecedor: String(row.fornecedor ?? ''),
        numeroPedido: String(row.numero_pedido ?? ''),
        previsao: dateOnly(row.previsao),
        responsavelId: row.responsavel_id ? String(row.responsavel_id) : null,
        responsavel: String(row.responsavel_nome ?? ''),
        criadoEm: iso(row.criado_em),
        atualizadoEm: iso(row.atualizado_em),
      }));

    return { source: 'live', items };
  } catch (error) {
    console.error('Falha ao carregar pendências pós-entrega:', error);
    return {
      source: 'error',
      items: [],
      error: error instanceof Error ? error.message : 'Falha ao carregar o pós-entrega.',
    };
  }
}

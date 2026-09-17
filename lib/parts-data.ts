import 'server-only';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import type { DataSource } from '@/lib/dashboard-data';

export type PartsStatus = 'Sem Pedido' | 'Nenhuma Recebida' | 'Parcial' | 'Completo';

export type PartsItem = {
  id: string;
  descricao: string;
  codigo: string;
  quantidade: number;
  quantidadeRecebida: number;
  ultimoRecebimentoEm: string | null;
  observacoes: string;
};

export type PartsOrder = {
  id: string;
  fornecedor: string;
  numeroPedido: string;
  dataPedido: string | null;
  previsaoEntrega: string | null;
  status: string;
  observacoes: string;
  items: PartsItem[];
};

export type PartsControl = {
  id: string;
  placa: string;
  modelo: string;
  clienteNome: string;
  filaEntradaId: string | null;
  veiculoId: string | null;
  liberadoEntrada: boolean;
  observacaoLiberacao: string;
  total: number;
  recebidas: number;
  statusPecas: PartsStatus;
  orders: PartsOrder[];
};

export type PartsData = {
  source: DataSource;
  controls: PartsControl[];
  canManage: boolean;
  error?: string;
};

function dateOnly(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function deriveStatus(orderCount: number, total: number, recebidas: number): PartsStatus {
  if (orderCount === 0) return 'Sem Pedido';
  if (recebidas === 0) return 'Nenhuma Recebida';
  if (total > 0 && recebidas < total) return 'Parcial';
  if (total > 0 && recebidas >= total) return 'Completo';
  return 'Nenhuma Recebida';
}

export async function getPartsData(): Promise<PartsData> {
  if (!isDatabaseConfigured()) return { source: 'demo', controls: [], canManage: false };

  try {
    const user = await getCurrentAppUser();
    if (!user?.ativo || !userHasPermission(user, 'gerenciar_pecas')) {
      return { source: 'error', controls: [], canManage: false, error: 'Acesso ao controle de peças não autorizado.' };
    }

    const sql = getDb();
    const [controlRows, orderRows, itemRows] = await Promise.all([
      sql`
        SELECT c.id, c.placa, c.veiculo_id, c.fila_entrada_id, c.liberado_entrada,
               c.observacao_liberacao, v.modelo AS veiculo_modelo,
               f.modelo AS fila_modelo, f.cliente_nome
        FROM controle_pecas c
        LEFT JOIN veiculos v ON v.id = c.veiculo_id
        LEFT JOIN fila_entrada f ON f.id = c.fila_entrada_id
        WHERE c.encerrado_em IS NULL
        ORDER BY c.atualizado_em DESC, c.criado_em DESC
      `,
      sql`
        SELECT id, controle_pecas_id, fornecedor, numero_pedido, data_pedido,
               previsao_entrega, status, observacoes
        FROM pedidos_pecas
        ORDER BY data_pedido DESC, criado_em DESC
      `,
      sql`
        SELECT id, pedido_id, descricao, codigo, quantidade, quantidade_recebida,
               ultimo_recebimento_em, observacoes
        FROM itens_pedido_pecas
        ORDER BY criado_em ASC
      `,
    ]);

    const itemsByOrder = new Map<string, PartsItem[]>();
    for (const row of itemRows) {
      const pedidoId = String(row.pedido_id);
      const current = itemsByOrder.get(pedidoId) ?? [];
      current.push({
        id: String(row.id),
        descricao: String(row.descricao ?? ''),
        codigo: String(row.codigo ?? ''),
        quantidade: Number(row.quantidade ?? 0),
        quantidadeRecebida: Number(row.quantidade_recebida ?? 0),
        ultimoRecebimentoEm: dateOnly(row.ultimo_recebimento_em),
        observacoes: String(row.observacoes ?? ''),
      });
      itemsByOrder.set(pedidoId, current);
    }

    const ordersByControl = new Map<string, PartsOrder[]>();
    for (const row of orderRows) {
      const controlId = String(row.controle_pecas_id);
      const order: PartsOrder = {
        id: String(row.id),
        fornecedor: String(row.fornecedor ?? ''),
        numeroPedido: String(row.numero_pedido ?? ''),
        dataPedido: dateOnly(row.data_pedido),
        previsaoEntrega: dateOnly(row.previsao_entrega),
        status: String(row.status ?? 'Aberto'),
        observacoes: String(row.observacoes ?? ''),
        items: itemsByOrder.get(String(row.id)) ?? [],
      };
      const current = ordersByControl.get(controlId) ?? [];
      current.push(order);
      ordersByControl.set(controlId, current);
    }

    const controls: PartsControl[] = controlRows.map((row: any) => {
      const orders = ordersByControl.get(String(row.id)) ?? [];
      const activeOrders = orders.filter((order) => order.status !== 'Cancelado');
      const total = activeOrders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantidade, 0), 0);
      const recebidas = activeOrders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantidadeRecebida, 0), 0);
      return {
        id: String(row.id),
        placa: String(row.placa ?? ''),
        modelo: String(row.veiculo_modelo ?? row.fila_modelo ?? ''),
        clienteNome: String(row.cliente_nome ?? ''),
        filaEntradaId: row.fila_entrada_id ? String(row.fila_entrada_id) : null,
        veiculoId: row.veiculo_id ? String(row.veiculo_id) : null,
        liberadoEntrada: Boolean(row.liberado_entrada),
        observacaoLiberacao: String(row.observacao_liberacao ?? ''),
        total,
        recebidas,
        statusPecas: deriveStatus(activeOrders.length, total, recebidas),
        orders,
      };
    });

    return { source: 'live', controls, canManage: true };
  } catch (error) {
    console.error('Falha ao carregar controle de peças:', error);
    return {
      source: 'error',
      controls: [],
      canManage: false,
      error: error instanceof Error ? error.message : 'Falha ao carregar controle de peças.',
    };
  }
}

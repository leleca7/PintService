import 'server-only';
import { getDb } from '@/lib/db';

export type PartsLookupItem = {
  descricao: string;
  codigo: string;
  quantidade: number;
  quantidadeRecebida: number;
  ultimoRecebimentoEm: string | null;
  fornecedor: string;
  numeroPedido: string;
  previsaoEntrega: string | null;
};

export type PartsLookupResult =
  | { status: 'no_control'; items: [] }
  | { status: 'no_orders'; items: [] }
  | { status: 'not_matched'; items: PartsLookupItem[] }
  | { status: 'matched'; items: PartsLookupItem[] };

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function dateOnly(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function scoreMatch(query: string, item: PartsLookupItem) {
  const q = normalize(query);
  if (!q) return 1;
  const description = normalize(item.descricao);
  const code = normalize(item.codigo);
  if (description === q || code === q) return 100;
  if (description.includes(q) || q.includes(description)) return 80;
  if (code && (code.includes(q) || q.includes(code))) return 75;

  const tokens = q.split(' ').filter((token) => token.length >= 3);
  if (!tokens.length) return 0;
  const haystack = `${description} ${code}`;
  const matches = tokens.filter((token) => haystack.includes(token)).length;
  return matches === tokens.length ? 60 + matches : matches > 0 ? matches : 0;
}

export async function lookupPartsByPlate(plate: string, query = ''): Promise<PartsLookupResult> {
  const sql = getDb();
  const controls = await sql`
    SELECT id
    FROM controle_pecas
    WHERE upper(placa) = upper(${plate})
      AND encerrado_em IS NULL
    ORDER BY atualizado_em DESC
    LIMIT 1
  `;
  if (!controls[0]) return { status: 'no_control', items: [] };

  const rows = await sql`
    SELECT i.descricao, i.codigo, i.quantidade, i.quantidade_recebida,
           i.ultimo_recebimento_em, p.fornecedor, p.numero_pedido, p.previsao_entrega
    FROM pedidos_pecas p
    JOIN itens_pedido_pecas i ON i.pedido_id = p.id
    WHERE p.controle_pecas_id = ${controls[0].id}
      AND p.status <> 'Cancelado'
    ORDER BY p.data_pedido DESC, i.criado_em ASC
  `;
  if (!rows.length) return { status: 'no_orders', items: [] };

  const items: PartsLookupItem[] = rows.map((row: any) => ({
    descricao: String(row.descricao ?? ''),
    codigo: String(row.codigo ?? ''),
    quantidade: Number(row.quantidade ?? 0),
    quantidadeRecebida: Number(row.quantidade_recebida ?? 0),
    ultimoRecebimentoEm: dateOnly(row.ultimo_recebimento_em),
    fornecedor: String(row.fornecedor ?? ''),
    numeroPedido: String(row.numero_pedido ?? ''),
    previsaoEntrega: dateOnly(row.previsao_entrega),
  }));

  if (!query.trim()) return { status: 'matched', items };

  const ranked = items
    .map((item) => ({ item, score: scoreMatch(query, item) }))
    .filter(({ score }) => score >= 60)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return { status: 'not_matched', items };
  const bestScore = ranked[0].score;
  const matched = ranked.filter(({ score }) => score >= Math.max(60, bestScore - 10)).map(({ item }) => item);
  return { status: 'matched', items: matched };
}

function itemStatus(item: PartsLookupItem) {
  if (item.quantidade > 0 && item.quantidadeRecebida >= item.quantidade) return 'recebida';
  if (item.quantidadeRecebida > 0) return 'parcial';
  return 'pendente';
}

export function formatPartsReply(plate: string, result: PartsLookupResult, query = '') {
  if (result.status === 'no_control') {
    return {
      definitive: false,
      text: `Ainda não existe um controle de peças confirmado no Sistema da Pint para o veículo ${plate}. Vou pedir a conferência à equipe para não te passar uma informação errada.`,
    };
  }
  if (result.status === 'no_orders') {
    return {
      definitive: false,
      text: `O veículo ${plate} está no controle de peças, mas não há itens de pedido registrados nele. Vou pedir a conferência à equipe.`,
    };
  }
  if (result.status === 'not_matched') {
    return {
      definitive: false,
      text: query
        ? `Encontrei o controle de peças do veículo ${plate}, mas não consegui relacionar com segurança “${query}” a um item cadastrado. Vou pedir a equipe para confirmar.`
        : `Encontrei o controle de peças do veículo ${plate}, mas não há informação suficiente para responder com segurança. Vou pedir a equipe para confirmar.`,
    };
  }

  const lines = result.items.slice(0, 5).map((item) => {
    const status = itemStatus(item);
    const quantity = item.quantidade > 1 ? ` (${item.quantidadeRecebida}/${item.quantidade})` : '';
    if (status === 'recebida') {
      return `${item.descricao}: registrada como recebida${quantity}${item.ultimoRecebimentoEm ? ` em ${item.ultimoRecebimentoEm.split('-').reverse().join('/')}` : ''}.`;
    }
    if (status === 'parcial') return `${item.descricao}: recebimento parcial${quantity}.`;
    return `${item.descricao}: ainda sem recebimento confirmado no sistema${item.previsaoEntrega ? `; previsão registrada para ${item.previsaoEntrega.split('-').reverse().join('/')}` : ''}.`;
  });

  const hasMore = result.items.length > 5 ? ` Há mais ${result.items.length - 5} item(ns) registrado(s).` : '';
  return {
    definitive: true,
    text: `Consultei o controle registrado do veículo ${plate}. ${lines.join(' ')}${hasMore}`,
  };
}

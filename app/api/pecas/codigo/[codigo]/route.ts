import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const clean = decodeURIComponent(codigo).trim();
  if (!clean) return NextResponse.json({ items: [] });

  const sql = getDb();
  const rows = await sql`
    SELECT i.id, i.codigo, i.descricao, i.quantidade, i.quantidade_recebida,
           p.id AS pedido_id, p.numero_pedido, p.fornecedor,
           c.veiculo_id, c.placa, v.modelo
    FROM itens_pedido_pecas i
    JOIN pedidos_pecas p ON p.id=i.pedido_id
    JOIN controle_pecas c ON c.id=p.controle_pecas_id
    LEFT JOIN veiculos v ON v.id=c.veiculo_id
    WHERE lower(coalesce(i.codigo,'')) = lower(${clean})
      AND p.status <> 'Cancelado'
    ORDER BY p.data_pedido DESC
    LIMIT 10
  `;
  return NextResponse.json({
    items: rows.map((row: any) => ({
      id: String(row.id),
      codigo: String(row.codigo ?? ''),
      descricao: String(row.descricao ?? ''),
      quantidade: Number(row.quantidade ?? 0),
      recebidas: Number(row.quantidade_recebida ?? 0),
      pedidoId: String(row.pedido_id),
      numeroPedido: String(row.numero_pedido ?? ''),
      fornecedor: String(row.fornecedor ?? ''),
      veiculoId: row.veiculo_id ? String(row.veiculo_id) : null,
      placa: String(row.placa ?? ''),
      modelo: String(row.modelo ?? ''),
    })),
  });
}

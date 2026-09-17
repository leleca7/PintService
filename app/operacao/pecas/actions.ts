'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function normalizedPlate(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function positiveInt(value: string, fallback = 1) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('Quantidade inválida.');
  return parsed;
}

function nonNegativeInt(value: string) {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error('Quantidade recebida inválida.');
  return parsed;
}

function nullableDate(value: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Data inválida.');
  return value;
}

function revalidatePartsPaths() {
  revalidatePath('/operacao');
  revalidatePath('/operacao/pecas');
  revalidatePath('/operacao/fila');
  revalidatePath('/operacao/agenda');
}

export async function createPartsControl(formData: FormData) {
  const user = await requirePermission('gerenciar_pecas');
  const placa = normalizedPlate(text(formData, 'placa'));
  if (!placa) throw new Error('Informe a placa.');

  const sql = getDb();
  const existing = await sql`
    SELECT id FROM controle_pecas
    WHERE upper(placa) = upper(${placa}) AND encerrado_em IS NULL
    LIMIT 1
  `;
  if (existing[0]) return;

  const [queueRows, vehicleRows] = await Promise.all([
    sql`
      SELECT id FROM fila_entrada
      WHERE upper(placa) = upper(${placa})
        AND status NOT IN ('Movido para Produção','Cancelado')
      ORDER BY criado_em DESC LIMIT 1
    `,
    sql`SELECT id FROM veiculos WHERE upper(placa) = upper(${placa}) LIMIT 1`,
  ]);

  const inserted = await sql`
    INSERT INTO controle_pecas (placa, fila_entrada_id, veiculo_id, criado_por)
    VALUES (${placa}, ${queueRows[0]?.id ?? null}, ${vehicleRows[0]?.id ?? null}, ${user.id})
    RETURNING id
  `;
  const id = String(inserted[0].id);
  await writeAudit(user, 'criar_controle_pecas', 'controle_pecas', id, { placa });
  revalidatePartsPaths();
}

export async function updatePartsRelease(formData: FormData) {
  const user = await requirePermission('gerenciar_pecas');
  const id = text(formData, 'id');
  const liberado = text(formData, 'liberado_entrada') === 'on';
  const observacao = text(formData, 'observacao_liberacao');
  if (!id) throw new Error('Controle de peças inválido.');

  const sql = getDb();
  const before = await sql`SELECT placa, liberado_entrada, observacao_liberacao FROM controle_pecas WHERE id = ${id} LIMIT 1`;
  if (!before[0]) throw new Error('Controle de peças não encontrado.');

  await sql`
    UPDATE controle_pecas
    SET liberado_entrada = ${liberado}, observacao_liberacao = ${observacao || null}, atualizado_em = now()
    WHERE id = ${id}
  `;
  await writeAudit(user, 'alterar_liberacao_pecas', 'controle_pecas', id, {
    placa: before[0].placa,
    antes: { liberadoEntrada: before[0].liberado_entrada, observacao: before[0].observacao_liberacao },
    depois: { liberadoEntrada: liberado, observacao },
  });
  revalidatePartsPaths();
}

export async function createPartsOrder(formData: FormData) {
  const user = await requirePermission('gerenciar_pecas');
  const controleId = text(formData, 'controle_id');
  const fornecedor = text(formData, 'fornecedor');
  const numeroPedido = text(formData, 'numero_pedido');
  const dataPedido = nullableDate(text(formData, 'data_pedido'));
  const previsaoEntrega = nullableDate(text(formData, 'previsao_entrega'));
  const observacoes = text(formData, 'observacoes');
  if (!controleId) throw new Error('Controle de peças inválido.');

  const sql = getDb();
  const inserted = await sql`
    INSERT INTO pedidos_pecas
      (controle_pecas_id, fornecedor, numero_pedido, data_pedido, previsao_entrega, observacoes, criado_por)
    VALUES
      (${controleId}, ${fornecedor || null}, ${numeroPedido || null}, COALESCE(${dataPedido}::date, CURRENT_DATE),
       ${previsaoEntrega}, ${observacoes || null}, ${user.id})
    RETURNING id
  `;
  const id = String(inserted[0].id);
  await writeAudit(user, 'criar_pedido_pecas', 'pedidos_pecas', id, { controleId, fornecedor, numeroPedido });
  revalidatePartsPaths();
}

export async function addPartsItem(formData: FormData) {
  const user = await requirePermission('gerenciar_pecas');
  const pedidoId = text(formData, 'pedido_id');
  const descricao = text(formData, 'descricao');
  const codigo = text(formData, 'codigo');
  const quantidade = positiveInt(text(formData, 'quantidade'));
  const observacoes = text(formData, 'observacoes');
  if (!pedidoId || !descricao) throw new Error('Pedido e descrição da peça são obrigatórios.');

  const sql = getDb();
  const inserted = await sql`
    INSERT INTO itens_pedido_pecas (pedido_id, descricao, codigo, quantidade, observacoes)
    VALUES (${pedidoId}, ${descricao}, ${codigo || null}, ${quantidade}, ${observacoes || null})
    RETURNING id
  `;
  const id = String(inserted[0].id);
  await writeAudit(user, 'adicionar_item_pecas', 'itens_pedido_pecas', id, { pedidoId, descricao, quantidade });
  revalidatePartsPaths();
}

export async function updatePartsItemReceipt(formData: FormData) {
  const user = await requirePermission('gerenciar_pecas');
  const id = text(formData, 'id');
  const quantidadeRecebida = nonNegativeInt(text(formData, 'quantidade_recebida'));
  const dataRecebimento = nullableDate(text(formData, 'ultimo_recebimento_em'));
  const observacoes = text(formData, 'observacoes');
  if (!id) throw new Error('Item de peça inválido.');

  const sql = getDb();
  const before = await sql`
    SELECT descricao, quantidade, quantidade_recebida FROM itens_pedido_pecas WHERE id = ${id} LIMIT 1
  `;
  if (!before[0]) throw new Error('Item não encontrado.');
  const quantidade = Number(before[0].quantidade ?? 0);
  if (quantidadeRecebida > quantidade) throw new Error('Quantidade recebida não pode ser maior que a quantidade pedida.');

  await sql`
    UPDATE itens_pedido_pecas
    SET quantidade_recebida = ${quantidadeRecebida},
        ultimo_recebimento_em = ${quantidadeRecebida > 0 ? dataRecebimento : null},
        observacoes = ${observacoes || null}, atualizado_em = now()
    WHERE id = ${id}
  `;
  await writeAudit(user, 'atualizar_recebimento_peca', 'itens_pedido_pecas', id, {
    descricao: before[0].descricao,
    antes: Number(before[0].quantidade_recebida ?? 0),
    depois: quantidadeRecebida,
  });
  revalidatePartsPaths();
}

export async function updatePartsOrderStatus(formData: FormData) {
  const user = await requirePermission('gerenciar_pecas');
  const id = text(formData, 'id');
  const status = text(formData, 'status');
  if (!id || !['Aberto', 'Concluído', 'Cancelado'].includes(status)) throw new Error('Status do pedido inválido.');

  const sql = getDb();
  await sql`UPDATE pedidos_pecas SET status = ${status}, atualizado_em = now() WHERE id = ${id}`;
  await writeAudit(user, 'alterar_status_pedido_pecas', 'pedidos_pecas', id, { status });
  revalidatePartsPaths();
}

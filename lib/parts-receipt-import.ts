import 'server-only';

import { extractPartsReceiptFromMedia, type ExtractedPartsReceipt } from '@/lib/agent';
import { getDb } from '@/lib/db';
import { downloadWhatsAppMedia } from '@/lib/whatsapp-media';
import { sendWhatsAppText, sentWhatsAppMessageId, type IncomingWhatsAppMessage } from '@/lib/whatsapp';
import { advancePostDeliveryFromParts } from '@/lib/operational-intelligence';

type Employee = { id: string; nome: string; setor: string | null; telefone: string | null; cargo: string | null };

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizePlate(value = '') {
  const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(clean) ? clean : '';
}

function positive(value: string) {
  return ['sim', 's', 'confirmo', 'pode confirmar', 'confirmar'].includes(normalize(value).replace(/[.!]+$/g, ''));
}

function negative(value: string) {
  return ['nao', 'n', 'cancelar', 'corrigir', 'nao confirmar'].includes(normalize(value).replace(/[.!]+$/g, ''));
}

function scoreItem(receiptItem: { description: string; code: string }, dbItem: { descricao: string; codigo: string }) {
  const receiptCode = normalize(receiptItem.code);
  const dbCode = normalize(dbItem.codigo);
  if (receiptCode && dbCode && receiptCode === dbCode) return 100;

  const a = normalize(receiptItem.description);
  const b = normalize(dbItem.descricao);
  if (!a || !b) return 0;
  if (a === b) return 90;
  if (a.includes(b) || b.includes(a)) return 80;
  const tokens = a.split(' ').filter((token) => token.length >= 3);
  const matches = tokens.filter((token) => b.includes(token)).length;
  return tokens.length && matches === tokens.length ? 70 : matches >= 2 ? 55 : 0;
}

async function storeImport(input: {
  employeeId: string;
  mediaId: string;
  mimeType: string;
  filename: string;
  extracted: ExtractedPartsReceipt;
  vehicleId?: string | null;
  controlId?: string | null;
  orderId?: string | null;
  proposed?: unknown;
  status: 'aguardando_confirmacao' | 'requer_revisao';
}) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO importacoes_recebimento_pecas (
      funcionario_id, media_id, mime_type, arquivo_nome, dados_extraidos,
      veiculo_id, controle_pecas_id, pedido_id, proposta_recebimento, status
    )
    VALUES (
      ${input.employeeId}, ${input.mediaId}, ${input.mimeType}, ${input.filename},
      ${JSON.stringify(input.extracted)}::jsonb, ${input.vehicleId ?? null}, ${input.controlId ?? null},
      ${input.orderId ?? null}, ${JSON.stringify(input.proposed ?? [])}::jsonb, ${input.status}
    )
    RETURNING id, codigo
  `;
  return rows[0];
}

export async function stagePartsReceiptFromStaff(message: IncomingWhatsAppMessage, employee: Employee) {
  if (!employee.telefone || !message.mediaId || !['image', 'document'].includes(message.type)) return { handled: false as const };

  const media = await downloadWhatsAppMedia(message.mediaId);
  const extracted = await extractPartsReceiptFromMedia(media);
  const plate = normalizePlate(extracted.plate);

  if (!plate || extracted.confidence < 0.55 || !extracted.items.length) {
    const imported = await storeImport({
      employeeId: employee.id,
      mediaId: message.mediaId,
      mimeType: media.mimeType,
      filename: media.filename,
      extracted,
      status: 'requer_revisao',
    });
    await sendWhatsAppText(
      employee.telefone,
      `Recebi o documento #${imported.codigo}, mas não consegui relacionar tudo com segurança. ${!plate ? 'A placa não ficou clara. ' : ''}Envie novamente a imagem/PDF com a placa na legenda ou faça o recebimento pelo painel. Não alterei nenhuma peça.`,
      message.id,
    );
    return { handled: true as const, review: true as const };
  }

  const sql = getDb();
  const controls = await sql`
    SELECT c.id, c.veiculo_id, v.modelo
    FROM controle_pecas c
    LEFT JOIN veiculos v ON v.id = c.veiculo_id
    WHERE upper(c.placa) = upper(${plate}) AND c.encerrado_em IS NULL
    ORDER BY c.atualizado_em DESC
    LIMIT 1
  `;
  const control = controls[0];
  if (!control) {
    const imported = await storeImport({
      employeeId: employee.id,
      mediaId: message.mediaId,
      mimeType: media.mimeType,
      filename: media.filename,
      extracted,
      status: 'requer_revisao',
    });
    await sendWhatsAppText(employee.telefone, `Documento #${imported.codigo} lido para a placa ${plate}, mas não existe controle de peças ativo para esse veículo. Não registrei recebimento.`, message.id);
    return { handled: true as const, review: true as const };
  }

  const rows = await sql`
    SELECT i.id, i.pedido_id, i.descricao, i.codigo, i.quantidade, i.quantidade_recebida,
           p.fornecedor, p.numero_pedido
    FROM pedidos_pecas p
    JOIN itens_pedido_pecas i ON i.pedido_id = p.id
    WHERE p.controle_pecas_id = ${control.id} AND p.status <> 'Cancelado'
    ORDER BY p.data_pedido DESC, i.criado_em ASC
  `;

  const proposed: Array<{ itemId: string; pedidoId: string; descricao: string; incremento: number; atual: number; total: number }> = [];
  for (const incoming of extracted.items) {
    const candidates = rows
      .map((row: any) => ({
        row,
        score: scoreItem(
          { description: incoming.description, code: incoming.code },
          { descricao: String(row.descricao ?? ''), codigo: String(row.codigo ?? '') },
        ),
      }))
      .filter(({ score }: any) => score >= 55)
      .sort((a: any, b: any) => b.score - a.score);

    if (!candidates.length) continue;
    const best = candidates[0].row;
    const current = Number(best.quantidade_recebida ?? 0);
    const total = Number(best.quantidade ?? 0);
    const remaining = Math.max(0, total - current);
    const increment = Math.min(remaining, Math.max(1, Number(incoming.quantity ?? 1)));
    if (!increment) continue;
    if (proposed.some((item) => item.itemId === String(best.id))) continue;
    proposed.push({
      itemId: String(best.id),
      pedidoId: String(best.pedido_id),
      descricao: String(best.descricao ?? incoming.description),
      incremento: increment,
      atual: current,
      total,
    });
  }

  if (!proposed.length) {
    const imported = await storeImport({
      employeeId: employee.id,
      mediaId: message.mediaId,
      mimeType: media.mimeType,
      filename: media.filename,
      extracted,
      vehicleId: control.veiculo_id ? String(control.veiculo_id) : null,
      controlId: String(control.id),
      status: 'requer_revisao',
    });
    await sendWhatsAppText(employee.telefone, `Li o documento #${imported.codigo} da placa ${plate}, mas não consegui casar as peças com os itens do pedido sem risco de erro. Não registrei recebimento.`, message.id);
    return { handled: true as const, review: true as const };
  }

  const orderIds = [...new Set(proposed.map((item) => item.pedidoId))];
  const imported = await storeImport({
    employeeId: employee.id,
    mediaId: message.mediaId,
    mimeType: media.mimeType,
    filename: media.filename,
    extracted,
    vehicleId: control.veiculo_id ? String(control.veiculo_id) : null,
    controlId: String(control.id),
    orderId: orderIds.length === 1 ? orderIds[0] : null,
    proposed,
    status: 'aguardando_confirmacao',
  });

  const lines = proposed.map((item) => `• ${item.descricao}: +${item.incremento} (ficará ${Math.min(item.total, item.atual + item.incremento)}/${item.total})`);
  const text = [
    `Conferi o documento #${imported.codigo} para ${control.modelo ? `${control.modelo} — ` : ''}${plate}.`,
    extracted.supplier ? `Fornecedor: ${extracted.supplier}` : '',
    extracted.documentNumber ? `Documento: ${extracted.documentNumber}` : '',
    '',
    'Vou registrar:',
    ...lines,
    '',
    'Responda SIM nesta mensagem para confirmar o recebimento.',
    'Responda NÃO para cancelar. Nenhuma quantidade foi alterada ainda.',
  ].filter(Boolean).join('\n');

  const response = await sendWhatsAppText(employee.telefone, text, message.id);
  const outboundId = sentWhatsAppMessageId(response);
  if (outboundId) {
    await sql`UPDATE importacoes_recebimento_pecas SET mensagem_confirmacao_id = ${outboundId}, atualizado_em = now() WHERE id = ${imported.id}`;
  }
  return { handled: true as const, staged: true as const };
}

export async function findPartsReceiptImportByReply(message: IncomingWhatsAppMessage, employee: Employee) {
  if (!message.contextMessageId) return null;
  const sql = getDb();
  const rows = await sql`
    SELECT *
    FROM importacoes_recebimento_pecas
    WHERE funcionario_id = ${employee.id}
      AND mensagem_confirmacao_id = ${message.contextMessageId}
      AND status = 'aguardando_confirmacao'
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function processPartsReceiptConfirmation(message: IncomingWhatsAppMessage, employee: Employee, imported: any) {
  if (!employee.telefone) return { handled: true as const };
  const answer = message.text.trim();

  if (negative(answer)) {
    const sql = getDb();
    await sql`UPDATE importacoes_recebimento_pecas SET status = 'rejeitado', resolvido_em = now(), atualizado_em = now() WHERE id = ${imported.id} AND status = 'aguardando_confirmacao'`;
    await sendWhatsAppText(employee.telefone, `Recebimento #${imported.codigo} cancelado. Nenhuma peça foi alterada.`, message.id);
    return { handled: true as const, rejected: true as const };
  }

  if (!positive(answer)) {
    await sendWhatsAppText(employee.telefone, `Para o recebimento #${imported.codigo}, responda somente SIM para registrar ou NÃO para cancelar.`, message.id);
    return { handled: true as const, waiting: true as const };
  }

  const sql = getDb();
  const proposed = Array.isArray(imported.proposta_recebimento) ? imported.proposta_recebimento : [];
  for (const item of proposed) {
    await sql`
      UPDATE itens_pedido_pecas
      SET quantidade_recebida = LEAST(quantidade, quantidade_recebida + ${Number(item.incremento ?? 0)}),
          ultimo_recebimento_em = CURRENT_DATE,
          atualizado_em = now()
      WHERE id = ${String(item.itemId)}
    `;
  }

  const orderIds = [...new Set(proposed.map((item: any) => String(item.pedidoId)).filter(Boolean))];
  for (const orderId of orderIds) {
    await sql`
      UPDATE pedidos_pecas p
      SET status = CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM itens_pedido_pecas i
          WHERE i.pedido_id = p.id AND i.quantidade_recebida < i.quantidade
        ) THEN 'Concluído'
        ELSE 'Aberto'
      END,
      atualizado_em = now()
      WHERE p.id = ${orderId}
    `;
  }

  await sql`
    UPDATE importacoes_recebimento_pecas
    SET status = 'confirmado', resolvido_em = now(), atualizado_em = now()
    WHERE id = ${imported.id} AND status = 'aguardando_confirmacao'
  `;

  if (imported.veiculo_id) {
    await sql`
      INSERT INTO historico_veiculos (veiculo_id, evento, dados_novos)
      VALUES (
        ${imported.veiculo_id},
        'recebimento_pecas_via_whatsapp',
        ${JSON.stringify({
          importacaoId: String(imported.id),
          codigo: String(imported.codigo),
          mediaId: imported.media_id,
          itens: proposed,
          confirmadoPorFuncionarioId: employee.id,
        })}::jsonb
      )
    `;
    try {
      await advancePostDeliveryFromParts({
        vehicleId: String(imported.veiculo_id),
        receivedItems: proposed.map((item: any) => ({ descricao: String(item.descricao ?? '') })),
        orderIds,
      });
    } catch (error) {
      console.error('Falha ao avançar pendência pós-entrega após recebimento:', error);
    }
  }

  await sendWhatsAppText(employee.telefone, `Recebimento #${imported.codigo} confirmado. Atualizei as quantidades das peças e o histórico do veículo automaticamente.`, message.id);
  return { handled: true as const, confirmed: true as const };
}

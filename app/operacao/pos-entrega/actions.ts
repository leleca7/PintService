'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';
import { sendWhatsAppTemplate } from '@/lib/whatsapp';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function nullableDate(value: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Data inválida.');
  return value;
}

function formatDateBr(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function buildMeaningfulUpdate(before: any, after: any) {
  if (after.status === 'resolvida' && before.status !== 'resolvida') return 'A pendência foi concluída.';
  if (after.status === 'aguardando_agendamento' && before.status !== 'aguardando_agendamento') return 'A pendência está pronta para agendamento com a oficina.';
  if (after.previsao && after.previsao !== before.previsao) return `Foi registrada uma previsão para ${formatDateBr(after.previsao)}.`;
  return '';
}

export async function updatePostDeliveryPending(formData: FormData) {
  const user = await requirePermission('atualizar_operacao_veiculos');
  const id = text(formData, 'id');
  const descricao = text(formData, 'descricao');
  const status = text(formData, 'status');
  const fornecedor = text(formData, 'fornecedor');
  const numeroPedido = text(formData, 'numero_pedido');
  const previsao = nullableDate(text(formData, 'previsao'));

  if (!id) throw new Error('Pendência inválida.');
  if (!descricao) throw new Error('A descrição da pendência é obrigatória.');
  if (!['aberta', 'aguardando_peca', 'aguardando_agendamento', 'resolvida', 'cancelada'].includes(status)) {
    throw new Error('Status de pendência inválido.');
  }

  const sql = getDb();
  const rows = await sql`
    SELECT p.*, v.placa, v.modelo, c.nome AS cliente_nome, c.telefone
    FROM pendencias_pos_entrega p
    JOIN veiculos v ON v.id = p.veiculo_id
    LEFT JOIN clientes c ON c.id = p.cliente_id
    WHERE p.id = ${id}
    LIMIT 1
  `;
  const current = rows[0];
  if (!current) throw new Error('Pendência não encontrada.');

  if (user.perfil === 'funcionario' && current.responsavel_id && String(current.responsavel_id) !== String(user.funcionarioId ?? '')) {
    throw new Error('FORBIDDEN');
  }

  const before = {
    descricao: String(current.descricao ?? ''),
    status: String(current.status ?? ''),
    fornecedor: String(current.fornecedor ?? ''),
    numero_pedido: String(current.numero_pedido ?? ''),
    previsao: current.previsao ? String(current.previsao).slice(0, 10) : null,
  };
  const after = {
    descricao,
    status,
    fornecedor,
    numero_pedido: numeroPedido,
    previsao,
  };

  await sql`
    UPDATE pendencias_pos_entrega
    SET descricao = ${descricao},
        status = ${status},
        fornecedor = ${fornecedor || null},
        numero_pedido = ${numeroPedido || null},
        previsao = ${previsao},
        atualizado_em = now(),
        resolvido_em = CASE WHEN ${status} = 'resolvida' THEN COALESCE(resolvido_em, now()) ELSE NULL END
    WHERE id = ${id}
  `;

  await sql`
    INSERT INTO historico_veiculos (veiculo_id, usuario_app_id, evento, dados_anteriores, dados_novos)
    VALUES (
      ${current.veiculo_id},
      ${user.id},
      'atualizacao_pendencia_pos_entrega',
      ${JSON.stringify(before)}::jsonb,
      ${JSON.stringify(after)}::jsonb
    )
  `;

  await writeAudit(user, 'atualizar_pendencia_pos_entrega', 'pendencia_pos_entrega', id, {
    veiculoId: current.veiculo_id,
    placa: current.placa,
    antes: before,
    depois: after,
  });

  const update = buildMeaningfulUpdate(before, after);
  const phone = String(current.telefone ?? '').replace(/\D/g, '');
  const template = process.env.WHATSAPP_POST_DELIVERY_UPDATE_TEMPLATE?.trim();

  if (update && phone && template) {
    try {
      const vehicleLabel = String(current.modelo ?? '').trim()
        ? `${String(current.modelo).trim()} ${String(current.placa ?? '').trim()}`.trim()
        : `veículo ${String(current.placa ?? '').trim()}`.trim();
      await sendWhatsAppTemplate(phone, template, [
        String(current.cliente_nome ?? 'cliente'),
        vehicleLabel,
        descricao,
        update,
      ]);
      await sql`
        INSERT INTO conversas (telefone, cliente_id, veiculo_id, mensagem, origem, intencao, atendente_assumiu)
        VALUES (
          ${phone},
          ${current.cliente_id ?? null},
          ${current.veiculo_id},
          ${`Atualização de pendência: ${descricao}. ${update}`},
          'bot',
          'pendencia_pos_entrega',
          false
        )
      `;
    } catch (error) {
      console.error('Pendência atualizada, mas a comunicação ao cliente falhou:', error);
    }
  }

  revalidatePath('/operacao/pos-entrega');
  revalidatePath('/operacao');
  revalidatePath(`/veiculos/${current.veiculo_id}`);
}

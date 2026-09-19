'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';
import { normalizeOperationalStage } from '@/lib/operation-stages';
import { addMonths, getPostDeliveryConfig, startPostDeliveryFlow, type FinalizationKind } from '@/lib/post-delivery';
import { maybeSendOperationalEvent } from '@/lib/operational-communications';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function nullableDate(value: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Data inválida.');
  return value;
}

function todayInBahia() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function snapshot(row: any) {
  return {
    setor: row?.setor ?? null,
    status: row?.status ?? null,
    previsao_saida: row?.previsao_saida ? String(row.previsao_saida).slice(0, 10) : null,
    responsavel_id: row?.responsavel_id ?? null,
    observacoes: row?.observacoes ?? null,
    motivo_parada: row?.motivo_parada ?? null,
    motivo_parada_detalhe: row?.motivo_parada_detalhe ?? null,
    etapa_iniciada_em: row?.etapa_iniciada_em ?? null,
  };
}

export async function updateOperationalVehicle(formData: FormData) {
  const user = await requirePermission('atualizar_operacao_veiculos');
  const id = text(formData, 'id');
  const requestedStage = text(formData, 'setor');
  const status = text(formData, 'status');
  const previsaoSaida = nullableDate(text(formData, 'previsao_saida'));
  const observacoes = text(formData, 'observacoes');
  const motivoParada = text(formData, 'motivo_parada');
  const motivoParadaDetalhe = text(formData, 'motivo_parada_detalhe');

  if (!id) throw new Error('Veículo inválido.');
  const setor = normalizeOperationalStage(requestedStage);
  if (!setor) throw new Error('Etapa operacional inválida.');

  const sql = getDb();
  const currentRows = await sql`
    SELECT id, placa, setor, status, previsao_saida, responsavel_id, observacoes,
           motivo_parada, motivo_parada_detalhe, etapa_iniciada_em
    FROM veiculos
    WHERE id = ${id}
    LIMIT 1
  `;
  const current = currentRows[0];
  if (!current) throw new Error('Veículo não encontrado.');

  if (user.perfil === 'funcionario') {
    const userSector = normalizeOperationalStage(user.setor ?? '');
    const vehicleSector = normalizeOperationalStage(String(current.setor ?? ''));
    if (!userSector || !vehicleSector || vehicleSector !== userSector) throw new Error('FORBIDDEN');
  }

  const responsavelId = user.funcionarioId ?? current.responsavel_id ?? null;
  const before = snapshot(current);

  const updatedRows = await sql`
    UPDATE veiculos
    SET setor = ${setor},
        status = ${status || null},
        previsao_saida = ${previsaoSaida},
        responsavel_id = ${responsavelId},
        observacoes = ${observacoes || null},
        etapa_iniciada_em = CASE WHEN setor IS DISTINCT FROM ${setor} THEN now() ELSE COALESCE(etapa_iniciada_em, now()) END,
        motivo_parada = CASE
          WHEN ${status || null} IN ('Em serviço','Pronto para entrega') THEN NULL
          ELSE ${motivoParada || null}
        END,
        motivo_parada_detalhe = CASE
          WHEN ${status || null} IN ('Em serviço','Pronto para entrega') THEN NULL
          ELSE ${motivoParadaDetalhe || null}
        END,
        ultima_atualizacao = now()
    WHERE id = ${id}
    RETURNING id, placa, setor, status, previsao_saida, responsavel_id, observacoes,
              motivo_parada, motivo_parada_detalhe, etapa_iniciada_em
  `;
  const updated = updatedRows[0];
  const after = snapshot(updated);

  await sql`
    INSERT INTO historico_veiculos (veiculo_id, usuario_app_id, evento, dados_anteriores, dados_novos)
    VALUES (${id}, ${user.id}, 'atualizacao_operacional', ${JSON.stringify(before)}::jsonb, ${JSON.stringify(after)}::jsonb)
  `;

  await writeAudit(user, 'atualizar_operacao', 'veiculo', id, {
    placa: updated.placa,
    antes: before,
    depois: after,
  });

  try {
    await maybeSendOperationalEvent({
      vehicleId: id,
      beforeStage: before.setor,
      afterStage: after.setor,
      beforeStatus: before.status,
      afterStatus: after.status,
    });
  } catch (error) {
    console.error('Falha ao processar comunicação de evento operacional:', error);
  }

  revalidatePath('/');
  revalidatePath('/operacao');
  revalidatePath('/veiculos');
  revalidatePath(`/veiculos/${id}`);
}


export async function finalizeOperationalVehicle(formData: FormData) {
  const user = await requirePermission('atualizar_operacao_veiculos');
  const id = text(formData, 'id');
  const kind = text(formData, 'finalizacao_tipo') as FinalizationKind;
  const pendingDescription = text(formData, 'pendencia_descricao');

  if (!id) throw new Error('Veículo inválido.');
  if (!['sem_pendencias', 'com_pendencias'].includes(kind)) throw new Error('Tipo de finalização inválido.');
  if (kind === 'com_pendencias' && !pendingDescription) throw new Error('Descreva a pendência antes de finalizar o veículo.');

  const sql = getDb();
  const rows = await sql`
    SELECT id, placa, modelo, cliente_id, setor, status, responsavel_id, data_saida_real
    FROM veiculos
    WHERE id = ${id}
    LIMIT 1
  `;
  const current = rows[0];
  if (!current) throw new Error('Veículo não encontrado.');
  if (current.data_saida_real) throw new Error('Este veículo já foi finalizado.');

  const configRows = await sql`SELECT exigir_checklist_qualidade FROM configuracao_operacao WHERE id=true LIMIT 1`;
  if (configRows[0]?.exigir_checklist_qualidade !== false) {
    const checklist = await sql`
      SELECT id FROM checklists_qualidade
      WHERE veiculo_id=${id} AND status='aprovado'
      ORDER BY concluido_em DESC NULLS LAST
      LIMIT 1
    `;
    if (!checklist[0]) throw new Error('Conclua e aprove o checklist de qualidade antes de finalizar a entrega.');
  }

  if (user.perfil === 'funcionario') {
    const userSector = normalizeOperationalStage(user.setor ?? '');
    const vehicleSector = normalizeOperationalStage(String(current.setor ?? ''));
    if (!userSector || !vehicleSector || vehicleSector !== userSector) throw new Error('FORBIDDEN');
  }

  const today = todayInBahia();
  const config = await getPostDeliveryConfig();
  const serviceWarrantyUntil = addMonths(today, config.serviceWarrantyMonths);
  const partsWarrantyUntil = addMonths(today, config.partsWarrantyMonths);
  const finalStatus = kind === 'com_pendencias' ? 'Entregue com pendência' : 'Entregue';

  await sql`
    UPDATE veiculos
    SET data_saida_real = ${today},
        status = ${finalStatus},
        finalizacao_tipo = ${kind},
        finalizacao_observacao = ${pendingDescription || null},
        finalizado_em = now(),
        garantia_servico_ate = ${serviceWarrantyUntil},
        garantia_pecas_ate = ${partsWarrantyUntil},
        ultima_atualizacao = now()
    WHERE id = ${id}
  `;

  let pendingId: string | null = null;
  if (kind === 'com_pendencias') {
    const inserted = await sql`
      INSERT INTO pendencias_pos_entrega (
        veiculo_id, cliente_id, descricao, status, responsavel_id, criado_por
      )
      VALUES (
        ${id},
        ${current.cliente_id ?? null},
        ${pendingDescription},
        'aberta',
        ${current.responsavel_id ?? user.funcionarioId ?? null},
        ${user.id}
      )
      RETURNING id
    `;
    pendingId = inserted[0]?.id ? String(inserted[0].id) : null;
  }

  const before = {
    status: current.status ?? null,
    setor: current.setor ?? null,
    data_saida_real: null,
    finalizacao_tipo: null,
  };
  const after = {
    status: finalStatus,
    setor: current.setor ?? null,
    data_saida_real: today,
    finalizacao_tipo: kind,
    pendencia: pendingDescription || null,
    garantia_servico_ate: serviceWarrantyUntil,
    garantia_pecas_ate: partsWarrantyUntil,
  };

  await sql`
    INSERT INTO historico_veiculos (veiculo_id, usuario_app_id, evento, dados_anteriores, dados_novos)
    VALUES (${id}, ${user.id}, 'finalizacao_operacional', ${JSON.stringify(before)}::jsonb, ${JSON.stringify(after)}::jsonb)
  `;

  await writeAudit(user, 'finalizar_veiculo', 'veiculo', id, {
    placa: current.placa,
    tipo: kind,
    pendencia: pendingDescription || null,
    garantiaServicoAte: serviceWarrantyUntil,
    garantiaPecasAte: partsWarrantyUntil,
  });

  try {
    await startPostDeliveryFlow({
      vehicleId: id,
      kind,
      pendingId,
      pendingDescription,
    });
  } catch (error) {
    console.error('Veículo finalizado, mas o fluxo de pós-entrega não pôde ser iniciado:', error);
  }

  revalidatePath('/');
  revalidatePath('/operacao');
  revalidatePath('/veiculos');
  revalidatePath(`/veiculos/${id}`);
}

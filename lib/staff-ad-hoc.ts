import 'server-only';

import { createHash } from 'node:crypto';
import { interpretStaffOperationalCommand } from '@/lib/agent';
import { getDb } from '@/lib/db';
import { normalizeOperationalStage } from '@/lib/operation-stages';
import { sendMappedTaskText } from '@/lib/task-messaging';
import { sendWhatsAppText, type IncomingWhatsAppMessage } from '@/lib/whatsapp';

type Employee = { id: string; nome: string; setor: string | null; telefone: string | null; cargo: string | null };

const ALLOWED_STATUSES = ['Em serviço','Aguardando peças','Aguardando aprovação','Parado','Pronto para entrega'];
const ALLOWED_STOP_REASONS = ['Aguardando peça','Aguardando seguradora','Aguardando cliente','Retrabalho','Capacidade interna','Problema técnico','Outro'];

export function explicitPlate(value = '') {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const direct = compact.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
  if (direct?.[0]) return direct[0];
  const spaced = value.toUpperCase().match(/\b[A-Z]{3}[-\s]?[0-9][A-Z0-9][-\s]?[0-9]{2}\b/);
  return spaced?.[0]?.replace(/[^A-Z0-9]/g, '') ?? '';
}

export async function stageAdHocStaffCommand(input: {
  employee: Employee;
  message: IncomingWhatsAppMessage;
  text: string;
  sourceMediaId?: string | null;
  sourceMediaType?: string | null;
  forcedPlate?: string;
  forcedCheckin?: boolean;
}) {
  if (!input.employee.telefone) return { handled: true as const, reason: 'employee_without_phone' as const };

  let command;
  try {
    command = await interpretStaffOperationalCommand({
      message: input.forcedPlate
        ? `${input.text}\nPlaca identificada com segurança: ${input.forcedPlate}`
        : input.text,
      employeeSector: input.employee.setor,
    });
  } catch (error) {
    console.error('Falha ao interpretar comando espontâneo do funcionário:', error);
    await sendWhatsAppText(input.employee.telefone, 'Não consegui interpretar essa atualização com segurança. Envie a placa e a informação de forma direta, por exemplo: ABC1D23 está na Montagem.');
    return { handled: true as const, interpretationError: true as const };
  }

  const plate = (input.forcedPlate || command.plate || explicitPlate(input.text)).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (!plate || command.confidence < 0.58) {
    await sendWhatsAppText(input.employee.telefone, 'Para atualizar sem abrir o sistema, me envie a placa e a informação. Ex.: “ABC1D23 está na Montagem” ou “ABC1D23 parado aguardando seguradora”.');
    return { handled: true as const, incomplete: true as const };
  }

  const sql = getDb();
  const rows = await sql`
    SELECT v.id, v.placa, v.modelo, v.setor, v.status, v.observacoes, v.checkin_realizado_em,
           v.responsavel_id, c.nome AS cliente_nome
    FROM veiculos v
    LEFT JOIN clientes c ON c.id = v.cliente_id
    WHERE upper(v.placa) = upper(${plate})
    LIMIT 1
  `;
  const vehicle = rows[0];
  if (!vehicle) {
    await sendWhatsAppText(input.employee.telefone, `Não encontrei a placa ${plate} no cadastro operacional. Não alterei nada.`);
    return { handled: true as const, vehicleNotFound: true as const };
  }

  const stage = command.stage ? normalizeOperationalStage(command.stage) : null;
  const status = ALLOWED_STATUSES.includes(command.status) ? command.status : null;
  const stopReason = ALLOWED_STOP_REASONS.includes(command.stopReason) ? command.stopReason : null;
  const stopDetail = String(command.stopDetail || '').trim() || null;
  const markCheckin = Boolean(input.forcedCheckin || command.action === 'checkin');
  const observation = String(command.note || '').trim() || (
    command.action === 'registrar_observacao' ? input.text.trim() : null
  );

  if (!stage && !status && !stopReason && !observation && !markCheckin && !input.sourceMediaId) {
    await sendWhatsAppText(input.employee.telefone, `Localizei ${plate}, mas não encontrei uma atualização segura para registrar. Nada foi alterado.`);
    return { handled: true as const, noSafeUpdate: true as const };
  }

  const proposedUpdate = {
    newVehicleSector: stage,
    newVehicleStatus: status,
    newVehicleStopReason: stopReason,
    newVehicleStopDetail: stopDetail,
    appendVehicleObservation: observation,
    markCheckin,
  };
  const dedupeKey = createHash('sha256').update(`staff-command|${input.employee.id}|${input.message.id}|${plate}`).digest('hex');
  const taskRows = await sql`
    INSERT INTO tarefas_operacionais (
      cliente_id, veiculo_id, telefone_cliente, tipo, titulo, instrucoes,
      setor_responsavel, responsavel_id, prioridade, status, requer_foto,
      resposta_funcionario, evidencia_media_id, resultado, dedupe_key, origem_mensagem
    )
    VALUES (
      NULL, ${vehicle.id}, '', 'informacao_setor',
      ${`Atualização espontânea — ${plate}`},
      'Atualização enviada espontaneamente pelo funcionário via WhatsApp.',
      ${vehicle.setor ?? input.employee.setor ?? null},
      ${input.employee.id},
      'normal',
      'aguardando_confirmacao',
      false,
      ${input.text.trim() || (markCheckin ? 'Check-in por foto.' : 'Mídia operacional enviada.')},
      ${input.sourceMediaType === 'image' ? input.sourceMediaId ?? null : null},
      ${JSON.stringify({
        proposedUpdate,
        sourceMediaId: input.sourceMediaId ?? null,
        sourceMediaType: input.sourceMediaType ?? null,
        adHoc: true,
      })}::jsonb,
      ${dedupeKey},
      'comando_funcionario'
    )
    ON CONFLICT DO NOTHING
    RETURNING id, codigo
  `;
  let task = taskRows[0];
  if (!task) {
    const existing = await sql`SELECT id, codigo FROM tarefas_operacionais WHERE dedupe_key = ${dedupeKey} LIMIT 1`;
    task = existing[0];
  }
  if (!task) throw new Error('Não foi possível preparar a atualização espontânea.');

  const changes = [
    stage ? `Etapa: ${stage}` : '',
    status ? `Status: ${status}` : '',
    stopReason ? `Motivo: ${stopReason}${stopDetail ? ` — ${stopDetail}` : ''}` : '',
    observation ? `Observação: ${observation}` : '',
    markCheckin ? 'Registrar check-in do veículo' : '',
    input.sourceMediaId ? 'Anexar mídia ao histórico do veículo' : '',
  ].filter(Boolean);

  await sendMappedTaskText({
    taskId: String(task.id),
    employeeId: input.employee.id,
    employeePhone: input.employee.telefone,
    purpose: 'confirmacao',
    contextMessageId: input.message.id,
    text: [
      `Localizei ${vehicle.modelo ? `${vehicle.modelo} — ` : ''}${plate}.`,
      'Vou registrar:',
      ...changes.map((item) => `• ${item}`),
      '',
      'Responda SIM para confirmar.',
      'Responda NÃO para corrigir. Nada foi alterado ainda.',
    ].join('\n'),
  });

  return { handled: true as const, staged: true as const, taskId: String(task.id) };
}

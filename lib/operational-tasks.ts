import 'server-only';
import { createHash } from 'node:crypto';
import { answerOperationalResolution } from '@/lib/agent';
import { getDb } from '@/lib/db';
import { sendOperationalTaskToEmployee } from '@/lib/task-messaging';
import { sendWhatsAppImageId, sendWhatsAppImageUrl, sendWhatsAppText } from '@/lib/whatsapp';

export type OperationalTaskType = 'confirmar_etapa' | 'tirar_foto' | 'confirmar_peca' | 'verificar_status_fisico' | 'informacao_setor';
export type OperationalTaskRequest = { type: OperationalTaskType; sector: string; instruction: string; requiresPhoto: boolean };
type CreateTaskInput = { clientId: string; vehicle: { id: string; placa: string; modelo?: string | null }; customerPhone: string; customerMessage: string; priority: 'baixa' | 'normal' | 'alta' | 'urgente'; request: OperationalTaskRequest };
type ResolveTaskInput = { taskId: string; employeeId?: string | null; employeeResponse: string; evidenceUrl?: string | null; evidenceMediaId?: string | null; newVehicleStatus?: string | null; newVehicleSector?: string | null; customerReply?: string | null };

function compact(value = '') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 160); }
function taskKey(vehicleId: string, request: OperationalTaskRequest) { return createHash('sha256').update([vehicleId, request.type, compact(request.sector), compact(request.instruction)].join('|')).digest('hex'); }

async function findResponsibleEmployee(sector: string) {
  if (!sector.trim()) return null;
  const sql = getDb();
  const rows = await sql`SELECT id, nome, setor, telefone FROM funcionarios WHERE ativo = true AND lower(setor) = lower(${sector.trim()}) ORDER BY nome ASC LIMIT 2`;
  return rows.length === 1 ? rows[0] : null;
}

export async function createOrReuseOperationalTask(input: CreateTaskInput) {
  const sql = getDb();
  const dedupeKey = taskKey(input.vehicle.id, input.request);
  const similar = input.request.sector.trim()
    ? await sql`SELECT id,codigo,tipo,titulo,instrucoes,setor_responsavel,responsavel_id,status,requer_foto,resposta_funcionario,evidencia_url,evidencia_media_id,criado_em FROM tarefas_operacionais WHERE veiculo_id = ${input.vehicle.id} AND tipo = ${input.request.type} AND status IN ('aberta','em_execucao','aguardando_confirmacao') AND lower(coalesce(setor_responsavel,'')) = lower(${input.request.sector.trim()}) ORDER BY criado_em DESC LIMIT 1`
    : await sql`SELECT id,codigo,tipo,titulo,instrucoes,setor_responsavel,responsavel_id,status,requer_foto,resposta_funcionario,evidencia_url,evidencia_media_id,criado_em FROM tarefas_operacionais WHERE veiculo_id = ${input.vehicle.id} AND tipo = ${input.request.type} AND status IN ('aberta','em_execucao','aguardando_confirmacao') ORDER BY criado_em DESC LIMIT 1`;
  if (similar[0]) return { task: similar[0], reused: true };

  const existing = await sql`SELECT id,codigo,tipo,titulo,instrucoes,setor_responsavel,responsavel_id,status,requer_foto,resposta_funcionario,evidencia_url,evidencia_media_id,criado_em FROM tarefas_operacionais WHERE dedupe_key = ${dedupeKey} AND status IN ('aberta','em_execucao','aguardando_confirmacao') LIMIT 1`;
  if (existing[0]) return { task: existing[0], reused: true };

  const employee = await findResponsibleEmployee(input.request.sector);
  const vehicleLabel = input.vehicle.modelo ? `${input.vehicle.modelo} ${input.vehicle.placa}` : `veículo ${input.vehicle.placa}`;
  const title = `${input.request.instruction.replace(/[.!?]+$/, '')} — ${input.vehicle.placa}`;
  const inserted = await sql`
    INSERT INTO tarefas_operacionais (cliente_id, veiculo_id, telefone_cliente, tipo, titulo, instrucoes, setor_responsavel, responsavel_id, prioridade, requer_foto, dedupe_key, origem_mensagem)
    VALUES (${input.clientId}, ${input.vehicle.id}, ${input.customerPhone}, ${input.request.type}, ${title}, ${`${input.request.instruction} Veículo: ${vehicleLabel}.`}, ${input.request.sector || null}, ${employee?.id ?? null}, ${input.priority}, ${input.request.requiresPhoto}, ${dedupeKey}, ${input.customerMessage})
    ON CONFLICT DO NOTHING
    RETURNING id,codigo,tipo,titulo,instrucoes,setor_responsavel,responsavel_id,status,requer_foto,resposta_funcionario,evidencia_url,evidencia_media_id,criado_em
  `;
  let task = inserted[0];
  if (!task) {
    const concurrent = await sql`SELECT id,codigo,tipo,titulo,instrucoes,setor_responsavel,responsavel_id,status,requer_foto,resposta_funcionario,evidencia_url,evidencia_media_id,criado_em FROM tarefas_operacionais WHERE dedupe_key = ${dedupeKey} AND status IN ('aberta','em_execucao','aguardando_confirmacao') LIMIT 1`;
    task = concurrent[0];
    if (!task) throw new Error('A tarefa operacional não foi criada.');
    return { task, reused: true };
  }

  const eventData = JSON.stringify({ customerMessage: input.customerMessage, assignedEmployeeId: employee?.id ?? null, assignedEmployeeName: employee?.nome ?? null });
  await sql`INSERT INTO tarefa_eventos (tarefa_id, ator_tipo, evento, dados) VALUES (${task.id}, 'ia', 'tarefa_criada', ${eventData}::jsonb)`;
  await sql`
    INSERT INTO estado_atendimento (telefone, etapa, bot_ativo, tarefa_aguardada_id, atualizado_em)
    VALUES (${input.customerPhone}, 'aguardando_tarefa_operacional', true, ${task.id}, now())
    ON CONFLICT (telefone) DO UPDATE SET etapa = EXCLUDED.etapa, bot_ativo = true, tarefa_aguardada_id = EXCLUDED.tarefa_aguardada_id, atualizado_em = now()
  `;

  try {
    const notification = await sendOperationalTaskToEmployee(String(task.id));
    if (!notification.sent) {
      const reason = JSON.stringify({ reason: notification.reason });
      await sql`INSERT INTO tarefa_eventos (tarefa_id, ator_tipo, evento, dados) VALUES (${task.id}, 'sistema', 'whatsapp_funcionario_nao_enviado', ${reason}::jsonb)`;
    }
  } catch (notificationError) {
    console.error('Falha ao notificar funcionário sobre tarefa operacional:', notificationError);
    const message = JSON.stringify({ message: notificationError instanceof Error ? notificationError.message.slice(0, 500) : 'erro_desconhecido' });
    await sql`INSERT INTO tarefa_eventos (tarefa_id, ator_tipo, evento, dados) VALUES (${task.id}, 'sistema', 'whatsapp_funcionario_erro', ${message}::jsonb)`;
  }
  return { task, reused: false };
}

function defaultCustomerReply(task: any, employeeResponse: string) {
  const response = employeeResponse.trim();
  const plate = task.placa ? ` do veículo ${task.placa}` : '';
  switch (task.tipo) {
    case 'tirar_foto': return response ? `A equipe concluiu a verificação${plate}: ${response}` : `A equipe concluiu o pedido de foto${plate}.`;
    case 'confirmar_peca': return `Confirmei com a equipe${plate}: ${response}`;
    case 'confirmar_etapa':
    case 'verificar_status_fisico': return `Acabei de confirmar com a equipe${plate}: ${response}`;
    default: return `Recebi a confirmação da equipe${plate}: ${response}`;
  }
}

export async function resolveOperationalTask(input: ResolveTaskInput) {
  const sql = getDb();
  const rows = await sql`
    SELECT t.*, v.placa, v.modelo, v.status AS veiculo_status, v.setor AS veiculo_setor, c.telefone AS cliente_telefone
    FROM tarefas_operacionais t
    LEFT JOIN veiculos v ON v.id = t.veiculo_id
    LEFT JOIN clientes c ON c.id = t.cliente_id
    WHERE t.id = ${input.taskId}
    LIMIT 1
  `;
  const task = rows[0];
  if (!task) throw new Error('Tarefa operacional não encontrada.');
  if (task.status === 'resolvida' || task.status === 'cancelada') return { task, alreadyFinished: true };

  if (task.veiculo_id && input.newVehicleStatus) await sql`UPDATE veiculos SET status = ${input.newVehicleStatus}, ultima_atualizacao = now() WHERE id = ${task.veiculo_id}`;
  if (task.veiculo_id && input.newVehicleSector) await sql`UPDATE veiculos SET setor = ${input.newVehicleSector}, ultima_atualizacao = now() WHERE id = ${task.veiculo_id}`;

  const result = { employeeResponse: input.employeeResponse, evidenceUrl: input.evidenceUrl ?? null, evidenceMediaId: input.evidenceMediaId ?? null, newVehicleStatus: input.newVehicleStatus ?? null, newVehicleSector: input.newVehicleSector ?? null };
  const resultJson = JSON.stringify(result);
  const resolvedRows = await sql`
    UPDATE tarefas_operacionais
    SET status = 'resolvida', responsavel_id = ${input.employeeId ?? task.responsavel_id}, resposta_funcionario = ${input.employeeResponse}, evidencia_url = ${input.evidenceUrl ?? null}, evidencia_media_id = ${input.evidenceMediaId ?? null}, resultado = ${resultJson}::jsonb, atualizado_em = now(), resolvido_em = now()
    WHERE id = ${input.taskId}
    RETURNING *
  `;
  const eventType = input.employeeId ? 'funcionario' : 'sistema';
  await sql`INSERT INTO tarefa_eventos (tarefa_id, ator_tipo, ator_id, evento, dados) VALUES (${input.taskId}, ${eventType}, ${input.employeeId ?? null}, 'tarefa_resolvida', ${resultJson}::jsonb)`;

  const phone = String(task.telefone_cliente || task.cliente_telefone || '');
  let reply = input.customerReply?.trim() || '';
  const evidenceSent = Boolean(input.evidenceUrl || input.evidenceMediaId);
  if (!reply && process.env.OPENAI_API_KEY) {
    try {
      reply = await answerOperationalResolution({ customerQuestion: task.origem_mensagem || task.instrucoes || '', employeeResponse: input.employeeResponse, taskType: task.tipo, evidenceSent, vehicle: { placa: task.placa ?? null, modelo: task.modelo ?? null, status: input.newVehicleStatus ?? task.veiculo_status ?? null, setor: input.newVehicleSector ?? task.veiculo_setor ?? null } });
    } catch (error) { console.error('Falha ao reavaliar conclusão operacional com IA:', error); }
  }
  if (!reply) reply = defaultCustomerReply(task, input.employeeResponse);

  if (phone && reply) {
    if (input.evidenceMediaId) await sendWhatsAppImageId(phone, input.evidenceMediaId, task.tipo === 'tirar_foto' ? reply : `Evidência da verificação do veículo ${task.placa ?? ''}`.trim());
    else if (input.evidenceUrl) await sendWhatsAppImageUrl(phone, input.evidenceUrl, task.tipo === 'tirar_foto' ? reply : `Evidência da verificação do veículo ${task.placa ?? ''}`.trim());
    if (!evidenceSent || task.tipo !== 'tirar_foto') await sendWhatsAppText(phone, reply);
    const logMessage = evidenceSent && task.tipo === 'tirar_foto' ? `${reply} [foto enviada]` : reply;
    await sql`INSERT INTO conversas (telefone, cliente_id, veiculo_id, mensagem, origem, intencao, atendente_assumiu) VALUES (${phone}, ${task.cliente_id}, ${task.veiculo_id}, ${logMessage}, 'bot', 'confirmacao_operacional', false)`;
    await sql`
      INSERT INTO estado_atendimento (telefone, etapa, bot_ativo, ultima_intencao, placa_contexto, aguardando_campo, tarefa_aguardada_id, atualizado_em)
      VALUES (${phone}, 'inicio', true, 'confirmacao_operacional', ${task.placa ?? null}, null, null, now())
      ON CONFLICT (telefone) DO UPDATE SET etapa = 'inicio', bot_ativo = true, ultima_intencao = 'confirmacao_operacional', placa_contexto = EXCLUDED.placa_contexto, aguardando_campo = null, tarefa_aguardada_id = null, atualizado_em = now()
    `;
  }
  return { task: resolvedRows[0], customerReply: reply, alreadyFinished: false };
}

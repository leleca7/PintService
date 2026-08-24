import 'server-only';
import { createHash } from 'node:crypto';
import { answerOperationalResolution } from '@/lib/agent';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sendOperationalTaskToEmployee } from '@/lib/task-messaging';
import { sendWhatsAppImageId, sendWhatsAppImageUrl, sendWhatsAppText } from '@/lib/whatsapp';

export type OperationalTaskType = 'confirmar_etapa' | 'tirar_foto' | 'confirmar_peca' | 'verificar_status_fisico' | 'informacao_setor';
export type OperationalTaskRequest = { type: OperationalTaskType; sector: string; instruction: string; requiresPhoto: boolean };
type CreateTaskInput = { clientId: string; vehicle: { id: string; placa: string; modelo?: string | null }; customerPhone: string; customerMessage: string; priority: 'baixa' | 'normal' | 'alta' | 'urgente'; request: OperationalTaskRequest };
type ResolveTaskInput = { taskId: string; employeeId?: string | null; employeeResponse: string; evidenceUrl?: string | null; evidenceMediaId?: string | null; newVehicleStatus?: string | null; newVehicleSector?: string | null; customerReply?: string | null };
const ACTIVE_TASK_STATUSES = ['aberta', 'em_execucao', 'aguardando_confirmacao'];
function compact(value = '') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 160); }
function taskKey(vehicleId: string, request: OperationalTaskRequest) { return createHash('sha256').update([vehicleId, request.type, compact(request.sector), compact(request.instruction)].join('|')).digest('hex'); }

async function findResponsibleEmployee(supabase: any, sector: string) {
  if (!sector.trim()) return null;
  const { data, error } = await supabase.from('funcionarios').select('id,nome,setor,telefone').eq('ativo', true).ilike('setor', sector.trim()).order('nome', { ascending: true }).limit(2);
  if (error) throw error;
  return data?.length === 1 ? data[0] : null;
}

export async function createOrReuseOperationalTask(input: CreateTaskInput) {
  const supabase = getSupabaseAdmin(); const dedupeKey = taskKey(input.vehicle.id, input.request);
  const taskFields = 'id,codigo,tipo,titulo,instrucoes,setor_responsavel,responsavel_id,status,requer_foto,resposta_funcionario,evidencia_url,evidencia_media_id,criado_em';
  let similarQuery = supabase.from('tarefas_operacionais').select(taskFields).eq('veiculo_id', input.vehicle.id).eq('tipo', input.request.type).in('status', ACTIVE_TASK_STATUSES).order('criado_em', { ascending: false }).limit(1);
  if (input.request.sector.trim()) similarQuery = similarQuery.ilike('setor_responsavel', input.request.sector.trim());
  const { data: similar, error: similarError } = await similarQuery; if (similarError) throw similarError; if (similar?.[0]) return { task: similar[0], reused: true };
  const { data: existing, error: existingError } = await supabase.from('tarefas_operacionais').select(taskFields).eq('dedupe_key', dedupeKey).in('status', ACTIVE_TASK_STATUSES).maybeSingle(); if (existingError) throw existingError; if (existing) return { task: existing, reused: true };
  const employee = await findResponsibleEmployee(supabase, input.request.sector);
  const vehicleLabel = input.vehicle.modelo ? `${input.vehicle.modelo} ${input.vehicle.placa}` : `veículo ${input.vehicle.placa}`;
  const title = `${input.request.instruction.replace(/[.!?]+$/, '')} — ${input.vehicle.placa}`;
  const { data: task, error } = await supabase.from('tarefas_operacionais').insert({ cliente_id: input.clientId, veiculo_id: input.vehicle.id, telefone_cliente: input.customerPhone, tipo: input.request.type, titulo: title, instrucoes: `${input.request.instruction} Veículo: ${vehicleLabel}.`, setor_responsavel: input.request.sector || null, responsavel_id: employee?.id ?? null, prioridade: input.priority, requer_foto: input.request.requiresPhoto, dedupe_key: dedupeKey, origem_mensagem: input.customerMessage }).select(taskFields).single();
  if (error?.code === '23505') { const { data: concurrent, error: concurrentError } = await supabase.from('tarefas_operacionais').select(taskFields).eq('dedupe_key', dedupeKey).in('status', ACTIVE_TASK_STATUSES).single(); if (concurrentError) throw concurrentError; if (!concurrent) throw new Error('Tarefa concorrente não encontrada após deduplicação.'); return { task: concurrent, reused: true }; }
  if (error) throw error; if (!task) throw new Error('A tarefa operacional não foi criada.');
  await supabase.from('tarefa_eventos').insert({ tarefa_id: task.id, ator_tipo: 'ia', evento: 'tarefa_criada', dados: { customerMessage: input.customerMessage, assignedEmployeeId: employee?.id ?? null, assignedEmployeeName: employee?.nome ?? null } });
  await supabase.from('estado_atendimento').upsert({ telefone: input.customerPhone, etapa: 'aguardando_tarefa_operacional', bot_ativo: true, tarefa_aguardada_id: task.id, atualizado_em: new Date().toISOString() }, { onConflict: 'telefone' });
  try { const notification = await sendOperationalTaskToEmployee(task.id); if (!notification.sent) await supabase.from('tarefa_eventos').insert({ tarefa_id: task.id, ator_tipo: 'sistema', evento: 'whatsapp_funcionario_nao_enviado', dados: { reason: notification.reason } }); }
  catch (notificationError) { console.error('Falha ao notificar funcionário sobre tarefa operacional:', notificationError); await supabase.from('tarefa_eventos').insert({ tarefa_id: task.id, ator_tipo: 'sistema', evento: 'whatsapp_funcionario_erro', dados: { message: notificationError instanceof Error ? notificationError.message.slice(0, 500) : 'erro_desconhecido' } }); }
  return { task, reused: false };
}

function defaultCustomerReply(task: any, employeeResponse: string) {
  const response = employeeResponse.trim(); const plate = task.veiculos?.placa ? ` do veículo ${task.veiculos.placa}` : '';
  switch (task.tipo) { case 'tirar_foto': return response ? `A equipe concluiu a verificação${plate}: ${response}` : `A equipe concluiu o pedido de foto${plate}.`; case 'confirmar_peca': return `Confirmei com a equipe${plate}: ${response}`; case 'confirmar_etapa': case 'verificar_status_fisico': return `Acabei de confirmar com a equipe${plate}: ${response}`; default: return `Recebi a confirmação da equipe${plate}: ${response}`; }
}

export async function resolveOperationalTask(input: ResolveTaskInput) {
  const supabase = getSupabaseAdmin();
  const { data: task, error: taskError } = await supabase.from('tarefas_operacionais').select('*, veiculos(id,placa,modelo,status,setor), clientes(id,telefone)').eq('id', input.taskId).single(); if (taskError) throw taskError; if (!task) throw new Error('Tarefa operacional não encontrada.');
  if (task.status === 'resolvida' || task.status === 'cancelada') return { task, alreadyFinished: true };
  const now = new Date().toISOString(); const result = { employeeResponse: input.employeeResponse, evidenceUrl: input.evidenceUrl ?? null, evidenceMediaId: input.evidenceMediaId ?? null, newVehicleStatus: input.newVehicleStatus ?? null, newVehicleSector: input.newVehicleSector ?? null };
  if (task.veiculo_id && (input.newVehicleStatus || input.newVehicleSector)) { const vehicleUpdate: Record<string, unknown> = { ultima_atualizacao: now }; if (input.newVehicleStatus) vehicleUpdate.status = input.newVehicleStatus; if (input.newVehicleSector) vehicleUpdate.setor = input.newVehicleSector; const { error: vehicleError } = await supabase.from('veiculos').update(vehicleUpdate).eq('id', task.veiculo_id); if (vehicleError) throw vehicleError; }
  const { data: resolved, error: updateError } = await supabase.from('tarefas_operacionais').update({ status: 'resolvida', responsavel_id: input.employeeId ?? task.responsavel_id, resposta_funcionario: input.employeeResponse, evidencia_url: input.evidenceUrl ?? null, evidencia_media_id: input.evidenceMediaId ?? null, resultado: result, atualizado_em: now, resolvido_em: now }).eq('id', input.taskId).select('*').single(); if (updateError) throw updateError;
  await supabase.from('tarefa_eventos').insert({ tarefa_id: input.taskId, ator_tipo: input.employeeId ? 'funcionario' : 'sistema', ator_id: input.employeeId ?? null, evento: 'tarefa_resolvida', dados: result });
  const phone = task.telefone_cliente || task.clientes?.telefone; let reply = input.customerReply?.trim() || ''; const evidenceSent = Boolean(input.evidenceUrl || input.evidenceMediaId);
  if (!reply && process.env.OPENAI_API_KEY) { try { reply = await answerOperationalResolution({ customerQuestion: task.origem_mensagem || task.instrucoes || '', employeeResponse: input.employeeResponse, taskType: task.tipo, evidenceSent, vehicle: { placa: task.veiculos?.placa ?? null, modelo: task.veiculos?.modelo ?? null, status: input.newVehicleStatus ?? task.veiculos?.status ?? null, setor: input.newVehicleSector ?? task.veiculos?.setor ?? null } }); } catch (error) { console.error('Falha ao reavaliar conclusão operacional com IA:', error); } }
  if (!reply) reply = defaultCustomerReply(task, input.employeeResponse);
  if (phone && reply) {
    if (input.evidenceMediaId) await sendWhatsAppImageId(phone, input.evidenceMediaId, task.tipo === 'tirar_foto' ? reply : `Evidência da verificação do veículo ${task.veiculos?.placa ?? ''}`.trim());
    else if (input.evidenceUrl) await sendWhatsAppImageUrl(phone, input.evidenceUrl, task.tipo === 'tirar_foto' ? reply : `Evidência da verificação do veículo ${task.veiculos?.placa ?? ''}`.trim());
    if (!evidenceSent || task.tipo !== 'tirar_foto') await sendWhatsAppText(phone, reply);
    await supabase.from('conversas').insert({ telefone: phone, cliente_id: task.cliente_id, veiculo_id: task.veiculo_id, mensagem: evidenceSent && task.tipo === 'tirar_foto' ? `${reply} [foto enviada]` : reply, origem: 'bot', intencao: 'confirmacao_operacional', atendente_assumiu: false });
    await supabase.from('estado_atendimento').upsert({ telefone: phone, etapa: 'inicio', bot_ativo: true, ultima_intencao: 'confirmacao_operacional', placa_contexto: task.veiculos?.placa ?? null, aguardando_campo: null, tarefa_aguardada_id: null, atualizado_em: now }, { onConflict: 'telefone' });
  }
  return { task: resolved, customerReply: reply, alreadyFinished: false };
}

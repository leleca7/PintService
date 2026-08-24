import 'server-only';
import { resolveOperationalTask } from '@/lib/operational-tasks';
import { findTaskIdByOutboundMessage, sendMappedTaskText } from '@/lib/task-messaging';
import { getDb } from '@/lib/db';
import { normalizeWhatsAppPhone, sendWhatsAppText, type IncomingWhatsAppMessage } from '@/lib/whatsapp';

const TASK_CODE_PATTERN = /#[A-Z0-9]{10}\b/gi;
type Employee = { id: string; nome: string; setor: string | null; telefone: string | null; cargo: string | null };
type LocatedTask = { task: any | null; purpose: string | null; ambiguousIds: string[] };

function normalizeText(value = '') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
function isPositiveConfirmation(value: string) { const normalized = normalizeText(value).replace(/[.!]+$/g, ''); return ['sim', 's', 'sim pode enviar', 'sim, pode enviar', 'confirmo'].includes(normalized); }
function isNegativeConfirmation(value: string) { const normalized = normalizeText(value).replace(/[.!]+$/g, ''); return ['nao', 'n', 'nao enviar', 'nao, corrigir', 'corrigir'].includes(normalized); }
function extractTaskCode(value = '') { const match = value.toUpperCase().match(/#([A-Z0-9]{10})\b/); return match?.[1] ?? ''; }
function stripTaskCode(value = '') { return value.replace(TASK_CODE_PATTERN, '').replace(/\s{2,}/g, ' ').trim(); }

async function getTask(taskId: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT t.id,t.codigo,t.cliente_id,t.veiculo_id,t.telefone_cliente,t.tipo,t.titulo,t.instrucoes,t.setor_responsavel,t.responsavel_id,t.prioridade,t.status,t.requer_foto,t.resposta_funcionario,t.evidencia_url,t.evidencia_media_id,t.origem_mensagem,
           v.placa,v.modelo,v.status AS veiculo_status,v.setor AS veiculo_setor
    FROM tarefas_operacionais t
    LEFT JOIN veiculos v ON v.id = t.veiculo_id
    WHERE t.id = ${taskId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function findTaskForEmployee(message: IncomingWhatsAppMessage, employee: Employee): Promise<LocatedTask> {
  const sql = getDb();
  if (message.contextMessageId) {
    const mapping = await findTaskIdByOutboundMessage(message.contextMessageId);
    if (mapping?.tarefa_id && String(mapping.funcionario_id) === employee.id) return { task: await getTask(String(mapping.tarefa_id)), purpose: mapping.finalidade ? String(mapping.finalidade) : null, ambiguousIds: [] };
  }
  const code = extractTaskCode(`${message.text} ${message.interactiveId}`);
  if (code) {
    const rows = await sql`SELECT id FROM tarefas_operacionais WHERE codigo = ${code} AND status IN ('aberta','em_execucao','aguardando_confirmacao') LIMIT 1`;
    if (rows[0]?.id) return { task: await getTask(String(rows[0].id)), purpose: null, ambiguousIds: [] };
  }
  const assigned = await sql`SELECT id FROM tarefas_operacionais WHERE responsavel_id = ${employee.id} AND status IN ('aberta','em_execucao','aguardando_confirmacao') ORDER BY criado_em DESC LIMIT 6`;
  if (assigned.length === 1) return { task: await getTask(String(assigned[0].id)), purpose: null, ambiguousIds: [] };
  return { task: null, purpose: null, ambiguousIds: assigned.map((item: any) => String(item.id)) };
}

async function sendAmbiguityMessage(employee: Employee, taskIds: string[]) {
  if (!employee.telefone) return;
  if (!taskIds.length) {
    await sendWhatsAppText(employee.telefone, 'Não encontrei nenhuma tarefa operacional aberta atribuída a você. Se você recebeu uma tarefa antes, responda diretamente àquela mensagem para eu identificar corretamente.');
    return;
  }
  const sql = getDb();
  const tasks = await sql`
    SELECT t.id,t.codigo,t.titulo,v.placa,v.modelo
    FROM tarefas_operacionais t LEFT JOIN veiculos v ON v.id = t.veiculo_id
    WHERE t.id = ANY(${taskIds}::uuid[])
    ORDER BY t.criado_em DESC
  `;
  const lines = tasks.map((task: any) => { const label = task.modelo ? `${task.modelo} ${task.placa}` : task.placa ?? 'veículo'; return `#${task.codigo} — ${label} — ${task.titulo}`; });
  await sendWhatsAppText(employee.telefone, ['Tenho mais de uma tarefa sua aberta e não quero adivinhar de qual veículo é essa resposta.', '', ...lines, '', 'Envie novamente a informação ou foto colocando o código no texto/legenda, por exemplo: #A1B2C3D4E5.', 'Outra opção é responder diretamente à mensagem original da tarefa.'].join('\n'));
}

async function ensureTaskBelongsToEmployee(task: any, employee: Employee) {
  if (!task) return false;
  if (!task.responsavel_id) {
    const sql = getDb();
    await sql`UPDATE tarefas_operacionais SET responsavel_id = ${employee.id}, atualizado_em = now() WHERE id = ${task.id}`;
    task.responsavel_id = employee.id;
    return true;
  }
  return String(task.responsavel_id) === employee.id;
}

async function requestCorrection(task: any, employee: Employee, contextMessageId: string) {
  const sql = getDb();
  await sql`UPDATE tarefas_operacionais SET status = 'em_execucao', resposta_funcionario = null, evidencia_url = null, evidencia_media_id = null, atualizado_em = now() WHERE id = ${task.id}`;
  await sql`INSERT INTO tarefa_eventos (tarefa_id, ator_tipo, ator_id, evento, dados) VALUES (${task.id}, 'funcionario', ${employee.id}, 'confirmacao_recusada', '{}'::jsonb)`;
  if (employee.telefone) await sendMappedTaskText({ taskId: String(task.id), employeeId: employee.id, employeePhone: employee.telefone, text: `Sem problema. Envie a informação correta${task.requer_foto ? ' e a foto correta' : ''} respondendo esta mensagem. Tarefa #${task.codigo}.`, purpose: 'solicitacao', contextMessageId });
}

async function confirmStagedTask(task: any, employee: Employee, message: IncomingWhatsAppMessage) {
  if (!employee.telefone) return { ok: false };
  const confirmationText = stripTaskCode(message.text);
  if (isNegativeConfirmation(confirmationText)) { await requestCorrection(task, employee, message.id); return { ok: true, corrected: true }; }
  if (!isPositiveConfirmation(confirmationText)) {
    await sendMappedTaskText({ taskId: String(task.id), employeeId: employee.id, employeePhone: employee.telefone, text: `Para evitar enviar algo errado ao cliente, responda somente SIM para confirmar ou NÃO para corrigir. Tarefa #${task.codigo}.`, purpose: 'confirmacao', contextMessageId: message.id });
    return { ok: true, waitingConfirmation: true };
  }
  if (!String(task.resposta_funcionario ?? '').trim()) { await requestCorrection(task, employee, message.id); return { ok: true, corrected: true }; }
  const result = await resolveOperationalTask({ taskId: String(task.id), employeeId: employee.id, employeeResponse: String(task.resposta_funcionario), evidenceUrl: task.evidencia_url ?? null, evidenceMediaId: task.evidencia_media_id ?? null });
  await sendWhatsAppText(employee.telefone, `Tarefa #${task.codigo} concluída. A confirmação foi registrada e o atendimento do cliente foi retomado automaticamente.`, message.id);
  return { ok: true, resolved: true, result };
}

async function stageEmployeeResponse(task: any, employee: Employee, message: IncomingWhatsAppMessage) {
  const sql = getDb();
  const hasImage = message.type === 'image' && Boolean(message.mediaId);
  const incomingText = stripTaskCode(message.text);
  const previousText = String(task.resposta_funcionario ?? '').trim();

  if (!['text', 'image', 'interactive'].includes(message.type)) {
    if (employee.telefone) await sendMappedTaskText({ taskId: String(task.id), employeeId: employee.id, employeePhone: employee.telefone, text: `Para esta tarefa, me envie uma resposta em texto${task.requer_foto ? ' ou uma foto' : ''}. Tarefa #${task.codigo}.`, purpose: 'solicitacao', contextMessageId: message.id });
    return { ok: true, unsupportedType: true };
  }

  if (task.requer_foto && !hasImage) {
    const responseText = incomingText || previousText;
    await sql`UPDATE tarefas_operacionais SET status = 'em_execucao', responsavel_id = ${employee.id}, resposta_funcionario = ${responseText || null}, atualizado_em = now() WHERE id = ${task.id}`;
    const data = JSON.stringify({ texto: responseText || null, faltaFoto: true });
    await sql`INSERT INTO tarefa_eventos (tarefa_id, ator_tipo, ator_id, evento, dados) VALUES (${task.id}, 'funcionario', ${employee.id}, 'resposta_parcial', ${data}::jsonb)`;
    if (employee.telefone) await sendMappedTaskText({ taskId: String(task.id), employeeId: employee.id, employeePhone: employee.telefone, text: `Anotei a informação da tarefa #${task.codigo}. Agora falta a foto. Envie a foto respondendo esta mensagem; depois eu mostro um resumo para você confirmar antes de mandar ao cliente.`, purpose: 'solicitacao', contextMessageId: message.id });
    return { ok: true, waitingPhoto: true };
  }

  if (hasImage && task.tipo !== 'tirar_foto' && !incomingText && !previousText) {
    await sql`UPDATE tarefas_operacionais SET status = 'em_execucao', responsavel_id = ${employee.id}, evidencia_media_id = ${message.mediaId}, atualizado_em = now() WHERE id = ${task.id}`;
    if (employee.telefone) await sendMappedTaskText({ taskId: String(task.id), employeeId: employee.id, employeePhone: employee.telefone, text: `Foto recebida. Agora escreva a confirmação em texto para a tarefa #${task.codigo}. Eu não vou deduzir o status do veículo somente pela imagem.`, purpose: 'solicitacao', contextMessageId: message.id });
    return { ok: true, waitingText: true };
  }

  const responseText = incomingText || previousText || (hasImage ? 'Foto enviada pela equipe.' : 'Confirmação enviada pela equipe.');
  const evidenceMediaId = hasImage ? message.mediaId : task.evidencia_media_id ?? null;
  await sql`UPDATE tarefas_operacionais SET status = 'aguardando_confirmacao', responsavel_id = ${employee.id}, resposta_funcionario = ${responseText}, evidencia_media_id = ${evidenceMediaId}, atualizado_em = now() WHERE id = ${task.id}`;
  const data = JSON.stringify({ texto: responseText, mediaId: evidenceMediaId, messageId: message.id });
  await sql`INSERT INTO tarefa_eventos (tarefa_id, ator_tipo, ator_id, evento, dados) VALUES (${task.id}, 'funcionario', ${employee.id}, 'resposta_recebida_whatsapp', ${data}::jsonb)`;
  const label = task.modelo ? `${task.modelo} ${task.placa}` : task.placa ?? 'veículo';
  if (employee.telefone) await sendMappedTaskText({ taskId: String(task.id), employeeId: employee.id, employeePhone: employee.telefone, text: [`Só confirma antes de eu mandar ao cliente — tarefa #${task.codigo}:`, `Veículo: ${label}`, `Informação: ${responseText}`, evidenceMediaId ? 'Foto: recebida' : '', '', 'Responda SIM para concluir e enviar ao cliente.', 'Responda NÃO para corrigir.'].filter(Boolean).join('\n'), purpose: 'confirmacao', contextMessageId: message.id });
  return { ok: true, staged: true };
}

export async function findEmployeeByWhatsAppPhone(phone: string): Promise<Employee | null> {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  const sql = getDb();
  const rows = await sql`SELECT id,nome,setor,telefone,cargo FROM funcionarios WHERE ativo = true AND telefone IS NOT NULL AND regexp_replace(telefone, '[^0-9]', '', 'g') = ${normalized} LIMIT 1`;
  if (!rows[0]) return null;
  return { id: String(rows[0].id), nome: String(rows[0].nome), setor: rows[0].setor ? String(rows[0].setor) : null, telefone: rows[0].telefone ? String(rows[0].telefone) : null, cargo: rows[0].cargo ? String(rows[0].cargo) : null };
}

export async function processStaffWhatsAppMessage(message: IncomingWhatsAppMessage, employee: Employee) {
  const located = await findTaskForEmployee(message, employee);
  if (!located.task) { await sendAmbiguityMessage(employee, located.ambiguousIds); return { staff: true, handled: true, ambiguous: true }; }
  const task = located.task;
  if (!(await ensureTaskBelongsToEmployee(task, employee))) {
    if (employee.telefone) await sendWhatsAppText(employee.telefone, `Essa tarefa #${task.codigo} está atribuída a outro responsável. Para evitar atualizar o carro errado, não registrei sua resposta.`, message.id);
    return { staff: true, handled: true, wrongAssignee: true };
  }
  if (located.purpose === 'confirmacao' || task.status === 'aguardando_confirmacao') return { staff: true, handled: true, ...(await confirmStagedTask(task, employee, message)) };
  return { staff: true, handled: true, ...(await stageEmployeeResponse(task, employee, message)) };
}

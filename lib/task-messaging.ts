import 'server-only';
import { getDb } from '@/lib/db';
import { sendWhatsAppText, sentWhatsAppMessageId } from '@/lib/whatsapp';

export type TaskMessagePurpose = 'solicitacao' | 'confirmacao' | 'ambiguidade';

async function recordOutboundTaskMessage(input: { taskId: string; employeeId: string; messageId: string; purpose: TaskMessagePurpose }) {
  if (!input.messageId) return;
  const sql = getDb();
  await sql`
    INSERT INTO tarefa_mensagens_whatsapp (tarefa_id, funcionario_id, message_id, direcao, finalidade)
    VALUES (${input.taskId}, ${input.employeeId}, ${input.messageId}, 'sistema_para_funcionario', ${input.purpose})
    ON CONFLICT (message_id) DO NOTHING
  `;
}

export async function sendMappedTaskText(input: { taskId: string; employeeId: string; employeePhone: string; text: string; purpose: TaskMessagePurpose; contextMessageId?: string }) {
  const response = await sendWhatsAppText(input.employeePhone, input.text, input.contextMessageId);
  const messageId = sentWhatsAppMessageId(response);
  await recordOutboundTaskMessage({ taskId: input.taskId, employeeId: input.employeeId, messageId, purpose: input.purpose });
  return { response, messageId };
}

async function sectorHasSingleActiveEmployee(sector: string | null, assignedEmployeeId: string) {
  if (!sector?.trim()) return true;
  const sql = getDb();
  const rows = await sql`SELECT id FROM funcionarios WHERE ativo = true AND lower(setor) = lower(${sector.trim()}) LIMIT 2`;
  return rows.length === 1 && String(rows[0].id) === assignedEmployeeId;
}

export async function sendOperationalTaskToEmployee(taskId: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT t.id,t.codigo,t.tipo,t.titulo,t.instrucoes,t.setor_responsavel,t.responsavel_id,t.prioridade,t.requer_foto,t.origem_mensagem,
           v.id AS veiculo_id,v.placa,v.modelo,
           f.id AS funcionario_id,f.nome AS funcionario_nome,f.setor AS funcionario_setor,f.telefone AS funcionario_telefone
    FROM tarefas_operacionais t
    LEFT JOIN veiculos v ON v.id = t.veiculo_id
    LEFT JOIN funcionarios f ON f.id = t.responsavel_id
    WHERE t.id = ${taskId}
    LIMIT 1
  `;
  const task = rows[0];
  if (!task) return { sent: false, reason: 'task_not_found' as const };
  if (!task.funcionario_id || !task.funcionario_telefone) return { sent: false, reason: 'employee_without_whatsapp' as const };
  if (!(await sectorHasSingleActiveEmployee(task.setor_responsavel, String(task.funcionario_id)))) return { sent: false, reason: 'ambiguous_sector_assignment' as const };

  const vehicleLabel = task.modelo ? `${task.modelo} — ${task.placa}` : task.placa || 'veículo não identificado';
  const priority = task.prioridade === 'urgente' ? '[URGENTE]' : task.prioridade === 'alta' ? '[PRIORIDADE ALTA]' : '[NOVA TAREFA]';
  const customerQuestion = String(task.origem_mensagem ?? '').trim().slice(0, 500);
  const text = [
    `${priority} #${task.codigo}`,
    `Veículo: ${vehicleLabel}`,
    task.setor_responsavel ? `Setor: ${task.setor_responsavel}` : '',
    customerQuestion ? `Cliente perguntou: “${customerQuestion}”` : '',
    '',
    `Preciso que você: ${task.instrucoes}`,
    task.requer_foto ? 'Esta tarefa precisa de foto.' : '',
    '',
    'Responda ESTA mensagem com a informação solicitada' + (task.requer_foto ? ' e a foto.' : '.'),
    `Se mandar uma mensagem solta, escreva #${task.codigo} para eu saber de qual veículo é.`,
    'O PintService confirma a resposta antes de enviar qualquer informação ao cliente.',
  ].filter(Boolean).join('\n');

  const result = await sendMappedTaskText({ taskId: String(task.id), employeeId: String(task.funcionario_id), employeePhone: String(task.funcionario_telefone), text, purpose: 'solicitacao' });
  const eventData = JSON.stringify({ funcionarioId: String(task.funcionario_id), messageId: result.messageId });
  await sql`INSERT INTO tarefa_eventos (tarefa_id, ator_tipo, evento, dados) VALUES (${task.id}, 'sistema', 'whatsapp_funcionario_enviado', ${eventData}::jsonb)`;
  return { sent: true, messageId: result.messageId, employeeId: String(task.funcionario_id) };
}

export async function findTaskIdByOutboundMessage(messageId: string) {
  if (!messageId) return null;
  const sql = getDb();
  const rows = await sql`SELECT tarefa_id, funcionario_id, finalidade FROM tarefa_mensagens_whatsapp WHERE message_id = ${messageId} LIMIT 1`;
  return rows[0] ?? null;
}

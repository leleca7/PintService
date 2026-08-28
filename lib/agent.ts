import 'server-only';
import OpenAI from 'openai';
import { z } from 'zod';

const OperationalTaskSchema = z.object({
  type: z.enum(['confirmar_etapa', 'tirar_foto', 'confirmar_peca', 'verificar_status_fisico', 'informacao_setor', 'nenhuma']),
  sector: z.string(),
  instruction: z.string(),
  requiresPhoto: z.boolean(),
});

const PlanSchema = z.object({
  intent: z.enum(['status', 'confirmacao_operacional', 'vistoria', 'foto', 'orcamento', 'agendamento', 'horario_endereco', 'reclamacao', 'humano', 'midia', 'geral']),
  action: z.enum(['status', 'verificar_operacao', 'pedir_placa', 'vistoria', 'foto', 'orcamento', 'agendamento', 'horario_endereco', 'humano', 'midia', 'geral']),
  plate: z.string(),
  confidence: z.number().min(0).max(1),
  needsHuman: z.boolean(),
  priority: z.enum(['baixa', 'normal', 'alta', 'urgente']),
  sentiment: z.enum(['positivo', 'neutro', 'frustrado', 'irritado']),
  reason: z.string(),
  operationalTask: OperationalTaskSchema,
});

export type AgentPlan = z.infer<typeof PlanSchema>;

type VehicleContext = { id?: string; placa: string; modelo: string | null; status: string | null; setor: string | null; ultima_atualizacao?: string | null };
type OpenTaskContext = { id: string; veiculo_id: string | null; tipo: string; titulo: string; instrucoes: string; setor_responsavel: string | null; status: string; criado_em: string };
type AgentContext = { message: string; messageType: string; waitingFor: string | null; plateContext: string | null; vehicles: VehicleContext[]; history: Array<{ origem: string; mensagem: string }>; openTasks: OpenTaskContext[] };

function client() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada.');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const schema = {
  type: 'object', additionalProperties: false,
  properties: {
    intent: { type: 'string', enum: ['status', 'confirmacao_operacional', 'vistoria', 'foto', 'orcamento', 'agendamento', 'horario_endereco', 'reclamacao', 'humano', 'midia', 'geral'] },
    action: { type: 'string', enum: ['status', 'verificar_operacao', 'pedir_placa', 'vistoria', 'foto', 'orcamento', 'agendamento', 'horario_endereco', 'humano', 'midia', 'geral'] },
    plate: { type: 'string' }, confidence: { type: 'number', minimum: 0, maximum: 1 }, needsHuman: { type: 'boolean' }, priority: { type: 'string', enum: ['baixa', 'normal', 'alta', 'urgente'] }, sentiment: { type: 'string', enum: ['positivo', 'neutro', 'frustrado', 'irritado'] }, reason: { type: 'string' },
    operationalTask: { type: 'object', additionalProperties: false, properties: { type: { type: 'string', enum: ['confirmar_etapa', 'tirar_foto', 'confirmar_peca', 'verificar_status_fisico', 'informacao_setor', 'nenhuma'] }, sector: { type: 'string' }, instruction: { type: 'string' }, requiresPhoto: { type: 'boolean' } }, required: ['type', 'sector', 'instruction', 'requiresPhoto'] },
  },
  required: ['intent', 'action', 'plate', 'confidence', 'needsHuman', 'priority', 'sentiment', 'reason', 'operationalTask'],
};

function normalizePlate(value = '') { const match = value.toUpperCase().match(/\b([A-Z]{3})[\s-]?([0-9][A-Z][0-9]{2}|[0-9]{4})\b/); return match ? `${match[1]}${match[2]}` : ''; }
function normalizeText(value = '') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function asksAboutParts(value = '') { return /\b(peca|pecas|reposicao|componente|componentes)\b/.test(normalizeText(value)); }
const emptyTask = { type: 'nenhuma' as const, sector: '', instruction: '', requiresPhoto: false };

export async function planAttendance(context: AgentContext): Promise<AgentPlan> {
  if (context.messageType !== 'text') return { intent: 'midia', action: 'midia', plate: '', confidence: 1, needsHuman: true, priority: 'normal', sentiment: 'neutro', reason: 'midia_recebida', operationalTask: emptyTask };
  const response = await client().responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna', store: false,
    instructions: `Você é o roteador de atendimento da PintService, uma oficina brasileira de funilaria e pintura.
Entenda a intenção do cliente e escolha UMA ação segura.
Nunca invente status, setor, preço, orçamento, prazo, data de entrega, peça recebida ou disponibilidade.
Status registrado no sistema pode ser informado, mas perguntas que exigem confirmação física atual devem gerar verificar_operacao.
Exemplos permitidos para verificar_operacao: "já está pronto para pintura?", "consegue tirar uma foto agora?", "confere em qual setor ele está?".
Tipos operacionais permitidos para resposta automática: confirmar_etapa, tirar_foto, verificar_status_fisico ou informacao_setor.
Qualquer pergunta sobre peça, peças, reposição, chegada de peça ou componente deve ir para humano. Nunca use confirmar_peca para atender cliente automaticamente.
Solicitações de vistoria, orçamento particular, discussão de preço/prazo, reclamação, pedido de gerente, ameaça, acidente grave, informação conflitante ou baixa confiança devem ir para humano.
Para pedido de foto do veículo na oficina, prefira verificar_operacao/tirar_foto quando a placa estiver identificada.
Revise openTasks antes de pedir nova verificação. Se já houver tarefa equivalente, reutilize a finalidade.
Se o cliente pedir status simples e existir exatamente um veículo, pode usar a placa dele. Se houver vários e não identificar qual, peça a placa.
Quando a ação não for verificar_operacao, use operationalTask.type="nenhuma" e os demais campos vazios/false.`,
    input: JSON.stringify(context), text: { format: { type: 'json_schema', name: 'triagem_oficina', strict: true, schema } },
  });
  const plan = PlanSchema.parse(JSON.parse(response.output_text));
  const messagePlate = normalizePlate(context.message); const contextPlate = normalizePlate(context.plateContext || ''); const aiPlate = normalizePlate(plan.plate); let plate = messagePlate || aiPlate || contextPlate;

  if (asksAboutParts(context.message) || plan.operationalTask.type === 'confirmar_peca') {
    return { ...plan, intent: 'humano', action: 'humano', plate, needsHuman: true, priority: plan.priority === 'baixa' ? 'normal' : plan.priority, reason: `guardrail:pecas:${plan.reason}`, operationalTask: emptyTask };
  }
  if (plan.intent === 'vistoria' || plan.action === 'vistoria') {
    return { ...plan, action: 'humano', plate, needsHuman: true, reason: `guardrail:vistoria:${plan.reason}`, operationalTask: emptyTask };
  }
  if (plan.confidence < 0.62 || plan.intent === 'reclamacao' || plan.intent === 'humano') return { ...plan, plate, action: 'humano', needsHuman: true, reason: `guardrail:${plan.reason}`, operationalTask: emptyTask };
  if ((plan.action === 'status' || plan.action === 'verificar_operacao') && !plate) { if (context.vehicles.length === 1) plate = normalizePlate(context.vehicles[0].placa); else return { ...plan, plate: '', action: 'pedir_placa', needsHuman: false, operationalTask: emptyTask }; }
  if (plan.action === 'verificar_operacao' && plan.operationalTask.type === 'nenhuma') return { ...plan, plate, operationalTask: { type: 'verificar_status_fisico', sector: '', instruction: 'Verificar fisicamente a situação atual do veículo e confirmar a informação solicitada pelo cliente.', requiresPhoto: false } };
  return { ...plan, plate };
}

export async function answerGeneralQuestion(message: string) {
  const response = await client().responses.create({ model: process.env.OPENAI_MODEL || 'gpt-5.6-luna', store: false, instructions: 'Você atende a PintService, uma oficina de funilaria e pintura, pelo WhatsApp. Responda em português do Brasil, cordialmente, em até 3 frases. Nunca informe preço, prazo, disponibilidade, status de veículo, peça ou diagnóstico definitivo sem dados reais e regra explícita do sistema. Perguntas sobre peças, orçamento particular, vistoria ou casos que exijam avaliação específica devem ser encaminhadas para a equipe humana.', input: message });
  return response.output_text.trim();
}

export async function answerOperationalResolution(input: { customerQuestion: string; employeeResponse: string; taskType: string; evidenceSent: boolean; vehicle: { placa?: string | null; modelo?: string | null; status?: string | null; setor?: string | null } }) {
  const response = await client().responses.create({ model: process.env.OPENAI_MODEL || 'gpt-5.6-luna', store: false, instructions: 'Você está retomando uma conversa de WhatsApp depois que um funcionário da PintService fez uma confirmação física. Responda em português do Brasil, cordialmente, em até 3 frases. Use SOMENTE os fatos fornecidos na entrada. Não invente preço, prazo, data de entrega, próxima etapa, peça recebida ou qualquer status não confirmado. Se evidenceSent=true, pode mencionar que a foto/evidência está sendo enviada junto.', input: JSON.stringify(input) });
  return response.output_text.trim();
}

import 'server-only';
import OpenAI from 'openai';
import { z } from 'zod';
import { getOfficeProfileFacts } from '@/lib/office-profile';

const OperationalTaskSchema = z.object({
  type: z.enum(['confirmar_etapa', 'tirar_foto', 'confirmar_peca', 'verificar_status_fisico', 'informacao_setor', 'nenhuma']),
  sector: z.string(),
  instruction: z.string(),
  requiresPhoto: z.boolean(),
});

const PlanSchema = z.object({
  intent: z.enum(['status', 'pecas', 'confirmacao_operacional', 'vistoria', 'foto', 'orcamento', 'agendamento', 'horario_endereco', 'reclamacao', 'humano', 'midia', 'geral']),
  action: z.enum(['status', 'pecas', 'verificar_operacao', 'pedir_placa', 'vistoria', 'foto', 'orcamento', 'agendamento', 'horario_endereco', 'humano', 'midia', 'geral']),
  plate: z.string(),
  partQuery: z.string(),
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
    intent: { type: 'string', enum: ['status', 'pecas', 'confirmacao_operacional', 'vistoria', 'foto', 'orcamento', 'agendamento', 'horario_endereco', 'reclamacao', 'humano', 'midia', 'geral'] },
    action: { type: 'string', enum: ['status', 'pecas', 'verificar_operacao', 'pedir_placa', 'vistoria', 'foto', 'orcamento', 'agendamento', 'horario_endereco', 'humano', 'midia', 'geral'] },
    plate: { type: 'string' }, partQuery: { type: 'string' }, confidence: { type: 'number', minimum: 0, maximum: 1 }, needsHuman: { type: 'boolean' }, priority: { type: 'string', enum: ['baixa', 'normal', 'alta', 'urgente'] }, sentiment: { type: 'string', enum: ['positivo', 'neutro', 'frustrado', 'irritado'] }, reason: { type: 'string' },
    operationalTask: { type: 'object', additionalProperties: false, properties: { type: { type: 'string', enum: ['confirmar_etapa', 'tirar_foto', 'confirmar_peca', 'verificar_status_fisico', 'informacao_setor', 'nenhuma'] }, sector: { type: 'string' }, instruction: { type: 'string' }, requiresPhoto: { type: 'boolean' } }, required: ['type', 'sector', 'instruction', 'requiresPhoto'] },
  },
  required: ['intent', 'action', 'plate', 'partQuery', 'confidence', 'needsHuman', 'priority', 'sentiment', 'reason', 'operationalTask'],
};

function normalizePlate(value = '') { const match = value.toUpperCase().match(/\b([A-Z]{3})[\s-]?([0-9][A-Z][0-9]{2}|[0-9]{4})\b/); return match ? `${match[1]}${match[2]}` : ''; }
const emptyTask = { type: 'nenhuma' as const, sector: '', instruction: '', requiresPhoto: false };

export async function planAttendance(context: AgentContext): Promise<AgentPlan> {
  if (context.messageType !== 'text') return { intent: 'midia', action: 'midia', plate: '', partQuery: '', confidence: 1, needsHuman: true, priority: 'normal', sentiment: 'neutro', reason: 'midia_recebida', operationalTask: emptyTask };
  const response = await client().responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna', store: false,
    instructions: `Você é o roteador de atendimento da PintService, uma oficina brasileira de funilaria e pintura.
Entenda a intenção do cliente e escolha UMA ação segura.
Nunca invente status, setor, preço, orçamento, prazo, data de entrega, peça recebida ou disponibilidade.
Status registrado no sistema pode ser informado, mas perguntas que exigem confirmação física atual devem gerar verificar_operacao.
Exemplos permitidos para verificar_operacao: "já está pronto para pintura?", "consegue tirar uma foto agora?", "confere em qual setor ele está?".
Tipos operacionais permitidos para resposta automática: confirmar_etapa, tirar_foto, verificar_status_fisico ou informacao_setor.
Perguntas sobre chegada, recebimento ou falta de peça devem usar intent/action="pecas" para consultar o controle nativo antes de envolver humano. Em partQuery escreva somente a peça ou componente citado, sem placa e sem palavras como "chegou". Se a pergunta for sobre peças em geral, deixe partQuery vazio.
Nunca afirme que uma peça chegou a partir do texto do cliente; a ação pecas apenas autoriza a camada determinística a consultar o banco.
Solicitações de vistoria, orçamento particular, discussão de preço/prazo, reclamação, pedido de gerente, ameaça, acidente grave, informação conflitante ou baixa confiança devem ir para humano.
Para pedido de foto do veículo na oficina, prefira verificar_operacao/tirar_foto quando a placa estiver identificada.
Revise openTasks antes de pedir nova verificação. Se já houver tarefa equivalente, reutilize a finalidade.
Se o cliente pedir status simples e existir exatamente um veículo, pode usar a placa dele. Se houver vários e não identificar qual, peça a placa.
Quando a ação não for verificar_operacao, use operationalTask.type="nenhuma" e os demais campos vazios/false.`,
    input: JSON.stringify(context), text: { format: { type: 'json_schema', name: 'triagem_oficina', strict: true, schema } },
  });
  const plan = PlanSchema.parse(JSON.parse(response.output_text));
  const messagePlate = normalizePlate(context.message); const contextPlate = normalizePlate(context.plateContext || ''); const aiPlate = normalizePlate(plan.plate); let plate = messagePlate || aiPlate || contextPlate;

  if (plan.operationalTask.type === 'confirmar_peca') {
    return { ...plan, intent: 'pecas', action: 'pecas', plate, needsHuman: false, operationalTask: emptyTask };
  }
  if (plan.intent === 'vistoria' || plan.action === 'vistoria') {
    return { ...plan, action: 'humano', plate, needsHuman: true, reason: `guardrail:vistoria:${plan.reason}`, operationalTask: emptyTask };
  }
  if (plan.confidence < 0.62 || plan.intent === 'reclamacao' || plan.intent === 'humano') return { ...plan, plate, action: 'humano', needsHuman: true, reason: `guardrail:${plan.reason}`, operationalTask: emptyTask };
  if ((plan.action === 'status' || plan.action === 'verificar_operacao' || plan.action === 'pecas') && !plate) { if (context.vehicles.length === 1) plate = normalizePlate(context.vehicles[0].placa); else return { ...plan, plate: '', action: 'pedir_placa', needsHuman: false, operationalTask: emptyTask }; }
  if (plan.action === 'verificar_operacao' && plan.operationalTask.type === 'nenhuma') return { ...plan, plate, operationalTask: { type: 'verificar_status_fisico', sector: '', instruction: 'Verificar fisicamente a situação atual do veículo e confirmar a informação solicitada pelo cliente.', requiresPhoto: false } };
  return { ...plan, plate };
}

const PostDeliveryFeedbackSchema = z.object({
  sentiment: z.enum(['positivo', 'neutro', 'negativo', 'nao_relacionado']),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

export async function classifyPostDeliveryFeedback(message: string) {
  const feedbackSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      sentiment: { type: 'string', enum: ['positivo', 'neutro', 'negativo', 'nao_relacionado'] },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      reason: { type: 'string' },
    },
    required: ['sentiment', 'confidence', 'reason'],
  };
  const response = await client().responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    store: false,
    instructions: `Classifique a resposta de um cliente de funilaria/pintura que acabou de ser perguntado sobre a experiência após a entrega do veículo.
Use positivo quando houver satisfação clara, elogio ou confirmação inequívoca de que ficou tudo certo.
Use negativo quando houver reclamação, defeito percebido, insatisfação, problema, cobrança ou algo que precise de atenção humana.
Use neutro quando a resposta for relacionada ao serviço, mas não permitir concluir satisfação ou insatisfação.
Use nao_relacionado quando a mensagem claramente tratar de outro assunto.
Não transforme respostas vagas como "ok", "beleza" ou "recebido" em elogio automaticamente; em caso de dúvida, prefira neutro.`,
    input: message,
    text: { format: { type: 'json_schema', name: 'feedback_pos_entrega', strict: true, schema: feedbackSchema } },
  });
  return PostDeliveryFeedbackSchema.parse(JSON.parse(response.output_text));
}

export async function answerGeneralQuestion(message: string) {
  const officeFacts = getOfficeProfileFacts();
  const response = await client().responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    store: false,
    instructions: `Você atende a Pint Services pelo WhatsApp. Responda em português do Brasil, cordialmente, em até 3 frases.
Nunca informe preço, prazo, disponibilidade, status de veículo, peça ou diagnóstico definitivo sem dados reais e regra explícita do sistema. Perguntas sobre peças, orçamento particular, vistoria ou casos que exijam avaliação específica devem ser encaminhadas para a equipe humana.
Para telefone, endereço, horários, Instagram e localização, use somente os dados oficiais abaixo. Não invente outros canais e não trate o Reclame Aqui como oficial enquanto estiver pendente de confirmação.

DADOS OFICIAIS DISPONÍVEIS:
${officeFacts}`,
    input: message,
  });
  return response.output_text.trim();
}

const StaffOperationalUpdateSchema = z.object({
  updateStage: z.boolean(),
  stage: z.string(),
  updateStatus: z.boolean(),
  status: z.string(),
  reason: z.string(),
});

export async function suggestOperationalUpdateFromEmployeeResponse(input: {
  employeeResponse: string;
  currentStage?: string | null;
  currentStatus?: string | null;
  taskType: string;
}) {
  const updateSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      updateStage: { type: 'boolean' },
      stage: { type: 'string' },
      updateStatus: { type: 'boolean' },
      status: { type: 'string' },
      reason: { type: 'string' },
    },
    required: ['updateStage', 'stage', 'updateStatus', 'status', 'reason'],
  };

  const response = await client().responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    store: false,
    instructions: `Você analisa uma resposta curta de um funcionário de oficina e decide se ela contém uma atualização operacional EXPLÍCITA e segura para gravar no cadastro do veículo.

Etapas permitidas, exatamente com estes nomes:
- Desmontagem
- Funilaria
- Prep. de Pintura
- Pintura
- Polimento de Pint.
- Montagem
- Lavagem/Acabamento

Status permitidos, exatamente com estes nomes:
- Em serviço
- Aguardando peças
- Aguardando aprovação
- Parado
- Pronto para entrega

Regras:
- Só marque updateStage=true quando o funcionário afirmar claramente a etapa ATUAL do veículo, por exemplo "está na montagem", "já foi para polimento", "está em pintura".
- Frases como "acabou de sair da pintura", "terminou a funilaria" ou "vai para montagem" NÃO provam a etapa atual; nesses casos não atualize a etapa.
- Só marque updateStatus=true quando um dos status permitidos estiver explicitamente sustentado pela resposta.
- Nunca inferir próxima etapa, prazo, disponibilidade, entrega ou recebimento de peça.
- Se houver dúvida, deixe os campos de atualização falsos e strings vazias.
- A resposta ao cliente pode continuar normalmente mesmo quando não houver atualização estrutural.`,
    input: JSON.stringify(input),
    text: { format: { type: 'json_schema', name: 'atualizacao_operacional_funcionario', strict: true, schema: updateSchema } },
  });
  return StaffOperationalUpdateSchema.parse(JSON.parse(response.output_text));
}

export async function answerOperationalResolution(input: { customerQuestion: string; employeeResponse: string; taskType: string; evidenceSent: boolean; vehicle: { placa?: string | null; modelo?: string | null; status?: string | null; setor?: string | null } }) {
  const response = await client().responses.create({ model: process.env.OPENAI_MODEL || 'gpt-5.6-luna', store: false, instructions: 'Você está retomando uma conversa de WhatsApp depois que um funcionário da PintService fez uma confirmação física. Responda em português do Brasil, cordialmente, em até 3 frases. Use SOMENTE os fatos fornecidos na entrada. Não invente preço, prazo, data de entrega, próxima etapa, peça recebida ou qualquer status não confirmado. Se evidenceSent=true, pode mencionar que a foto/evidência está sendo enviada junto.', input: JSON.stringify(input) });
  return response.output_text.trim();
}

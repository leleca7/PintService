import 'server-only';
import { answerGeneralQuestion, planAttendance, type AgentPlan } from '@/lib/agent';
import { createOrReuseOperationalTask, type OperationalTaskType } from '@/lib/operational-tasks';
import { externalVehicleSourceConfigured, resolveOperationalVehicle } from '@/lib/operational-vehicle';
import { findEmployeeByWhatsAppPhone, processStaffWhatsAppMessage } from '@/lib/staff-whatsapp';
import { getOfficeProfile } from '@/lib/office-profile';
import { getDb } from '@/lib/db';
import { sendWhatsAppText, sentWhatsAppMessageId, type IncomingWhatsAppMessage } from '@/lib/whatsapp';

const STAGES = ['Desmontagem', 'Funilaria', 'Preparação de pintura', 'Pintura', 'Montagem', 'Polimento', 'Lavagem'];

type ProcessIncomingOptions = { eventManaged?: boolean };

function normalize(value = '') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

function safeErrorSummary(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? 'erro desconhecido');
  return raw.replace(/([a-z][a-z0-9+.-]*:\/\/)[^@\s]+@/gi, '$1***@').slice(0, 300);
}

function statusMessage(vehicle: any) {
  const sector = vehicle.setor ?? vehicle.etapa ?? '';
  const base = normalize(`${vehicle.status ?? ''} ${sector}`);
  const index = STAGES.findIndex((stage) => base.includes(normalize(stage)));
  const label = vehicle.modelo ? `${vehicle.modelo} (${vehicle.placa})` : `veículo ${vehicle.placa}`;
  let text = index >= 0 ? `Seu ${label} está registrado na etapa ${index + 1} de ${STAGES.length} — ${STAGES[index]}.` : `Encontrei seu ${label}. A atualização registrada é ${sector || vehicle.status || 'em acompanhamento pela oficina'}.`;
  if (vehicle.status) text += ` Situação registrada: ${vehicle.status}.`;
  if (index > 0 && vehicle.statusPrazo) text += ` Situação do prazo registrada: ${vehicle.statusPrazo}.`;
  if (vehicle.source === 'planilha') text += ' Consultei agora a fonte operacional vinculada pela oficina.';
  text += ' Se a sua pergunta exigir uma confirmação física atual, eu posso pedir para a equipe verificar sem inventar a resposta.';
  return text;
}

async function createPending(clientId: string | null, vehicleId: string | null, type: string, message: string, priority: string) {
  if (!clientId) return;
  const sql = getDb();
  const existing = vehicleId
    ? await sql`SELECT id FROM pendencias WHERE cliente_id = ${clientId} AND tipo = ${type} AND veiculo_id = ${vehicleId} AND status IN ('aberta','em_atendimento') LIMIT 1`
    : await sql`SELECT id FROM pendencias WHERE cliente_id = ${clientId} AND tipo = ${type} AND status IN ('aberta','em_atendimento') LIMIT 1`;
  if (!existing[0]) await sql`INSERT INTO pendencias (cliente_id,veiculo_id,tipo,mensagem,prioridade) VALUES (${clientId},${vehicleId},${type},${message},${priority})`;
}

type StateValues = { etapa: string; bot_ativo: boolean; ultima_intencao?: string | null; placa_contexto?: string | null; aguardando_campo?: string | null; tarefa_aguardada_id?: string | null };
async function setState(phone: string, values: StateValues) {
  const sql = getDb();
  await sql`
    INSERT INTO estado_atendimento (telefone,etapa,bot_ativo,ultima_intencao,placa_contexto,aguardando_campo,tarefa_aguardada_id,atualizado_em)
    VALUES (${phone},${values.etapa},${values.bot_ativo},${values.ultima_intencao ?? null},${values.placa_contexto ?? null},${values.aguardando_campo ?? null},${values.tarefa_aguardada_id ?? null},now())
    ON CONFLICT (telefone) DO UPDATE SET etapa = EXCLUDED.etapa, bot_ativo = EXCLUDED.bot_ativo, ultima_intencao = EXCLUDED.ultima_intencao, placa_contexto = EXCLUDED.placa_contexto, aguardando_campo = EXCLUDED.aguardando_campo, tarefa_aguardada_id = EXCLUDED.tarefa_aguardada_id, atualizado_em = now()
  `;
}

function unavailableVehicleReply(reason: 'not_found' | 'source_error' | 'incomplete') {
  if (reason === 'source_error') return 'A fonte operacional da oficina não respondeu agora. Para não te passar uma informação possivelmente desatualizada, encaminhei para a equipe confirmar e continuar com você por aqui.';
  if (reason === 'incomplete') return 'Encontrei o veículo, mas a informação de etapa/status não está preenchida na fonte da oficina. Encaminhei para a equipe confirmar antes de te responder.';
  return 'Não encontrei essa placa na fonte operacional da oficina. Encaminhei para a equipe verificar e continuar com você por aqui.';
}

export async function processIncomingMessage(message: IncomingWhatsAppMessage, options: ProcessIncomingOptions = {}) {
  const sql = getDb();
  if (!options.eventManaged) {
    const event = await sql`INSERT INTO eventos_whatsapp (message_id,telefone) VALUES (${message.id},${message.phone}) ON CONFLICT (message_id) DO NOTHING RETURNING message_id`;
    if (!event[0]) return { duplicate: true };
  }

  const employee = await findEmployeeByWhatsAppPhone(message.phone);
  if (employee) return processStaffWhatsAppMessage(message, employee);

  const clients = await sql`
    INSERT INTO clientes (telefone,nome) VALUES (${message.phone},${message.name || null})
    ON CONFLICT (telefone) DO UPDATE SET nome = COALESCE(EXCLUDED.nome, clientes.nome), atualizado_em = now()
    RETURNING id,nome,telefone
  `;
  const client = clients[0];
  if (!client) throw new Error('Não foi possível registrar o cliente.');

  await sql`
    INSERT INTO conversas (telefone,cliente_id,message_id,mensagem,origem,tipo_mensagem,media_id,atendente_assumiu)
    VALUES (${message.phone},${client.id},${message.id},${message.text || `[${message.type} recebida]`},'cliente',${message.type},${message.mediaId || null},false)
    ON CONFLICT (message_id) DO NOTHING
  `;

  const [stateRows, vehicleRows, historyRows, openTaskRows] = await Promise.all([
    sql`SELECT * FROM estado_atendimento WHERE telefone = ${message.phone} LIMIT 1`,
    sql`SELECT id,placa,modelo,status,setor,ultima_atualizacao FROM veiculos WHERE cliente_id = ${client.id} ORDER BY ultima_atualizacao DESC`,
    sql`SELECT origem,mensagem FROM conversas WHERE telefone = ${message.phone} ORDER BY id DESC LIMIT 12`,
    sql`SELECT id,veiculo_id,tipo,titulo,instrucoes,setor_responsavel,status,criado_em FROM tarefas_operacionais WHERE cliente_id = ${client.id} AND status IN ('aberta','em_execucao','aguardando_confirmacao') ORDER BY criado_em DESC LIMIT 12`,
  ]);
  const state = stateRows[0] ?? null;
  if (state?.bot_ativo === false) return { handedToHuman: true };

  const vehicles = vehicleRows.map((row) => ({
    id: String(row.id ?? ''),
    placa: String(row.placa ?? ''),
    modelo: row.modelo == null ? null : String(row.modelo),
    status: row.status == null ? null : String(row.status),
    setor: row.setor == null ? null : String(row.setor),
    ultima_atualizacao: row.ultima_atualizacao == null ? null : String(row.ultima_atualizacao),
  }));
  const history = historyRows.map((row) => ({ origem: String(row.origem ?? ''), mensagem: String(row.mensagem ?? '') }));
  const openTasks = openTaskRows.map((row) => ({
    id: String(row.id ?? ''),
    veiculo_id: row.veiculo_id == null ? null : String(row.veiculo_id),
    tipo: String(row.tipo ?? ''),
    titulo: String(row.titulo ?? ''),
    instrucoes: String(row.instrucoes ?? ''),
    setor_responsavel: row.setor_responsavel == null ? null : String(row.setor_responsavel),
    status: String(row.status ?? ''),
    criado_em: String(row.criado_em ?? ''),
  }));

  const plannerVehicles = externalVehicleSourceConfigured() ? [] : vehicles;
  let plan: AgentPlan;
  try {
    plan = await planAttendance({
      message: message.text,
      messageType: message.type,
      waitingFor: state?.aguardando_campo == null ? null : String(state.aguardando_campo),
      plateContext: state?.placa_contexto == null ? null : String(state.placa_contexto),
      vehicles: plannerVehicles,
      history: [...history].reverse(),
      openTasks,
    });
  } catch (error) {
    const summary = safeErrorSummary(error);
    console.error('ai_planner_unavailable', { messageId: message.id, error: summary });
    await createPending(String(client.id), null, 'atendente', `Triagem automática indisponível. Revisar a mensagem do cliente: ${message.text || `[${message.type} recebida]`}`, 'alta');
    await setState(message.phone, { etapa: 'atendimento_humano', bot_ativo: false, ultima_intencao: 'falha_ia' });
    const fallbackReply = 'Recebi sua mensagem. Nosso atendimento automático está indisponível neste momento, então encaminhei sua solicitação para a equipe continuar com você por aqui.';
    const sendResult = await sendWhatsAppText(message.phone, fallbackReply);
    const outboundMessageId = sentWhatsAppMessageId(sendResult);
    await sql`INSERT INTO decisoes_ia (telefone,mensagem,intencao,acao,confianca,prioridade,precisa_atendente,dados) VALUES (${message.phone},${message.text},'humano','humano',0,'alta',true,${JSON.stringify({ reason: 'ai_unavailable', error: summary, incomingMessageId: message.id, outboundMessageId })}::jsonb)`;
    if (outboundMessageId) {
      await sql`INSERT INTO conversas (telefone,cliente_id,message_id,mensagem,origem,intencao,atendente_assumiu) VALUES (${message.phone},${client.id},${outboundMessageId},${fallbackReply},'bot','humano',true) ON CONFLICT (message_id) DO NOTHING`;
    }
    return { ok: true, action: 'humano', needsHuman: true, fallback: 'ai_unavailable' };
  }

  const decisionData = JSON.stringify({ reason: plan.reason, sentiment: plan.sentiment, plate: plan.plate, operationalTask: plan.operationalTask, openTaskCount: openTasks.length, externalVehicleSource: externalVehicleSourceConfigured(), incomingMessageId: message.id });
  await sql`INSERT INTO decisoes_ia (telefone,mensagem,intencao,acao,confianca,prioridade,precisa_atendente,dados) VALUES (${message.phone},${message.text},${plan.intent},${plan.action},${plan.confidence},${plan.priority},${plan.needsHuman},${decisionData}::jsonb)`;

  let reply = '';
  let needsHuman = false;
  let vehicleId: string | null = null;

  switch (plan.action) {
    case 'status': {
      const resolution = await resolveOperationalVehicle(plan.plate);
      if (!resolution.ok) {
        needsHuman = true;
        reply = unavailableVehicleReply(resolution.reason);
        const detail = resolution.reason === 'source_error' ? `Fonte por link indisponível ao consultar ${plan.plate}: ${resolution.error || 'erro sem detalhe'}.` : resolution.reason === 'incomplete' ? `Completar etapa/status da placa ${plan.plate} na fonte operacional e responder o cliente.` : `Localizar a placa ${plan.plate || 'não identificada'} na fonte operacional e responder o cliente.`;
        await createPending(String(client.id), null, 'atendente', detail, resolution.reason === 'source_error' ? 'alta' : 'normal');
        await setState(message.phone, { etapa: 'atendimento_humano', bot_ativo: false, ultima_intencao: 'status' });
      } else {
        const vehicle = resolution.vehicle;
        vehicleId = vehicle.id;
        await sql`UPDATE veiculos SET cliente_id = COALESCE(cliente_id, ${client.id}) WHERE id = ${vehicle.id}`;
        reply = statusMessage(vehicle);
        await setState(message.phone, { etapa: 'inicio', bot_ativo: true, ultima_intencao: 'status', placa_contexto: vehicle.placa });
      }
      break;
    }
    case 'verificar_operacao': {
      const resolution = await resolveOperationalVehicle(plan.plate);
      if (!resolution.ok) {
        needsHuman = true;
        reply = unavailableVehicleReply(resolution.reason);
        const detail = resolution.reason === 'source_error' ? `Fonte por link indisponível antes da confirmação física da placa ${plan.plate}: ${resolution.error || 'erro sem detalhe'}.` : `Localizar/completar o cadastro da placa ${plan.plate || 'não identificada'} antes da confirmação operacional.`;
        await createPending(String(client.id), null, 'atendente', detail, plan.priority);
        await setState(message.phone, { etapa: 'atendimento_humano', bot_ativo: false, ultima_intencao: plan.intent });
        break;
      }
      const vehicle = resolution.vehicle;
      vehicleId = vehicle.id;
      await sql`UPDATE veiculos SET cliente_id = COALESCE(cliente_id, ${client.id}) WHERE id = ${vehicle.id}`;
      const taskType: OperationalTaskType = plan.operationalTask.type === 'nenhuma' || plan.operationalTask.type === 'confirmar_peca' ? 'verificar_status_fisico' : plan.operationalTask.type;
      const request = { type: taskType, sector: plan.operationalTask.sector || vehicle.setor || '', instruction: plan.operationalTask.instruction || `Verificar fisicamente a situação atual do veículo ${vehicle.placa} e confirmar a informação solicitada pelo cliente.`, requiresPhoto: plan.operationalTask.requiresPhoto };
      const { task, reused } = await createOrReuseOperationalTask({ clientId: String(client.id), vehicle, customerPhone: message.phone, customerMessage: message.text, priority: plan.priority, request });
      const sector = task.setor_responsavel ? ` com o setor de ${task.setor_responsavel}` : ' com a equipe da oficina';
      reply = reused ? `Essa confirmação já está sendo verificada${sector}. Não criei outra cobrança; assim que a tarefa for concluída, eu te aviso automaticamente por aqui.` : `Vou confirmar isso${sector}. Criei uma verificação específica para o veículo ${vehicle.placa}; assim que a equipe responder, eu continuo com você automaticamente por aqui.`;
      await setState(message.phone, { etapa: 'aguardando_tarefa_operacional', bot_ativo: true, ultima_intencao: plan.intent, placa_contexto: vehicle.placa, tarefa_aguardada_id: String(task.id) });
      break;
    }
    case 'pedir_placa':
      reply = 'Claro. Pode me informar a placa do veículo?';
      await setState(message.phone, { etapa: 'aguardando_placa', bot_ativo: true, ultima_intencao: 'status', aguardando_campo: 'placa' });
      break;
    case 'vistoria':
      needsHuman = true;
      await createPending(String(client.id), null, 'vistoria', message.text || 'Solicitação de vistoria', 'normal');
      await setState(message.phone, { etapa: 'atendimento_humano', bot_ativo: false, ultima_intencao: 'vistoria' });
      reply = 'Recebi sua solicitação de vistoria e encaminhei para a equipe confirmar as orientações e continuar com você por aqui.';
      break;
    case 'horario_endereco': {
      const office = getOfficeProfile();
      reply = `Nosso atendimento é ${office.hours}. Estamos em ${office.address}. Telefone comercial: ${office.publicPhone}.`;
      break;
    }
    case 'foto':
    case 'orcamento':
    case 'agendamento':
    case 'midia':
    case 'humano': {
      needsHuman = true;
      const type = plan.action === 'midia' ? 'midia_cliente' : plan.action === 'humano' ? 'atendente' : plan.action;
      await createPending(String(client.id), null, type, message.text || `[${message.type} recebida]`, plan.priority);
      await setState(message.phone, { etapa: 'atendimento_humano', bot_ativo: false, ultima_intencao: plan.intent });
      const responses: Record<string, string> = {
        foto: 'Registrei seu pedido de foto e passei para o atendimento continuar com você por aqui.',
        orcamento: 'Registrei seu pedido de orçamento. Como o valor depende da avaliação do veículo e do serviço, o atendimento vai continuar com você por aqui.',
        agendamento: 'Registrei seu pedido de agendamento. O atendimento vai verificar a disponibilidade e continuar com você por aqui.',
        midia: 'Recebi o arquivo e deixei registrado para o atendimento analisar e continuar com você por aqui.',
        humano: plan.priority === 'alta' || plan.priority === 'urgente' ? 'Entendi. Marquei sua solicitação como prioritária e encaminhei para o atendimento.' : 'Entendi. Encaminhei sua mensagem para o atendimento continuar com você por aqui.',
      };
      reply = responses[plan.action];
      break;
    }
    case 'geral':
    default:
      try {
        reply = await answerGeneralQuestion(message.text);
      } catch (error) {
        const summary = safeErrorSummary(error);
        console.error('ai_general_answer_unavailable', { messageId: message.id, error: summary });
        needsHuman = true;
        await createPending(String(client.id), null, 'atendente', `Resposta automática indisponível. Revisar: ${message.text}`, 'normal');
        await setState(message.phone, { etapa: 'atendimento_humano', bot_ativo: false, ultima_intencao: 'geral' });
        reply = 'Recebi sua mensagem e encaminhei para a equipe continuar com você por aqui.';
      }
      break;
  }

  const sendResult = await sendWhatsAppText(message.phone, reply);
  const outboundMessageId = sentWhatsAppMessageId(sendResult);
  if (outboundMessageId) {
    await sql`INSERT INTO conversas (telefone,cliente_id,veiculo_id,message_id,mensagem,origem,intencao,atendente_assumiu) VALUES (${message.phone},${client.id},${vehicleId},${outboundMessageId},${reply},'bot',${plan.intent},${needsHuman}) ON CONFLICT (message_id) DO NOTHING`;
  }
  return { ok: true, action: plan.action, needsHuman, outboundMessageId };
}

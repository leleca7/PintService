import 'server-only';
import { answerGeneralQuestion, planAttendance } from '@/lib/agent';
import { createOrReuseOperationalTask, type OperationalTaskType } from '@/lib/operational-tasks';
import { externalVehicleSourceConfigured, resolveOperationalVehicle } from '@/lib/operational-vehicle';
import { findEmployeeByWhatsAppPhone, processStaffWhatsAppMessage } from '@/lib/staff-whatsapp';
import { getDb } from '@/lib/db';
import { sendWhatsAppText, type IncomingWhatsAppMessage } from '@/lib/whatsapp';

const STAGES = ['Desmontagem', 'Funilaria', 'Preparação de pintura', 'Pintura', 'Montagem', 'Polimento', 'Lavagem'];

function normalize(value = '') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

function statusMessage(vehicle: any) {
  const sector = vehicle.setor ?? vehicle.etapa ?? '';
  const base = normalize(`${vehicle.status ?? ''} ${sector}`);
  const index = STAGES.findIndex((stage) => base.includes(normalize(stage)));
  const label = vehicle.modelo ? `${vehicle.modelo} (${vehicle.placa})` : `veículo ${vehicle.placa}`;
  let text = index >= 0 ? `Seu ${label} está registrado na etapa ${index + 1} de ${STAGES.length} — ${STAGES[index]}.` : `Encontrei seu ${label}. A atualização registrada é ${sector || vehicle.status || 'em acompanhamento pela oficina'}.`;
  if (vehicle.status) text += ` Situação registrada: ${vehicle.status}.`;
  if (vehicle.statusPrazo) text += ` Situação do prazo registrada: ${vehicle.statusPrazo}.`;
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

export async function processIncomingMessage(message: IncomingWhatsAppMessage) {
  const sql = getDb();
  const event = await sql`INSERT INTO eventos_whatsapp (message_id,telefone) VALUES (${message.id},${message.phone}) ON CONFLICT (message_id) DO NOTHING RETURNING message_id`;
  if (!event[0]) return { duplicate: true };

  const employee = await findEmployeeByWhatsAppPhone(message.phone);
  if (employee) return processStaffWhatsAppMessage(message, employee);

  const clients = await sql`
    INSERT INTO clientes (telefone,nome) VALUES (${message.phone},${message.name || null})
    ON CONFLICT (telefone) DO UPDATE SET nome = COALESCE(EXCLUDED.nome, clientes.nome), atualizado_em = now()
    RETURNING id,nome,telefone
  `;
  const client = clients[0];
  if (!client) throw new Error('Não foi possível registrar o cliente.');

  await sql`INSERT INTO conversas (telefone,cliente_id,message_id,mensagem,origem,tipo_mensagem,media_id,atendente_assumiu) VALUES (${message.phone},${client.id},${message.id},${message.text || `[${message.type} recebida]`},'cliente',${message.type},${message.mediaId || null},false)`;

  const [stateRows, vehicles, history, openTasks] = await Promise.all([
    sql`SELECT * FROM estado_atendimento WHERE telefone = ${message.phone} LIMIT 1`,
    sql`SELECT id,placa,modelo,status,setor,ultima_atualizacao FROM veiculos WHERE cliente_id = ${client.id} ORDER BY ultima_atualizacao DESC`,
    sql`SELECT origem,mensagem FROM conversas WHERE telefone = ${message.phone} ORDER BY id DESC LIMIT 12`,
    sql`SELECT id,veiculo_id,tipo,titulo,instrucoes,setor_responsavel,status,criado_em FROM tarefas_operacionais WHERE cliente_id = ${client.id} AND status IN ('aberta','em_execucao','aguardando_confirmacao') ORDER BY criado_em DESC LIMIT 12`,
  ]);
  const state = stateRows[0] ?? null;
  if (state?.bot_ativo === false) return { handedToHuman: true };

  const plannerVehicles = externalVehicleSourceConfigured() ? [] : vehicles;
  const plan = await planAttendance({ message: message.text, messageType: message.type, waitingFor: state?.aguardando_campo ?? null, plateContext: state?.placa_contexto ?? null, vehicles: plannerVehicles, history: [...history].reverse(), openTasks });

  const decisionData = JSON.stringify({ reason: plan.reason, sentiment: plan.sentiment, plate: plan.plate, operationalTask: plan.operationalTask, openTaskCount: openTasks.length, externalVehicleSource: externalVehicleSourceConfigured() });
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
      const taskType: OperationalTaskType = plan.operationalTask.type === 'nenhuma' ? 'verificar_status_fisico' : plan.operationalTask.type;
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
      reply = 'Para vistorias de seguradoras e associações, não é necessário agendamento. O atendimento é por ordem de chegada, das 8h às 16h.';
      await setState(message.phone, { etapa: 'inicio', bot_ativo: true, ultima_intencao: 'vistoria' });
      break;
    case 'horario_endereco': {
      const hours = process.env.OFICINA_HOURS || 'das 8h às 16h';
      const address = process.env.OFICINA_ADDRESS;
      reply = address ? `Nosso atendimento é ${hours}. Estamos em ${address}.` : `Nosso atendimento é ${hours}. Para confirmar o endereço, vou deixar essa informação disponível assim que cadastrarmos os dados da oficina.`;
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
        foto: 'Registrei seu pedido de foto e passei para o atendimento. Se o veículo estiver identificado, a IA também pode transformar pedidos de foto em tarefa operacional da equipe.',
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
      reply = await answerGeneralQuestion(message.text);
      break;
  }

  await sendWhatsAppText(message.phone, reply);
  await sql`INSERT INTO conversas (telefone,cliente_id,veiculo_id,mensagem,origem,intencao,atendente_assumiu) VALUES (${message.phone},${client.id},${vehicleId},${reply},'bot',${plan.intent},${needsHuman})`;
  return { ok: true, action: plan.action, needsHuman };
}

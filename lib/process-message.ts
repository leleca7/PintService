import 'server-only';
import { answerGeneralQuestion, planAttendance } from '@/lib/agent';
import { createOrReuseOperationalTask, type OperationalTaskType } from '@/lib/operational-tasks';
import { externalVehicleSourceConfigured, resolveOperationalVehicle } from '@/lib/operational-vehicle';
import { findEmployeeByWhatsAppPhone, processStaffWhatsAppMessage } from '@/lib/staff-whatsapp';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sendWhatsAppText, type IncomingWhatsAppMessage } from '@/lib/whatsapp';

const STAGES = ['Desmontagem', 'Funilaria', 'Preparação de pintura', 'Pintura', 'Montagem', 'Polimento', 'Lavagem'];

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function statusMessage(vehicle: any) {
  const sector = vehicle.setor ?? vehicle.etapa ?? '';
  const base = normalize(`${vehicle.status ?? ''} ${sector}`);
  const index = STAGES.findIndex((stage) => base.includes(normalize(stage)));
  const label = vehicle.modelo ? `${vehicle.modelo} (${vehicle.placa})` : `veículo ${vehicle.placa}`;

  let text = index >= 0
    ? `Seu ${label} está registrado na etapa ${index + 1} de ${STAGES.length} — ${STAGES[index]}.`
    : `Encontrei seu ${label}. A atualização registrada é ${sector || vehicle.status || 'em acompanhamento pela oficina'}.`;

  if (vehicle.status) text += ` Situação registrada: ${vehicle.status}.`;
  if (vehicle.statusPrazo) text += ` Situação do prazo registrada: ${vehicle.statusPrazo}.`;
  if (vehicle.source === 'planilha') text += ' Consultei agora a fonte operacional vinculada pela oficina.';
  text += ' Se a sua pergunta exigir uma confirmação física atual, eu posso pedir para a equipe verificar sem inventar a resposta.';
  return text;
}

async function createPending(supabase: any, clientId: string | null, vehicleId: string | null, type: string, message: string, priority: string) {
  if (!clientId) return;
  let query = supabase.from('pendencias').select('id').eq('cliente_id', clientId).eq('tipo', type).in('status', ['aberta', 'em_atendimento']).limit(1);
  if (vehicleId) query = query.eq('veiculo_id', vehicleId);
  const { data } = await query.maybeSingle();
  if (!data) await supabase.from('pendencias').insert({ cliente_id: clientId, veiculo_id: vehicleId, tipo: type, mensagem: message, prioridade: priority });
}

async function setState(supabase: any, phone: string, values: Record<string, unknown>) {
  await supabase.from('estado_atendimento').upsert({ telefone: phone, atualizado_em: new Date().toISOString(), ...values }, { onConflict: 'telefone' });
}

function unavailableVehicleReply(reason: 'not_found' | 'source_error' | 'incomplete') {
  if (reason === 'source_error') return 'A fonte operacional da oficina não respondeu agora. Para não te passar uma informação possivelmente desatualizada, encaminhei para a equipe confirmar e continuar com você por aqui.';
  if (reason === 'incomplete') return 'Encontrei o veículo, mas a informação de etapa/status não está preenchida na fonte da oficina. Encaminhei para a equipe confirmar antes de te responder.';
  return 'Não encontrei essa placa na fonte operacional da oficina. Encaminhei para a equipe verificar e continuar com você por aqui.';
}

export async function processIncomingMessage(message: IncomingWhatsAppMessage) {
  const supabase = getSupabaseAdmin();

  const { error: eventError } = await supabase.from('eventos_whatsapp').insert({ message_id: message.id, telefone: message.phone });
  if (eventError?.code === '23505') return { duplicate: true };
  if (eventError) throw eventError;

  const employee = await findEmployeeByWhatsAppPhone(message.phone);
  if (employee) return processStaffWhatsAppMessage(message, employee);

  const { data: client, error: clientError } = await supabase
    .from('clientes')
    .upsert({ telefone: message.phone, nome: message.name || null }, { onConflict: 'telefone' })
    .select('id,nome,telefone')
    .single();
  if (clientError) throw clientError;

  await supabase.from('conversas').insert({
    telefone: message.phone,
    cliente_id: client.id,
    mensagem: message.text || `[${message.type} recebida]`,
    origem: 'cliente',
    tipo_mensagem: message.type,
    media_id: message.mediaId || null,
    message_id: message.id,
    atendente_assumiu: false,
  });

  const [{ data: state }, { data: vehicles }, { data: history }, { data: openTasks }] = await Promise.all([
    supabase.from('estado_atendimento').select('*').eq('telefone', message.phone).maybeSingle(),
    supabase.from('veiculos').select('id,placa,modelo,status,setor,ultima_atualizacao').eq('cliente_id', client.id).order('ultima_atualizacao', { ascending: false }),
    supabase.from('conversas').select('origem,mensagem').eq('telefone', message.phone).order('id', { ascending: false }).limit(12),
    supabase.from('tarefas_operacionais').select('id,veiculo_id,tipo,titulo,instrucoes,setor_responsavel,status,criado_em').eq('cliente_id', client.id).in('status', ['aberta', 'em_execucao', 'aguardando_confirmacao']).order('criado_em', { ascending: false }).limit(12),
  ]);

  if (state?.bot_ativo === false) return { handedToHuman: true };

  const plannerVehicles = externalVehicleSourceConfigured() ? [] : (vehicles ?? []);
  const plan = await planAttendance({ message: message.text, messageType: message.type, waitingFor: state?.aguardando_campo ?? null, plateContext: state?.placa_contexto ?? null, vehicles: plannerVehicles, history: (history ?? []).reverse(), openTasks: openTasks ?? [] });

  await supabase.from('decisoes_ia').insert({ telefone: message.phone, mensagem: message.text, intencao: plan.intent, acao: plan.action, confianca: plan.confidence, prioridade: plan.priority, precisa_atendente: plan.needsHuman, dados: { reason: plan.reason, sentiment: plan.sentiment, plate: plan.plate, operationalTask: plan.operationalTask, openTaskCount: openTasks?.length ?? 0, externalVehicleSource: externalVehicleSourceConfigured() } });

  let reply = '';
  let needsHuman = false;
  let vehicleId: string | null = null;

  switch (plan.action) {
    case 'status': {
      const resolution = await resolveOperationalVehicle(supabase, plan.plate);
      if (!resolution.ok) {
        needsHuman = true;
        reply = unavailableVehicleReply(resolution.reason);
        const detail = resolution.reason === 'source_error' ? `Fonte por link indisponível ao consultar ${plan.plate}: ${resolution.error || 'erro sem detalhe'}.` : resolution.reason === 'incomplete' ? `Completar etapa/status da placa ${plan.plate} na fonte operacional e responder o cliente.` : `Localizar a placa ${plan.plate || 'não identificada'} na fonte operacional e responder o cliente.`;
        await createPending(supabase, client.id, null, 'atendente', detail, resolution.reason === 'source_error' ? 'alta' : 'normal');
        await setState(supabase, message.phone, { etapa: 'atendimento_humano', bot_ativo: false, ultima_intencao: 'status', aguardando_campo: null });
      } else {
        const vehicle = resolution.vehicle;
        vehicleId = vehicle.id;
        reply = statusMessage(vehicle);
        await setState(supabase, message.phone, { etapa: 'inicio', bot_ativo: true, ultima_intencao: 'status', placa_contexto: vehicle.placa, aguardando_campo: null });
      }
      break;
    }
    case 'verificar_operacao': {
      const resolution = await resolveOperationalVehicle(supabase, plan.plate);
      if (!resolution.ok) {
        needsHuman = true;
        reply = unavailableVehicleReply(resolution.reason);
        const detail = resolution.reason === 'source_error' ? `Fonte por link indisponível antes da confirmação física da placa ${plan.plate}: ${resolution.error || 'erro sem detalhe'}.` : `Localizar/completar o cadastro da placa ${plan.plate || 'não identificada'} antes da confirmação operacional.`;
        await createPending(supabase, client.id, null, 'atendente', detail, plan.priority);
        await setState(supabase, message.phone, { etapa: 'atendimento_humano', bot_ativo: false, ultima_intencao: plan.intent, aguardando_campo: null });
        break;
      }

      const vehicle = resolution.vehicle;
      vehicleId = vehicle.id;
      const taskType: OperationalTaskType = plan.operationalTask.type === 'nenhuma' ? 'verificar_status_fisico' : plan.operationalTask.type;
      const request = { type: taskType, sector: plan.operationalTask.sector || vehicle.setor || '', instruction: plan.operationalTask.instruction || `Verificar fisicamente a situação atual do veículo ${vehicle.placa} e confirmar a informação solicitada pelo cliente.`, requiresPhoto: plan.operationalTask.requiresPhoto };
      const { task, reused } = await createOrReuseOperationalTask({ clientId: client.id, vehicle, customerPhone: message.phone, customerMessage: message.text, priority: plan.priority, request });
      const sector = task.setor_responsavel ? ` com o setor de ${task.setor_responsavel}` : ' com a equipe da oficina';
      reply = reused ? `Essa confirmação já está sendo verificada${sector}. Não criei outra cobrança; assim que a tarefa for concluída, eu te aviso automaticamente por aqui.` : `Vou confirmar isso${sector}. Criei uma verificação específica para o veículo ${vehicle.placa}; assim que a equipe responder, eu continuo com você automaticamente por aqui.`;
      await setState(supabase, message.phone, { etapa: 'aguardando_tarefa_operacional', bot_ativo: true, ultima_intencao: plan.intent, placa_contexto: vehicle.placa, aguardando_campo: null, tarefa_aguardada_id: task.id });
      break;
    }
    case 'pedir_placa': reply = 'Claro. Pode me informar a placa do veículo?'; await setState(supabase, message.phone, { etapa: 'aguardando_placa', bot_ativo: true, ultima_intencao: 'status', aguardando_campo: 'placa' }); break;
    case 'vistoria': reply = 'Para vistorias de seguradoras e associações, não é necessário agendamento. O atendimento é por ordem de chegada, das 8h às 16h.'; await setState(supabase, message.phone, { etapa: 'inicio', bot_ativo: true, ultima_intencao: 'vistoria', aguardando_campo: null }); break;
    case 'horario_endereco': {
      const hours = process.env.OFICINA_HOURS || 'das 8h às 16h'; const address = process.env.OFICINA_ADDRESS;
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
      await createPending(supabase, client.id, null, type, message.text || `[${message.type} recebida]`, plan.priority);
      await setState(supabase, message.phone, { etapa: 'atendimento_humano', bot_ativo: false, ultima_intencao: plan.intent, aguardando_campo: null });
      const responses: Record<string, string> = { foto: 'Registrei seu pedido de foto e passei para o atendimento. Se o veículo estiver identificado, a IA também pode transformar pedidos de foto em tarefa operacional da equipe.', orcamento: 'Registrei seu pedido de orçamento. Como o valor depende da avaliação do veículo e do serviço, o atendimento vai continuar com você por aqui.', agendamento: 'Registrei seu pedido de agendamento. O atendimento vai verificar a disponibilidade e continuar com você por aqui.', midia: 'Recebi o arquivo e deixei registrado para o atendimento analisar e continuar com você por aqui.', humano: plan.priority === 'alta' || plan.priority === 'urgente' ? 'Entendi. Marquei sua solicitação como prioritária e encaminhei para o atendimento.' : 'Entendi. Encaminhei sua mensagem para o atendimento continuar com você por aqui.' };
      reply = responses[plan.action];
      break;
    }
    case 'geral':
    default: reply = await answerGeneralQuestion(message.text); break;
  }

  await sendWhatsAppText(message.phone, reply);
  await supabase.from('conversas').insert({ telefone: message.phone, cliente_id: client.id, veiculo_id: vehicleId, mensagem: reply, origem: 'bot', intencao: plan.intent, atendente_assumiu: needsHuman });
  return { ok: true, action: plan.action, needsHuman };
}

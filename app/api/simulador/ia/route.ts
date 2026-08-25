import { NextResponse } from 'next/server';
import { answerGeneralQuestion, planAttendance } from '@/lib/agent';
import { requirePermission } from '@/lib/auth/current-user';
import { externalVehicleSourceConfigured, resolveOperationalVehicle } from '@/lib/operational-vehicle';
import { getOfficeProfile } from '@/lib/office-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HistoryItem = { origem: string; mensagem: string };

function cleanHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-12)
    .map((item: any) => ({ origem: String(item?.origem || ''), mensagem: String(item?.mensagem || '').slice(0, 1200) }))
    .filter((item) => item.origem && item.mensagem);
}

function vehicleReply(vehicle: any) {
  const label = vehicle.modelo ? `${vehicle.modelo} (${vehicle.placa})` : `veículo ${vehicle.placa}`;
  const update = vehicle.setor || vehicle.etapa || vehicle.status;
  let reply = `Encontrei o ${label}.`;
  if (update) reply += ` A atualização registrada é ${update}.`;
  if (vehicle.status && vehicle.status !== update) reply += ` Situação registrada: ${vehicle.status}.`;
  if (vehicle.statusPrazo) reply += ` Situação do prazo registrada: ${vehicle.statusPrazo}.`;
  reply += ' Essa resposta usa somente a fonte operacional; uma confirmação física atual ainda deve ser feita pela equipe.';
  return reply;
}

export async function POST(request: Request) {
  try {
    await requirePermission('gerenciar_integracoes');

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json({ error: 'OpenAI ainda não está configurada na Vercel.' }, { status: 503 });
    }

    const body = await request.json();
    const message = String(body?.message || '').trim().slice(0, 3000);
    if (!message) return NextResponse.json({ error: 'Digite uma mensagem para testar.' }, { status: 400 });

    const history = cleanHistory(body?.history);
    const plateContext = String(body?.plateContext || '').trim().slice(0, 20) || null;
    const plan = await planAttendance({
      message,
      messageType: 'text',
      waitingFor: null,
      plateContext,
      vehicles: [],
      history,
      openTasks: [],
    });

    const office = getOfficeProfile();
    let reply = '';

    switch (plan.action) {
      case 'pedir_placa':
        reply = 'Claro. Pode me informar a placa do veículo?';
        break;
      case 'vistoria':
        reply = 'Para vistorias de seguradoras e associações, não é necessário agendamento. O atendimento é por ordem de chegada, das 8h às 16h.';
        break;
      case 'horario_endereco':
        reply = `Nosso atendimento é ${office.hours}. Estamos em ${office.address}.`;
        break;
      case 'orcamento':
        reply = 'O valor depende da avaliação do veículo e do serviço. Vou encaminhar seu pedido para uma pessoa da oficina continuar o atendimento.';
        break;
      case 'agendamento':
        reply = 'Vou encaminhar seu pedido de agendamento para a equipe confirmar a disponibilidade antes de responder.';
        break;
      case 'foto':
        reply = 'Pedido de foto identificado. No atendimento real, a IA cria uma solicitação para a equipe e só envia a informação depois da confirmação humana.';
        break;
      case 'midia':
        reply = 'Arquivo recebido. No atendimento real, ele fica registrado para análise da equipe; a IA não usa a mídia sozinha como confirmação de etapa, peça ou dano.';
        break;
      case 'humano':
        reply = plan.priority === 'alta' || plan.priority === 'urgente'
          ? 'Entendi. Essa solicitação deve ser tratada como prioritária por uma pessoa da equipe.'
          : 'Entendi. Essa conversa deve seguir com uma pessoa da equipe, com as respostas automáticas pausadas.';
        break;
      case 'status': {
        if (!externalVehicleSourceConfigured()) {
          reply = 'A IA identificou um pedido de status, mas a fonte real de veículos ainda não está conectada. Para não inventar informação, o atendimento deve aguardar a planilha/fonte oficial da oficina.';
          break;
        }
        const resolution = await resolveOperationalVehicle(plan.plate);
        if (!resolution.ok) {
          reply = resolution.reason === 'source_error'
            ? 'A fonte operacional não respondeu agora. A IA não deve usar informação antiga como verdade e precisa encaminhar para confirmação humana.'
            : resolution.reason === 'incomplete'
              ? 'Encontrei o veículo, mas etapa/status estão incompletos na fonte oficial. A equipe precisa completar ou confirmar antes de responder.'
              : 'Não encontrei essa placa na fonte oficial. A IA deve encaminhar para a equipe verificar.';
        } else {
          reply = vehicleReply(resolution.vehicle);
        }
        break;
      }
      case 'verificar_operacao': {
        const taskLabel = plan.operationalTask.instruction || 'confirmar fisicamente a informação solicitada pelo cliente';
        reply = `Essa pergunta exige confirmação física. No fluxo real, a IA criaria uma tarefa para a equipe: ${taskLabel}`;
        break;
      }
      case 'geral':
      default:
        reply = await answerGeneralQuestion(message);
        break;
    }

    return NextResponse.json({
      reply,
      plan: {
        intent: plan.intent,
        action: plan.action,
        priority: plan.priority,
        needsHuman: plan.needsHuman,
        confidence: plan.confidence,
        plate: plan.plate,
        reason: plan.reason,
        operationalTask: plan.operationalTask,
      },
      model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      vehicleSourceConnected: externalVehicleSourceConfigured(),
    });
  } catch (error: any) {
    const status = error?.status === 401 ? 401 : error?.status === 403 ? 403 : 500;
    return NextResponse.json({
      error: status === 401
        ? 'Não autenticado.'
        : status === 403
          ? 'Somente administradores com acesso às integrações podem testar a IA.'
          : error?.message || 'Falha ao testar a IA.',
    }, { status });
  }
}

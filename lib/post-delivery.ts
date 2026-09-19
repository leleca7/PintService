import 'server-only';
import { classifyPostDeliveryFeedback } from '@/lib/agent';
import { getDb } from '@/lib/db';
import { sendWhatsAppTemplate, sendWhatsAppText } from '@/lib/whatsapp';

export type FinalizationKind = 'sem_pendencias' | 'com_pendencias';

export type PostDeliveryConfig = {
  active: boolean;
  serviceWarrantyMonths: number;
  partsWarrantyMonths: number;
  reviewLink: string;
};

export async function getPostDeliveryConfig(): Promise<PostDeliveryConfig> {
  const sql = getDb();
  const rows = await sql`
    SELECT garantia_servico_meses, garantia_pecas_meses, link_avaliacao, ativo
    FROM configuracao_pos_entrega
    WHERE id = true
    LIMIT 1
  `;
  const row = rows[0];
  return {
    active: row?.ativo !== false,
    serviceWarrantyMonths: Number(row?.garantia_servico_meses ?? 12),
    partsWarrantyMonths: Number(row?.garantia_pecas_meses ?? 6),
    reviewLink: String(row?.link_avaliacao ?? process.env.GOOGLE_REVIEW_URL ?? '').trim(),
  };
}

export function addMonths(date: string, months: number) {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1 + months, day, 12));
  return value.toISOString().slice(0, 10);
}

function durationLabel(months: number) {
  if (months === 12) return '1 ano';
  return `${months} meses`;
}

function fallbackInitialMessage(input: {
  customerName: string;
  vehicleLabel: string;
  finalizationKind: FinalizationKind;
  pendingDescription: string;
  config: PostDeliveryConfig;
}) {
  const greeting = input.customerName ? `Olá, ${input.customerName}.` : 'Olá.';
  const warranty = `O atendimento do seu ${input.vehicleLabel} foi registrado como entregue. A garantia registrada é de ${durationLabel(input.config.serviceWarrantyMonths)} para o serviço e ${durationLabel(input.config.partsWarrantyMonths)} para peças substituídas, conforme as condições aplicáveis ao atendimento.`;
  const pending = input.finalizationKind === 'com_pendencias'
    ? ` Permanece registrada a seguinte pendência: ${input.pendingDescription}. Ela continuará em acompanhamento e avisaremos quando houver uma atualização real.`
    : '';
  return `${greeting} ${warranty}${pending} Como foi sua experiência com o serviço da Pint Services? Pode me responder por aqui.`;
}

async function recordBotConversation(input: { phone: string; clientId: string | null; vehicleId: string; message: string; intent: string }) {
  const sql = getDb();
  await sql`
    INSERT INTO conversas (telefone, cliente_id, veiculo_id, mensagem, origem, intencao, atendente_assumiu)
    VALUES (${input.phone}, ${input.clientId}, ${input.vehicleId}, ${input.message}, 'bot', ${input.intent}, false)
  `;
}

export async function startPostDeliveryFlow(input: {
  vehicleId: string;
  kind: FinalizationKind;
  pendingId?: string | null;
  pendingDescription?: string;
}) {
  const sql = getDb();
  const [config, rows] = await Promise.all([
    getPostDeliveryConfig(),
    sql`
      SELECT v.id, v.placa, v.modelo, v.cliente_id, c.nome AS cliente_nome, c.telefone
      FROM veiculos v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.id = ${input.vehicleId}
      LIMIT 1
    `,
  ]);
  const vehicle = rows[0];
  if (!vehicle) return { started: false, reason: 'vehicle_not_found' as const };

  const phone = String(vehicle.telefone ?? '').replace(/\D/g, '');
  if (!phone) return { started: false, reason: 'customer_without_phone' as const };

  await sql`
    INSERT INTO fluxos_pos_entrega (veiculo_id, cliente_id, telefone, tipo_finalizacao, pendencia_id, status, atualizado_em)
    VALUES (${input.vehicleId}, ${vehicle.cliente_id ?? null}, ${phone}, ${input.kind}, ${input.pendingId ?? null}, 'aguardando_envio', now())
    ON CONFLICT (veiculo_id) DO UPDATE SET
      cliente_id = EXCLUDED.cliente_id,
      telefone = EXCLUDED.telefone,
      tipo_finalizacao = EXCLUDED.tipo_finalizacao,
      pendencia_id = EXCLUDED.pendencia_id,
      status = 'aguardando_envio',
      feedback = null,
      feedback_sentimento = null,
      mensagem_inicial_em = null,
      avaliacao_enviada_em = null,
      encerrado_em = null,
      atualizado_em = now()
  `;

  if (!config.active) return { started: false, reason: 'post_delivery_disabled' as const };

  const vehicleLabel = String(vehicle.modelo ?? '').trim()
    ? `${String(vehicle.modelo).trim()} ${String(vehicle.placa ?? '').trim()}`.trim()
    : `veículo ${String(vehicle.placa ?? '').trim()}`.trim();
  const customerName = String(vehicle.cliente_nome ?? '').trim();
  const pendingDescription = String(input.pendingDescription ?? '').trim();
  const allowText = process.env.WHATSAPP_POST_DELIVERY_ALLOW_TEXT === 'true';
  const templateName = input.kind === 'com_pendencias'
    ? process.env.WHATSAPP_POST_DELIVERY_PENDING_TEMPLATE?.trim()
    : process.env.WHATSAPP_POST_DELIVERY_TEMPLATE?.trim();

  try {
    if (templateName) {
      await sendWhatsAppTemplate(phone, templateName, [
        customerName || 'cliente',
        vehicleLabel,
        durationLabel(config.serviceWarrantyMonths),
        durationLabel(config.partsWarrantyMonths),
        pendingDescription || 'sem pendências registradas',
      ]);
    } else if (allowText) {
      await sendWhatsAppText(phone, fallbackInitialMessage({
        customerName,
        vehicleLabel,
        finalizationKind: input.kind,
        pendingDescription,
        config,
      }));
    } else {
      return { started: false, reason: 'template_not_configured' as const };
    }

    const logMessage = fallbackInitialMessage({
      customerName,
      vehicleLabel,
      finalizationKind: input.kind,
      pendingDescription,
      config,
    });
    await sql`
      UPDATE fluxos_pos_entrega
      SET status = 'aguardando_satisfacao', mensagem_inicial_em = now(), atualizado_em = now()
      WHERE veiculo_id = ${input.vehicleId}
    `;
    await recordBotConversation({
      phone,
      clientId: vehicle.cliente_id ? String(vehicle.cliente_id) : null,
      vehicleId: input.vehicleId,
      message: logMessage,
      intent: 'pos_entrega',
    });
    return { started: true as const };
  } catch (error) {
    await sql`
      UPDATE fluxos_pos_entrega
      SET status = 'erro_envio', atualizado_em = now()
      WHERE veiculo_id = ${input.vehicleId}
    `;
    console.error('Falha ao iniciar pós-entrega:', error);
    return { started: false, reason: 'send_error' as const };
  }
}

export async function handlePostDeliveryFeedback(input: {
  phone: string;
  clientId: string;
  message: string;
}) {
  const sql = getDb();
  const rows = await sql`
    SELECT f.id, f.veiculo_id, f.status, v.placa, v.modelo
    FROM fluxos_pos_entrega f
    LEFT JOIN veiculos v ON v.id = f.veiculo_id
    WHERE f.cliente_id = ${input.clientId}
      AND f.telefone = ${input.phone}
      AND f.status IN ('aguardando_satisfacao','feedback_neutro')
    ORDER BY f.atualizado_em DESC
    LIMIT 1
  `;
  const flow = rows[0];
  if (!flow) return { handled: false as const };

  let classification;
  try {
    classification = await classifyPostDeliveryFeedback(input.message);
  } catch (error) {
    console.error('Falha ao classificar feedback pós-entrega:', error);
    return { handled: false as const };
  }
  if (classification.confidence < 0.65 || classification.sentiment === 'nao_relacionado') {
    return { handled: false as const };
  }

  const config = await getPostDeliveryConfig();
  const vehicleLabel = String(flow.modelo ?? '').trim()
    ? `${String(flow.modelo).trim()} ${String(flow.placa ?? '').trim()}`.trim()
    : `veículo ${String(flow.placa ?? '').trim()}`.trim();

  if (classification.sentiment === 'positivo') {
    const reply = config.reviewLink
      ? `Ficamos felizes em saber! Se puder compartilhar sua experiência com a Pint Services, sua avaliação ajuda muito: ${config.reviewLink}`
      : 'Ficamos felizes em saber! Obrigado por confiar na Pint Services.';
    await sendWhatsAppText(input.phone, reply);
    await sql`
      UPDATE fluxos_pos_entrega
      SET status = ${config.reviewLink ? 'avaliacao_enviada' : 'encerrado'},
          feedback = ${input.message},
          feedback_sentimento = 'positivo',
          avaliacao_enviada_em = ${config.reviewLink ? new Date().toISOString() : null},
          encerrado_em = ${config.reviewLink ? null : new Date().toISOString()},
          atualizado_em = now()
      WHERE id = ${flow.id}
    `;
    await recordBotConversation({ phone: input.phone, clientId: input.clientId, vehicleId: String(flow.veiculo_id), message: reply, intent: 'pos_entrega_positivo' });
    return { handled: true as const, sentiment: 'positivo' as const };
  }

  if (classification.sentiment === 'neutro') {
    const reply = 'Obrigado por me contar. Teve algum ponto do serviço que não ficou exatamente como você esperava? Pode me explicar por aqui.';
    await sendWhatsAppText(input.phone, reply);
    await sql`
      UPDATE fluxos_pos_entrega
      SET status = 'feedback_neutro', feedback = ${input.message}, feedback_sentimento = 'neutro', atualizado_em = now()
      WHERE id = ${flow.id}
    `;
    await recordBotConversation({ phone: input.phone, clientId: input.clientId, vehicleId: String(flow.veiculo_id), message: reply, intent: 'pos_entrega_neutro' });
    return { handled: true as const, sentiment: 'neutro' as const };
  }

  const existing = await sql`
    SELECT id FROM pendencias
    WHERE cliente_id = ${input.clientId}
      AND veiculo_id = ${flow.veiculo_id}
      AND tipo = 'pos_entrega'
      AND status IN ('aberta','em_atendimento')
    LIMIT 1
  `;
  if (!existing[0]) {
    await sql`
      INSERT INTO pendencias (cliente_id, veiculo_id, tipo, mensagem, prioridade)
      VALUES (${input.clientId}, ${flow.veiculo_id}, 'pos_entrega', ${`Feedback pós-entrega do ${vehicleLabel}: ${input.message}`}, 'alta')
    `;
  }
  await sql`
    UPDATE fluxos_pos_entrega
    SET status = 'atendimento_humano', feedback = ${input.message}, feedback_sentimento = 'negativo', atualizado_em = now()
    WHERE id = ${flow.id}
  `;
  await sql`
    INSERT INTO estado_atendimento (telefone, etapa, bot_ativo, ultima_intencao, placa_contexto, atualizado_em)
    VALUES (${input.phone}, 'atendimento_humano', false, 'pos_entrega', ${flow.placa ?? null}, now())
    ON CONFLICT (telefone) DO UPDATE SET
      etapa = 'atendimento_humano',
      bot_ativo = false,
      ultima_intencao = 'pos_entrega',
      placa_contexto = EXCLUDED.placa_contexto,
      atualizado_em = now()
  `;
  const reply = 'Obrigado por nos contar. Registrei o que aconteceu e encaminhei para a equipe da Pint Services continuar com você por aqui.';
  await sendWhatsAppText(input.phone, reply);
  await recordBotConversation({ phone: input.phone, clientId: input.clientId, vehicleId: String(flow.veiculo_id), message: reply, intent: 'pos_entrega_negativo' });
  return { handled: true as const, sentiment: 'negativo' as const };
}

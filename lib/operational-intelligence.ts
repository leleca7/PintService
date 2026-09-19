import 'server-only';

import { createHash } from 'node:crypto';
import { getDb } from '@/lib/db';
import { OPERATION_STAGES, normalizeOperationalStage } from '@/lib/operation-stages';
import { sendOperationalTaskToEmployee } from '@/lib/task-messaging';
import { sendWhatsAppTemplate } from '@/lib/whatsapp';

const DAY_MS = 86_400_000;

function dateOnly(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

async function upsertAlert(input: {
  vehicleId?: string | null;
  orderId?: string | null;
  type: string;
  key: string;
  level: 'atencao' | 'alto' | 'critico';
  title: string;
  message: string;
  responsibleId?: string | null;
  data?: unknown;
}) {
  const sql = getDb();
  const existing = await sql`
    SELECT id FROM alertas_operacionais
    WHERE chave_dedupe = ${input.key}
      AND status IN ('aberto','em_tratamento')
    LIMIT 1
  `;
  if (existing[0]) {
    await sql`
      UPDATE alertas_operacionais
      SET nivel = ${input.level}, titulo = ${input.title}, mensagem = ${input.message},
          responsavel_id = ${input.responsibleId ?? null},
          dados = ${JSON.stringify(input.data ?? {})}::jsonb,
          atualizado_em = now()
      WHERE id = ${existing[0].id}
    `;
    return { id: String(existing[0].id), created: false };
  }

  const rows = await sql`
    INSERT INTO alertas_operacionais (
      veiculo_id, pedido_pecas_id, tipo, chave_dedupe, nivel,
      titulo, mensagem, responsavel_id, dados
    )
    VALUES (
      ${input.vehicleId ?? null}, ${input.orderId ?? null}, ${input.type}, ${input.key},
      ${input.level}, ${input.title}, ${input.message}, ${input.responsibleId ?? null},
      ${JSON.stringify(input.data ?? {})}::jsonb
    )
    RETURNING id
  `;
  return { id: String(rows[0].id), created: true };
}

async function createInternalVerificationTask(input: {
  vehicleId: string;
  plate: string;
  model: string;
  stage: string;
  employeeId: string | null;
  hours: number;
  critical: boolean;
}) {
  const sql = getDb();
  const key = createHash('sha256').update(`stall|${input.vehicleId}|${input.stage}`).digest('hex');
  const existing = await sql`
    SELECT id FROM tarefas_operacionais
    WHERE dedupe_key = ${key}
      AND status IN ('aberta','em_execucao','aguardando_confirmacao')
    LIMIT 1
  `;
  if (existing[0]) return { taskId: String(existing[0].id), created: false };

  const title = `Confirmar situação — ${input.plate}`;
  const instruction = `O veículo está há aproximadamente ${input.hours}h em ${input.stage}. Confirme a etapa/status atual e informe se existe algum impedimento.`;
  const rows = await sql`
    INSERT INTO tarefas_operacionais (
      cliente_id, veiculo_id, telefone_cliente, tipo, titulo, instrucoes,
      setor_responsavel, responsavel_id, prioridade, requer_foto, dedupe_key, origem_mensagem
    )
    VALUES (
      NULL, ${input.vehicleId}, '', 'verificar_status_fisico', ${title}, ${instruction},
      ${input.stage || null}, ${input.employeeId}, ${input.critical ? 'alta' : 'normal'},
      false, ${key}, 'detector_atraso'
    )
    RETURNING id
  `;
  const taskId = String(rows[0].id);
  try {
    await sendOperationalTaskToEmployee(taskId);
  } catch (error) {
    console.error('Falha ao enviar verificação preventiva ao funcionário:', error);
  }
  return { taskId, created: true };
}

export async function refreshSmartForecasts() {
  const sql = getDb();
  const [stageRows, vehicles] = await Promise.all([
    sql`SELECT fase, horas_alerta FROM configuracao_tempo_etapas WHERE ativo = true`,
    sql`
      SELECT v.id, v.placa, v.setor, v.status, v.etapa_iniciada_em, v.previsao_saida,
             v.data_entrada, v.seguradora
      FROM veiculos v
      WHERE v.data_saida_real IS NULL
    `,
  ]);
  const hoursByStage = new Map(stageRows.map((row: any) => [String(row.fase), Number(row.horas_alerta)]));
  let updated = 0;
  let unavailable = 0;

  for (const vehicle of vehicles) {
    const stage = normalizeOperationalStage(String(vehicle.setor ?? ''));
    let forecast: string | null = null;
    let confidence = 0;
    let explanation = '';
    const now = new Date();

    if (!stage) {
      explanation = 'Etapa atual não informada.';
    } else if (String(vehicle.status ?? '') === 'Aguardando aprovação') {
      explanation = 'Aguardando aprovação sem base segura para estimar retomada.';
    } else {
      let base = now;
      if (String(vehicle.status ?? '') === 'Aguardando peças') {
        const partForecast = await sql`
          SELECT MAX(p.previsao_entrega) AS previsao
          FROM controle_pecas c
          JOIN pedidos_pecas p ON p.controle_pecas_id = c.id
          JOIN itens_pedido_pecas i ON i.pedido_id = p.id
          WHERE c.veiculo_id = ${vehicle.id}
            AND c.encerrado_em IS NULL
            AND p.status = 'Aberto'
            AND i.quantidade_recebida < i.quantidade
        `;
        const safePartDate = dateOnly(partForecast[0]?.previsao);
        if (!safePartDate) {
          explanation = 'Aguardando peças sem previsão confirmada de fornecedor.';
        } else {
          base = new Date(`${safePartDate}T12:00:00Z`);
          confidence = 0.5;
          explanation = `Baseada na previsão de peça de ${safePartDate} e tempos configurados das etapas.`;
        }
      }

      if (!explanation || confidence > 0) {
        const currentIndex = OPERATION_STAGES.indexOf(stage);
        const stageStart = vehicle.etapa_iniciada_em ? new Date(vehicle.etapa_iniciada_em).getTime() : now.getTime();
        const elapsedHours = Math.max(0, (now.getTime() - stageStart) / 3_600_000);
        const currentBudget = hoursByStage.get(stage) ?? 48;
        let remainingHours = Math.max(0, currentBudget - elapsedHours);

        for (let i = currentIndex + 1; i < OPERATION_STAGES.length; i++) {
          remainingHours += hoursByStage.get(OPERATION_STAGES[i]) ?? 24;
        }

        const days = Math.max(1, Math.ceil(remainingHours / 24));
        forecast = addDays(base, days).toISOString().slice(0, 10);
        confidence = Math.max(confidence, 0.58);
        if (vehicle.etapa_iniciada_em) confidence += 0.08;
        if (vehicle.data_entrada) confidence += 0.05;
        confidence = Math.min(0.82, confidence);
        if (!explanation) explanation = 'Estimativa interna baseada na etapa atual, tempo já consumido e tempos configurados das etapas restantes.';
      }
    }

    if (!forecast) {
      unavailable += 1;
      await sql`
        UPDATE veiculos
        SET previsao_ia = NULL, previsao_ia_confianca = NULL, previsao_ia_atualizada_em = now()
        WHERE id = ${vehicle.id}
      `;
      await sql`
        INSERT INTO previsoes_operacionais (veiculo_id, previsao, confianca, metodo, explicacao, dados)
        VALUES (${vehicle.id}, NULL, NULL, 'regras_operacionais', ${explanation}, ${JSON.stringify({ stage, status: vehicle.status })}::jsonb)
      `;
      continue;
    }

    await sql`
      UPDATE veiculos
      SET previsao_ia = ${forecast}, previsao_ia_confianca = ${confidence}, previsao_ia_atualizada_em = now()
      WHERE id = ${vehicle.id}
    `;
    await sql`
      INSERT INTO previsoes_operacionais (veiculo_id, previsao, confianca, metodo, explicacao, dados)
      VALUES (
        ${vehicle.id}, ${forecast}, ${confidence}, 'regras_operacionais', ${explanation},
        ${JSON.stringify({ stage, status: vehicle.status, informedForecast: dateOnly(vehicle.previsao_saida) })}::jsonb
      )
    `;
    updated += 1;
  }

  return { updated, unavailable };
}

export async function scanOperationalExceptions() {
  const sql = getDb();
  const vehicles = await sql`
    SELECT v.id, v.placa, v.modelo, v.setor, v.status, v.etapa_iniciada_em,
           v.responsavel_id, c.id AS cliente_id, c.telefone AS cliente_telefone,
           cfg.horas_alerta, cfg.horas_critico
    FROM veiculos v
    LEFT JOIN clientes c ON c.id = v.cliente_id
    JOIN configuracao_tempo_etapas cfg ON cfg.fase = v.setor AND cfg.ativo = true
    WHERE v.data_saida_real IS NULL
      AND v.etapa_iniciada_em IS NOT NULL
  `;

  const activeStallKeys = new Set<string>();
  let vehicleAlerts = 0;
  let staffTasks = 0;

  for (const vehicle of vehicles) {
    const elapsedHours = Math.max(0, Math.floor((Date.now() - new Date(vehicle.etapa_iniciada_em).getTime()) / 3_600_000));
    const alertHours = Number(vehicle.horas_alerta ?? 0);
    if (!alertHours || elapsedHours < alertHours) continue;
    const critical = elapsedHours >= Number(vehicle.horas_critico ?? alertHours * 2);
    const key = `veiculo_parado:${vehicle.id}:${normalize(String(vehicle.setor ?? ''))}`;
    activeStallKeys.add(key);
    const alert = await upsertAlert({
      vehicleId: String(vehicle.id),
      type: 'veiculo_parado',
      key,
      level: critical ? 'critico' : 'alto',
      title: `${vehicle.placa} acima do tempo esperado em ${vehicle.setor}`,
      message: `Está há aproximadamente ${elapsedHours}h na etapa. O limite de atenção configurado é ${alertHours}h.`,
      responsibleId: vehicle.responsavel_id ? String(vehicle.responsavel_id) : null,
      data: { elapsedHours, alertHours, criticalHours: Number(vehicle.horas_critico ?? 0), stage: vehicle.setor },
    });
    vehicleAlerts += 1;

    if (alert.created && vehicle.responsavel_id) {
      const task = await createInternalVerificationTask({
        vehicleId: String(vehicle.id),
        plate: String(vehicle.placa),
        model: String(vehicle.modelo ?? ''),
        stage: String(vehicle.setor ?? ''),
        employeeId: String(vehicle.responsavel_id),
        hours: elapsedHours,
        critical,
      });
      if (task.created) staffTasks += 1;
    }
  }

  const openStallAlerts = await sql`
    SELECT id, chave_dedupe FROM alertas_operacionais
    WHERE tipo = 'veiculo_parado' AND status IN ('aberto','em_tratamento')
  `;
  for (const alert of openStallAlerts) {
    if (!activeStallKeys.has(String(alert.chave_dedupe))) {
      await sql`UPDATE alertas_operacionais SET status='resolvido', resolvido_em=now(), atualizado_em=now() WHERE id=${alert.id}`;
    }
  }

  const overdueOrders = await sql`
    SELECT p.id, p.fornecedor, p.numero_pedido, p.previsao_entrega, p.ultima_cobranca_em,
           c.veiculo_id, c.placa, v.responsavel_id,
           SUM(i.quantidade) AS total,
           SUM(i.quantidade_recebida) AS recebidas
    FROM pedidos_pecas p
    JOIN controle_pecas c ON c.id = p.controle_pecas_id
    JOIN itens_pedido_pecas i ON i.pedido_id = p.id
    LEFT JOIN veiculos v ON v.id = c.veiculo_id
    WHERE p.status = 'Aberto'
      AND p.previsao_entrega IS NOT NULL
      AND p.previsao_entrega < CURRENT_DATE
      AND i.quantidade_recebida < i.quantidade
    GROUP BY p.id, c.veiculo_id, c.placa, v.responsavel_id
  `;

  const automationRows = await sql`
    SELECT cobranca_fornecedor_automatica
    FROM configuracao_operacao
    WHERE id=true
    LIMIT 1
  `;
  const automaticSupplierCharge = automationRows[0]?.cobranca_fornecedor_automatica === true;
  const supplierTemplate = process.env.WHATSAPP_SUPPLIER_DELAY_TEMPLATE?.trim();

  let supplierAlerts = 0;
  let automaticSupplierMessages = 0;
  for (const order of overdueOrders) {
    const key = `fornecedor_atrasado:${order.id}`;
    const supplier = String(order.fornecedor ?? 'Fornecedor não informado');
    const message = `Pedido ${order.numero_pedido || 'sem número'} da placa ${order.placa}: ${Number(order.recebidas ?? 0)}/${Number(order.total ?? 0)} item(ns) recebidos. Previsão vencida em ${dateOnly(order.previsao_entrega)}.`;
    const draft = `Olá, ${supplier}. Precisamos de uma atualização do pedido ${order.numero_pedido || ''} referente ao veículo ${order.placa}. A previsão registrada era ${dateOnly(order.previsao_entrega)?.split('-').reverse().join('/')}. Podem confirmar a situação e uma nova previsão real?`;
    await upsertAlert({
      vehicleId: order.veiculo_id ? String(order.veiculo_id) : null,
      orderId: String(order.id),
      type: 'fornecedor_atrasado',
      key,
      level: 'alto',
      title: `Peça atrasada — ${order.placa}`,
      message,
      responsibleId: order.responsavel_id ? String(order.responsavel_id) : null,
      data: { supplier, orderNumber: order.numero_pedido, expected: dateOnly(order.previsao_entrega), draft },
    });
    await sql`
      UPDATE pedidos_pecas
      SET cobranca_status = CASE WHEN cobranca_status='enviada_automaticamente' THEN cobranca_status ELSE 'preparada' END,
          cobranca_mensagem = ${draft},
          atualizado_em = now()
      WHERE id = ${order.id}
    `;

    if (automaticSupplierCharge && supplierTemplate && order.fornecedor) {
      const contacts = await sql`
        SELECT telefone
        FROM fornecedores_contatos
        WHERE ativo=true AND lower(nome)=lower(${String(order.fornecedor)})
        LIMIT 1
      `;
      const phone = String(contacts[0]?.telefone ?? '').replace(/\D/g,'');
      const lastCharge = order.ultima_cobranca_em ? new Date(order.ultima_cobranca_em).getTime() : 0;
      const canSendAgain = !lastCharge || Date.now() - lastCharge >= 48 * 60 * 60 * 1000;
      if (phone && canSendAgain) {
        try {
          await sendWhatsAppTemplate(phone, supplierTemplate, [
            String(order.fornecedor),
            String(order.numero_pedido || 'sem número'),
            String(order.placa),
            dateOnly(order.previsao_entrega)?.split('-').reverse().join('/') || 'sem data',
          ]);
          await sql`
            UPDATE pedidos_pecas
            SET ultima_cobranca_em=now(),cobranca_status='enviada_automaticamente',atualizado_em=now()
            WHERE id=${order.id}
          `;
          automaticSupplierMessages += 1;
        } catch (error) {
          console.error('Falha na cobrança automática de fornecedor:', error);
        }
      }
    }
    supplierAlerts += 1;
  }

  return { vehicleAlerts, supplierAlerts, staffTasks, automaticSupplierMessages };
}

function itemMatchesPending(description: string, pending: string) {
  const item = normalize(description);
  const target = normalize(pending);
  if (item.length >= 5 && (target.includes(item) || item.includes(target))) return true;
  const tokens = item.split(' ').filter((token) => token.length >= 4);
  return tokens.length >= 2 && tokens.filter((token) => target.includes(token)).length >= Math.min(2, tokens.length);
}

export async function advancePostDeliveryFromParts(input: {
  vehicleId: string;
  receivedItems: Array<{ descricao: string }>;
  orderIds: string[];
}) {
  const sql = getDb();
  const orderRows = input.orderIds.length
    ? await sql`SELECT numero_pedido FROM pedidos_pecas WHERE id = ANY(${input.orderIds}::uuid[])`
    : [];
  const orderNumbers = new Set(orderRows.map((row: any) => String(row.numero_pedido ?? '').trim()).filter(Boolean));
  const pendings = await sql`
    SELECT p.id, p.descricao, p.numero_pedido, p.cliente_id, v.placa, v.modelo, c.nome AS cliente_nome, c.telefone
    FROM pendencias_pos_entrega p
    JOIN veiculos v ON v.id = p.veiculo_id
    LEFT JOIN clientes c ON c.id = p.cliente_id
    WHERE p.veiculo_id = ${input.vehicleId}
      AND p.status IN ('aberta','aguardando_peca')
  `;

  let advanced = 0;
  for (const pending of pendings) {
    const numberMatch = pending.numero_pedido && orderNumbers.has(String(pending.numero_pedido));
    const itemMatch = input.receivedItems.some((item) => itemMatchesPending(item.descricao, String(pending.descricao ?? '')));
    if (!numberMatch && !itemMatch) continue;

    await sql`
      UPDATE pendencias_pos_entrega
      SET status='aguardando_agendamento', atualizado_em=now()
      WHERE id=${pending.id}
    `;
    advanced += 1;

    const template = process.env.WHATSAPP_POST_DELIVERY_UPDATE_TEMPLATE?.trim();
    const phone = String(pending.telefone ?? '').replace(/\D/g, '');
    if (template && phone) {
      try {
        await sendWhatsAppTemplate(phone, template, [
          String(pending.cliente_nome ?? 'cliente'),
          `${String(pending.modelo ?? 'Veículo')} ${String(pending.placa ?? '')}`.trim(),
          String(pending.descricao ?? ''),
          'A peça pendente foi registrada como recebida e a oficina já pode organizar o agendamento do retorno.',
        ]);
      } catch (error) {
        console.error('Falha ao avisar cliente sobre peça pós-entrega recebida:', error);
      }
    }
  }

  return { advanced };
}

export async function getOperationalIntelligenceData() {
  const sql = getDb();
  const [alerts, causes, stages, insurers, suppliers, forecastStats, performanceStats] = await Promise.all([
    sql`
      SELECT a.id,a.tipo,a.nivel,a.titulo,a.mensagem,a.criado_em,a.dados,a.pedido_pecas_id,v.placa,f.nome AS responsavel
      FROM alertas_operacionais a
      LEFT JOIN veiculos v ON v.id=a.veiculo_id
      LEFT JOIN funcionarios f ON f.id=a.responsavel_id
      WHERE a.status IN ('aberto','em_tratamento')
      ORDER BY CASE a.nivel WHEN 'critico' THEN 0 WHEN 'alto' THEN 1 ELSE 2 END, a.criado_em ASC
      LIMIT 40
    `,
    sql`
      SELECT COALESCE(motivo_parada,'Sem motivo informado') AS motivo, COUNT(*)::int AS quantidade
      FROM veiculos
      WHERE data_saida_real IS NULL AND status IN ('Parado','Aguardando peças','Aguardando aprovação')
      GROUP BY 1 ORDER BY 2 DESC
    `,
    sql`
      SELECT v.setor, COUNT(*)::int AS quantidade,
             ROUND(AVG(EXTRACT(EPOCH FROM (now()-COALESCE(v.etapa_iniciada_em,v.ultima_atualizacao)))/3600))::int AS media_horas,
             MAX(cfg.horas_alerta)::int AS horas_alerta,
             MAX(cfg.horas_critico)::int AS horas_critico
      FROM veiculos v
      LEFT JOIN configuracao_tempo_etapas cfg ON cfg.fase=v.setor
      WHERE v.data_saida_real IS NULL
      GROUP BY v.setor
      ORDER BY v.setor
    `,
    sql`
      SELECT COALESCE(seguradora,'Não informada') AS seguradora,
             COUNT(*)::int AS entregues,
             ROUND(AVG(data_saida_real-data_entrada))::int AS media_dias
      FROM veiculos
      WHERE data_saida_real IS NOT NULL AND data_entrada IS NOT NULL
      GROUP BY 1 HAVING COUNT(*) >= 1
      ORDER BY media_dias DESC NULLS LAST, entregues DESC
      LIMIT 12
    `,
    sql`
      SELECT COALESCE(p.fornecedor,'Não informado') AS fornecedor,
             MAX(fc.telefone) AS telefone,
             MAX(fc.email) AS email,
             COUNT(*) FILTER (WHERE p.previsao_entrega < CURRENT_DATE AND p.status='Aberto')::int AS atrasados,
             COUNT(*)::int AS pedidos
      FROM pedidos_pecas p
      LEFT JOIN fornecedores_contatos fc ON lower(fc.nome)=lower(p.fornecedor) AND fc.ativo=true
      GROUP BY COALESCE(p.fornecedor,'Não informado')
      ORDER BY atrasados DESC, pedidos DESC
      LIMIT 12
    `,
    sql`
      SELECT
        COUNT(*) FILTER (WHERE previsao_ia IS NOT NULL)::int AS com_previsao,
        COUNT(*) FILTER (WHERE previsao_ia IS NULL AND data_saida_real IS NULL)::int AS sem_previsao,
        ROUND(AVG(previsao_ia_confianca) FILTER (WHERE previsao_ia_confianca IS NOT NULL) * 100)::int AS confianca_media
      FROM veiculos
      WHERE data_saida_real IS NULL
    `,
    sql`
      SELECT
        COUNT(*) FILTER (WHERE data_saida_real IS NOT NULL)::int AS entregues,
        ROUND(AVG(data_saida_real-data_entrada) FILTER (WHERE data_saida_real IS NOT NULL AND data_entrada IS NOT NULL))::int AS media_ciclo_dias,
        ROUND(
          100.0 * COUNT(*) FILTER (
            WHERE data_saida_real IS NOT NULL
              AND previsao_saida IS NOT NULL
              AND data_saida_real <= previsao_saida
          ) /
          NULLIF(COUNT(*) FILTER (WHERE data_saida_real IS NOT NULL AND previsao_saida IS NOT NULL),0)
        )::int AS percentual_no_prazo,
        COUNT(*) FILTER (WHERE data_saida_real IS NULL AND motivo_parada='Retrabalho')::int AS retrabalho_aberto,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE data_saida_real IS NULL AND status='Aguardando peças') /
          NULLIF(COUNT(*) FILTER (WHERE data_saida_real IS NULL),0)
        )::int AS percentual_aguardando_pecas
      FROM veiculos
    `,
  ]);

  return {
    alerts,
    causes,
    stages,
    insurers,
    suppliers,
    forecast: forecastStats[0] ?? { com_previsao: 0, sem_previsao: 0, confianca_media: null },
    performance: performanceStats[0] ?? {
      entregues: 0,
      media_ciclo_dias: null,
      percentual_no_prazo: null,
      retrabalho_aberto: 0,
      percentual_aguardando_pecas: null,
    },
  };
}

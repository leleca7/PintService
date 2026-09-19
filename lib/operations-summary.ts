import 'server-only';

import { getDb } from '@/lib/db';

function clean(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export async function buildOperationsExceptionSummary() {
  const sql = getDb();
  const [vehicles, tasks, postDelivery, parts, alerts] = await Promise.all([
    sql`
      SELECT placa, modelo, setor, status, previsao_saida, ultima_atualizacao
      FROM veiculos
      WHERE data_saida_real IS NULL
        AND (
          (previsao_saida IS NOT NULL AND previsao_saida < CURRENT_DATE)
          OR status IN ('Aguardando peças','Aguardando aprovação','Parado')
          OR ultima_atualizacao < now() - interval '2 days'
        )
      ORDER BY previsao_saida ASC NULLS LAST, ultima_atualizacao ASC
      LIMIT 12
    `,
    sql`
      SELECT t.codigo, t.titulo, t.prioridade, t.status, v.placa, f.nome AS responsavel
      FROM tarefas_operacionais t
      LEFT JOIN veiculos v ON v.id = t.veiculo_id
      LEFT JOIN funcionarios f ON f.id = t.responsavel_id
      WHERE t.status IN ('aberta','em_execucao','aguardando_confirmacao')
      ORDER BY
        CASE t.prioridade WHEN 'urgente' THEN 0 WHEN 'alta' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
        t.criado_em ASC
      LIMIT 12
    `,
    sql`
      SELECT p.status, p.descricao, p.previsao, v.placa, f.nome AS responsavel
      FROM pendencias_pos_entrega p
      JOIN veiculos v ON v.id = p.veiculo_id
      LEFT JOIN funcionarios f ON f.id = p.responsavel_id
      WHERE p.status NOT IN ('resolvida','cancelada')
      ORDER BY p.previsao ASC NULLS LAST, p.criado_em ASC
      LIMIT 12
    `,
    sql`
      SELECT c.placa, p.numero_pedido, p.fornecedor, p.previsao_entrega,
             SUM(i.quantidade) AS total,
             SUM(i.quantidade_recebida) AS recebidas
      FROM controle_pecas c
      JOIN pedidos_pecas p ON p.controle_pecas_id = c.id
      JOIN itens_pedido_pecas i ON i.pedido_id = p.id
      WHERE c.encerrado_em IS NULL
        AND p.status = 'Aberto'
        AND (p.previsao_entrega < CURRENT_DATE OR i.quantidade_recebida < i.quantidade)
      GROUP BY c.placa, p.id, p.numero_pedido, p.fornecedor, p.previsao_entrega
      ORDER BY p.previsao_entrega ASC NULLS LAST
      LIMIT 12
    `,
    sql`
      SELECT nivel,titulo,mensagem
      FROM alertas_operacionais
      WHERE status IN ('aberto','em_tratamento')
      ORDER BY CASE nivel WHEN 'critico' THEN 0 WHEN 'alto' THEN 1 ELSE 2 END, criado_em ASC
      LIMIT 10
    `,
  ]);

  const total = vehicles.length + tasks.length + postDelivery.length + parts.length + alerts.length;
  if (!total) return { total: 0, text: 'Operação sem exceções relevantes registradas agora.' };

  const blocks: string[] = [];
  if (vehicles.length) {
    blocks.push('VEÍCULOS');
    for (const item of vehicles) {
      const reason = item.previsao_saida && String(item.previsao_saida).slice(0, 10) < new Date().toISOString().slice(0, 10)
        ? 'previsão vencida'
        : clean(item.status) || 'sem atualização recente';
      blocks.push(`• ${clean(item.placa)} ${clean(item.modelo)} — ${clean(item.setor) || 'etapa não informada'} — ${reason}`);
    }
  }

  if (parts.length) {
    blocks.push('PEÇAS');
    for (const item of parts) {
      blocks.push(`• ${clean(item.placa)} — ${Number(item.recebidas ?? 0)}/${Number(item.total ?? 0)} recebidas${item.previsao_entrega ? ` — previsão ${String(item.previsao_entrega).slice(0, 10).split('-').reverse().join('/')}` : ''}`);
    }
  }

  if (tasks.length) {
    blocks.push('TAREFAS');
    for (const item of tasks) {
      blocks.push(`• #${clean(item.codigo)} ${clean(item.placa)} — ${clean(item.titulo)}${item.responsavel ? ` — ${clean(item.responsavel)}` : ' — sem responsável'}`);
    }
  }

  if (postDelivery.length) {
    blocks.push('PÓS-ENTREGA');
    for (const item of postDelivery) {
      blocks.push(`• ${clean(item.placa)} — ${clean(item.descricao).slice(0, 110)}${item.responsavel ? ` — ${clean(item.responsavel)}` : ''}`);
    }
  }

  if (alerts.length) {
    blocks.push('ALERTAS INTELIGENTES');
    for (const item of alerts) {
      blocks.push(`• [${clean(item.nivel)}] ${clean(item.titulo)} — ${clean(item.mensagem).slice(0, 120)}`);
    }
  }

  const text = ['Resumo de exceções da Pint Services', ...blocks].join('\n').slice(0, 3600);
  return { total, text };
}

export async function buildSectorSupervisorSummaries() {
  const sql = getDb();
  const leaders = await sql`
    SELECT id,nome,setor,telefone,cargo
    FROM funcionarios
    WHERE ativo=true
      AND telefone IS NOT NULL
      AND (
        lower(coalesce(cargo,'')) LIKE '%lider%'
        OR lower(coalesce(cargo,'')) LIKE '%líder%'
        OR lower(coalesce(cargo,'')) LIKE '%supervisor%'
        OR lower(coalesce(cargo,'')) LIKE '%encarregado%'
      )
    ORDER BY setor,nome
  `;

  const result:Array<{employeeId:string;name:string;sector:string;phone:string;text:string}>=[];
  for(const leader of leaders){
    const sector=String(leader.setor??'').trim();
    if(!sector) continue;
    const [vehicles,alerts,tasks]=await Promise.all([
      sql`
        SELECT placa,modelo,status,etapa_iniciada_em,motivo_parada
        FROM veiculos
        WHERE data_saida_real IS NULL AND lower(coalesce(setor,''))=lower(${sector})
        ORDER BY etapa_iniciada_em ASC NULLS LAST
      `,
      sql`
        SELECT a.nivel,a.titulo
        FROM alertas_operacionais a
        JOIN veiculos v ON v.id=a.veiculo_id
        WHERE a.status IN ('aberto','em_tratamento')
          AND lower(coalesce(v.setor,''))=lower(${sector})
        ORDER BY CASE a.nivel WHEN 'critico' THEN 0 WHEN 'alto' THEN 1 ELSE 2 END
        LIMIT 8
      `,
      sql`
        SELECT t.codigo,v.placa,t.titulo
        FROM tarefas_operacionais t
        LEFT JOIN veiculos v ON v.id=t.veiculo_id
        WHERE t.status IN ('aberta','em_execucao','aguardando_confirmacao')
          AND lower(coalesce(t.setor_responsavel,''))=lower(${sector})
        ORDER BY t.criado_em ASC
        LIMIT 8
      `,
    ]);
    const lines=[
      `Resumo do setor ${sector}`,
      `${vehicles.length} veículo(s) em andamento · ${alerts.length} alerta(s) · ${tasks.length} tarefa(s) aberta(s)`,
    ];
    for(const alert of alerts) lines.push(`• ${clean(alert.titulo)}`);
    for(const vehicle of vehicles.slice(0,8)){
      const elapsed=vehicle.etapa_iniciada_em
        ? Math.max(0,Math.floor((Date.now()-new Date(vehicle.etapa_iniciada_em).getTime())/3_600_000))
        : null;
      lines.push(`• ${clean(vehicle.placa)} — ${clean(vehicle.status)||'sem status'}${elapsed==null?'':` — ${elapsed}h na etapa`}${vehicle.motivo_parada?` — ${clean(vehicle.motivo_parada)}`:''}`);
    }
    result.push({
      employeeId:String(leader.id),
      name:String(leader.nome),
      sector,
      phone:String(leader.telefone).replace(/\D/g,''),
      text:lines.join('\n').slice(0,3000),
    });
  }
  return result;
}

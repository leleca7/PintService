import 'server-only';

import { getDb } from '@/lib/db';
import { sendWhatsAppTemplate } from '@/lib/whatsapp';

type VehicleEventInput = {
  vehicleId: string;
  beforeStage?: string | null;
  afterStage?: string | null;
  beforeStatus?: string | null;
  afterStatus?: string | null;
  checkin?: boolean;
};

type EventDef = { key: string; label: string; message: string };

function eventFor(input: VehicleEventInput): EventDef | null {
  if (input.checkin) {
    return {
      key: 'entrada_oficina',
      label: 'Entrada na oficina',
      message: 'O veículo foi registrado na oficina e entrou no acompanhamento operacional da Pint Services.',
    };
  }

  if (input.beforeStatus !== 'Pronto para entrega' && input.afterStatus === 'Pronto para entrega') {
    return {
      key: 'pronto_entrega',
      label: 'Pronto para entrega',
      message: 'A equipe registrou o veículo como pronto para entrega. A Pint Services seguirá com a orientação de retirada/agendamento pelos canais de atendimento.',
    };
  }

  if (input.beforeStage !== input.afterStage && input.afterStage === 'Funilaria') {
    return {
      key: 'inicio_reparo',
      label: 'Reparo iniciado',
      message: 'O veículo avançou para a etapa de Funilaria e o reparo está em andamento.',
    };
  }

  if (input.beforeStage === 'Pintura' && input.afterStage && input.afterStage !== 'Pintura') {
    return {
      key: 'pintura_concluida',
      label: 'Pintura concluída',
      message: 'A etapa de pintura foi concluída e o veículo avançou no processo da oficina.',
    };
  }

  if (input.beforeStage !== input.afterStage && input.afterStage === 'Montagem') {
    return {
      key: 'montagem',
      label: 'Montagem',
      message: 'O veículo avançou para a etapa de Montagem.',
    };
  }

  return null;
}

export async function maybeSendOperationalEvent(input: VehicleEventInput) {
  const event = eventFor(input);
  if (!event) return { handled: false as const };

  const sql = getDb();
  const configRows = await sql`SELECT comunicacao_eventos_ativa FROM configuracao_operacao WHERE id=true LIMIT 1`;
  if (configRows[0]?.comunicacao_eventos_ativa === false) return { handled: false as const, disabled: true as const };

  const rows = await sql`
    SELECT v.id,v.placa,v.modelo,v.cliente_id,c.nome AS cliente_nome,c.telefone
    FROM veiculos v
    LEFT JOIN clientes c ON c.id=v.cliente_id
    WHERE v.id=${input.vehicleId}
    LIMIT 1
  `;
  const vehicle=rows[0];
  if(!vehicle) return {handled:false as const};

  const lifecycle=String(vehicle.id);
  const dedupeKey=`${lifecycle}:${event.key}`;
  const exists=await sql`SELECT id,status FROM comunicacoes_operacionais WHERE chave_dedupe=${dedupeKey} LIMIT 1`;
  if(exists[0]) return {handled:true as const,duplicate:true as const,status:String(exists[0].status)};

  const inserted=await sql`
    INSERT INTO comunicacoes_operacionais (veiculo_id,cliente_id,evento,chave_dedupe,canal,mensagem,status)
    VALUES (${vehicle.id},${vehicle.cliente_id??null},${event.key},${dedupeKey},'whatsapp',${event.message},'preparada')
    RETURNING id
  `;
  const communicationId=String(inserted[0].id);

  const phone=String(vehicle.telefone??'').replace(/\D/g,'');
  const template=process.env.WHATSAPP_OPERATION_UPDATE_TEMPLATE?.trim();
  if(!phone||!template){
    return {handled:true as const,prepared:true as const,reason:!phone?'customer_without_phone':'template_not_configured'};
  }

  try{
    await sendWhatsAppTemplate(phone,template,[
      String(vehicle.cliente_nome??'cliente'),
      `${String(vehicle.modelo??'Veículo')} ${String(vehicle.placa??'')}`.trim(),
      event.label,
      event.message,
    ]);
    await sql`
      UPDATE comunicacoes_operacionais
      SET status='enviada',enviado_em=now()
      WHERE id=${communicationId}
    `;
    await sql`
      INSERT INTO conversas (telefone,cliente_id,veiculo_id,mensagem,origem,intencao,canal,atendente_assumiu)
      VALUES (${phone},${vehicle.cliente_id??null},${vehicle.id},${event.message},'bot','atualizacao_operacional','whatsapp',false)
    `;
    return {handled:true as const,sent:true as const,event:event.key};
  }catch(error){
    await sql`
      UPDATE comunicacoes_operacionais
      SET status='erro',erro=${error instanceof Error?error.message.slice(0,500):'erro desconhecido'}
      WHERE id=${communicationId}
    `;
    console.error('Falha ao enviar evento operacional ao cliente:',error);
    return {handled:true as const,sent:false as const,error:true as const};
  }
}


export async function flushPreparedOperationalCommunications(){
  const template=process.env.WHATSAPP_OPERATION_UPDATE_TEMPLATE?.trim();
  if(!template) return {sent:0,skipped:'template_not_configured' as const};

  const sql=getDb();
  const configRows=await sql`SELECT comunicacao_eventos_ativa FROM configuracao_operacao WHERE id=true LIMIT 1`;
  if(configRows[0]?.comunicacao_eventos_ativa===false) return {sent:0,skipped:'disabled' as const};

  const rows=await sql`
    SELECT co.id,co.evento,co.mensagem,v.placa,v.modelo,c.nome AS cliente_nome,c.telefone,
           co.cliente_id,co.veiculo_id
    FROM comunicacoes_operacionais co
    JOIN veiculos v ON v.id=co.veiculo_id
    LEFT JOIN clientes c ON c.id=co.cliente_id
    WHERE co.status='preparada'
      AND co.criado_em >= now()-interval '3 days'
    ORDER BY co.criado_em ASC
    LIMIT 30
  `;

  let sent=0;
  for(const item of rows){
    const phone=String(item.telefone??'').replace(/\D/g,'');
    if(!phone){
      await sql`UPDATE comunicacoes_operacionais SET status='ignorada',erro='cliente sem telefone' WHERE id=${item.id}`;
      continue;
    }
    const labels:Record<string,string>={
      entrada_oficina:'Entrada na oficina',
      inicio_reparo:'Reparo iniciado',
      pintura_concluida:'Pintura concluída',
      montagem:'Montagem',
      pronto_entrega:'Pronto para entrega',
    };
    try{
      await sendWhatsAppTemplate(phone,template,[
        String(item.cliente_nome??'cliente'),
        `${String(item.modelo??'Veículo')} ${String(item.placa??'')}`.trim(),
        labels[String(item.evento)]??String(item.evento),
        String(item.mensagem??''),
      ]);
      await sql`
        UPDATE comunicacoes_operacionais
        SET status='enviada',enviado_em=now(),erro=NULL
        WHERE id=${item.id}
      `;
      await sql`
        INSERT INTO conversas (telefone,cliente_id,veiculo_id,mensagem,origem,intencao,canal,atendente_assumiu)
        VALUES (${phone},${item.cliente_id??null},${item.veiculo_id},${String(item.mensagem??'')},'bot','atualizacao_operacional','whatsapp',false)
      `;
      sent+=1;
    }catch(error){
      await sql`
        UPDATE comunicacoes_operacionais
        SET status='erro',erro=${error instanceof Error?error.message.slice(0,500):'erro desconhecido'}
        WHERE id=${item.id}
      `;
    }
  }
  return {sent};
}

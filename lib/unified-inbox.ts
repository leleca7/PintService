import 'server-only';

import { getDb } from '@/lib/db';
import { priorityFor } from '@/lib/reputation';

export type InboxChannel='whatsapp'|'instagram'|'email'|'site';

export async function recordInboxEvent(input:{
  channel:InboxChannel;
  externalId?:string|null;
  author?:string|null;
  message:string;
  phone?:string|null;
  data?:unknown;
}){
  const text=input.message.trim();
  if(!text) return null;
  const sql=getDb();

  let clientId:string|null=null;
  let vehicleId:string|null=null;
  if(input.phone){
    const phone=String(input.phone).replace(/\D/g,'');
    const clients=await sql`SELECT id FROM clientes WHERE telefone=${phone} LIMIT 1`;
    if(clients[0]){
      clientId=String(clients[0].id);
      const vehicles=await sql`
        SELECT id FROM veiculos
        WHERE cliente_id=${clientId}
        ORDER BY (data_saida_real IS NULL) DESC, ultima_atualizacao DESC
        LIMIT 1
      `;
      vehicleId=vehicles[0]?.id?String(vehicles[0].id):null;
    }
  }

  const priority=priorityFor({text});
  const rows=await sql`
    INSERT INTO inbox_eventos
      (canal,identificador_externo,cliente_id,veiculo_id,autor,mensagem,prioridade,dados)
    VALUES
      (${input.channel},${input.externalId??null},${clientId},${vehicleId},${input.author??null},
       ${text},${priority},${JSON.stringify(input.data??{})}::jsonb)
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  return rows[0]?.id?String(rows[0].id):null;
}

export async function getUnifiedInboxData(){
  const sql=getDb();
  const rows=await sql`
    SELECT i.id,i.canal,i.autor,i.mensagem,i.prioridade,i.status,i.criado_em,
           c.nome AS cliente_nome,v.placa,v.modelo
    FROM inbox_eventos i
    LEFT JOIN clientes c ON c.id=i.cliente_id
    LEFT JOIN veiculos v ON v.id=i.veiculo_id
    ORDER BY
      CASE i.prioridade WHEN 'urgente' THEN 0 WHEN 'alta' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
      i.criado_em DESC
    LIMIT 60
  `;
  return rows.map((row:any)=>({
    id:String(row.id),
    channel:String(row.canal),
    author:String(row.cliente_nome??row.autor??'Contato'),
    message:String(row.mensagem??''),
    priority:String(row.prioridade??'normal'),
    status:String(row.status??'novo'),
    plate:String(row.placa??''),
    model:String(row.modelo??''),
    createdAt:row.criado_em instanceof Date?row.criado_em.toISOString():String(row.criado_em??''),
  }));
}

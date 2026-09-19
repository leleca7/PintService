'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';

export async function markOperationalAlertResolved(formData:FormData){
  const user=await requirePermission('atualizar_operacao_veiculos');
  const id=String(formData.get('id')??'').trim();
  if(!id) throw new Error('Alerta inválido.');
  const sql=getDb();
  const rows=await sql`UPDATE alertas_operacionais SET status='resolvido',resolvido_em=now(),atualizado_em=now() WHERE id=${id} RETURNING veiculo_id,tipo,pedido_pecas_id`;
  if(rows[0]) await writeAudit(user,'resolver_alerta_operacional','alerta_operacional',id,{tipo:rows[0].tipo});
  revalidatePath('/operacao/inteligencia');
}

export async function markSupplierChargeSent(formData:FormData){
  const user=await requirePermission('gerenciar_pecas');
  const alertId=String(formData.get('alert_id')??'').trim();
  if(!alertId) throw new Error('Alerta inválido.');
  const sql=getDb();
  const rows=await sql`SELECT pedido_pecas_id FROM alertas_operacionais WHERE id=${alertId} LIMIT 1`;
  const orderId=rows[0]?.pedido_pecas_id;
  if(!orderId) throw new Error('Pedido não encontrado para este alerta.');
  await sql`
    UPDATE pedidos_pecas
    SET ultima_cobranca_em=now(),cobranca_status='cobrada',atualizado_em=now()
    WHERE id=${orderId}
  `;
  await sql`UPDATE alertas_operacionais SET status='em_tratamento',atualizado_em=now() WHERE id=${alertId}`;
  await writeAudit(user,'registrar_cobranca_fornecedor','pedidos_pecas',String(orderId),{alertId});
  revalidatePath('/operacao/inteligencia');
}


export async function saveSupplierContact(formData:FormData){
  const user=await requirePermission('gerenciar_pecas');
  const nome=String(formData.get('nome')??'').trim();
  const telefone=String(formData.get('telefone')??'').replace(/\D/g,'');
  const email=String(formData.get('email')??'').trim();
  if(!nome) throw new Error('Fornecedor inválido.');
  const sql=getDb();
  const rows=await sql`
    INSERT INTO fornecedores_contatos (nome,telefone,email,ativo,atualizado_em)
    VALUES (${nome},${telefone||null},${email||null},true,now())
    ON CONFLICT ((lower(nome))) DO UPDATE SET
      telefone=EXCLUDED.telefone,
      email=EXCLUDED.email,
      ativo=true,
      atualizado_em=now()
    RETURNING id
  `;
  await writeAudit(user,'salvar_contato_fornecedor','fornecedor',String(rows[0].id),{
    nome,telefone:telefone? 'configurado':'vazio',email:email?'configurado':'vazio'
  });
  revalidatePath('/operacao/inteligencia');
}


export async function updateStageTiming(formData:FormData){
  const user=await requirePermission('gerenciar_capacidade');
  const fase=String(formData.get('fase')??'').trim();
  const alerta=Number.parseInt(String(formData.get('horas_alerta')??''),10);
  const critico=Number.parseInt(String(formData.get('horas_critico')??''),10);
  if(!fase||!Number.isInteger(alerta)||alerta<=0||!Number.isInteger(critico)||critico<alerta){
    throw new Error('Tempos da etapa inválidos.');
  }
  const sql=getDb();
  const before=await sql`SELECT horas_alerta,horas_critico FROM configuracao_tempo_etapas WHERE fase=${fase} LIMIT 1`;
  await sql`
    INSERT INTO configuracao_tempo_etapas (fase,horas_alerta,horas_critico,ativo,atualizado_em)
    VALUES (${fase},${alerta},${critico},true,now())
    ON CONFLICT (fase) DO UPDATE SET horas_alerta=EXCLUDED.horas_alerta,horas_critico=EXCLUDED.horas_critico,ativo=true,atualizado_em=now()
  `;
  await writeAudit(user,'configurar_tempo_etapa','configuracao_tempo_etapas',fase,{
    antes:before[0]??null,depois:{horas_alerta:alerta,horas_critico:critico}
  });
  revalidatePath('/operacao/inteligencia');
}

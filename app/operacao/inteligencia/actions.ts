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

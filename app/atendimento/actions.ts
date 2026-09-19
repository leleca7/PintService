'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

export async function updateInboxStatus(formData:FormData){
  const user=await requirePermission('ver_atendimento');
  const id=String(formData.get('id')??'').trim();
  const status=String(formData.get('status')??'').trim();
  if(!id||!['novo','triado','em_atendimento','resolvido'].includes(status)) throw new Error('Atualização da caixa inválida.');
  const sql=getDb();
  const before=await sql`SELECT canal,status FROM inbox_eventos WHERE id=${id} LIMIT 1`;
  if(!before[0]) throw new Error('Evento não encontrado.');
  await sql`UPDATE inbox_eventos SET status=${status} WHERE id=${id}`;
  await writeAudit(user,'atualizar_inbox','inbox_evento',id,{canal:before[0].canal,antes:before[0].status,depois:status});
  revalidatePath('/atendimento');
}

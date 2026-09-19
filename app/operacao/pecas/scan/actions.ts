'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';
import { advancePostDeliveryFromParts } from '@/lib/operational-intelligence';

export async function receiveScannedPart(formData: FormData) {
  const user = await requirePermission('gerenciar_pecas');
  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Peça inválida.');

  const sql = getDb();
  const rows = await sql`
    SELECT i.id,i.descricao,i.quantidade,i.quantidade_recebida,i.pedido_id,
           c.veiculo_id,c.placa
    FROM itens_pedido_pecas i
    JOIN pedidos_pecas p ON p.id=i.pedido_id
    JOIN controle_pecas c ON c.id=p.controle_pecas_id
    WHERE i.id=${id}
    LIMIT 1
  `;
  const item=rows[0];
  if (!item) throw new Error('Peça não encontrada.');
  const total=Number(item.quantidade ?? 0);
  const before=Number(item.quantidade_recebida ?? 0);
  if (before >= total) return;

  const after=Math.min(total,before+1);
  await sql`
    UPDATE itens_pedido_pecas
    SET quantidade_recebida=${after},ultimo_recebimento_em=CURRENT_DATE,atualizado_em=now()
    WHERE id=${id}
  `;
  await writeAudit(user,'receber_peca_por_codigo','itens_pedido_pecas',id,{
    placa:item.placa,descricao:item.descricao,antes:before,depois:after,
  });

  if (after >= total && item.veiculo_id) {
    await advancePostDeliveryFromParts({
      vehicleId:String(item.veiculo_id),
      receivedItems:[{descricao:String(item.descricao ?? '')}],
      orderIds:[String(item.pedido_id)],
    });
  }

  revalidatePath('/operacao/pecas');
  revalidatePath('/operacao/pecas/scan');
}

'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';
import { QUALITY_ITEMS } from '@/lib/quality-control';

function checked(formData:FormData,key:string){return String(formData.get(key)??'')==='on';}

export async function saveQualityChecklist(formData:FormData){
  const user=await requirePermission('atualizar_operacao_veiculos');
  const vehicleId=String(formData.get('vehicle_id')??'').trim();
  const decision=String(formData.get('decision')??'review');
  const observacoes=String(formData.get('observacoes')??'').trim();
  if(!vehicleId) throw new Error('Veículo inválido.');

  const items=Object.fromEntries(QUALITY_ITEMS.map(([key])=>[key,checked(formData,key)]));
  const complete=QUALITY_ITEMS.every(([key])=>Boolean(items[key]));
  if(decision==='approve'&&!complete) throw new Error('Conclua todos os itens antes de aprovar a liberação.');
  if(decision==='reject'&&!observacoes) throw new Error('Informe o motivo da reprovação.');

  const status=decision==='approve'?'aprovado':decision==='reject'?'reprovado':'em_revisao';
  const sql=getDb();
  const rows=await sql`
    SELECT id FROM checklists_qualidade
    WHERE veiculo_id=${vehicleId}
    ORDER BY criado_em DESC LIMIT 1
  `;

  let id:string;
  if(rows[0]){
    id=String(rows[0].id);
    await sql`
      UPDATE checklists_qualidade
      SET status=${status},itens=${JSON.stringify(items)}::jsonb,observacoes=${observacoes||null},
          concluido_por=${status==='aprovado'?user.funcionarioId??null:null},
          concluido_em=CASE WHEN ${status}='aprovado' THEN now() ELSE NULL END,
          atualizado_em=now()
      WHERE id=${id}
    `;
  }else{
    const inserted=await sql`
      INSERT INTO checklists_qualidade
        (veiculo_id,status,itens,observacoes,concluido_por,concluido_em)
      VALUES
        (${vehicleId},${status},${JSON.stringify(items)}::jsonb,${observacoes||null},
         ${status==='aprovado'?user.funcionarioId??null:null},
         CASE WHEN ${status}='aprovado' THEN now() ELSE NULL END)
      RETURNING id
    `;
    id=String(inserted[0].id);
  }

  await sql`
    INSERT INTO historico_veiculos (veiculo_id,usuario_app_id,evento,dados_novos)
    VALUES (
      ${vehicleId},${user.id},'checklist_qualidade',
      ${JSON.stringify({checklistId:id,status,items,observacoes})}::jsonb
    )
  `;
  await writeAudit(user,'checklist_qualidade','veiculo',vehicleId,{status,items,observacoes});
  revalidatePath(`/operacao/qualidade/${vehicleId}`);
  revalidatePath('/operacao');
  revalidatePath(`/veiculos/${vehicleId}`);
}

'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';

function on(formData:FormData,key:string){return String(formData.get(key)??'')==='on';}

export async function updateOperationalAutomationConfig(formData:FormData){
  const user=await requirePermission('gerenciar_integracoes');
  const next={
    detectorDelays:on(formData,'detector_atrasos_ativo'),
    smartForecast:on(formData,'previsao_operacional_ativa'),
    requireQualityChecklist:on(formData,'exigir_checklist_qualidade'),
    customerEvents:on(formData,'comunicacao_eventos_ativa'),
    sectorSummaries:on(formData,'resumo_setores_ativo'),
    automaticSupplierCharge:on(formData,'cobranca_fornecedor_automatica'),
  };
  const sql=getDb();
  const before=await sql`SELECT * FROM configuracao_operacao WHERE id=true LIMIT 1`;
  await sql`
    INSERT INTO configuracao_operacao (
      id,detector_atrasos_ativo,previsao_operacional_ativa,exigir_checklist_qualidade,
      comunicacao_eventos_ativa,resumo_setores_ativo,cobranca_fornecedor_automatica,atualizado_em
    )
    VALUES (
      true,${next.detectorDelays},${next.smartForecast},${next.requireQualityChecklist},
      ${next.customerEvents},${next.sectorSummaries},${next.automaticSupplierCharge},now()
    )
    ON CONFLICT (id) DO UPDATE SET
      detector_atrasos_ativo=EXCLUDED.detector_atrasos_ativo,
      previsao_operacional_ativa=EXCLUDED.previsao_operacional_ativa,
      exigir_checklist_qualidade=EXCLUDED.exigir_checklist_qualidade,
      comunicacao_eventos_ativa=EXCLUDED.comunicacao_eventos_ativa,
      resumo_setores_ativo=EXCLUDED.resumo_setores_ativo,
      cobranca_fornecedor_automatica=EXCLUDED.cobranca_fornecedor_automatica,
      atualizado_em=now()
  `;
  await writeAudit(user,'configurar_automacoes','configuracao_operacao','global',{
    antes:before[0]??null,
    depois:next,
  });
  revalidatePath('/configuracoes');
}

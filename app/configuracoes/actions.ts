'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';
import { sendWhatsAppTemplate } from '@/lib/whatsapp';
import { WHATSAPP_TEMPLATE_SPECS } from '@/lib/whatsapp-readiness';

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


export async function sendWhatsAppActivationTest(formData:FormData){
  const user=await requirePermission('gerenciar_integracoes');
  const phone=String(formData.get('phone')??'').replace(/\D/g,'');
  const envKey=String(formData.get('template')??'').trim();
  if(!phone||phone.length<10) throw new Error('Informe um número de teste com DDD e país.');
  const spec=WHATSAPP_TEMPLATE_SPECS.find((item)=>item.envKey===envKey);
  if(!spec) throw new Error('Template de teste inválido.');
  const templateName=String(process.env[spec.envKey]??'').trim();
  if(!templateName) throw new Error('Esse template ainda não está configurado na Vercel.');

  const paramsByKey:Record<string,string[]>={
    WHATSAPP_OPERATION_UPDATE_TEMPLATE:['Teste','Veículo TESTE','Teste de integração','Mensagem de teste da integração da Pint Services.'],
    WHATSAPP_POST_DELIVERY_TEMPLATE:['Teste','Veículo TESTE','1 ano','6 meses','sem pendências registradas'],
    WHATSAPP_POST_DELIVERY_PENDING_TEMPLATE:['Teste','Veículo TESTE','1 ano','6 meses','pendência de teste'],
    WHATSAPP_POST_DELIVERY_UPDATE_TEMPLATE:['Teste','Veículo TESTE','Pendência de teste','Atualização de teste da integração.'],
    WHATSAPP_SUPPLIER_DELAY_TEMPLATE:['Fornecedor teste','PEDIDO-TESTE','TESTE123','19/09/2026'],
    ALERT_WHATSAPP_TEMPLATE:['Teste de integração do Sistema da Pint.'],
  };
  await sendWhatsAppTemplate(
    phone,
    templateName,
    paramsByKey[spec.envKey]??[],
    spec.envKey==='ALERT_WHATSAPP_TEMPLATE'
      ? (process.env.ALERT_WHATSAPP_TEMPLATE_LANGUAGE?.trim()||'pt_BR')
      : 'pt_BR'
  );
  await writeAudit(user,'teste_whatsapp_meta','integracao','whatsapp',{
    template:templateName,
    destinatarioFinal:phone.slice(-4),
  });
  revalidatePath('/configuracoes');
}

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


async function ensureSiteConfigTable(){
  const sql=getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS configuracao_site (
      id boolean PRIMARY KEY DEFAULT true,
      logo_base64 text,
      logo_mime text,
      atualizado_em timestamptz NOT NULL DEFAULT now()
    )
  `;
  return sql;
}

export async function updateSiteLogo(formData:FormData){
  const user=await requirePermission('gerenciar_integracoes');
  const file=formData.get('logo');

  if(!(file instanceof File) || file.size===0){
    throw new Error('Selecione uma imagem para a logo.');
  }

  const allowed=new Set(['image/png','image/jpeg','image/webp']);
  if(!allowed.has(file.type)){
    throw new Error('Use uma logo em PNG, JPG ou WEBP.');
  }

  const maxBytes=2*1024*1024;
  if(file.size>maxBytes){
    throw new Error('A logo deve ter no máximo 2 MB.');
  }

  const buffer=Buffer.from(await file.arrayBuffer());
  const base64=buffer.toString('base64');
  const sql=await ensureSiteConfigTable();
  const before=await sql`SELECT logo_mime, atualizado_em FROM configuracao_site WHERE id=true LIMIT 1`;

  await sql`
    INSERT INTO configuracao_site (id,logo_base64,logo_mime,atualizado_em)
    VALUES (true,${base64},${file.type},now())
    ON CONFLICT (id) DO UPDATE SET
      logo_base64=EXCLUDED.logo_base64,
      logo_mime=EXCLUDED.logo_mime,
      atualizado_em=now()
  `;

  await writeAudit(user,'atualizar_logo_site','configuracao_site','global',{
    antes:before[0]??null,
    depois:{mime:file.type,tamanho:file.size,nome:file.name},
  });

  revalidatePath('/site');
  revalidatePath('/configuracoes');
}

export async function resetSiteLogo(){
  const user=await requirePermission('gerenciar_integracoes');
  const sql=await ensureSiteConfigTable();
  const before=await sql`SELECT logo_mime, atualizado_em FROM configuracao_site WHERE id=true LIMIT 1`;

  await sql`
    INSERT INTO configuracao_site (id,logo_base64,logo_mime,atualizado_em)
    VALUES (true,NULL,NULL,now())
    ON CONFLICT (id) DO UPDATE SET
      logo_base64=NULL,
      logo_mime=NULL,
      atualizado_em=now()
  `;

  await writeAudit(user,'restaurar_logo_padrao','configuracao_site','global',{
    antes:before[0]??null,
    depois:{logo:'padrao_local'},
  });

  revalidatePath('/site');
  revalidatePath('/configuracoes');
}


export async function updateSiteMedia(formData:FormData){
  const user=await requirePermission('gerenciar_integracoes');
  const slot=String(formData.get('slot')??'').trim();
  if(slot!=='processo'&&slot!=='resultado') throw new Error('Espaço de vídeo inválido.');

  const file=formData.get('media');
  if(!(file instanceof File)||file.size===0) throw new Error('Selecione um vídeo.');

  const allowed=new Set(['video/mp4','video/webm']);
  if(!allowed.has(file.type)) throw new Error('Use vídeo MP4 ou WEBM.');

  const maxBytes=8*1024*1024;
  if(file.size>maxBytes) throw new Error('O vídeo deve ter no máximo 8 MB.');

  const buffer=Buffer.from(await file.arrayBuffer());
  const sql=getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS configuracao_site_media (
      slot text PRIMARY KEY,
      media bytea,
      mime text,
      nome_arquivo text,
      atualizado_em timestamptz NOT NULL DEFAULT now()
    )
  `;

  const before=await sql`
    SELECT slot,mime,nome_arquivo,atualizado_em
    FROM configuracao_site_media
    WHERE slot=${slot}
    LIMIT 1
  `;

  await sql`
    INSERT INTO configuracao_site_media (slot,media,mime,nome_arquivo,atualizado_em)
    VALUES (${slot},${buffer},${file.type},${file.name},now())
    ON CONFLICT (slot) DO UPDATE SET
      media=EXCLUDED.media,
      mime=EXCLUDED.mime,
      nome_arquivo=EXCLUDED.nome_arquivo,
      atualizado_em=now()
  `;

  await writeAudit(user,'atualizar_video_site','configuracao_site_media',slot,{
    antes:before[0]??null,
    depois:{slot,mime:file.type,tamanho:file.size,nome:file.name},
  });

  revalidatePath('/site');
  revalidatePath('/configuracoes');
}

export async function resetSiteMedia(formData:FormData){
  const user=await requirePermission('gerenciar_integracoes');
  const slot=String(formData.get('slot')??'').trim();
  if(slot!=='processo'&&slot!=='resultado') throw new Error('Espaço de vídeo inválido.');

  const sql=getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS configuracao_site_media (
      slot text PRIMARY KEY,
      media bytea,
      mime text,
      nome_arquivo text,
      atualizado_em timestamptz NOT NULL DEFAULT now()
    )
  `;

  const before=await sql`
    SELECT slot,mime,nome_arquivo,atualizado_em
    FROM configuracao_site_media
    WHERE slot=${slot}
    LIMIT 1
  `;

  await sql`DELETE FROM configuracao_site_media WHERE slot=${slot}`;

  await writeAudit(user,'remover_video_site','configuracao_site_media',slot,{
    antes:before[0]??null,
    depois:null,
  });

  revalidatePath('/site');
  revalidatePath('/configuracoes');
}

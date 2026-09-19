import 'server-only';
import { getDb } from '@/lib/db';

export type OperationalAutomationConfig={
  detectorDelays:boolean;
  smartForecast:boolean;
  requireQualityChecklist:boolean;
  customerEvents:boolean;
  sectorSummaries:boolean;
  automaticSupplierCharge:boolean;
};

export async function getOperationalAutomationConfig():Promise<OperationalAutomationConfig>{
  const fallback:OperationalAutomationConfig={
    detectorDelays:true,
    smartForecast:true,
    requireQualityChecklist:true,
    customerEvents:true,
    sectorSummaries:true,
    automaticSupplierCharge:false,
  };
  try{
    const sql=getDb();
    const rows=await sql`
      SELECT detector_atrasos_ativo,previsao_operacional_ativa,exigir_checklist_qualidade,
             comunicacao_eventos_ativa,resumo_setores_ativo,cobranca_fornecedor_automatica
      FROM configuracao_operacao WHERE id=true LIMIT 1
    `;
    const row=rows[0];
    if(!row) return fallback;
    return {
      detectorDelays:row.detector_atrasos_ativo!==false,
      smartForecast:row.previsao_operacional_ativa!==false,
      requireQualityChecklist:row.exigir_checklist_qualidade!==false,
      customerEvents:row.comunicacao_eventos_ativa!==false,
      sectorSummaries:row.resumo_setores_ativo!==false,
      automaticSupplierCharge:row.cobranca_fornecedor_automatica===true,
    };
  }catch(error){
    console.error('Configuração de automações operacionais ainda não disponível:',error);
    return fallback;
  }
}

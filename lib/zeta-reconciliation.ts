import 'server-only';

import { getDb } from '@/lib/db';

type ZetaRecord={
  plate:string;
  reference:string;
  status:string;
  closed:boolean;
  raw:any;
};

function normalizePlate(value=''){
  return value.replace(/[^A-Za-z0-9]/g,'').toUpperCase();
}

function remoteRecords(payload:any):ZetaRecord[]{
  const source=Array.isArray(payload)?payload:Array.isArray(payload?.items)?payload.items:Array.isArray(payload?.vehicles)?payload.vehicles:Array.isArray(payload?.data)?payload.data:[];
  return source.map((item:any)=>{
    const status=String(item?.status??item?.situacao??item?.state??'').trim();
    const closedRaw=item?.closed??item?.encerrado??item?.finalizado??false;
    const closed=closedRaw===true||['encerrado','finalizado','concluido','concluído','fechado'].includes(status.toLowerCase());
    return {
      plate:normalizePlate(String(item?.plate??item?.placa??item?.vehicle_plate??'')),
      reference:String(item?.id??item?.os??item?.ordem_servico??item?.reference??''),
      status,
      closed,
      raw:item,
    };
  }).filter((item:ZetaRecord)=>Boolean(item.plate));
}

async function openDivergenceAlert(input:{vehicleId:string;plate:string;divergences:any[];reference:string}){
  const sql=getDb();
  const key=`zeta_divergencia:${input.vehicleId}`;
  const existing=await sql`
    SELECT id FROM alertas_operacionais
    WHERE chave_dedupe=${key} AND status IN ('aberto','em_tratamento')
    LIMIT 1
  `;
  const message=input.divergences.map(item=>String(item.message)).join(' · ');
  if(existing[0]){
    await sql`
      UPDATE alertas_operacionais
      SET nivel='alto',titulo=${`Divergência Zeta — ${input.plate}`},mensagem=${message},
          dados=${JSON.stringify({reference:input.reference,divergences:input.divergences})}::jsonb,
          atualizado_em=now()
      WHERE id=${existing[0].id}
    `;
    return;
  }
  await sql`
    INSERT INTO alertas_operacionais
      (veiculo_id,tipo,chave_dedupe,nivel,titulo,mensagem,dados)
    VALUES
      (${input.vehicleId},'zeta_divergencia',${key},'alto',${`Divergência Zeta — ${input.plate}`},${message},
       ${JSON.stringify({reference:input.reference,divergences:input.divergences})}::jsonb)
  `;
}

export async function reconcileZeta(){
  const url=process.env.ZETA_SYNC_URL?.trim();
  if(!url) return {enabled:false,checked:0,divergent:0,reason:'ZETA_SYNC_URL não configurada'};

  const headers:Record<string,string>={accept:'application/json'};
  const token=process.env.ZETA_SYNC_TOKEN?.trim();
  if(token) headers.authorization=`Bearer ${token}`;

  const response=await fetch(url,{headers,cache:'no-store'});
  if(!response.ok) throw new Error(`Fonte do Zeta respondeu ${response.status}`);
  const payload=await response.json();
  const records=remoteRecords(payload);
  const sql=getDb();
  let checked=0;
  let divergent=0;

  for(const remote of records){
    const localRows=await sql`
      SELECT id,placa,status,setor,data_saida_real,zeta_referencia
      FROM veiculos
      WHERE upper(placa)=upper(${remote.plate})
      LIMIT 1
    `;
    const local=localRows[0];
    if(!local) continue;
    checked+=1;
    const divergences:any[]=[];

    if(remote.closed&&!local.data_saida_real){
      divergences.push({
        type:'zeta_encerrado_pint_aberto',
        message:'Zeta indica atendimento encerrado, mas o veículo continua aberto na Pint.',
      });
    }
    if(!remote.closed&&local.data_saida_real){
      divergences.push({
        type:'pint_encerrado_zeta_aberto',
        message:'Pint indica veículo entregue, mas a fonte do Zeta não aparece encerrada.',
      });
    }

    if(process.env.ZETA_COMPARE_STATUS==='true'&&remote.status&&local.status&&remote.status.toLowerCase()!==String(local.status).toLowerCase()){
      divergences.push({
        type:'status_diferente',
        message:`Status diferente: Pint “${local.status}” · Zeta “${remote.status}”.`,
      });
    }

    await sql`
      INSERT INTO zeta_snapshots (veiculo_id,placa,referencia_zeta,payload,divergencias,status)
      VALUES (
        ${local.id},${remote.plate},${remote.reference||null},${JSON.stringify(remote.raw)}::jsonb,
        ${JSON.stringify(divergences)}::jsonb,${divergences.length?'divergente':'sincronizado'}
      )
    `;
    await sql`
      UPDATE veiculos
      SET zeta_referencia=COALESCE(${remote.reference||null},zeta_referencia),
          zeta_ultima_sincronizacao=now()
      WHERE id=${local.id}
    `;

    if(divergences.length){
      divergent+=1;
      await openDivergenceAlert({
        vehicleId:String(local.id),
        plate:String(local.placa),
        divergences,
        reference:remote.reference,
      });
    }else{
      await sql`
        UPDATE alertas_operacionais
        SET status='resolvido',resolvido_em=now(),atualizado_em=now()
        WHERE chave_dedupe=${`zeta_divergencia:${local.id}`}
          AND status IN ('aberto','em_tratamento')
      `;
    }
  }

  return {enabled:true,checked,divergent,received:records.length};
}

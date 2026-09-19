import 'server-only';
import { getDb } from '@/lib/db';

export type VehicleMedia={
  id:string;
  mediaId:string;
  mediaType:string;
  caption:string;
  event:string;
  createdAt:string;
};

export async function getVehicleMedia(vehicleId:string):Promise<VehicleMedia[]>{
  const sql=getDb();
  const rows=await sql`
    SELECT id,evento,criado_em,dados_novos,
           COALESCE(
             NULLIF(dados_novos->>'evidenceMediaId',''),
             NULLIF(dados_novos->>'sourceMediaId',''),
             NULLIF(dados_novos->>'mediaId','')
           ) AS media_id
    FROM historico_veiculos
    WHERE veiculo_id=${vehicleId}
      AND (
        NULLIF(dados_novos->>'evidenceMediaId','') IS NOT NULL
        OR NULLIF(dados_novos->>'sourceMediaId','') IS NOT NULL
        OR (evento='recebimento_pecas_via_whatsapp' AND NULLIF(dados_novos->>'mediaId','') IS NOT NULL)
      )
    ORDER BY criado_em DESC
    LIMIT 40
  `;
  return rows.filter((row:any)=>Boolean(row.media_id)).map((row:any)=>{
    const data=typeof row.dados_novos==='string'?(()=>{try{return JSON.parse(row.dados_novos);}catch{return {};}})():row.dados_novos??{};
    return {
      id:String(row.id),
      mediaId:String(row.media_id),
      mediaType:String(data.sourceMediaType??(data.evidenceMediaId?'image':'image')),
      caption:String(data.textoConfirmado??data.descricao??''),
      event:String(row.evento??'mídia operacional'),
      createdAt:row.criado_em instanceof Date?row.criado_em.toISOString():String(row.criado_em??''),
    };
  });
}

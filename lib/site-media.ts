import { getDb } from '@/lib/db';

export type SiteMediaSlot = 'processo' | 'resultado';

const ALLOWED_SLOTS = new Set<SiteMediaSlot>(['processo','resultado']);

export function isSiteMediaSlot(value:string):value is SiteMediaSlot{
  return ALLOWED_SLOTS.has(value as SiteMediaSlot);
}

export async function ensureSiteMediaTable(){
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
  return sql;
}

export async function getSiteMediaState(){
  try{
    const sql=await ensureSiteMediaTable();
    const rows=await sql`
      SELECT slot, mime, nome_arquivo, atualizado_em
      FROM configuracao_site_media
      WHERE media IS NOT NULL AND octet_length(media) > 0
    `;
    const bySlot=new Map(rows.map((row)=>[String(row.slot),row]));
    return {
      processo:Boolean(bySlot.get('processo')),
      resultado:Boolean(bySlot.get('resultado')),
      processoMeta:bySlot.get('processo')??null,
      resultadoMeta:bySlot.get('resultado')??null,
    };
  }catch{
    return {
      processo:false,
      resultado:false,
      processoMeta:null,
      resultadoMeta:null,
    };
  }
}

export async function getSiteMedia(slot:SiteMediaSlot){
  const sql=await ensureSiteMediaTable();
  const rows=await sql`
    SELECT media, mime, nome_arquivo, atualizado_em
    FROM configuracao_site_media
    WHERE slot=${slot}
    LIMIT 1
  `;
  return rows[0]??null;
}

import { NextResponse } from 'next/server';
import { getSiteMedia, isSiteMediaSlot } from '@/lib/site-media';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(_request:Request,{params}:{params:Promise<{slot:string}>}){
  const {slot}=await params;
  if(!isSiteMediaSlot(slot)){
    return NextResponse.json({error:'mídia inválida'},{status:404});
  }

  try{
    const media=await getSiteMedia(slot);
    if(!media?.media || !media?.mime){
      return new Response(null,{status:204});
    }

    const buffer=Buffer.isBuffer(media.media)
      ? media.media
      : Buffer.from(media.media);

    if(buffer.length===0){
      return new Response(null,{status:204});
    }

    return new Response(new Uint8Array(buffer),{
      headers:{
        'content-type':String(media.mime),
        'content-length':String(buffer.length),
        'cache-control':'public, max-age=300, stale-while-revalidate=3600',
        'content-disposition':`inline; filename="${String(media.nome_arquivo??slot).replace(/"/g,'')}"`,
      },
    });
  }catch(error){
    console.error('Falha ao abrir mídia pública do site:',error);
    return NextResponse.json({error:'mídia indisponível'},{status:404});
  }
}

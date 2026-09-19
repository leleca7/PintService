import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import { downloadWhatsAppMedia } from '@/lib/whatsapp-media';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(_request:Request,{params}:{params:Promise<{mediaId:string}>}){
  const user=await getCurrentAppUser();
  if(!user?.ativo) return NextResponse.json({error:'sem acesso'},{status:403});
  const {mediaId}=await params;
  try{
    const media=await downloadWhatsAppMedia(decodeURIComponent(mediaId));
    return new Response(new Uint8Array(media.buffer),{
      headers:{
        'content-type':media.mimeType,
        'cache-control':'private, max-age=120',
        'content-disposition':`inline; filename="${media.filename.replace(/"/g,'')}"`,
      },
    });
  }catch(error){
    console.error('Falha ao abrir mídia operacional:',error);
    return NextResponse.json({error:'mídia indisponível'},{status:404});
  }
}

import { NextResponse } from 'next/server';
import { recordInboxEvent } from '@/lib/unified-inbox';

export const runtime='nodejs';

function authorized(request:Request){
  const secret=process.env.INBOX_SITE_WEBHOOK_SECRET?.trim();
  return Boolean(secret)&&request.headers.get('authorization')===`Bearer ${secret}`;
}

export async function POST(request:Request){
  if(!authorized(request)) return NextResponse.json({error:'não autorizado'},{status:401});
  const body=await request.json().catch(()=>null) as any;
  const message=String(body?.message??body?.mensagem??'').trim();
  if(!message) return NextResponse.json({error:'mensagem ausente'},{status:400});
  await recordInboxEvent({
    channel:'site',
    externalId:String(body?.id??'')||null,
    author:String(body?.name??body?.nome??'Site'),
    phone:String(body?.phone??body?.telefone??'')||null,
    message,
    data:{email:body?.email??null},
  });
  return NextResponse.json({received:true});
}

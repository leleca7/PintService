import { NextResponse } from 'next/server';
import { recordInboxEvent } from '@/lib/unified-inbox';

export const runtime='nodejs';

function authorized(request:Request){
  const secret=process.env.INBOX_EMAIL_WEBHOOK_SECRET?.trim();
  return Boolean(secret)&&request.headers.get('authorization')===`Bearer ${secret}`;
}

export async function POST(request:Request){
  if(!authorized(request)) return NextResponse.json({error:'não autorizado'},{status:401});
  const body=await request.json().catch(()=>null) as any;
  const text=String(body?.text??body?.body??body?.snippet??'').trim();
  if(!text) return NextResponse.json({error:'mensagem ausente'},{status:400});
  await recordInboxEvent({
    channel:'email',
    externalId:String(body?.id??body?.messageId??'')||null,
    author:String(body?.from??body?.sender??'E-mail'),
    message:[body?.subject?String(body.subject):'',text].filter(Boolean).join(' — '),
    data:{subject:body?.subject??null},
  });
  return NextResponse.json({received:true});
}

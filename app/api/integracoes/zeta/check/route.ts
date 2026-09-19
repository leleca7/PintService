import { NextResponse } from 'next/server';
import { reconcileZeta } from '@/lib/zeta-reconciliation';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function authorized(request:Request){
  const secret=process.env.CRON_SECRET?.trim();
  if(!secret) return process.env.NODE_ENV!=='production';
  return request.headers.get('authorization')===`Bearer ${secret}`;
}

export async function GET(request:Request){
  if(!authorized(request)) return NextResponse.json({error:'não autorizado'},{status:401});
  try{
    const result=await reconcileZeta();
    return NextResponse.json({ok:true,...result});
  }catch(error){
    console.error('Falha na reconciliação Zeta:',error);
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:'erro desconhecido'},{status:500});
  }
}

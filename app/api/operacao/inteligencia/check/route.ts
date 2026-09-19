import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { refreshSmartForecasts, scanOperationalExceptions } from '@/lib/operational-intelligence';
import { flushPreparedOperationalCommunications } from '@/lib/operational-communications';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function authorized(request:Request){
  const secret=process.env.CRON_SECRET?.trim();
  if(!secret) return process.env.NODE_ENV!=='production';
  return request.headers.get('authorization')===`Bearer ${secret}`;
}

export async function GET(request:Request){
  if(!authorized(request)) return NextResponse.json({error:'não autorizado'},{status:401});
  const sql=getDb();
  const rows=await sql`
    SELECT detector_atrasos_ativo,previsao_operacional_ativa
    FROM configuracao_operacao WHERE id=true LIMIT 1
  `;
  const config=rows[0]??{};
  const [alerts,forecast,communications]=await Promise.all([
    config.detector_atrasos_ativo===false?Promise.resolve({disabled:true}):scanOperationalExceptions(),
    config.previsao_operacional_ativa===false?Promise.resolve({disabled:true}):refreshSmartForecasts(),
    flushPreparedOperationalCommunications(),
  ]);
  return NextResponse.json({ok:true,alerts,forecast,communications});
}

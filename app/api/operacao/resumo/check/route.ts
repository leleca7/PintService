import { NextResponse } from 'next/server';
import { buildOperationsExceptionSummary } from '@/lib/operations-summary';
import { sendWhatsAppAlert } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 });

  const phone = process.env.OPERATIONS_SUMMARY_WHATSAPP_TO?.trim() || process.env.ALERT_WHATSAPP_TO?.trim();
  if (!phone) return NextResponse.json({ ok: true, skipped: 'telefone de resumo não configurado' });

  const summary = await buildOperationsExceptionSummary();
  if (!summary.total && process.env.OPERATIONS_SUMMARY_SEND_EMPTY !== 'true') {
    return NextResponse.json({ ok: true, exceptions: 0, skipped: 'sem exceções' });
  }

  await sendWhatsAppAlert(phone, summary.text);
  return NextResponse.json({ ok: true, exceptions: summary.total });
}

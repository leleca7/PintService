import { NextResponse } from 'next/server';
import { safeStringEqual } from '@/lib/security';
import { retryRecoverableWhatsAppEvents } from '@/lib/whatsapp-event-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  return safeStringEqual(request.headers.get('authorization'), `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 });
  try {
    const result = await retryRecoverableWhatsAppEvents(20);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : 'Falha ao recuperar eventos do WhatsApp.';
    console.error('whatsapp_retry_cron_error', { error: message });
    return NextResponse.json({ ok: false, error: 'Falha ao recuperar eventos pendentes.' }, { status: 500 });
  }
}

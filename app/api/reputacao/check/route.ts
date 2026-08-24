import { NextResponse } from 'next/server';
import { channelLabel, getReputationData } from '@/lib/reputation';
import { sendWhatsAppText } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 });
  const phone = process.env.ALERT_WHATSAPP_TO?.trim();
  if (!phone) return NextResponse.json({ ok: true, skipped: 'ALERT_WHATSAPP_TO não configurado' });

  const data = await getReputationData({ demoFallback: false });
  const windowMinutes = Math.max(60, Number(process.env.REPUTATION_ALERT_WINDOW_MINUTES || 1500));
  const cutoff = Date.now() - windowMinutes * 60_000;
  const actionable = data.items.filter((item) =>
    item.status !== 'respondido' &&
    ['alta', 'urgente'].includes(item.priority) &&
    new Date(item.createdAt).getTime() >= cutoff,
  );

  if (!actionable.length) return NextResponse.json({ ok: true, alerts: 0, errors: data.errors });
  const lines = actionable.slice(0, 12).map((item) => {
    const short = item.message.replace(/\s+/g, ' ').slice(0, 120);
    return `• ${channelLabel(item.channel)} · ${item.priority} · ${item.author}: ${short}`;
  });
  const extra = actionable.length > 12 ? `\n+ ${actionable.length - 12} item(ns) na central.` : '';
  await sendWhatsAppText(phone, `PintService — reputação precisa de atenção\n${actionable.length} item(ns) novo(s) ou sem resposta.\n\n${lines.join('\n')}${extra}\n\nAbra /reputacao para revisar e responder.`);
  return NextResponse.json({ ok: true, alerts: actionable.length, errors: data.errors });
}

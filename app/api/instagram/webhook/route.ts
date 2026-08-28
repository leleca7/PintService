import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { priorityFor } from '@/lib/reputation';
import { safeStringEqual } from '@/lib/security';
import { sendWhatsAppAlert } from '@/lib/whatsapp';

export const runtime = 'nodejs';

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.INSTAGRAM_APP_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!signature?.startsWith('sha256=')) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function eventsFrom(payload: any) {
  const events: Array<{ kind: 'mensagem' | 'comentario'; author: string; text: string; id: string }> = [];
  for (const entry of payload?.entry ?? []) {
    for (const messaging of entry?.messaging ?? []) {
      const text = String(messaging?.message?.text ?? '').trim();
      if (text) events.push({ kind: 'mensagem', author: String(messaging?.sender?.id ?? 'Instagram'), text, id: String(messaging?.message?.mid ?? '') });
    }
    const changes = Array.isArray(entry?.changes) ? entry.changes : entry?.field ? [{ field: entry.field, value: entry.value }] : [];
    for (const change of changes) {
      if (!['comments', 'live_comments'].includes(String(change?.field ?? ''))) continue;
      const value = change?.value ?? {};
      const text = String(value?.text ?? '').trim();
      if (text) events.push({ kind: 'comentario', author: value?.from?.username ? `@${value.from.username}` : 'Instagram', text, id: String(value?.id ?? '') });
    }
  }
  return events;
}

function shouldNotify(event: { kind: string }, priority: string) {
  const mode = (process.env.INSTAGRAM_ALERT_MODE || 'messages').trim().toLowerCase();
  if (mode === 'all') return true;
  if (mode === 'critical') return ['alta', 'urgente'].includes(priority);
  return event.kind === 'mensagem' || ['alta', 'urgente'].includes(priority);
}

async function notifyIfNeeded(event: { kind: string; author: string; text: string }) {
  const priority = priorityFor({ text: event.text });
  if (!shouldNotify(event, priority)) return;
  const phone = process.env.ALERT_WHATSAPP_TO?.trim();
  if (!phone || !process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_GRAPH_VERSION) return;
  const preview = event.text.length > 320 ? `${event.text.slice(0, 317)}...` : event.text;
  const heading = priority === 'alta' || priority === 'urgente' ? 'Instagram precisa de atenção' : 'Nova mensagem no Instagram';
  await sendWhatsAppAlert(phone, `${heading}. ${event.kind}; prioridade ${priority}; ${event.author}: ${preview}. Abra a Central de reputação para revisar e responder.`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expectedToken = process.env.INSTAGRAM_VERIFY_TOKEN?.trim();
  if (mode === 'subscribe' && safeStringEqual(token, expectedToken)) return new Response(challenge ?? '', { status: 200 });
  return new Response('forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'))) return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 });
  let payload: any;
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: 'json inválido' }, { status: 400 }); }
  const events = eventsFrom(payload);
  await Promise.allSettled(events.map(notifyIfNeeded));
  return NextResponse.json({ received: true, events: events.length });
}

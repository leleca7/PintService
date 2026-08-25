import { after, NextRequest, NextResponse } from 'next/server';
import { processIncomingMessage } from '@/lib/process-message';
import { isDatabaseConfigured } from '@/lib/db';
import { extractIncomingMessages, verifyMetaSignature } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function whatsappAiEnabled() {
  return process.env.WHATSAPP_AI_ENABLED?.trim().toLowerCase() === 'true';
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) return new NextResponse(challenge ?? '', { status: 200 });
  return NextResponse.json({ error: 'Verificação inválida' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Fluxo do WhatsApp não ativado: banco Neon não conectado.' }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  if (!verifyMetaSignature(rawBody, signature)) return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });

  if (!whatsappAiEnabled()) {
    return NextResponse.json({ received: true, automation: 'paused' });
  }

  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }
  const messages = extractIncomingMessages(payload);
  after(async () => {
    for (const message of messages) {
      try { await processIncomingMessage(message); }
      catch (error) { console.error('whatsapp_process_error', { messageId: message.id, error }); }
    }
  });
  return NextResponse.json({ received: true, automation: 'enabled' });
}

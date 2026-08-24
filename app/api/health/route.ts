import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const checks = {
    database: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_GRAPH_VERSION && process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_APP_SECRET),
  };
  const integrationsReady = Object.values(checks).every(Boolean);
  return NextResponse.json({ ok: true, mode: integrationsReady ? 'connected' : 'demo', integrationsReady, checks });
}

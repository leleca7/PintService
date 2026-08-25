import { NextResponse } from 'next/server';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { isAuthConfigured } from '@/lib/auth/server';

export const runtime = 'nodejs';
// Sempre avalia as variáveis atuais da Vercel, sem reutilizar resultado antigo.
export const dynamic = 'force-dynamic';

export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  let database = false;
  let databaseStatus: 'ready' | 'missing-DATABASE_URL' | 'connection-failed' = databaseConfigured
    ? 'connection-failed'
    : 'missing-DATABASE_URL';

  if (databaseConfigured) {
    try {
      const sql = getDb();
      const result = await sql`SELECT 1 AS ok`;
      database = Number(result[0]?.ok) === 1;
      if (database) databaseStatus = 'ready';
    } catch {
      database = false;
      databaseStatus = 'connection-failed';
    }
  }

  const checks = {
    database,
    auth: isAuthConfigured,
    vehicleSource: Boolean(process.env.VEHICLE_DATA_URL?.trim()),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_MODEL?.trim()),
    whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() && process.env.WHATSAPP_GRAPH_VERSION?.trim() && process.env.WHATSAPP_VERIFY_TOKEN?.trim() && process.env.WHATSAPP_APP_SECRET?.trim()),
    instagram: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim() && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim() && process.env.INSTAGRAM_VERIFY_TOKEN?.trim() && process.env.INSTAGRAM_APP_SECRET?.trim()),
    google: Boolean(process.env.GOOGLE_BUSINESS_ACCESS_TOKEN?.trim() && process.env.GOOGLE_BUSINESS_ACCOUNT_ID?.trim() && process.env.GOOGLE_BUSINESS_LOCATION_ID?.trim()),
    reclameAqui: Boolean(process.env.RECLAME_AQUI_API_KEY?.trim() && process.env.RECLAME_AQUI_COMPANY_ID?.trim()),
    shop: Boolean(process.env.OFICINA_HOURS?.trim() && process.env.OFICINA_ADDRESS?.trim()),
  };
  const coreReady = checks.database && checks.auth;
  const integrationsReady = checks.vehicleSource && checks.openai && checks.whatsapp;
  return NextResponse.json({
    ok: coreReady,
    mode: coreReady ? 'production-ready-core' : 'setup-required',
    coreReady,
    integrationsReady,
    databaseStatus,
    checks,
  });
}

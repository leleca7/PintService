import { NextResponse } from 'next/server';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { isAuthConfigured } from '@/lib/auth/server';
import { getOfficeProfile } from '@/lib/office-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let database = false;
  if (isDatabaseConfigured()) {
    try {
      const sql = getDb();
      const result = await sql`SELECT 1 AS ok`;
      database = Number(result[0]?.ok) === 1;
    } catch {
      database = false;
    }
  }

  const office = getOfficeProfile();
  const checks = {
    database,
    auth: isAuthConfigured,
    vehicleSource: Boolean(process.env.VEHICLE_DATA_URL?.trim()),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_MODEL?.trim()),
    whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() && process.env.WHATSAPP_GRAPH_VERSION?.trim() && process.env.WHATSAPP_VERIFY_TOKEN?.trim() && process.env.WHATSAPP_APP_SECRET?.trim()),
    instagram: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim() && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim() && process.env.INSTAGRAM_VERIFY_TOKEN?.trim() && process.env.INSTAGRAM_APP_SECRET?.trim()),
    google: Boolean(process.env.GOOGLE_BUSINESS_ACCESS_TOKEN?.trim() && process.env.GOOGLE_BUSINESS_ACCOUNT_ID?.trim() && process.env.GOOGLE_BUSINESS_LOCATION_ID?.trim()),
    reclameAqui: Boolean(process.env.RECLAME_AQUI_API_KEY?.trim() && process.env.RECLAME_AQUI_COMPANY_ID?.trim()),
    shop: Boolean(office.name && office.publicPhone && office.address && office.hours),
  };
  const coreReady = checks.database && checks.auth;
  const integrationsReady = checks.vehicleSource && checks.openai && checks.whatsapp;
  const pendingConnections = Object.entries(checks)
    .filter(([name, ready]) => !ready && !['database', 'auth', 'shop'].includes(name))
    .map(([name]) => name);

  return NextResponse.json({
    ok: coreReady,
    mode: coreReady ? 'production-ready-core' : 'setup-required',
    coreReady,
    integrationsReady,
    checks,
    pendingConnections,
    reputationLiveWrites: process.env.REPUTATION_LIVE_WRITES_ENABLED === 'true',
  });
}

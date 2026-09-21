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
  const whatsappTransport = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() &&
    process.env.WHATSAPP_GRAPH_VERSION?.trim() &&
    process.env.WHATSAPP_VERIFY_TOKEN?.trim() &&
    process.env.WHATSAPP_APP_SECRET?.trim()
  );

  const checks = {
    database,
    auth: isAuthConfigured,
    shop: Boolean(office.name && office.publicPhone && office.address && office.hours),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_MODEL?.trim()),
    whatsapp: whatsappTransport,
    whatsappBusinessAccount: Boolean(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim()),
    instagram: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim() && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim() && process.env.INSTAGRAM_VERIFY_TOKEN?.trim() && process.env.INSTAGRAM_APP_SECRET?.trim()),
    google: Boolean(process.env.GOOGLE_BUSINESS_ACCESS_TOKEN?.trim() && process.env.GOOGLE_BUSINESS_ACCOUNT_ID?.trim() && process.env.GOOGLE_BUSINESS_LOCATION_ID?.trim()),
    reclameAqui: Boolean(process.env.RECLAME_AQUI_API_KEY?.trim() && process.env.RECLAME_AQUI_COMPANY_ID?.trim()),
    blinko: Boolean(process.env.BLINKO_API_SECRET?.trim()),
    zeta: Boolean(process.env.ZETA_SYNC_URL?.trim()),
    inboxEmail: Boolean(process.env.INBOX_EMAIL_WEBHOOK_SECRET?.trim()),
    inboxSite: Boolean(process.env.INBOX_SITE_WEBHOOK_SECRET?.trim()),
    internalAlerts: Boolean(process.env.ALERT_WHATSAPP_TO?.trim() && whatsappTransport),
    operationUpdateTemplate: Boolean(process.env.WHATSAPP_OPERATION_UPDATE_TEMPLATE?.trim()),
    vehicleSource: Boolean(process.env.VEHICLE_DATA_URL?.trim()),
  };

  const coreReady = checks.database && checks.auth;
  // A fonte externa de veículos é contingência/importação; o banco nativo é a fonte oficial.
  const integrationsReady = checks.openai && checks.whatsapp;
  const pendingConnections = Object.entries(checks)
    .filter(([name, ready]) => !ready && !['database', 'auth', 'shop', 'vehicleSource'].includes(name))
    .map(([name]) => name);
  const optionalConnections = [
    ...(checks.vehicleSource ? [] : ['vehicleSource']),
  ];

  return NextResponse.json({
    ok: coreReady,
    mode: coreReady ? 'production-ready-core' : 'setup-required',
    coreReady,
    integrationsReady,
    operationalSource: checks.vehicleSource ? 'native-database+external-contingency' : 'native-database',
    checks,
    pendingConnections,
    optionalConnections,
    reputationLiveWrites: process.env.REPUTATION_LIVE_WRITES_ENABLED === 'true',
  });
}

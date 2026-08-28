import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { getOfficeProfile } from '@/lib/office-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function configured(...values: Array<string | undefined>) {
  return values.every((value) => Boolean(value?.trim()));
}

function authorized(request: Request) {
  const secret = process.env.BLINKO_API_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return false;
  const expected = Buffer.from(secret);
  const received = Buffer.from(token);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  if (!process.env.BLINKO_API_SECRET?.trim()) {
    return NextResponse.json(
      { error: 'Integração Blinko não configurada.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (!authorized(request)) {
    return NextResponse.json(
      { error: 'Não autorizado.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Banco de dados não configurado.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const sql = getDb();
    const [row] = await sql`
      SELECT
        (SELECT count(*)::int FROM veiculos) AS vehicles_tracked,
        (SELECT count(*)::int FROM tarefas_operacionais WHERE status IN ('aberta','em_execucao','aguardando_confirmacao')) AS pending_tasks,
        (SELECT count(*)::int FROM tarefas_operacionais WHERE status IN ('aberta','em_execucao','aguardando_confirmacao') AND prioridade IN ('alta','urgente')) AS critical_tasks,
        (SELECT count(*)::int FROM estado_atendimento WHERE bot_ativo = false) AS human_support_pending,
        (SELECT count(*)::int FROM pendencias WHERE status IN ('aberta','em_atendimento')) AS open_pending_items
    `;

    const office = getOfficeProfile();
    const integrations = {
      vehicleSource: configured(process.env.VEHICLE_DATA_URL),
      openai: configured(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL),
      whatsapp: configured(
        process.env.WHATSAPP_ACCESS_TOKEN,
        process.env.WHATSAPP_PHONE_NUMBER_ID,
        process.env.WHATSAPP_VERIFY_TOKEN,
        process.env.WHATSAPP_APP_SECRET,
      ),
      instagram: configured(
        process.env.INSTAGRAM_ACCESS_TOKEN,
        process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
        process.env.INSTAGRAM_VERIFY_TOKEN,
        process.env.INSTAGRAM_APP_SECRET,
      ),
      google: configured(
        process.env.GOOGLE_BUSINESS_ACCESS_TOKEN,
        process.env.GOOGLE_BUSINESS_ACCOUNT_ID,
        process.env.GOOGLE_BUSINESS_LOCATION_ID,
      ),
      reclameAqui: configured(process.env.RECLAME_AQUI_API_KEY, process.env.RECLAME_AQUI_COMPANY_ID),
    };

    const metrics = {
      vehiclesTracked: Number(row?.vehicles_tracked ?? 0),
      pendingTasks: Number(row?.pending_tasks ?? 0),
      criticalTasks: Number(row?.critical_tasks ?? 0),
      humanSupportPending: Number(row?.human_support_pending ?? 0),
      openPendingItems: Number(row?.open_pending_items ?? 0),
    };

    const needsAttention = metrics.criticalTasks > 0 || metrics.humanSupportPending > 0;

    return NextResponse.json(
      {
        system: 'PintService',
        company: office.name,
        status: needsAttention ? 'attention' : 'healthy',
        generatedAt: new Date().toISOString(),
        metrics,
        integrations,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('blinko_summary_error', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar o resumo operacional.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

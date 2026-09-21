import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function ensureSiteConfigTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS configuracao_site (
      id boolean PRIMARY KEY DEFAULT true,
      logo_base64 text,
      logo_mime text,
      atualizado_em timestamptz NOT NULL DEFAULT now()
    )
  `;
  return sql;
}

export async function GET(request: Request) {
  try {
    const sql = await ensureSiteConfigTable();
    const rows = await sql`
      SELECT logo_base64, logo_mime
      FROM configuracao_site
      WHERE id = true
      LIMIT 1
    `;

    const row = rows[0];
    const base64 = String(row?.logo_base64 ?? '').trim();
    const mime = String(row?.logo_mime ?? '').trim();

    if (base64 && mime) {
      const body = Buffer.from(base64, 'base64');
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'no-store, max-age=0',
          'Content-Length': String(body.length),
        },
      });
    }
  } catch {
    // O site continua funcionando com a logo local mesmo se o banco estiver indisponível.
  }

  return NextResponse.redirect(new URL('/pint-services-logo.jpg', request.url), 307);
}

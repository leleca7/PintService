import QRCode from 'qrcode';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const rows = await sql`SELECT id, placa, qr_token FROM veiculos WHERE id=${id} LIMIT 1`;
  const vehicle = rows[0];
  if (!vehicle) return NextResponse.json({ error: 'veículo não encontrado' }, { status: 404 });

  let token = String(vehicle.qr_token ?? '');
  if (!token) {
    const updated = await sql`
      UPDATE veiculos
      SET qr_token = replace(gen_random_uuid()::text,'-','')
      WHERE id=${id}
      RETURNING qr_token
    `;
    token = String(updated[0].qr_token);
  }

  const base = new URL(request.url);
  const url = `${base.protocol}//${base.host}/q/${token}`;
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    width: 480,
  });

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'private, no-store',
      'content-disposition': `inline; filename="pint-${String(vehicle.placa)}-qr.svg"`,
    },
  });
}

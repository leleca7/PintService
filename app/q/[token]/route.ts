import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();
  const rows = await sql`SELECT id FROM veiculos WHERE qr_token=${token} LIMIT 1`;
  if (!rows[0]) return NextResponse.redirect(new URL('/veiculos', request.url));
  return NextResponse.redirect(new URL(`/veiculos/${rows[0].id}`, request.url));
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveOperationalTask } from '@/lib/operational-tasks';

export const runtime = 'nodejs';

const BodySchema = z.object({ employeeId: z.string().uuid().nullable().optional(), employeeResponse: z.string().min(2).max(2000), evidenceUrl: z.string().url().nullable().optional(), evidenceMediaId: z.string().max(500).nullable().optional(), newVehicleStatus: z.string().max(200).nullable().optional(), newVehicleSector: z.string().max(120).nullable().optional(), customerReply: z.string().max(2000).nullable().optional() });
function authorized(request: Request) { const expected = process.env.STAFF_API_TOKEN; if (!expected) return false; const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''); const direct = request.headers.get('x-staff-token'); return bearer === expected || direct === expected; }

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!process.env.STAFF_API_TOKEN) return NextResponse.json({ error: 'STAFF_API_TOKEN não configurado.' }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return NextResponse.json({ error: 'Banco não conectado.' }, { status: 503 });
  try { const { id } = await context.params; const body = BodySchema.parse(await request.json()); const result = await resolveOperationalTask({ taskId: id, ...body }); return NextResponse.json({ ok: true, ...result }); }
  catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos.', details: error.flatten() }, { status: 400 }); console.error('Erro ao resolver tarefa operacional:', error); return NextResponse.json({ error: 'Não foi possível resolver a tarefa.' }, { status: 500 }); }
}

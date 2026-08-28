import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveOperationalTask } from '@/lib/operational-tasks';
import { requireAnyPermission, userHasPermission } from '@/lib/auth/current-user';
import { getDb, isDatabaseConfigured } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({ employeeId: z.string().uuid().nullable().optional(), employeeResponse: z.string().min(2).max(2000), evidenceUrl: z.string().url().nullable().optional(), evidenceMediaId: z.string().max(500).nullable().optional(), newVehicleStatus: z.string().max(200).nullable().optional(), newVehicleSector: z.string().max(120).nullable().optional(), customerReply: z.string().max(2000).nullable().optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Banco Neon não configurado.' }, { status: 503 });
  try {
    const user = await requireAnyPermission(['gerenciar_tarefas', 'ver_proprias_tarefas']);
    const { id } = await context.params;
    const body = BodySchema.parse(await request.json());
    const canManage = userHasPermission(user, 'gerenciar_tarefas');
    let employeeId = body.employeeId ?? null;
    let customerReply = body.customerReply ?? null;

    if (!canManage) {
      if (!user.funcionarioId) return NextResponse.json({ error: 'Usuário não vinculado a funcionário.' }, { status: 403 });
      const sql = getDb();
      const task = await sql`SELECT responsavel_id FROM tarefas_operacionais WHERE id = ${id} LIMIT 1`;
      if (!task[0] || String(task[0].responsavel_id ?? '') !== user.funcionarioId) return NextResponse.json({ error: 'Esta tarefa não está atribuída a você.' }, { status: 403 });
      employeeId = user.funcionarioId;
      // Funcionário confirma fatos; a mensagem ao cliente é composta pelo fluxo seguro do sistema.
      customerReply = null;
    }

    const result = await resolveOperationalTask({ taskId: id, ...body, employeeId, customerReply });
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos.', details: error.flatten() }, { status: 400 });
    const status = error?.status === 401 ? 401 : error?.status === 403 ? 403 : 500;
    if (status === 500) console.error('Erro ao resolver tarefa operacional:', error);
    return NextResponse.json({ error: status === 401 ? 'Não autenticado.' : status === 403 ? 'Sem permissão.' : 'Não foi possível resolver a tarefa.' }, { status });
  }
}

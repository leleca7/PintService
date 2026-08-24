import { NextResponse } from 'next/server';
import { generateReputationDraft } from '@/lib/reputation-ai';
import type { ReputationItem } from '@/lib/reputation';
import { requirePermission } from '@/lib/auth/current-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requirePermission('responder_reputacao');
    const body = await request.json();
    const item = body?.item as ReputationItem | undefined;
    if (!item?.id || !item?.message || !item?.channel) return NextResponse.json({ error: 'Item inválido.' }, { status: 400 });
    const result = await generateReputationDraft(item);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error?.status === 401 ? 401 : error?.status === 403 ? 403 : 500;
    return NextResponse.json({ error: status === 401 ? 'Não autenticado.' : status === 403 ? 'Sem permissão para responder reputação.' : error?.message || 'Falha ao gerar rascunho.' }, { status });
  }
}

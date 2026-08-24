import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import {
  replyGoogleReview,
  replyInstagramComment,
  replyInstagramDm,
  replyReclameAqui,
  type ReputationItem,
} from '@/lib/reputation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await requirePermission('responder_reputacao');
    const body = await request.json();
    const item = body?.item as ReputationItem | undefined;
    const text = String(body?.text ?? '').trim();
    if (!item?.id || !item.replyTarget || !text) return NextResponse.json({ error: 'Resposta incompleta.' }, { status: 400 });
    if (text.length > 3000) return NextResponse.json({ error: 'Resposta longa demais.' }, { status: 400 });

    if (item.source === 'demo' || item.id.startsWith('demo-')) return NextResponse.json({ ok: true, demo: true });
    if (process.env.REPUTATION_LIVE_WRITES_ENABLED !== 'true') {
      return NextResponse.json({ error: 'Respostas reais estão bloqueadas até a conexão do canal ser validada.', code: 'live_writes_locked' }, { status: 503 });
    }

    if (item.replyTarget.kind === 'google_review') await replyGoogleReview(item.replyTarget.reviewId, text);
    else if (item.replyTarget.kind === 'instagram_dm') await replyInstagramDm(item.replyTarget.recipientId, text);
    else if (item.replyTarget.kind === 'instagram_comment') await replyInstagramComment(item.replyTarget.commentId, text);
    else if (item.replyTarget.kind === 'reclame_aqui') await replyReclameAqui(item.replyTarget.complaintId, text);
    else return NextResponse.json({ error: 'Canal de resposta não suportado.' }, { status: 400 });

    await writeAudit(user, 'responder_reputacao', String(item.channel), String(item.id), { replyKind: item.replyTarget.kind, length: text.length });
    return NextResponse.json({ ok: true, demo: false });
  } catch (error: any) {
    const status = error?.status === 401 ? 401 : error?.status === 403 ? 403 : 500;
    return NextResponse.json({ error: status === 401 ? 'Não autenticado.' : status === 403 ? 'Sem permissão para responder reputação.' : error?.message || 'Falha ao enviar resposta.' }, { status });
  }
}

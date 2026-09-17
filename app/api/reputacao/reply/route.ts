import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import {
  getReputationData,
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
    const requestedItem = body?.item as Partial<ReputationItem> | undefined;
    const text = String(body?.text ?? '').trim();
    if (!requestedItem?.id || !requestedItem.channel || !text) return NextResponse.json({ error: 'Resposta incompleta.' }, { status: 400 });
    if (text.length > 3000) return NextResponse.json({ error: 'Resposta longa demais.' }, { status: 400 });

    if (requestedItem.id.startsWith('demo-')) return NextResponse.json({ ok: true, demo: true });
    if (process.env.REPUTATION_LIVE_WRITES_ENABLED !== 'true') {
      return NextResponse.json({ error: 'Respostas reais estão bloqueadas até a conexão do canal ser validada.', code: 'live_writes_locked' }, { status: 503 });
    }

    // O navegador só identifica o item. O alvo externo usado para escrever no canal
    // sempre é reobtido das integrações confiáveis no servidor.
    const reputation = await getReputationData({ demoFallback: false });
    const item = reputation.items.find((candidate) => candidate.id === requestedItem.id && candidate.channel === requestedItem.channel);
    if (!item) {
      if (reputation.errors.length) return NextResponse.json({ error: 'Não foi possível revalidar o item no canal de origem. Tente novamente.', code: 'canonical_lookup_unavailable' }, { status: 503 });
      return NextResponse.json({ error: 'Item de reputação não encontrado no canal de origem.', code: 'canonical_item_not_found' }, { status: 404 });
    }
    if (item.source !== 'live' || !item.canReply || !item.replyTarget) {
      return NextResponse.json({ error: 'Este item não possui um alvo de resposta válido no canal de origem.', code: 'canonical_reply_unavailable' }, { status: 409 });
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

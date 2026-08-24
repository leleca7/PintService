import { NextResponse } from 'next/server';
import {
  replyGoogleReview,
  replyInstagramComment,
  replyInstagramDm,
  replyReclameAqui,
  type ReputationItem,
} from '@/lib/reputation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = body?.item as ReputationItem | undefined;
    const text = String(body?.text ?? '').trim();
    if (!item?.id || !item.replyTarget || !text) return NextResponse.json({ error: 'Resposta incompleta.' }, { status: 400 });
    if (text.length > 3000) return NextResponse.json({ error: 'Resposta longa demais.' }, { status: 400 });

    if (item.source === 'demo' || item.id.startsWith('demo-')) return NextResponse.json({ ok: true, demo: true });

    if (item.replyTarget.kind === 'google_review') await replyGoogleReview(item.replyTarget.reviewId, text);
    else if (item.replyTarget.kind === 'instagram_dm') await replyInstagramDm(item.replyTarget.recipientId, text);
    else if (item.replyTarget.kind === 'instagram_comment') await replyInstagramComment(item.replyTarget.commentId, text);
    else if (item.replyTarget.kind === 'reclame_aqui') await replyReclameAqui(item.replyTarget.complaintId, text);
    else return NextResponse.json({ error: 'Canal de resposta não suportado.' }, { status: 400 });

    return NextResponse.json({ ok: true, demo: false });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Falha ao enviar resposta.' }, { status: 500 });
  }
}

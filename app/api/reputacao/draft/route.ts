import { NextResponse } from 'next/server';
import { generateReputationDraft } from '@/lib/reputation-ai';
import type { ReputationItem } from '@/lib/reputation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = body?.item as ReputationItem | undefined;
    if (!item?.id || !item?.message || !item?.channel) return NextResponse.json({ error: 'Item inválido.' }, { status: 400 });
    const result = await generateReputationDraft(item);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Falha ao gerar rascunho.' }, { status: 500 });
  }
}

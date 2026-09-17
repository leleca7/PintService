'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';
import { normalizeOperationalStage } from '@/lib/operation-stages';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export async function updatePhaseCapacity(formData: FormData) {
  const user = await requirePermission('gerenciar_capacidade');
  const requestedStage = text(formData, 'fase');
  const stage = normalizeOperationalStage(requestedStage);
  const rawCapacity = text(formData, 'capacidade_maxima');
  const capacity = Number(rawCapacity);

  if (!stage) throw new Error('Fase operacional inválida.');
  if (!Number.isInteger(capacity) || capacity < 0 || capacity > 99) {
    throw new Error('A capacidade deve ser um número inteiro entre 0 e 99.');
  }

  const sql = getDb();
  const currentRows = await sql`
    SELECT fase, capacidade_maxima
    FROM capacidade_fases
    WHERE fase = ${stage}
    LIMIT 1
  `;
  const current = currentRows[0];
  if (!current) throw new Error('Fase não cadastrada na capacidade.');

  await sql`
    UPDATE capacidade_fases
    SET capacidade_maxima = ${capacity}, atualizado_em = now()
    WHERE fase = ${stage}
  `;

  await writeAudit(user, 'alterar_capacidade', 'capacidade_fase', stage, {
    fase: stage,
    capacidade_anterior: Number(current.capacidade_maxima),
    capacidade_nova: capacity,
  });

  revalidatePath('/');
  revalidatePath('/operacao');
  revalidatePath('/operacao/capacidade');
}

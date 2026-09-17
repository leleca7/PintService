'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';
import { normalizeOperationalStage } from '@/lib/operation-stages';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function nullableDate(value: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Data inválida.');
  return value;
}

function snapshot(row: any) {
  return {
    setor: row?.setor ?? null,
    status: row?.status ?? null,
    previsao_saida: row?.previsao_saida ? String(row.previsao_saida).slice(0, 10) : null,
    responsavel_id: row?.responsavel_id ?? null,
    observacoes: row?.observacoes ?? null,
  };
}

export async function updateOperationalVehicle(formData: FormData) {
  const user = await requirePermission('atualizar_operacao_veiculos');
  const id = text(formData, 'id');
  const requestedStage = text(formData, 'setor');
  const status = text(formData, 'status');
  const previsaoSaida = nullableDate(text(formData, 'previsao_saida'));
  const observacoes = text(formData, 'observacoes');

  if (!id) throw new Error('Veículo inválido.');
  const setor = normalizeOperationalStage(requestedStage);
  if (!setor) throw new Error('Etapa operacional inválida.');

  const sql = getDb();
  const currentRows = await sql`
    SELECT id, placa, setor, status, previsao_saida, responsavel_id, observacoes
    FROM veiculos
    WHERE id = ${id}
    LIMIT 1
  `;
  const current = currentRows[0];
  if (!current) throw new Error('Veículo não encontrado.');

  if (user.perfil === 'funcionario') {
    const userSector = (user.setor ?? '').trim().toLowerCase();
    const vehicleSector = String(current.setor ?? '').trim().toLowerCase();
    if (!userSector || vehicleSector !== userSector) throw new Error('FORBIDDEN');
  }

  const responsavelId = user.funcionarioId ?? current.responsavel_id ?? null;
  const before = snapshot(current);

  const updatedRows = await sql`
    UPDATE veiculos
    SET setor = ${setor},
        status = ${status || null},
        previsao_saida = ${previsaoSaida},
        responsavel_id = ${responsavelId},
        observacoes = ${observacoes || null},
        ultima_atualizacao = now()
    WHERE id = ${id}
    RETURNING id, placa, setor, status, previsao_saida, responsavel_id, observacoes
  `;
  const updated = updatedRows[0];
  const after = snapshot(updated);

  await sql`
    INSERT INTO historico_veiculos (veiculo_id, usuario_app_id, evento, dados_anteriores, dados_novos)
    VALUES (${id}, ${user.id}, 'atualizacao_operacional', ${JSON.stringify(before)}::jsonb, ${JSON.stringify(after)}::jsonb)
  `;

  await writeAudit(user, 'atualizar_operacao', 'veiculo', id, {
    placa: updated.placa,
    antes: before,
    depois: after,
  });

  revalidatePath('/');
  revalidatePath('/operacao');
  revalidatePath('/veiculos');
  revalidatePath(`/veiculos/${id}`);
}

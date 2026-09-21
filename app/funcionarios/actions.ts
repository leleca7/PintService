'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

function text(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }
function phone(formData: FormData) { return text(formData, 'telefone').replace(/\D/g, ''); }

const MAX_AVATAR_BYTES = 700 * 1024;
const AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function avatarDataUrl(formData: FormData) {
  const value = formData.get('foto');
  if (!(value instanceof File) || value.size === 0) return null;
  if (!AVATAR_TYPES.has(value.type)) throw new Error('A foto deve ser JPG, PNG ou WEBP.');
  if (value.size > MAX_AVATAR_BYTES) throw new Error('A foto do funcionário deve ter no máximo 700 KB.');
  const bytes = Buffer.from(await value.arrayBuffer());
  return `data:${value.type};base64,${bytes.toString('base64')}`;
}

export async function createEmployee(formData: FormData) {
  const user = await requirePermission('gerenciar_funcionarios');
  const nome = text(formData, 'nome');
  const setor = text(formData, 'setor');
  const cargo = text(formData, 'cargo');
  const telefone = phone(formData);
  const foto = await avatarDataUrl(formData);
  if (!nome || !setor) throw new Error('Nome e setor são obrigatórios.');
  const sql = getDb();
  const rows = await sql`INSERT INTO funcionarios (nome,setor,cargo,telefone,foto_data_url) VALUES (${nome},${setor},${cargo || null},${telefone || null},${foto}) RETURNING id`;
  await writeAudit(user, 'criar', 'funcionario', String(rows[0]?.id ?? ''), { nome, setor, cargo, foto: Boolean(foto) });
  revalidatePath('/funcionarios');
  revalidatePath('/acessos');
}

export async function updateEmployee(formData: FormData) {
  const user = await requirePermission('gerenciar_funcionarios');
  const id = text(formData, 'id');
  const nome = text(formData, 'nome');
  const setor = text(formData, 'setor');
  const cargo = text(formData, 'cargo');
  const telefone = phone(formData);
  const foto = await avatarDataUrl(formData);
  const removerFoto = text(formData, 'remover_foto') === 'true';
  if (!id || !nome || !setor) throw new Error('Funcionário, nome e setor são obrigatórios.');
  const sql = getDb();
  if (removerFoto) {
    await sql`UPDATE funcionarios SET nome=${nome},setor=${setor},cargo=${cargo || null},telefone=${telefone || null},foto_data_url=null,atualizado_em=now() WHERE id=${id}`;
  } else if (foto) {
    await sql`UPDATE funcionarios SET nome=${nome},setor=${setor},cargo=${cargo || null},telefone=${telefone || null},foto_data_url=${foto},atualizado_em=now() WHERE id=${id}`;
  } else {
    await sql`UPDATE funcionarios SET nome=${nome},setor=${setor},cargo=${cargo || null},telefone=${telefone || null},atualizado_em=now() WHERE id=${id}`;
  }
  await sql`UPDATE usuarios_app SET nome=${nome},setor=${setor},atualizado_em=now() WHERE funcionario_id=${id}`;
  await writeAudit(user, 'editar', 'funcionario', id, { nome, setor, cargo, fotoAtualizada: Boolean(foto), fotoRemovida: removerFoto });
  revalidatePath('/funcionarios');
  revalidatePath('/acessos');
}

export async function toggleEmployee(formData: FormData) {
  const user = await requirePermission('gerenciar_funcionarios');
  const id = text(formData, 'id');
  const ativo = text(formData, 'ativo') === 'true';
  if (!id) throw new Error('Funcionário inválido.');
  const sql = getDb();
  await sql`UPDATE funcionarios SET ativo=${ativo},atualizado_em=now() WHERE id=${id}`;
  if (!ativo) await sql`UPDATE usuarios_app SET ativo=false,atualizado_em=now() WHERE funcionario_id=${id}`;
  await writeAudit(user, ativo ? 'ativar' : 'desativar', 'funcionario', id);
  revalidatePath('/funcionarios');
  revalidatePath('/acessos');
}

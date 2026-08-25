'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

function text(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }
function phone(formData: FormData) { return text(formData, 'telefone').replace(/\D/g, ''); }

export async function createEmployee(formData: FormData) {
  const user = await requirePermission('gerenciar_funcionarios');
  const nome = text(formData, 'nome');
  const setor = text(formData, 'setor');
  const cargo = text(formData, 'cargo');
  const telefone = phone(formData);
  if (!nome || !setor) throw new Error('Nome e setor são obrigatórios.');
  const sql = getDb();
  const rows = await sql`INSERT INTO funcionarios (nome,setor,cargo,telefone) VALUES (${nome},${setor},${cargo || null},${telefone || null}) RETURNING id`;
  await writeAudit(user, 'criar', 'funcionario', String(rows[0]?.id ?? ''), { nome, setor, cargo });
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
  if (!id || !nome || !setor) throw new Error('Funcionário, nome e setor são obrigatórios.');
  const sql = getDb();
  await sql`UPDATE funcionarios SET nome=${nome},setor=${setor},cargo=${cargo || null},telefone=${telefone || null},atualizado_em=now() WHERE id=${id}`;
  await sql`UPDATE usuarios_app SET nome=${nome},setor=${setor},atualizado_em=now() WHERE funcionario_id=${id}`;
  await writeAudit(user, 'editar', 'funcionario', id, { nome, setor, cargo });
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

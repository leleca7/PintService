'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import type { UserRole } from '@/lib/permissions';

const ROLES = new Set<UserRole>(['admin', 'gerente', 'funcionario']);
function text(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }

export async function saveAppUser(formData: FormData) {
  const actor = await getCurrentAppUser();
  if (!actor?.ativo || actor.perfil !== 'admin') throw new Error('Somente administrador pode alterar perfis de acesso.');

  const authUserId = text(formData, 'auth_user_id');
  const perfil = text(formData, 'perfil') as UserRole;
  const funcionarioId = text(formData, 'funcionario_id') || null;
  const setorManual = text(formData, 'setor');
  const ativo = text(formData, 'ativo') === 'true';
  if (!authUserId || !ROLES.has(perfil)) throw new Error('Usuário ou perfil inválido.');
  if (authUserId === actor.authUserId && (!ativo || perfil !== 'admin')) throw new Error('O administrador atual não pode remover o próprio acesso administrativo.');

  const sql = getDb();
  const authRows = await sql`SELECT id,name,email FROM neon_auth."user" WHERE id::text = ${authUserId} LIMIT 1`;
  const authUser = authRows[0];
  if (!authUser) throw new Error('Login não encontrado no Neon Auth.');

  let funcionario: any = null;
  if (funcionarioId) {
    const employeeRows = await sql`SELECT id,nome,setor,ativo FROM funcionarios WHERE id = ${funcionarioId} LIMIT 1`;
    funcionario = employeeRows[0] ?? null;
    if (!funcionario) throw new Error('Funcionário não encontrado.');
    if (!funcionario.ativo) throw new Error('Não é possível vincular um funcionário inativo.');
    const otherLink = await sql`SELECT id FROM usuarios_app WHERE funcionario_id = ${funcionarioId} AND auth_user_id <> ${authUserId} LIMIT 1`;
    if (otherLink[0]) throw new Error('Esse funcionário já está vinculado a outro login.');
  }

  const nome = String(funcionario?.nome ?? authUser.name ?? authUser.email);
  const setor = funcionario?.setor ? String(funcionario.setor) : (setorManual || null);
  if (perfil === 'funcionario' && !funcionarioId) throw new Error('Perfil Funcionário precisa ser vinculado a um funcionário cadastrado.');
  if (perfil === 'funcionario' && !setor) throw new Error('Perfil Funcionário precisa ter setor.');

  const rows = await sql`
    INSERT INTO usuarios_app (auth_user_id,funcionario_id,nome,email,perfil,setor,ativo)
    VALUES (${authUserId},${funcionarioId},${nome},${String(authUser.email)},${perfil},${setor},${ativo})
    ON CONFLICT (auth_user_id) DO UPDATE SET funcionario_id=EXCLUDED.funcionario_id,nome=EXCLUDED.nome,email=EXCLUDED.email,perfil=EXCLUDED.perfil,setor=EXCLUDED.setor,ativo=EXCLUDED.ativo,atualizado_em=now()
    RETURNING id
  `;
  await writeAudit(actor, 'configurar_acesso', 'usuario_app', String(rows[0]?.id ?? ''), { authUserId, perfil, funcionarioId, setor, ativo });
  revalidatePath('/acessos');
}

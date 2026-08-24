import 'server-only';
import { auth } from '@/lib/auth/server';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { hasPermission, type Permission, type UserRole } from '@/lib/permissions';

export type CurrentAppUser = {
  id: string;
  authUserId: string;
  funcionarioId: string | null;
  nome: string;
  email: string;
  perfil: UserRole;
  setor: string | null;
  ativo: boolean;
};

function mapUser(row: any): CurrentAppUser {
  return {
    id: String(row.id),
    authUserId: String(row.auth_user_id),
    funcionarioId: row.funcionario_id ? String(row.funcionario_id) : null,
    nome: String(row.nome ?? ''),
    email: String(row.email ?? ''),
    perfil: row.perfil as UserRole,
    setor: row.setor ? String(row.setor) : null,
    ativo: Boolean(row.ativo),
  };
}

export async function getAuthSessionUser() {
  const sessionResult: any = await auth.getSession();
  return sessionResult?.user ?? sessionResult?.data?.user ?? null;
}

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  if (!isDatabaseConfigured()) return null;

  const authUser = await getAuthSessionUser();
  if (!authUser?.id || !authUser?.email) return null;

  const sql = getDb();
  const existing = await sql`
    SELECT id, auth_user_id, funcionario_id, nome, email, perfil, setor, ativo
    FROM usuarios_app
    WHERE auth_user_id = ${String(authUser.id)}
    LIMIT 1
  `;
  if (existing[0]) return mapUser(existing[0]);

  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (!bootstrapEmail || bootstrapEmail !== String(authUser.email).trim().toLowerCase()) return null;

  const inserted = await sql`
    INSERT INTO usuarios_app (auth_user_id, nome, email, perfil, ativo)
    VALUES (${String(authUser.id)}, ${String(authUser.name ?? authUser.email)}, ${String(authUser.email)}, 'admin', true)
    ON CONFLICT (auth_user_id) DO UPDATE SET atualizado_em = now()
    RETURNING id, auth_user_id, funcionario_id, nome, email, perfil, setor, ativo
  `;
  return inserted[0] ? mapUser(inserted[0]) : null;
}

export function userHasPermission(user: CurrentAppUser | null, permission: Permission) {
  return Boolean(user?.ativo && hasPermission(user.perfil, permission));
}

export async function requirePermission(permission: Permission) {
  const user = await getCurrentAppUser();
  if (!userHasPermission(user, permission)) {
    const error = new Error('FORBIDDEN');
    (error as Error & { status?: number }).status = user ? 403 : 401;
    throw error;
  }
  return user!;
}

export async function requireAnyPermission(permissions: Permission[]) {
  const user = await getCurrentAppUser();
  if (!user?.ativo || !permissions.some((permission) => userHasPermission(user, permission))) {
    const error = new Error('FORBIDDEN');
    (error as Error & { status?: number }).status = user ? 403 : 401;
    throw error;
  }
  return user;
}

import 'server-only';
import { getDb } from '@/lib/db';
import type { CurrentAppUser } from '@/lib/auth/current-user';

export async function writeAudit(
  user: CurrentAppUser,
  acao: string,
  entidade: string,
  entidadeId?: string | null,
  dados: Record<string, unknown> = {},
) {
  const sql = getDb();
  const payload = JSON.stringify(dados);
  await sql`
    INSERT INTO auditoria (usuario_app_id, acao, entidade, entidade_id, dados)
    VALUES (${user.id}, ${acao}, ${entidade}, ${entidadeId ?? null}, ${payload}::jsonb)
  `;
}

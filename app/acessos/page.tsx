import { redirect } from 'next/navigation';
import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db';
import { saveAppUser } from './actions';
import {
  PERMISSION_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type Permission,
  type UserRole,
} from '@/lib/permissions';

const roles: UserRole[] = ['admin', 'gerente', 'funcionario'];
const permissions = Object.keys(PERMISSION_LABELS) as Permission[];

function RoleIcon({ role }: { role: UserRole }) {
  const common = { width: 21, height: 21, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (role === 'admin') return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.8 8-7 10-4.2-2-7-5.2-7-10V6l7-3Z"/><path d="m9.5 12 1.7 1.7 3.5-3.7"/></svg>;
  if (role === 'gerente') return <svg {...common}><circle cx="12" cy="8" r="3"/><path d="M6.5 19c.6-3.4 2.4-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><path d="M18.5 5.5v5M16 8h5"/></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="3"/><path d="M6.5 19c.6-3.4 2.4-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/></svg>;
}

export default async function AccessPage() {
  const [data, currentUser] = await Promise.all([getDashboardData(), getCurrentAppUser()]);
  if (!currentUser?.ativo || currentUser.perfil !== 'admin') redirect('/sem-acesso');
  const sql = getDb();
  const [authUsers, employees] = await Promise.all([
    sql`SELECT u.id::text AS auth_user_id,u.name AS auth_name,u.email,u."emailVerified" AS email_verified,ua.id AS app_user_id,ua.funcionario_id,ua.nome AS app_name,ua.perfil,ua.setor,ua.ativo FROM neon_auth."user" u LEFT JOIN usuarios_app ua ON ua.auth_user_id=u.id::text ORDER BY u.email ASC`,
    sql`SELECT id,nome,setor,cargo,ativo FROM funcionarios ORDER BY nome ASC`,
  ]);

  return (
    <AppShell active="acessos" source={data.source}>
      <header className="topbar"><div><p className="eyebrow">SEGURANÇA</p><h1>Perfis e acessos</h1><p>Cada pessoa vê e altera somente o necessário para fazer o próprio trabalho.</p></div></header>

      <section className="role-grid">
        {roles.map((role) => <article className="panel role-card" key={role}><div className="role-card-head"><div className={`role-icon role-icon-${role}`}><RoleIcon role={role}/></div><div><p className="eyebrow">PERFIL</p><h2>{ROLE_LABELS[role]}</h2></div></div><p>{ROLE_DESCRIPTIONS[role]}</p><strong>{ROLE_PERMISSIONS[role].length} permissões ativas</strong></article>)}
      </section>

      <section className="panel page-panel">
        <div className="panel-head"><div><p className="eyebrow">USUÁRIOS</p><h2>Logins e vínculos da equipe</h2></div><span className="source-chip">RBAC ativo</span></div>
        <p className="section-intro">A pessoa cria o login na tela de acesso. Depois o administrador escolhe o perfil e, para funcionários, vincula o cadastro interno correspondente.</p>
        <div className="access-user-list">
          {authUsers.map((authUser: any) => {
            const currentRole = roles.includes(authUser.perfil as UserRole) ? authUser.perfil as UserRole : 'funcionario';
            const isLinked = Boolean(authUser.app_user_id);
            return (
              <form action={saveAppUser} className="access-user-card" key={String(authUser.auth_user_id)}>
                <input type="hidden" name="auth_user_id" value={String(authUser.auth_user_id)}/>
                <div className="access-user-identity"><strong>{String(authUser.app_name || authUser.auth_name || authUser.email)}</strong><span>{String(authUser.email)}</span><small>{isLinked ? 'Login vinculado' : 'Aguardando configuração do administrador'}</small></div>
                <label>Perfil<select name="perfil" defaultValue={currentRole}>{roles.map((role) => <option value={role} key={role}>{ROLE_LABELS[role]}</option>)}</select></label>
                <label>Funcionário<select name="funcionario_id" defaultValue={authUser.funcionario_id ? String(authUser.funcionario_id) : ''}><option value="">Sem vínculo</option>{employees.map((employee: any) => <option value={String(employee.id)} key={String(employee.id)} disabled={!employee.ativo}>{String(employee.nome)} · {String(employee.setor)}{employee.ativo ? '' : ' (inativo)'}</option>)}</select></label>
                <label>Setor<input name="setor" defaultValue={String(authUser.setor ?? '')} placeholder="Ex.: Pintura"/></label>
                <label>Status<select name="ativo" defaultValue={isLinked ? String(Boolean(authUser.ativo)) : 'true'}><option value="true">Ativo</option><option value="false">Inativo</option></select></label>
                <button className="ghost action-link" type="submit">Salvar acesso</button>
              </form>
            );
          })}
          {!authUsers.length && <div className="empty-state">Nenhum login criado ainda. O primeiro administrador deve entrar pela tela de login usando o e-mail de bootstrap configurado.</div>}
        </div>
      </section>

      <section className="panel page-panel">
        <div className="panel-head"><div><p className="eyebrow">MATRIZ DE ACESSO</p><h2>Quem pode ver ou alterar cada área</h2></div><span className="source-chip">regra central</span></div>
        <div className="permission-table-wrap"><table className="permission-table"><thead><tr><th>Permissão</th>{roles.map((role) => <th key={role}>{ROLE_LABELS[role]}</th>)}</tr></thead><tbody>{permissions.map((permission) => <tr key={permission}><td>{PERMISSION_LABELS[permission]}</td>{roles.map((role) => <td key={role}><span className={ROLE_PERMISSIONS[role].includes(permission) ? 'permission-yes' : 'permission-no'}>{ROLE_PERMISSIONS[role].includes(permission) ? '✓' : '—'}</span></td>)}</tr>)}</tbody></table></div>
      </section>

      <section className="system-banner info-banner"><strong>Proteção aplicada</strong><span>Menu, páginas e APIs sensíveis usam a sessão autenticada e as permissões do perfil. Funcionários ficam limitados ao próprio setor e às próprias tarefas.</span></section>
    </AppShell>
  );
}

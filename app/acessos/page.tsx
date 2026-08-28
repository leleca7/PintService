import { redirect } from 'next/navigation';
import AppShell from '@/app/components/app-shell';
import core from '@/app/components/precision-atelier-core.module.css';
import admin from '@/app/components/precision-atelier-admin.module.css';
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
  const linked = authUsers.filter((user: any) => Boolean(user.app_user_id)).length;
  const pending = authUsers.length - linked;

  return (
    <AppShell active="acessos" source={data.source}>
      <div className={core.page}>
        <header className={core.header}>
          <div className={core.headerCopy}><p className={core.kicker}>SEGURANÇA · GOVERNANÇA DE ACESSO</p><h1 className={core.title}>Perfis e acessos</h1><p className={core.subtitle}>Poucas pessoas usam o PintService. Cada login deve ter apenas o alcance necessário para administrar atendimento, logística e operação com segurança.</p></div>
        </header>

        <section className={core.darkBand}>
          <div className={core.darkCopy}><p className={core.darkLabel}>CONTROLE DE ACESSO</p><h2 className={core.darkTitle}>{pending ? `${pending} ${pending === 1 ? 'login ainda precisa' : 'logins ainda precisam'} de configuração administrativa.` : 'Todos os logins carregados estão vinculados.'}</h2><p className={core.darkText}>Criar uma conta não concede acesso operacional automaticamente. O administrador define perfil, vínculo e status antes de liberar o sistema.</p></div>
          <div className={core.darkStats}><div className={core.darkStat}><strong>{linked}</strong><span>vinculados</span></div><div className={core.darkStat}><strong>{pending}</strong><span>aguardando configuração</span></div></div>
        </section>

        <section className={admin.roleGrid}>
          {roles.map((role) => <article className={admin.roleCard} key={role}><div className={admin.roleTop}><div className={admin.roleIcon}><RoleIcon role={role}/></div><div><p className={core.kicker}>PERFIL</p><h2>{ROLE_LABELS[role]}</h2></div></div><p>{ROLE_DESCRIPTIONS[role]}</p><strong>{ROLE_PERMISSIONS[role].length} permissões ativas</strong></article>)}
        </section>

        <section className={core.section}>
          <div className={core.sectionHead}><div><p>USUÁRIOS</p><h2>Logins e vínculos da equipe</h2></div><span className={core.count}>{authUsers.length}</span></div>
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

        <section className={core.section}>
          <div className={core.sectionHead}><div><p>MATRIZ DE ACESSO</p><h2>Quem pode ver ou alterar cada área</h2></div><span className={core.count}>RBAC</span></div>
          <div className="permission-table-wrap"><table className="permission-table"><thead><tr><th>Permissão</th>{roles.map((role) => <th key={role}>{ROLE_LABELS[role]}</th>)}</tr></thead><tbody>{permissions.map((permission) => <tr key={permission}><td>{PERMISSION_LABELS[permission]}</td>{roles.map((role) => <td key={role}><span className={ROLE_PERMISSIONS[role].includes(permission) ? 'permission-yes' : 'permission-no'}>{ROLE_PERMISSIONS[role].includes(permission) ? '✓' : '—'}</span></td>)}</tr>)}</tbody></table></div>
        </section>

        <section className="system-banner info-banner"><strong>Proteção aplicada</strong><span>Menu, páginas e APIs sensíveis usam a sessão autenticada e as permissões do perfil. A estrutura de setores permanece disponível para expansão futura, mesmo que a V1 seja usada por um núcleo administrativo pequeno.</span></section>
      </div>
    </AppShell>
  );
}

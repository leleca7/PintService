import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';
import { PERMISSION_LABELS, ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_PERMISSIONS, type Permission, type UserRole } from '@/lib/permissions';

const roles: UserRole[] = ['admin', 'gerente', 'funcionario'];
const permissions = Object.keys(PERMISSION_LABELS) as Permission[];

export default async function AccessPage() {
  const data = await getDashboardData();
  return (
    <AppShell active="acessos" source={data.source}>
      <header className="topbar"><div><p className="eyebrow">SEGURANÇA</p><h1>Perfis e acessos</h1><p>Cada pessoa vê somente o necessário para fazer o próprio trabalho.</p></div></header>
      <section className="role-grid">
        {roles.map((role) => <article className="panel role-card" key={role}><div className="role-card-head"><div className="role-icon">{role === 'admin' ? '★' : role === 'gerente' ? '◆' : '●'}</div><div><p className="eyebrow">PERFIL</p><h2>{ROLE_LABELS[role]}</h2></div></div><p>{ROLE_DESCRIPTIONS[role]}</p><strong>{ROLE_PERMISSIONS[role].length} permissões</strong></article>)}
      </section>
      <section className="panel page-panel">
        <div className="panel-head"><div><p className="eyebrow">MATRIZ DE ACESSO</p><h2>Quem pode ver ou alterar cada área</h2></div><span className="source-chip live">RBAC ativo</span></div>
        <div className="permission-table-wrap"><table className="permission-table"><thead><tr><th>Permissão</th>{roles.map((role) => <th key={role}>{ROLE_LABELS[role]}</th>)}</tr></thead><tbody>{permissions.map((permission) => <tr key={permission}><td>{PERMISSION_LABELS[permission]}</td>{roles.map((role) => <td key={role}><span className={ROLE_PERMISSIONS[role].includes(permission) ? 'permission-yes' : 'permission-no'}>{ROLE_PERMISSIONS[role].includes(permission) ? '✓' : '—'}</span></td>)}</tr>)}</tbody></table></div>
      </section>
      <section className="system-banner info-banner"><strong>Login e perfis ligados ao banco</strong><span>A sessão autenticada é vinculada ao perfil, setor e funcionário no Neon. O menu e os dados são filtrados por essas regras, e o acesso direto a páginas fora do perfil é bloqueado.</span></section>
    </AppShell>
  );
}

import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';
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
  const common = {
    width: 21,
    height: 21,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (role === 'admin') return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.8 8-7 10-4.2-2-7-5.2-7-10V6l7-3Z"/><path d="m9.5 12 1.7 1.7 3.5-3.7"/></svg>;
  if (role === 'gerente') return <svg {...common}><circle cx="12" cy="8" r="3"/><path d="M6.5 19c.6-3.4 2.4-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><path d="M18.5 5.5v5M16 8h5"/></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="3"/><path d="M6.5 19c.6-3.4 2.4-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/></svg>;
}

export default async function AccessPage() {
  const data = await getDashboardData();

  return (
    <AppShell active="acessos" source={data.source}>
      <header className="topbar">
        <div>
          <p className="eyebrow">SEGURANÇA</p>
          <h1>Perfis e acessos</h1>
          <p>Cada pessoa vê somente o necessário para fazer o próprio trabalho.</p>
        </div>
      </header>

      <section className="role-grid">
        {roles.map((role) => (
          <article className="panel role-card" key={role}>
            <div className="role-card-head">
              <div className={`role-icon role-icon-${role}`}><RoleIcon role={role} /></div>
              <div>
                <p className="eyebrow">PERFIL</p>
                <h2>{ROLE_LABELS[role]}</h2>
              </div>
            </div>
            <p>{ROLE_DESCRIPTIONS[role]}</p>
            <strong>{ROLE_PERMISSIONS[role].length} permissões previstas</strong>
          </article>
        ))}
      </section>

      <section className="panel page-panel">
        <div className="panel-head">
          <div><p className="eyebrow">MATRIZ DE ACESSO</p><h2>Quem pode ver ou alterar cada área</h2></div>
          <span className="source-chip">base pronta</span>
        </div>
        <div className="permission-table-wrap">
          <table className="permission-table">
            <thead>
              <tr>
                <th>Permissão</th>
                {roles.map((role) => <th key={role}>{ROLE_LABELS[role]}</th>)}
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission}>
                  <td>{PERMISSION_LABELS[permission]}</td>
                  {roles.map((role) => (
                    <td key={role}>
                      <span className={ROLE_PERMISSIONS[role].includes(permission) ? 'permission-yes' : 'permission-no'}>
                        {ROLE_PERMISSIONS[role].includes(permission) ? '✓' : '—'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="system-banner info-banner">
        <strong>O que falta para isso bloquear telas de verdade</strong>
        <span>Conectar um sistema de login e um banco para associar cada usuário ao perfil e, no caso de funcionários, ao setor e às tarefas dele. A matriz acima já fica como regra central do código.</span>
      </section>
    </AppShell>
  );
}

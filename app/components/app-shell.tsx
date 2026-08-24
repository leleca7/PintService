import Link from 'next/link';
import type { DataSource } from '@/lib/dashboard-data';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { ROLE_LABELS, type Permission } from '@/lib/permissions';

type ActiveKey = 'visao' | 'atendimento' | 'veiculos' | 'tarefas' | 'funcionarios' | 'acessos' | 'configuracoes';
type Props = { active: ActiveKey; source: DataSource; children: React.ReactNode };

type NavItem = { key: ActiveKey; href: string; icon: string; label: string; permission?: Permission; anyPermission?: Permission[]; adminOnly?: boolean };

const items: NavItem[] = [
  { key: 'visao', href: '/', icon: '⌂', label: 'Visão geral', permission: 'ver_visao_geral' },
  { key: 'atendimento', href: '/atendimento', icon: '◉', label: 'Atendimento', permission: 'ver_atendimento' },
  { key: 'veiculos', href: '/veiculos', icon: '◇', label: 'Veículos', anyPermission: ['ver_todos_veiculos', 'ver_veiculos_setor'] },
  { key: 'tarefas', href: '/tarefas', icon: '!', label: 'Tarefas', anyPermission: ['ver_todas_tarefas', 'ver_proprias_tarefas'] },
  { key: 'funcionarios', href: '/funcionarios', icon: '♙', label: 'Funcionários', permission: 'ver_funcionarios' },
  { key: 'acessos', href: '/acessos', icon: '🔐', label: 'Perfis e acessos', adminOnly: true },
  { key: 'configuracoes', href: '/configuracoes', icon: '⚙', label: 'Configurações', permission: 'ver_configuracoes' },
];

function sourceLabel(source: DataSource) {
  if (source === 'live') return { text: 'Dados ao vivo', detail: 'Neon conectado', className: 'live-source' };
  if (source === 'error') return { text: 'Conexão com erro', detail: 'Verifique acesso/banco', className: 'error-source' };
  return { text: 'Modo demonstração', detail: 'Banco ainda não configurado no deploy', className: 'demo-source' };
}

function allowed(item: NavItem, user: Awaited<ReturnType<typeof getCurrentAppUser>>) {
  if (!user) return false;
  if (item.adminOnly) return user.perfil === 'admin';
  if (item.permission) return userHasPermission(user, item.permission);
  if (item.anyPermission) return item.anyPermission.some((permission) => userHasPermission(user, permission));
  return false;
}

export default async function AppShell({ active, source, children }: Props) {
  const sourceInfo = sourceLabel(source);
  const user = await getCurrentAppUser();
  const visibleItems = user ? items.filter((item) => allowed(item, user)) : items;
  const initials = user?.nome ? user.nome.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : 'PS';

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand"><div className="brand-mark">PS</div><div><strong>PintService</strong><span>Funilaria & Pintura</span></div></Link>
        <nav className="nav" aria-label="Navegação principal">
          {visibleItems.map((item) => <Link key={item.key} className={active === item.key ? 'active' : ''} href={item.href}>{item.icon} <span>{item.label}</span></Link>)}
          {user?.perfil === 'admin' && <Link href="/simulador">⌁ <span>Simulador</span></Link>}
        </nav>
        <div className="sidebar-bottom">
          <div className={`ia-status ${sourceInfo.className}`}><span className="pulse" /> {sourceInfo.text}<small>{sourceInfo.detail}</small></div>
          <Link className="profile" href="/auth/sign-out"><div className="avatar">{initials}</div><div><strong>{user?.nome || 'PintService'}</strong><span>{user ? ROLE_LABELS[user.perfil] : 'Acesso ainda não vinculado'}</span></div></Link>
        </div>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}

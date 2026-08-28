import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { DataSource } from '@/lib/dashboard-data';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { isDatabaseConfigured } from '@/lib/db';
import { ROLE_LABELS, type Permission } from '@/lib/permissions';
import styles from './app-shell.module.css';

type ActiveKey = 'visao' | 'atendimento' | 'reputacao' | 'veiculos' | 'tarefas' | 'funcionarios' | 'acessos' | 'configuracoes';
type Props = { active: ActiveKey; source: DataSource; children: React.ReactNode };
type IconName = 'home' | 'chat' | 'reputation' | 'car' | 'tasks' | 'team' | 'access' | 'settings';
type NavItem = { key: ActiveKey; href: string; label: string; icon: IconName; permission?: Permission; anyPermission?: Permission[]; adminOnly?: boolean };

const items: NavItem[] = [
  { key: 'visao', href: '/', label: 'Visão geral', icon: 'home', permission: 'ver_visao_geral' },
  { key: 'atendimento', href: '/atendimento', label: 'Atendimento', icon: 'chat', permission: 'ver_atendimento' },
  { key: 'reputacao', href: '/reputacao', label: 'Reputação', icon: 'reputation', permission: 'ver_reputacao' },
  { key: 'veiculos', href: '/veiculos', label: 'Veículos', icon: 'car', anyPermission: ['ver_todos_veiculos', 'ver_veiculos_setor'] },
  { key: 'tarefas', href: '/tarefas', label: 'Tarefas', icon: 'tasks', anyPermission: ['ver_todas_tarefas', 'ver_proprias_tarefas'] },
  { key: 'funcionarios', href: '/funcionarios', label: 'Funcionários', icon: 'team', permission: 'ver_funcionarios' },
  { key: 'acessos', href: '/acessos', label: 'Perfis e acessos', icon: 'access', adminOnly: true },
  { key: 'configuracoes', href: '/configuracoes', label: 'Configurações', icon: 'settings', permission: 'ver_configuracoes' },
];

const mobilePrimaryKeys = new Set<ActiveKey>(['visao', 'atendimento', 'veiculos', 'tarefas']);

function NavIcon({ name }: { name: IconName }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, className: 'nav-svg' };
  if (name === 'home') return <svg {...common}><path d="M3.5 10.5 12 3.8l8.5 6.7"/><path d="M5.5 9.7V20h13V9.7"/><path d="M9.5 20v-6h5v6"/></svg>;
  if (name === 'chat') return <svg {...common}><path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="M8 10h8"/><path d="M8 13h5"/></svg>;
  if (name === 'reputation') return <svg {...common}><path d="m12 3 2.7 5.4 6 .9-4.3 4.2 1 5.9-5.4-2.8-5.4 2.8 1-5.9-4.3-4.2 6-.9L12 3Z"/><path d="m9.5 12 1.6 1.6 3.5-3.6"/></svg>;
  if (name === 'car') return <svg {...common}><path d="m5 15 1.5-5h11L19 15"/><path d="M4 15h16v4H4z"/><path d="M7 19v1.5M17 19v1.5"/><circle cx="7.5" cy="16.8" r=".7"/><circle cx="16.5" cy="16.8" r=".7"/></svg>;
  if (name === 'tasks') return <svg {...common}><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8.5 9h7"/><path d="M8.5 13h7"/><path d="M8.5 17h4"/></svg>;
  if (name === 'team') return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M4 19c.5-3.2 2.2-5 5-5s4.5 1.8 5 5"/><circle cx="17" cy="9" r="2"/><path d="M15.5 14.5c2.5.2 4 1.7 4.5 4.5"/></svg>;
  if (name === 'access') return <svg {...common}><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><circle cx="12" cy="15" r="1"/><path d="M12 16v2"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 3.8v2M12 18.2v2M3.8 12h2M18.2 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4"/></svg>;
}

function MoreIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>;
}

function BrandSymbol() {
  return <span className={styles.brandSymbol} aria-hidden="true"/>;
}

function sourceLabel(source: DataSource) {
  if (source === 'live') return { text: 'Operação ao vivo', detail: 'Neon conectado', className: styles.sourceLive };
  if (source === 'error') return { text: 'Conexão com erro', detail: 'Verifique banco e perfil', className: styles.sourceError };
  return { text: 'Configuração pendente', detail: 'Ambiente ainda não ativado', className: '' };
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
  if (isDatabaseConfigured() && !user) redirect('/sem-acesso');

  const visibleItems = user ? items.filter((item) => allowed(item, user)) : [];
  const activeItem = items.find((item) => item.key === active);
  if (user && activeItem && !allowed(activeItem, user)) redirect('/sem-acesso');

  const initials = user?.nome ? user.nome.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : 'PS';
  const mobilePrimary = visibleItems.filter((item) => mobilePrimaryKeys.has(item.key));
  const mobileMore = visibleItems.filter((item) => !mobilePrimaryKeys.has(item.key));
  const moreIsActive = mobileMore.some((item) => item.key === active);

  return (
    <main className={styles.shell}>
      <aside className={styles.desktopSidebar}>
        <Link href="/inicio" className={styles.brand}>
          <BrandSymbol/>
          <div className={styles.brandCopy}><strong>PintService</strong><span>Pint Services Car Center</span></div>
        </Link>

        <nav className={styles.desktopNav} aria-label="Navegação principal">
          {visibleItems.map((item) => (
            <Link
              key={item.key}
              className={`${styles.navLink} ${active === item.key ? styles.navLinkActive : ''}`}
              href={item.href}
              title={item.label}
              aria-current={active === item.key ? 'page' : undefined}
            >
              <NavIcon name={item.icon}/><span className={styles.navText}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={`${styles.sourceCard} ${sourceInfo.className}`}>
            <div className={styles.sourceTop}><span className={styles.sourceDot}/><span>{sourceInfo.text}</span></div>
            <small>{sourceInfo.detail}</small>
          </div>
          <Link className={styles.profile} href="/auth/sign-out" title="Sair do PintService">
            <div className={styles.profileMark}>{initials}</div>
            <div className={styles.profileCopy}><strong>{user?.nome || 'PintService'}</strong><span>{user ? ROLE_LABELS[user.perfil] : 'Acesso não vinculado'}</span></div>
          </Link>
        </div>
      </aside>

      <header className={styles.mobileHeader}>
        <Link href="/inicio" className={styles.mobileBrand}>
          <BrandSymbol/>
          <span><strong>PintService</strong><span>Central de operação</span></span>
        </Link>
        <Link href="/auth/sign-out" className={styles.mobileAccount} aria-label="Sair do PintService">
          <span>{source === 'live' ? 'ao vivo' : 'configurando'}</span><div className={styles.profileMark}>{initials}</div>
        </Link>
      </header>

      <section className={styles.content}>{children}</section>

      <nav className={styles.mobileBottom} aria-label="Navegação móvel">
        {mobilePrimary.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`${styles.mobileNavLink} ${active === item.key ? styles.mobileNavActive : ''}`}
            aria-current={active === item.key ? 'page' : undefined}
          >
            <NavIcon name={item.icon}/><span>{item.key === 'visao' ? 'Início' : item.label}</span>
          </Link>
        ))}
        <details className={styles.moreMenu}>
          <summary className={`${styles.moreSummary} ${moreIsActive ? styles.mobileNavActive : ''}`}><MoreIcon/><span>Mais</span></summary>
          <div className={styles.morePanel}>
            {mobileMore.map((item) => (
              <Link key={item.key} href={item.href} className={`${styles.moreLink} ${active === item.key ? styles.moreLinkActive : ''}`}>
                <NavIcon name={item.icon}/><span>{item.label}</span>
              </Link>
            ))}
          </div>
        </details>
      </nav>
    </main>
  );
}

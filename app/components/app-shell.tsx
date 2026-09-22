import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { DataSource } from '@/lib/dashboard-data';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { isDatabaseConfigured } from '@/lib/db';
import { ROLE_LABELS, type Permission } from '@/lib/permissions';
import styles from './app-shell.module.css';

type ActiveKey =
  | 'visao'
  | 'operacao'
  | 'atendimento'
  | 'reputacao'
  | 'veiculos'
  | 'tarefas'
  | 'funcionarios'
  | 'acessos'
  | 'configuracoes'
  | 'gestao';

type PrimaryKey = 'visao' | 'operacao' | 'atendimento' | 'gestao';
type Props = { active: ActiveKey; source: DataSource; children: React.ReactNode };
type IconName = 'home' | 'chat' | 'car' | 'settings';
type NavItem = {
  key: PrimaryKey;
  href: string;
  label: string;
  icon: IconName;
  permission?: Permission;
  anyPermission?: Permission[];
};

const items: NavItem[] = [
  { key: 'visao', href: '/', label: 'Hoje', icon: 'home', permission: 'ver_visao_geral' },
  {
    key: 'operacao',
    href: '/operacao',
    label: 'Oficina',
    icon: 'car',
    anyPermission: [
      'atualizar_operacao_veiculos',
      'ver_todos_veiculos',
      'ver_veiculos_setor',
      'ver_todas_tarefas',
      'ver_proprias_tarefas',
    ],
  },
  {
    key: 'atendimento',
    href: '/atendimento',
    label: 'Atendimento',
    icon: 'chat',
    anyPermission: ['ver_atendimento', 'ver_reputacao'],
  },
  {
    key: 'gestao',
    href: '/gestao',
    label: 'Gestão',
    icon: 'settings',
    anyPermission: ['ver_funcionarios', 'ver_configuracoes', 'ver_relatorios'],
  },
];

const parentByActive: Record<ActiveKey, PrimaryKey> = {
  visao: 'visao',
  operacao: 'operacao',
  veiculos: 'operacao',
  tarefas: 'operacao',
  atendimento: 'atendimento',
  reputacao: 'atendimento',
  funcionarios: 'gestao',
  acessos: 'gestao',
  configuracoes: 'gestao',
  gestao: 'gestao',
};

function NavIcon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'nav-svg',
  };

  if (name === 'home') {
    return <svg {...common}><path d="M3.5 10.5 12 3.8l8.5 6.7"/><path d="M5.5 9.7V20h13V9.7"/><path d="M9.5 20v-6h5v6"/></svg>;
  }
  if (name === 'chat') {
    return <svg {...common}><path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="M8 10h8"/><path d="M8 13h5"/></svg>;
  }
  if (name === 'car') {
    return <svg {...common}><path d="m5 15 1.5-5h11L19 15"/><path d="M4 15h16v4H4z"/><path d="M7 19v1.5M17 19v1.5"/><circle cx="7.5" cy="16.8" r=".7"/><circle cx="16.5" cy="16.8" r=".7"/></svg>;
  }
  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 3.8v2M12 18.2v2M3.8 12h2M18.2 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4"/></svg>;
}

function BrandSymbol() {
  return <span className={styles.brandSymbol} aria-hidden="true"/>;
}

function sourceLabel(source: DataSource) {
  if (source === 'live') return { text: 'Operação ao vivo', detail: 'Base oficial conectada', className: styles.sourceLive };
  if (source === 'error') return { text: 'Conexão com erro', detail: 'Verifique banco e perfil', className: styles.sourceError };
  return { text: 'Configuração pendente', detail: 'Ambiente ainda não ativado', className: '' };
}

function allowed(item: NavItem, user: Awaited<ReturnType<typeof getCurrentAppUser>>) {
  if (!user) return false;
  if (item.permission) return userHasPermission(user, item.permission);
  if (item.anyPermission) return item.anyPermission.some((permission) => userHasPermission(user, permission));
  return false;
}

export default async function AppShell({ active, source, children }: Props) {
  const sourceInfo = sourceLabel(source);
  const user = await getCurrentAppUser();
  if (isDatabaseConfigured() && !user) redirect('/sem-acesso');

  const visibleItems = user ? items.filter((item) => allowed(item, user)) : [];
  const parentActive = parentByActive[active];
  const parentItem = items.find((item) => item.key === parentActive);

  if (user && parentItem && !allowed(parentItem, user)) redirect('/sem-acesso');

  const initials = user?.nome
    ? user.nome.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : 'PS';

  return (
    <main className={styles.shell}>
      <aside className={styles.desktopSidebar}>
        <Link href="/inicio" className={styles.brand}>
          <BrandSymbol/>
          <div className={styles.brandCopy}>
            <strong>Sistema da Pint</strong>
            <span>Pint Services Car Center</span>
          </div>
        </Link>

        <nav className={styles.desktopNav} aria-label="Navegação principal">
          {visibleItems.map((item) => (
            <Link
              key={item.key}
              className={`${styles.navLink} ${parentActive === item.key ? styles.navLinkActive : ''}`}
              href={item.href}
              title={item.label}
              aria-current={parentActive === item.key ? 'page' : undefined}
            >
              <NavIcon name={item.icon}/>
              <span className={styles.navText}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={`${styles.sourceCard} ${sourceInfo.className}`}>
            <div className={styles.sourceTop}><span className={styles.sourceDot}/><span>{sourceInfo.text}</span></div>
            <small>{sourceInfo.detail}</small>
          </div>
          <Link className={styles.profile} href="/auth/sign-out" title="Sair do Sistema da Pint">
            <div className={styles.profileMark}>{initials}</div>
            <div className={styles.profileCopy}>
              <strong>{user?.nome || 'Sistema da Pint'}</strong>
              <span>{user ? ROLE_LABELS[user.perfil] : 'Acesso não vinculado'}</span>
            </div>
          </Link>
        </div>
      </aside>

      <header className={styles.mobileHeader}>
        <Link href="/inicio" className={styles.mobileBrand}>
          <BrandSymbol/>
          <span><strong>Sistema da Pint</strong><span>Central da oficina</span></span>
        </Link>
        <Link href="/auth/sign-out" className={styles.mobileAccount} aria-label="Sair do Sistema da Pint">
          <span>{source === 'live' ? 'ao vivo' : 'configurando'}</span>
          <div className={styles.profileMark}>{initials}</div>
        </Link>
      </header>

      <section className={styles.content}>{children}</section>

      <nav className={styles.mobileBottom} aria-label="Navegação móvel">
        {visibleItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`${styles.mobileNavLink} ${parentActive === item.key ? styles.mobileNavActive : ''}`}
            aria-current={parentActive === item.key ? 'page' : undefined}
          >
            <NavIcon name={item.icon}/>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}

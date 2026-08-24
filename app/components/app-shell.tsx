import Link from 'next/link';
import type { DataSource } from '@/lib/dashboard-data';

type Props = {
  active: 'visao' | 'atendimento' | 'reputacao' | 'veiculos' | 'tarefas' | 'funcionarios' | 'acessos' | 'configuracoes';
  source: DataSource;
  children: React.ReactNode;
};

type IconName = 'home' | 'chat' | 'reputation' | 'car' | 'tasks' | 'team' | 'access' | 'settings' | 'simulator';

const items: { key: Props['active']; href: string; label: string; icon: IconName }[] = [
  { key: 'visao', href: '/', label: 'Visão geral', icon: 'home' },
  { key: 'atendimento', href: '/atendimento', label: 'Atendimento', icon: 'chat' },
  { key: 'reputacao', href: '/reputacao', label: 'Reputação', icon: 'reputation' },
  { key: 'veiculos', href: '/veiculos', label: 'Veículos', icon: 'car' },
  { key: 'tarefas', href: '/tarefas', label: 'Tarefas', icon: 'tasks' },
  { key: 'funcionarios', href: '/funcionarios', label: 'Funcionários', icon: 'team' },
  { key: 'acessos', href: '/acessos', label: 'Perfis e acessos', icon: 'access' },
  { key: 'configuracoes', href: '/configuracoes', label: 'Configurações', icon: 'settings' },
];

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

  if (name === 'home') return <svg {...common}><path d="M3.5 10.5 12 3.8l8.5 6.7"/><path d="M5.5 9.7V20h13V9.7"/><path d="M9.5 20v-6h5v6"/></svg>;
  if (name === 'chat') return <svg {...common}><path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="M8 10h8"/><path d="M8 13h5"/></svg>;
  if (name === 'reputation') return <svg {...common}><path d="m12 3 2.7 5.4 6 .9-4.3 4.2 1 5.9-5.4-2.8-5.4 2.8 1-5.9-4.3-4.2 6-.9L12 3Z"/><path d="m9.5 12 1.6 1.6 3.5-3.6"/></svg>;
  if (name === 'car') return <svg {...common}><path d="m5 15 1.5-5h11L19 15"/><path d="M4 15h16v4H4z"/><path d="M7 19v1.5M17 19v1.5"/><circle cx="7.5" cy="16.8" r=".7"/><circle cx="16.5" cy="16.8" r=".7"/></svg>;
  if (name === 'tasks') return <svg {...common}><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8.5 9h7"/><path d="M8.5 13h7"/><path d="M8.5 17h4"/></svg>;
  if (name === 'team') return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M4 19c.5-3.2 2.2-5 5-5s4.5 1.8 5 5"/><circle cx="17" cy="9" r="2"/><path d="M15.5 14.5c2.5.2 4 1.7 4.5 4.5"/></svg>;
  if (name === 'access') return <svg {...common}><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><circle cx="12" cy="15" r="1"/><path d="M12 16v2"/></svg>;
  if (name === 'settings') return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 3.8v2M12 18.2v2M3.8 12h2M18.2 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4"/></svg>;
  return <svg {...common}><path d="M4 18 18 4"/><path d="m14.5 4 3.5 3.5"/><path d="M5 8h3M16 16h3M8 19v-3"/></svg>;
}

function sourceLabel(source: DataSource) {
  if (source === 'live') return { text: 'Dados ao vivo', detail: 'Banco conectado', className: 'live-source' };
  if (source === 'error') return { text: 'Conexão com erro', detail: 'Verifique o banco', className: 'error-source' };
  return { text: 'Modo demonstração', detail: 'Banco opcional por enquanto', className: 'demo-source' };
}

export default function AppShell({ active, source, children }: Props) {
  const sourceInfo = sourceLabel(source);
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <div className="brand-mark" aria-hidden="true">PS</div>
          <div><strong>PintService</strong><span>Pint Services Car Center</span></div>
        </Link>
        <nav className="nav" aria-label="Navegação principal">
          {items.map((item) => (
            <Link key={item.key} className={active === item.key ? 'active' : ''} href={item.href}>
              <NavIcon name={item.icon} /><span>{item.label}</span>
            </Link>
          ))}
          <Link href="/simulador"><NavIcon name="simulator" /><span>Simulador</span></Link>
        </nav>
        <div className="sidebar-bottom">
          <div className={`ia-status ${sourceInfo.className}`}><span className="pulse" /> {sourceInfo.text}<small>{sourceInfo.detail}</small></div>
          <div className="profile"><div className="avatar">PS</div><div><strong>PintService</strong><span>Administrador</span></div></div>
        </div>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}

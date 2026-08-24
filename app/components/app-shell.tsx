import Link from 'next/link';
import type { DataSource } from '@/lib/dashboard-data';

type Props = {
  active: 'visao' | 'atendimento' | 'veiculos' | 'tarefas' | 'funcionarios' | 'acessos' | 'configuracoes';
  source: DataSource;
  children: React.ReactNode;
};

const items = [
  { key: 'visao', href: '/', label: 'Visão geral' },
  { key: 'atendimento', href: '/atendimento', label: 'Atendimento' },
  { key: 'veiculos', href: '/veiculos', label: 'Veículos' },
  { key: 'tarefas', href: '/tarefas', label: 'Tarefas' },
  { key: 'funcionarios', href: '/funcionarios', label: 'Funcionários' },
  { key: 'acessos', href: '/acessos', label: 'Perfis e acessos' },
  { key: 'configuracoes', href: '/configuracoes', label: 'Configurações' },
] as const;

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
              <i className="nav-icon" aria-hidden="true" /><span>{item.label}</span>
            </Link>
          ))}
          <Link href="/simulador"><i className="nav-icon" aria-hidden="true" /><span>Simulador</span></Link>
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

import Link from 'next/link';
import type { DataSource } from '@/lib/dashboard-data';

type Props = {
  active: 'visao' | 'atendimento' | 'veiculos' | 'tarefas' | 'funcionarios' | 'configuracoes';
  source: DataSource;
  children: React.ReactNode;
};

const items = [
  { key: 'visao', href: '/', icon: '⌂', label: 'Visão geral' },
  { key: 'atendimento', href: '/atendimento', icon: '◉', label: 'Atendimento' },
  { key: 'veiculos', href: '/veiculos', icon: '◇', label: 'Veículos' },
  { key: 'tarefas', href: '/tarefas', icon: '!', label: 'Tarefas' },
  { key: 'funcionarios', href: '/funcionarios', icon: '♙', label: 'Funcionários' },
  { key: 'configuracoes', href: '/configuracoes', icon: '⚙', label: 'Configurações' },
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
          <div className="brand-mark">PS</div>
          <div><strong>PintService</strong><span>Funilaria & Pintura</span></div>
        </Link>
        <nav className="nav" aria-label="Navegação principal">
          {items.map((item) => (
            <Link key={item.key} className={active === item.key ? 'active' : ''} href={item.href}>
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
          <Link href="/simulador">⌁ <span>Simulador</span></Link>
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

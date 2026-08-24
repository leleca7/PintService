import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';

function relativeTime(value: string | null) {
  if (!value) return 'Sem atualização';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return minutes < 1 ? 'agora' : `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `há ${hours}h` : `há ${Math.floor(hours / 24)}d`;
}

export default async function VehiclesPage() {
  const data = await getDashboardData();
  return (
    <AppShell active="veiculos" source={data.source}>
      <header className="topbar">
        <div><p className="eyebrow">PRODUÇÃO</p><h1>Veículos</h1><p>Uma visão única do estágio, cliente e última atualização de cada carro.</p></div>
        <div className="top-actions"><Link className="ghost action-link" href="/">← Visão geral</Link></div>
      </header>

      <section className="panel page-panel">
        <div className="panel-head"><div><p className="eyebrow">CADASTRO</p><h2>{data.vehicles.length} veículos</h2></div><span className={`source-chip ${data.source}`}>{data.source === 'live' ? 'Dados reais' : data.source === 'demo' ? 'Exemplos' : 'Erro no banco'}</span></div>
        <div className="vehicle-cards">
          {data.vehicles.map((vehicle) => (
            <Link className="vehicle-card" href={`/veiculos/${encodeURIComponent(vehicle.id)}`} key={vehicle.id}>
              <div className="vehicle-card-top"><span className="vehicle-emoji">🚘</span><span className="stage-chip">{vehicle.etapa}</span></div>
              <h3>{vehicle.modelo}</h3>
              <strong className="plate">{vehicle.placa}</strong>
              <dl><div><dt>Cliente</dt><dd>{vehicle.cliente}</dd></div><div><dt>Status</dt><dd>{vehicle.status}</dd></div><div><dt>Atualização</dt><dd>{relativeTime(vehicle.ultimaAtualizacao)}</dd></div></dl>
              <span className="open-row">Abrir ficha completa →</span>
            </Link>
          ))}
        </div>
        {!data.vehicles.length && <div className="empty-state">Nenhum veículo cadastrado.</div>}
      </section>
    </AppShell>
  );
}

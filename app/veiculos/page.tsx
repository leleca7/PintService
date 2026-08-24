import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { createVehicle } from './actions';

function relativeTime(value: string | null) {
  if (!value) return 'Sem atualização';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return minutes < 1 ? 'agora' : `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `há ${hours}h` : `há ${Math.floor(hours / 24)}d`;
}

export default async function VehiclesPage() {
  const [data, user] = await Promise.all([getDashboardData(), getCurrentAppUser()]);
  const canManage = userHasPermission(user, 'gerenciar_veiculos');
  return (
    <AppShell active="veiculos" source={data.source}>
      <header className="topbar"><div><p className="eyebrow">PRODUÇÃO</p><h1>Veículos</h1><p>Estágio, cliente e última atualização de cada carro.</p></div><div className="top-actions"><Link className="ghost action-link" href="/inicio">Voltar ao início</Link></div></header>

      {canManage && (
        <section className="panel page-panel">
          <div className="panel-head"><div><p className="eyebrow">NOVO ATENDIMENTO</p><h2>Cadastrar cliente e veículo</h2></div></div>
          <form action={createVehicle} className="settings-grid">
            <label>Cliente<input name="cliente_nome" placeholder="Nome do cliente" /></label>
            <label>Telefone<input name="telefone" inputMode="tel" required placeholder="55..." /></label>
            <label>Placa<input name="placa" required placeholder="ABC1D23" /></label>
            <label>Modelo<input name="modelo" placeholder="Ex.: Toyota Corolla" /></label>
            <label>Cor<input name="cor" placeholder="Ex.: Branco" /></label>
            <label>Etapa / setor<input name="setor" placeholder="Ex.: Pintura" /></label>
            <label>Status<input name="status" placeholder="Ex.: Em produção" /></label>
            <div><button className="ghost action-link" type="submit">Salvar veículo</button></div>
          </form>
        </section>
      )}

      <section className="panel page-panel">
        <div className="panel-head"><div><p className="eyebrow">CADASTRO</p><h2>{data.vehicles.length} veículos</h2></div><span className={`source-chip ${data.source}`}>{data.source === 'live' ? 'Dados reais' : data.source === 'demo' ? 'Configuração pendente' : 'Erro no banco'}</span></div>
        <div className="vehicle-cards">
          {data.vehicles.map((vehicle) => <Link className="vehicle-card" href={`/veiculos/${encodeURIComponent(vehicle.id)}`} key={vehicle.id}><div className="vehicle-card-top"><span className="vehicle-mark">PS</span><span className="stage-chip">{vehicle.etapa}</span></div><h3>{vehicle.modelo}</h3><strong className="plate">{vehicle.placa}</strong><dl><div><dt>Cliente</dt><dd>{vehicle.cliente}</dd></div><div><dt>Status</dt><dd>{vehicle.status}</dd></div><div><dt>Atualização</dt><dd>{relativeTime(vehicle.ultimaAtualizacao)}</dd></div></dl><span className="open-row">Abrir ficha completa</span></Link>)}
        </div>
        {!data.vehicles.length && <div className="empty-state">Nenhum veículo cadastrado.</div>}
      </section>
    </AppShell>
  );
}

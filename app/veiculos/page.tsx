import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import ops from '@/app/components/precision-atelier-ops.module.css';
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

function isStale(value: string | null) {
  if (!value) return true;
  return Date.now() - new Date(value).getTime() > 24 * 60 * 60 * 1000;
}

function timeValue(value: string | null) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export default async function VehiclesPage() {
  const [data, user] = await Promise.all([getDashboardData(), getCurrentAppUser()]);
  const canManage = userHasPermission(user, 'gerenciar_veiculos');
  const stages = new Set(data.vehicles.map((vehicle) => vehicle.etapa).filter(Boolean));
  const stale = data.vehicles.filter((vehicle) => isStale(vehicle.ultimaAtualizacao));
  const withOpenTasks = new Set(data.tasks.filter((task) => ['aberta', 'em_execucao', 'aguardando_confirmacao'].includes(task.status) && task.placa).map((task) => task.placa));

  const sortedVehicles = [...data.vehicles].sort((a, b) => {
    const aScore = (withOpenTasks.has(a.placa) ? 2 : 0) + (isStale(a.ultimaAtualizacao) ? 1 : 0);
    const bScore = (withOpenTasks.has(b.placa) ? 2 : 0) + (isStale(b.ultimaAtualizacao) ? 1 : 0);
    if (aScore !== bScore) return bScore - aScore;
    return timeValue(b.ultimaAtualizacao) - timeValue(a.ultimaAtualizacao);
  });

  const attentionCount = sortedVehicles.filter((vehicle) => withOpenTasks.has(vehicle.placa) || isStale(vehicle.ultimaAtualizacao)).length;

  return (
    <AppShell active="veiculos" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>OPERAÇÃO · ACOMPANHAMENTO</p>
            <h1 className={styles.title}>Veículos</h1>
            <p className={styles.subtitle}>Uma leitura direta do que está em acompanhamento, em qual etapa cada carro se encontra e onde a operação perdeu atualização.</p>
          </div>
          <Link className={styles.button} href="/">Visão geral</Link>
        </header>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Em acompanhamento</span><strong>{data.vehicles.length}</strong><small>veículos carregados</small></div>
          <div className={styles.summaryItem}><span>Etapas ativas</span><strong>{stages.size}</strong><small>fluxo atual</small></div>
          <div className={styles.summaryItem}><span>Com pendência</span><strong>{withOpenTasks.size}</strong><small>tarefa operacional aberta</small></div>
          <div className={styles.summaryItem}><span>Sem atualização 24h+</span><strong>{stale.length}</strong><small>merecem conferência</small></div>
        </div>

        {attentionCount > 0 && (
          <section className={ops.vehicleNotice}>
            <div>
              <strong>{attentionCount} {attentionCount === 1 ? 'veículo merece' : 'veículos merecem'} conferência primeiro.</strong>
              <p>Pendências operacionais e veículos sem atualização há mais de 24 horas foram trazidos para o início da carteira.</p>
            </div>
            <span className={ops.vehicleNoticeCount}>{attentionCount}</span>
          </section>
        )}

        {canManage && <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>NOVO ACOMPANHAMENTO</p><h2>Cadastrar cliente e veículo</h2></div></div>
          <div className={styles.formWrap}>
            <form action={createVehicle} className={styles.formGrid}>
              <label className={styles.field}>Cliente<input name="cliente_nome" placeholder="Nome do cliente" /></label>
              <label className={styles.field}>Telefone<input name="telefone" inputMode="tel" required placeholder="55..." /></label>
              <label className={styles.field}>Placa<input name="placa" required placeholder="ABC1D23" /></label>
              <label className={styles.field}>Modelo<input name="modelo" placeholder="Ex.: Toyota Corolla" /></label>
              <label className={styles.field}>Cor<input name="cor" placeholder="Ex.: Branco" /></label>
              <label className={styles.field}>Etapa / setor<input name="setor" placeholder="Ex.: Pintura" /></label>
              <label className={styles.field}>Status<input name="status" placeholder="Ex.: Em produção" /></label>
              <div className={styles.formAction}><button className={`${styles.button} ${styles.buttonAccent}`} type="submit">Salvar veículo</button></div>
            </form>
          </div>
        </section>}

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>CARTEIRA OPERACIONAL</p><h2>{data.vehicles.length ? 'Acompanhamento atual' : 'Nenhum veículo carregado'}</h2></div><span className={styles.count}>{data.vehicles.length}</span></div>
          {sortedVehicles.length ? <div className={styles.vehicleGrid}>{sortedVehicles.map((vehicle) => {
            const pending = withOpenTasks.has(vehicle.placa);
            const staleVehicle = isStale(vehicle.ultimaAtualizacao);
            const needsAttention = pending || staleVehicle;
            const signalClass = pending ? ops.signalPending : staleVehicle ? ops.signalStale : ops.signalOk;
            const signalLabel = pending ? 'Pendência' : staleVehicle ? 'Sem atualização' : 'Em dia';

            return <Link className={`${styles.vehicleCard} ${needsAttention ? ops.vehicleCardAttention : ''}`} href={`/veiculos/${encodeURIComponent(vehicle.id)}`} key={vehicle.id}>
              <div className={styles.vehicleCardTop}><span className={`${ops.signal} ${signalClass}`}>{signalLabel}</span><span className={styles.vehicleStage}>{vehicle.etapa || 'Etapa não informada'}</span></div>
              <h3>{vehicle.modelo}</h3>
              <span className={styles.plate}>{vehicle.placa || 'SEM PLACA'}</span>
              <div className={styles.vehicleMeta}>
                <div><span>Cliente</span><strong>{vehicle.cliente}</strong></div>
                <div><span>Atualização</span><strong>{relativeTime(vehicle.ultimaAtualizacao)}</strong></div>
              </div>
            </Link>;
          })}</div> : <div className={styles.quiet}><strong>Nenhum veículo cadastrado.</strong>Quando a fonte operacional estiver conectada ou um atendimento for cadastrado, os veículos aparecerão aqui.</div>}
        </section>
      </div>
    </AppShell>
  );
}

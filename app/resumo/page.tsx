import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';

function ageMinutes(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
}

function relativeTime(value: string | null) {
  const minutes = ageMinutes(value);
  if (!Number.isFinite(minutes)) return 'sem atualização';
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export default async function DailySummaryPage() {
  const data = await getDashboardData();
  const activeTasks = data.tasks.filter((task) => ['aberta', 'em_execucao', 'aguardando_confirmacao'].includes(task.status));
  const delayedTasks = activeTasks.filter((task) => ageMinutes(task.criadoEm) >= 120);
  const criticalTasks = activeTasks.filter((task) => ageMinutes(task.criadoEm) >= 240 || ['alta', 'urgente'].includes(task.prioridade));
  const staleVehicles = data.vehicles.filter((vehicle) => ageMinutes(vehicle.ultimaAtualizacao) >= 24 * 60);
  const recentVehicles = data.vehicles.filter((vehicle) => ageMinutes(vehicle.ultimaAtualizacao) < 24 * 60);
  const waitingHuman = data.conversations.filter((conversation) => conversation.status.includes('humano'));
  const urgentPendings = data.pendings.filter((pending) => ['alta', 'urgente'].includes(pending.prioridade));

  return (
    <AppShell active="resumo" source={data.source}>
      <header className="topbar"><div><p className="eyebrow">FECHAMENTO OPERACIONAL</p><h1>Resumo do dia</h1><p>Uma leitura rápida do que avançou e do que ainda merece atenção na operação.</p></div><div className="top-actions"><Link className="ghost action-link" href="/tarefas">Abrir tarefas</Link><Link className="primary action-link" href="/veiculos">Ver veículos</Link></div></header>

      <section className="metrics compact-metrics">
        <article><div className="metric-icon">AV</div><div><span>Veículos atualizados</span><strong>{recentVehicles.length}</strong><small>nas últimas 24 horas</small></div></article>
        <article><div className="metric-icon">AT</div><div><span>Tarefas em atenção</span><strong>{criticalTasks.length}</strong><small>{delayedTasks.length} abertas há 2h ou mais</small></div></article>
        <article><div className="metric-icon">HU</div><div><span>Esperando humano</span><strong>{waitingHuman.length}</strong><small>conversas que pedem equipe</small></div></article>
        <article><div className="metric-icon">PE</div><div><span>Pendências abertas</span><strong>{data.pendings.length}</strong><small>{urgentPendings.length} alta/urgente</small></div></article>
      </section>

      <div className="grid-main">
        <section className="panel production"><div className="panel-head"><div><p className="eyebrow">PRIORIDADE</p><h2>Resolver antes de encerrar</h2></div><Link className="link-button" href="/tarefas">Abrir fila</Link></div>
          <div className="attention-list">
            {criticalTasks.slice(0, 6).map((task) => <Link href="/tarefas" className="attention-item" key={task.id}><div className={`attention-icon ${task.prioridade}`}>{task.requerFoto ? 'FT' : 'TK'}</div><div><strong>{task.modelo} {task.placa}</strong><p>{task.titulo}</p><small>{task.responsavel} · {relativeTime(task.criadoEm)}</small></div><span className={`task-priority ${task.prioridade}`}>{task.prioridade}</span></Link>)}
            {!criticalTasks.length && <div className="empty-state compact-empty">Nenhuma tarefa crítica ou envelhecida agora.</div>}
          </div>
        </section>

        <section className="panel conversations"><div className="panel-head"><div><p className="eyebrow">SEM ATUALIZAÇÃO</p><h2>Carros que podem ter parado</h2></div><Link className="link-button" href="/veiculos">Abrir veículos</Link></div>
          <div className="conversation-list">
            {staleVehicles.slice(0, 6).map((vehicle) => <article className="conversation" key={vehicle.id}><div className="avatar soft">PS</div><div className="conversation-body"><div><strong>{vehicle.modelo} · {vehicle.placa}</strong><time>{relativeTime(vehicle.ultimaAtualizacao)}</time></div><p>{vehicle.cliente}</p><span className="tag human">{vehicle.etapa}</span></div></article>)}
            {!staleVehicles.length && <div className="empty-state compact-empty">Nenhum veículo com mais de 24h sem atualização.</div>}
          </div>
        </section>
      </div>

      <section className="panel page-panel"><div className="panel-head"><div><p className="eyebrow">PENDÊNCIAS</p><h2>Coisas que não podem ficar na memória da equipe</h2></div><span className="count">{data.pendings.length} abertas</span></div>
        <div className="task-list">
          {data.pendings.slice(0, 12).map((pending) => <article className="task-row" key={pending.id}><div className={`task-symbol ${pending.prioridade}`}>PE</div><div><strong>{pending.modelo} {pending.placa || ''}</strong><p>{pending.mensagem} · {pending.cliente}</p><small>{pending.tipo.replaceAll('_', ' ')} · {relativeTime(pending.criadoEm)}</small></div><span className={`task-priority ${pending.prioridade}`}>{pending.prioridade}</span></article>)}
        </div>
        {!data.pendings.length && <div className="empty-state">Nenhuma pendência aberta encontrada.</div>}
      </section>

      <section className="panel page-panel"><div className="panel-head"><div><p className="eyebrow">ATENDIMENTO</p><h2>Clientes que ainda esperam alguém</h2></div><Link className="link-button" href="/atendimento">Central de atendimento</Link></div>
        <div className="task-list">
          {waitingHuman.slice(0, 10).map((conversation) => <article className="task-row" key={conversation.id}><div className="task-symbol alta">HU</div><div><strong>{conversation.cliente}{conversation.placa ? ` · ${conversation.placa}` : ''}</strong><p>{conversation.mensagem}</p></div><span className="tag human">{relativeTime(conversation.criadoEm)}</span></article>)}
        </div>
        {!waitingHuman.length && <div className="empty-state">Nenhuma conversa aguardando atendimento humano.</div>}
      </section>
    </AppShell>
  );
}

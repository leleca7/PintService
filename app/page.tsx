import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';

const STAGES = ['Desmontagem', 'Funilaria', 'Preparação de pintura', 'Pintura', 'Montagem', 'Polimento', 'Lavagem'];

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function relativeTime(value: string | null) {
  if (!value) return 'Sem atualização';
  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export default async function Dashboard() {
  const data = await getDashboardData();
  const activeTasks = data.tasks.filter((task) => ['aberta', 'em_execucao', 'aguardando_confirmacao'].includes(task.status));
  const urgentTasks = activeTasks.filter((task) => ['alta', 'urgente'].includes(task.prioridade));
  const humanConversations = data.conversations.filter((conversation) => conversation.status.includes('humano'));
  const aiHandled = data.conversations.filter((conversation) => !conversation.status.includes('humano')).length;

  const stages = STAGES.map((name) => ({
    name,
    count: data.vehicles.filter((vehicle) => normalize(vehicle.etapa).includes(normalize(name))).length,
  }));
  const maxStageCount = Math.max(1, ...stages.map((stage) => stage.count));

  return (
    <AppShell active="visao" source={data.source}>
      {data.source === 'demo' && (
        <div className="system-banner demo-banner"><strong>Modo demonstração</strong><span>O site está funcionando sem banco. Os exemplos servem para navegar e testar a operação; quando um banco for conectado no futuro, eles são substituídos por dados reais.</span></div>
      )}
      {data.source === 'error' && (
        <div className="system-banner error-banner"><strong>Banco configurado, mas a leitura falhou</strong><span>{data.error || 'Verifique as variáveis e tabelas do banco.'}</span></div>
      )}

      <header className="topbar">
        <div><p className="eyebrow">CENTRAL OPERACIONAL</p><h1>Visão geral</h1><p>Atendimento, produção e tarefas em um só lugar.</p></div>
        <div className="top-actions"><Link className="ghost action-link" href="/configuracoes">⚙ Configurações</Link><Link className="primary action-link" href="/veiculos">Ver veículos →</Link></div>
      </header>

      <section className="metrics">
        <article><div className="metric-icon">🚘</div><div><span>Veículos cadastrados</span><strong>{data.vehicles.length}</strong><small>{stages.filter((stage) => stage.count > 0).length} etapas com veículos</small></div></article>
        <article><div className="metric-icon">💬</div><div><span>Conversas recentes</span><strong>{data.conversations.length}</strong><small>{humanConversations.length} aguardando humano</small></div></article>
        <article><div className="metric-icon">✓</div><div><span>Acompanhadas pela IA</span><strong>{aiHandled}</strong><small className="good">sem handoff humano</small></div></article>
        <article><div className="metric-icon">⚡</div><div><span>Precisam de atenção</span><strong>{activeTasks.length}</strong><small className={urgentTasks.length ? 'danger' : ''}>{urgentTasks.length} prioridade alta/urgente</small></div></article>
      </section>

      <section className="attention-panel panel">
        <div className="panel-head"><div><p className="eyebrow">AGORA</p><h2>O que precisa de atenção</h2></div><Link className="link-button" href="/tarefas">Abrir tarefas →</Link></div>
        {activeTasks.length ? (
          <div className="attention-list">
            {activeTasks.slice(0, 5).map((task) => (
              <Link href="/tarefas" className="attention-item" key={task.id}>
                <div className={`attention-icon ${task.prioridade}`}>{task.requerFoto ? '📸' : '🔧'}</div>
                <div><strong>{task.modelo} {task.placa}</strong><p>{task.titulo}</p><small>{task.responsavel} · {relativeTime(task.criadoEm)}</small></div>
                <span className={`task-priority ${task.prioridade}`}>{task.prioridade}</span>
              </Link>
            ))}
          </div>
        ) : <div className="empty-state">Nenhuma tarefa operacional aberta agora.</div>}
      </section>

      <div className="grid-main">
        <section className="panel production">
          <div className="panel-head"><div><p className="eyebrow">PRODUÇÃO</p><h2>Fluxo da oficina</h2></div><Link className="link-button" href="/veiculos">Ver veículos →</Link></div>
          <div className="stage-list">
            {stages.map((stage, index) => (
              <div className="stage" key={stage.name}>
                <div className="stage-number">{index + 1}</div>
                <div className="stage-info"><strong>{stage.name}</strong><span>{stage.count} {stage.count === 1 ? 'veículo' : 'veículos'}</span></div>
                <div className="stage-bar"><i style={{ width: `${Math.round((stage.count / maxStageCount) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel conversations">
          <div className="panel-head"><div><p className="eyebrow">WHATSAPP</p><h2>Atendimentos recentes</h2></div><span className={data.source === 'live' ? 'live' : 'live muted-live'}><i /> {data.source === 'live' ? 'dados reais' : 'preview'}</span></div>
          <div className="conversation-list">
            {data.conversations.slice(0, 5).map((conversation) => (
              <article className="conversation" key={conversation.id}>
                <div className="avatar soft">{conversation.cliente.slice(0, 2).toUpperCase()}</div>
                <div className="conversation-body"><div><strong>{conversation.cliente}</strong><time>{relativeTime(conversation.criadoEm)}</time></div><p>{conversation.mensagem}</p><span className={conversation.status.includes('humano') ? 'tag human' : 'tag ai'}>{conversation.status}</span></div>
              </article>
            ))}
            {!data.conversations.length && <div className="empty-state compact-empty">Nenhuma conversa encontrada.</div>}
          </div>
          <Link className="wide-button link-wide" href="/atendimento">Abrir central de atendimento</Link>
        </section>
      </div>

      <section className="panel vehicles">
        <div className="panel-head"><div><p className="eyebrow">VEÍCULOS</p><h2>Atualizados recentemente</h2></div><Link className="link-button" href="/veiculos">Ver todos →</Link></div>
        <div className="table-wrap">
          <table><thead><tr><th>Veículo</th><th>Cliente</th><th>Etapa atual</th><th>Última atualização</th><th></th></tr></thead>
            <tbody>{data.vehicles.slice(0, 8).map((vehicle) => <tr key={vehicle.id}><td><div className="vehicle-name"><span className="car-dot">🚗</span><div><strong>{vehicle.modelo}</strong><small>{vehicle.placa}{vehicle.cor ? ` · ${vehicle.cor}` : ''}</small></div></div></td><td>{vehicle.cliente}</td><td><span className="stage-chip">{vehicle.etapa}</span></td><td>{relativeTime(vehicle.ultimaAtualizacao)}</td><td><Link className="more" href={`/veiculos/${encodeURIComponent(vehicle.id)}`}>Abrir →</Link></td></tr>)}</tbody>
          </table>
          {!data.vehicles.length && <div className="empty-state">Nenhum veículo encontrado.</div>}
        </div>
      </section>

      <footer><span>PintService · {data.source === 'live' ? 'dados reais' : data.source === 'demo' ? 'preview sem banco conectado' : 'erro de conexão'}</span><span>WhatsApp <b className="status-dot" /> Banco <b className={`status-dot ${data.source === 'live' ? '' : 'status-muted'}`} /> IA <b className="status-dot" /></span></footer>
    </AppShell>
  );
}

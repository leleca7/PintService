import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import { getDashboardData, type DashboardConversation, type DashboardTask } from '@/lib/dashboard-data';

const STAGES = ['Desmontagem', 'Funilaria', 'Preparação de pintura', 'Pintura', 'Montagem', 'Polimento', 'Lavagem'];
const ACTIVE_TASK_STATUSES = new Set(['aberta', 'em_execucao', 'aguardando_confirmacao']);

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function minutesSince(value: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
}

function relativeTime(value: string | null) {
  if (!value) return 'Sem atualização';
  const minutes = minutesSince(value);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

function dateLabel() {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Bahia',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());
}

type Escalation = {
  id: string;
  score: number;
  level: 'critica' | 'alta' | 'atencao';
  eyebrow: string;
  title: string;
  detail: string;
  meta: string;
  href: string;
  action: string;
};

function taskEscalation(task: DashboardTask): Escalation | null {
  if (!ACTIVE_TASK_STATUSES.has(task.status)) return null;
  const age = minutesSince(task.criadoEm);
  const priority = normalize(task.prioridade);
  const isUrgent = priority === 'urgente';
  const isHigh = priority === 'alta';
  const stalled = age >= 120;

  // A rotina fica na base. Só sobe o que já é grave ou ficou parado tempo demais.
  if (!isUrgent && !isHigh && !stalled) return null;

  const score = isUrgent ? 100 : isHigh ? 82 : 68;
  const level = score >= 95 ? 'critica' : score >= 80 ? 'alta' : 'atencao';
  const vehicle = [task.modelo, task.placa].filter(Boolean).join(' · ');

  return {
    id: `task-${task.id}`,
    score: score + Math.min(15, Math.floor(age / 60)),
    level,
    eyebrow: task.requerFoto ? 'CONFIRMAÇÃO / FOTO' : 'PENDÊNCIA OPERACIONAL',
    title: task.titulo,
    detail: vehicle || task.setor || 'Operação',
    meta: `${task.responsavel} · ${relativeTime(task.criadoEm)}`,
    href: '/tarefas',
    action: 'Resolver',
  };
}

function conversationEscalation(conversation: DashboardConversation): Escalation | null {
  if (!normalize(conversation.status).includes('humano')) return null;
  const age = minutesSince(conversation.criadoEm);

  // Handoff recente continua na base do atendimento; só sobe quando começa a ficar parado.
  if (age < 20) return null;

  const critical = age >= 45;
  return {
    id: `conversation-${conversation.id}`,
    score: critical ? 96 + Math.min(10, Math.floor(age / 30)) : 78,
    level: critical ? 'critica' : 'alta',
    eyebrow: 'ATENDIMENTO HUMANO',
    title: `${conversation.cliente} aguarda continuidade`,
    detail: conversation.placa ? `Veículo ${conversation.placa}` : 'Conversa encaminhada para atendimento',
    meta: relativeTime(conversation.criadoEm),
    href: '/atendimento',
    action: 'Assumir atendimento',
  };
}

export default async function Dashboard() {
  const data = await getDashboardData();
  const activeTasks = data.tasks.filter((task) => ACTIVE_TASK_STATUSES.has(task.status));
  const humanConversations = data.conversations.filter((conversation) => normalize(conversation.status).includes('humano'));
  const aiHandled = data.conversations.filter((conversation) => !normalize(conversation.status).includes('humano')).length;
  const stages = STAGES.map((name) => ({
    name,
    count: data.vehicles.filter((vehicle) => normalize(vehicle.etapa).includes(normalize(name))).length,
  }));

  const escalations = [
    ...activeTasks.map(taskEscalation).filter((item): item is Escalation => Boolean(item)),
    ...humanConversations.map(conversationEscalation).filter((item): item is Escalation => Boolean(item)),
  ].sort((a, b) => b.score - a.score);

  const visibleEscalations = escalations.slice(0, 4);
  const criticalCount = escalations.filter((item) => item.level === 'critica').length;
  const highCount = escalations.filter((item) => item.level === 'alta').length;
  const basePending = Math.max(0, activeTasks.length + humanConversations.length - escalations.length);
  const attentionPlates = new Set(
    activeTasks
      .filter((task) => ['alta', 'urgente'].includes(normalize(task.prioridade)))
      .map((task) => task.placa)
      .filter(Boolean),
  );
  const highlightedVehicles = [...data.vehicles]
    .sort((a, b) => Number(attentionPlates.has(b.placa)) - Number(attentionPlates.has(a.placa)))
    .slice(0, 5);

  const systemChecks = [
    { label: 'Banco', ready: data.source === 'live' },
    { label: 'IA', ready: Boolean(process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_MODEL?.trim()) },
    { label: 'WhatsApp', ready: Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()) },
    { label: 'Veículos', ready: Boolean(process.env.VEHICLE_DATA_URL?.trim()) },
  ];
  const integrationsWithIssue = systemChecks.filter((item) => !item.ready).length;

  return (
    <AppShell active="visao" source={data.source}>
      {data.source === 'demo' && (
        <div className="system-banner info-banner">
          <strong>Configuração pendente</strong>
          <span>O ambiente ainda precisa das conexões operacionais para iniciar o uso real.</span>
        </div>
      )}
      {data.source === 'error' && (
        <div className="system-banner error-banner">
          <strong>Não foi possível carregar a operação</strong>
          <span>{data.error || 'Verifique a conexão com o banco e o perfil do usuário.'}</span>
        </div>
      )}

      <section className={`pa-command ${escalations.length ? 'has-attention' : 'is-clear'}`}>
        <div className="pa-command-copy">
          <p className="pa-kicker">{dateLabel().toUpperCase()} · CENTRAL OPERACIONAL</p>
          <h1>{escalations.length ? `${escalations.length} ${escalations.length === 1 ? 'situação chegou' : 'situações chegaram'} ao seu nível.` : 'Operação sob controle.'}</h1>
          <p>{escalations.length ? 'A base já absorveu a rotina. Aqui aparecem apenas exceções que ainda precisam de decisão.' : 'Nenhuma exceção venceu a base neste momento. A operação segue monitorada em segundo plano.'}</p>
          <div className="pa-command-actions">
            {escalations.length ? <Link href="/tarefas" className="pa-primary-action">Ver decisões pendentes</Link> : <Link href="/veiculos" className="pa-primary-action">Ver operação</Link>}
            <Link href="/atendimento" className="pa-secondary-action">Abrir atendimento</Link>
          </div>
        </div>

        <div className="pa-command-rail" aria-label="Resumo da operação">
          <div><span>VEÍCULOS</span><strong>{data.vehicles.length}</strong><small>em acompanhamento</small></div>
          <div><span>NO TOPO</span><strong>{escalations.length}</strong><small>{criticalCount ? `${criticalCount} crítico${criticalCount > 1 ? 's' : ''}` : 'sem críticos'}</small></div>
          <div><span>NA BASE</span><strong>{basePending}</strong><small>em tratamento</small></div>
        </div>
      </section>

      <section className="pa-attention">
        <div className="pa-section-head">
          <div><p className="pa-kicker dark">DECISÃO</p><h2>O que chegou até você</h2></div>
          <div className="pa-attention-summary">
            <span>{criticalCount} crítico{criticalCount === 1 ? '' : 's'}</span>
            <span>{highCount} alta{highCount === 1 ? '' : 's'}</span>
          </div>
        </div>

        {visibleEscalations.length ? (
          <div className="pa-escalation-list">
            {visibleEscalations.map((item) => (
              <Link href={item.href} className={`pa-escalation ${item.level}`} key={item.id}>
                <div className="pa-escalation-level"><i/><span>{item.level === 'critica' ? 'CRÍTICO' : item.level === 'alta' ? 'ALTA' : 'ATENÇÃO'}</span></div>
                <div className="pa-escalation-copy">
                  <small>{item.eyebrow}</small>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <div className="pa-escalation-meta"><span>{item.meta}</span><b>{item.action} →</b></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="pa-clear-state">
            <div className="pa-clear-mark">✓</div>
            <div><strong>Nada chegou ao topo da operação.</strong><p>As pendências atuais permanecem sendo tratadas na base e só sobem se precisarem de decisão.</p></div>
          </div>
        )}
      </section>

      <section className="pa-workspace-grid">
        <article className="pa-surface pa-production">
          <div className="pa-section-head compact">
            <div><p className="pa-kicker dark">PRODUÇÃO</p><h2>Fluxo da oficina</h2></div>
            <Link href="/veiculos" className="pa-text-link">Ver veículos →</Link>
          </div>
          <div className="pa-stage-track">
            {stages.map((stage, index) => (
              <div className="pa-stage-node" key={stage.name}>
                <div className="pa-stage-index">{String(index + 1).padStart(2, '0')}</div>
                <strong>{stage.count}</strong>
                <span>{stage.name}</span>
                <i className={stage.count ? 'active' : ''}/>
              </div>
            ))}
          </div>
        </article>

        <article className="pa-surface pa-service">
          <div className="pa-section-head compact">
            <div><p className="pa-kicker dark">ATENDIMENTO</p><h2>Fila inteligente</h2></div>
            <Link href="/atendimento" className="pa-text-link">Abrir central →</Link>
          </div>
          <div className="pa-service-numbers">
            <div><strong>{humanConversations.length}</strong><span>com humano</span></div>
            <div><strong>{aiHandled}</strong><span>sem escalada</span></div>
            <div><strong>{data.conversations.length}</strong><span>recentes</span></div>
          </div>
          <div className="pa-service-list">
            {humanConversations.slice(0, 3).map((conversation) => (
              <div className="pa-service-row" key={conversation.id}>
                <div className="pa-person-mark">{conversation.cliente.slice(0, 2).toUpperCase()}</div>
                <div><strong>{conversation.cliente}</strong><span>{conversation.placa ? `${conversation.placa} · ` : ''}{relativeTime(conversation.criadoEm)}</span></div>
                <b>{minutesSince(conversation.criadoEm) >= 20 ? 'atenção' : 'base'}</b>
              </div>
            ))}
            {!humanConversations.length && <div className="pa-inline-empty">Nenhum atendimento humano em espera.</div>}
          </div>
        </article>
      </section>

      <section className="pa-surface pa-vehicles">
        <div className="pa-section-head compact">
          <div><p className="pa-kicker dark">VEÍCULOS</p><h2>Em destaque agora</h2></div>
          <Link href="/veiculos" className="pa-text-link">Ver todos →</Link>
        </div>
        <div className="pa-vehicle-list">
          {highlightedVehicles.map((vehicle) => {
            const needsAttention = attentionPlates.has(vehicle.placa);
            return (
              <Link href={`/veiculos/${encodeURIComponent(vehicle.id)}`} className="pa-vehicle-row" key={vehicle.id}>
                <div className="pa-vehicle-id"><span>{vehicle.modelo}</span><strong>{vehicle.placa}</strong></div>
                <div className="pa-vehicle-client"><span>CLIENTE</span><strong>{vehicle.cliente}</strong></div>
                <div className="pa-vehicle-stage"><span>ETAPA</span><strong>{vehicle.etapa}</strong></div>
                <div className="pa-vehicle-time"><span>ATUALIZAÇÃO</span><strong>{relativeTime(vehicle.ultimaAtualizacao)}</strong></div>
                <div className={`pa-vehicle-state ${needsAttention ? 'attention' : ''}`}>{needsAttention ? 'atenção' : 'normal'}</div>
              </Link>
            );
          })}
          {!highlightedVehicles.length && <div className="pa-inline-empty">Nenhum veículo cadastrado ainda.</div>}
        </div>
      </section>

      <section className="pa-bottom-grid">
        <article className="pa-overview-numbers">
          <p className="pa-kicker dark">PANORAMA</p>
          <div><strong>{data.vehicles.length}</strong><span>veículos acompanhados</span></div>
          <div><strong>{activeTasks.length}</strong><span>pendências na operação</span></div>
          <div><strong>{escalations.length}</strong><span>exceções escaladas</span></div>
          <div><strong>{stages.filter((stage) => stage.count > 0).length}</strong><span>etapas ativas</span></div>
        </article>

        <article className="pa-system-health">
          <div><p className="pa-kicker">SISTEMA</p><h3>{integrationsWithIssue ? `${integrationsWithIssue} conexão${integrationsWithIssue > 1 ? 'ões' : ''} ainda pendente${integrationsWithIssue > 1 ? 's' : ''}.` : 'Todos os serviços operacionais.'}</h3></div>
          <div className="pa-health-list">
            {systemChecks.map((item) => <span key={item.label}><i className={item.ready ? 'ready' : 'pending'}/>{item.label}</span>)}
          </div>
          <Link href="/configuracoes">Ver configurações →</Link>
        </article>
      </section>

      <footer className="pa-footer"><span>PintService · Precision Atelier</span><span>Rotina silenciosa. Exceção visível.</span></footer>
    </AppShell>
  );
}

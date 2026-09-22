import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import { getDashboardData, type DashboardConversation, type DashboardTask } from '@/lib/dashboard-data';

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
    detail: vehicle || task.setor || 'Oficina',
    meta: `${task.responsavel} · ${relativeTime(task.criadoEm)}`,
    href: '/tarefas',
    action: 'Resolver',
  };
}

function conversationEscalation(conversation: DashboardConversation): Escalation | null {
  if (!normalize(conversation.status).includes('humano')) return null;

  const age = minutesSince(conversation.criadoEm);
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
    action: 'Atender',
  };
}

export default async function Dashboard() {
  const data = await getDashboardData();
  const activeTasks = data.tasks.filter((task) => ACTIVE_TASK_STATUSES.has(task.status));
  const humanConversations = data.conversations.filter((conversation) => normalize(conversation.status).includes('humano'));

  const escalations = [
    ...activeTasks.map(taskEscalation).filter((item): item is Escalation => Boolean(item)),
    ...humanConversations.map(conversationEscalation).filter((item): item is Escalation => Boolean(item)),
  ].sort((a, b) => b.score - a.score);

  const visibleEscalations = escalations.slice(0, 6);
  const criticalCount = escalations.filter((item) => item.level === 'critica').length;

  return (
    <AppShell active="visao" source={data.source}>
      {data.source === 'demo' && (
        <div className="system-banner info-banner">
          <strong>Configuração pendente</strong>
          <span>O ambiente ainda precisa da base operacional para iniciar o uso real.</span>
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
          <p className="pa-kicker">{dateLabel().toUpperCase()} · HOJE</p>
          <h1>
            {escalations.length
              ? `${escalations.length} ${escalations.length === 1 ? 'situação precisa' : 'situações precisam'} de atenção.`
              : 'Operação sob controle.'}
          </h1>
          <p>
            {escalations.length
              ? 'Aqui aparece somente o que saiu da rotina e precisa de decisão ou presença humana.'
              : 'Nada exige decisão agora. A rotina continua sendo tratada pela oficina e pelas automações.'}
          </p>
          <div className="pa-command-actions">
            <Link href="/operacao" className="pa-primary-action">Abrir Oficina</Link>
            <Link href="/atendimento" className="pa-secondary-action">Abrir Atendimento</Link>
          </div>
        </div>

        <div className="pa-command-rail" aria-label="Resumo do dia">
          <div><span>VEÍCULOS</span><strong>{data.vehicles.length}</strong><small>em acompanhamento</small></div>
          <div><span>ATENÇÃO</span><strong>{escalations.length}</strong><small>{criticalCount ? `${criticalCount} crítico${criticalCount > 1 ? 's' : ''}` : 'sem críticos'}</small></div>
          <div><span>CONVERSAS</span><strong>{humanConversations.length}</strong><small>com presença humana</small></div>
        </div>
      </section>

      <section className="pa-attention">
        <div className="pa-section-head">
          <div><p className="pa-kicker dark">PRECISA DE VOCÊ</p><h2>Exceções do momento</h2></div>
        </div>

        {visibleEscalations.length ? (
          <div className="pa-escalation-list">
            {visibleEscalations.map((item) => (
              <Link href={item.href} className={`pa-escalation ${item.level}`} key={item.id}>
                <div className="pa-escalation-level">
                  <i/>
                  <span>{item.level === 'critica' ? 'CRÍTICO' : item.level === 'alta' ? 'ALTA' : 'ATENÇÃO'}</span>
                </div>
                <div className="pa-escalation-copy">
                  <small>{item.eyebrow}</small>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <div className="pa-escalation-meta">
                  <span>{item.meta}</span>
                  <b>{item.action} →</b>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="pa-clear-state">
            <div className="pa-clear-mark">✓</div>
            <div>
              <strong>Nada precisa subir para você agora.</strong>
              <p>Quando surgir atraso, tarefa importante ou atendimento humano parado, ele aparece aqui.</p>
            </div>
          </div>
        )}
      </section>

      <section className="pa-workspace-grid">
        <Link href="/operacao" className="pa-surface pa-production" style={{ textDecoration: 'none' }}>
          <div className="pa-section-head compact">
            <div><p className="pa-kicker dark">OFICINA</p><h2>Produção, entradas e peças</h2></div>
            <span className="pa-text-link">Abrir →</span>
          </div>
          <div className="pa-inline-empty">A rotina operacional fica concentrada aqui.</div>
        </Link>

        <Link href="/atendimento" className="pa-surface pa-service" style={{ textDecoration: 'none' }}>
          <div className="pa-section-head compact">
            <div><p className="pa-kicker dark">ATENDIMENTO</p><h2>Conversas e reputação</h2></div>
            <span className="pa-text-link">Abrir →</span>
          </div>
          <div className="pa-inline-empty">A conversa com clientes fica concentrada aqui.</div>
        </Link>
      </section>
    </AppShell>
  );
}

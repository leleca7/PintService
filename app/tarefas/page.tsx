import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import ops from '@/app/components/precision-atelier-ops.module.css';
import { getDashboardData } from '@/lib/dashboard-data';

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function timestamp(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function relativeTime(value: string | null) {
  const parsed = timestamp(value);
  if (parsed === null) return 'sem horário';
  const minutes = Math.max(0, Math.floor((Date.now() - parsed) / 60_000));
  if (minutes < 60) return minutes < 1 ? 'agora' : `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `há ${hours}h` : `há ${Math.floor(hours / 24)}d`;
}

function priorityRank(priority: string) {
  const value = normalize(priority);
  if (value === 'urgente') return 4;
  if (value === 'alta') return 3;
  if (value === 'normal') return 2;
  return 1;
}

function timeValue(value: string | null) {
  return timestamp(value) ?? Number.MAX_SAFE_INTEGER;
}

function TaskFacts({ task }: { task: { setor: string; responsavel: string; status: string; criadoEm: string | null } }) {
  return (
    <div className={ops.taskFacts}>
      <div className={ops.taskFact}><span>Setor</span><strong>{task.setor || 'Não informado'}</strong></div>
      <div className={ops.taskFact}><span>Responsável</span><strong>{task.responsavel || 'Sem responsável'}</strong></div>
      <div className={ops.taskFact}><span>Status</span><strong>{task.status.replaceAll('_', ' ')}</strong></div>
      <div className={ops.taskFact}><span>Aberta</span><strong>{relativeTime(task.criadoEm)}</strong></div>
    </div>
  );
}

export default async function TasksPage() {
  const data = await getDashboardData();
  const activeStatuses = new Set(['aberta', 'em_execucao', 'aguardando_confirmacao']);
  const active = data.tasks
    .filter((task) => activeStatuses.has(normalize(task.status)))
    .sort((a, b) => priorityRank(b.prioridade) - priorityRank(a.prioridade) || timeValue(a.criadoEm) - timeValue(b.criadoEm));
  const escalated = active.filter((task) => ['alta', 'urgente'].includes(normalize(task.prioridade)));
  const base = active.filter((task) => !['alta', 'urgente'].includes(normalize(task.prioridade)));
  const resolved = data.tasks.filter((task) => normalize(task.status) === 'resolvida');
  const unassigned = active.filter((task) => !task.responsavel?.trim() || normalize(task.responsavel) === 'sem responsavel');
  const waitingConfirmation = active.filter((task) => normalize(task.status) === 'aguardando_confirmacao');
  const hasEscalation = escalated.length > 0;

  return (
    <AppShell active="tarefas" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>OPERAÇÃO · ESCALONAMENTO</p>
            <h1 className={styles.title}>Tarefas</h1>
            <p className={styles.subtitle}>A base resolve a rotina. O que ganha prioridade sobe para a equipe administrativa até receber confirmação ou decisão.</p>
          </div>
        </header>

        {hasEscalation ? (
          <section className={styles.darkBand}>
            <div className={styles.darkCopy}>
              <p className={styles.darkLabel}>TOPO DA PIRÂMIDE</p>
              <h2 className={styles.darkTitle}>{escalated.length} {escalated.length === 1 ? 'situação precisa' : 'situações precisam'} de atenção acima da rotina.</h2>
              <p className={styles.darkText}>Urgentes aparecem primeiro, seguidas pelas prioridades altas. O restante permanece na base sem disputar atenção com o que realmente exige decisão.</p>
            </div>
            <div className={styles.darkStats}>
              <div className={styles.darkStat}><strong>{escalated.length}</strong><span>no topo</span></div>
              <div className={styles.darkStat}><strong>{base.length}</strong><span>na base</span></div>
            </div>
          </section>
        ) : (
          <section className={ops.calmBand}>
            <div>
              <p className={ops.calmLabel}>OPERAÇÃO SEM ESCALONAMENTO</p>
              <h2 className={ops.calmTitle}>Nenhuma situação crítica chegou ao topo.</h2>
              <p className={ops.calmText}>As tarefas abertas continuam na base e podem ser resolvidas pela rotina administrativa sem ocupar a camada de decisão.</p>
            </div>
            <div className={ops.calmStats}>
              <div className={ops.calmStat}><strong>0</strong><span>no topo</span></div>
              <div className={ops.calmStat}><strong>{base.length}</strong><span>na base</span></div>
            </div>
          </section>
        )}

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Abertas</span><strong>{active.length}</strong><small>em acompanhamento</small></div>
          <div className={styles.summaryItem}><span>Sem responsável</span><strong>{unassigned.length}</strong><small>precisam de distribuição</small></div>
          <div className={styles.summaryItem}><span>Aguardando confirmação</span><strong>{waitingConfirmation.length}</strong><small>pendência de retorno</small></div>
          <div className={styles.summaryItem}><span>Resolvidas</span><strong>{resolved.length}</strong><small>histórico carregado</small></div>
        </div>

        {escalated.length > 0 && <section className={`${styles.section} ${ops.queueSection}`}>
          <div className={styles.sectionHead}><div><p>EXCEÇÕES</p><h2>Chegaram ao nível administrativo</h2></div><span className={`${styles.count} ${styles.countHot}`}>{escalated.length}</span></div>
          <div className={styles.taskGrid}>{escalated.map((task) => {
            const urgent = normalize(task.prioridade) === 'urgente';
            return <article className={`${styles.taskCard} ${ops.escalatedCard} ${urgent ? ops.urgentCard : ''}`} key={task.id}>
              <div className={styles.taskHead}>
                <div><span className={styles.taskCode}>#{task.codigo || task.id}</span><h3>{task.titulo}</h3></div>
                <span className={`${styles.priority} ${urgent ? ops.priorityUrgent : ops.priorityHigh}`}>{task.prioridade}</span>
              </div>
              <div className={styles.taskVehicle}><strong>{task.modelo}</strong><span>{task.placa || 'Sem placa'}</span></div>
              <p className={styles.taskInstruction}>{task.instrucoes || 'Aguardando ação operacional.'}</p>
              <TaskFacts task={task} />
            </article>;
          })}</div>
        </section>}

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>BASE OPERACIONAL</p><h2>Rotina em tratamento</h2></div><span className={styles.count}>{base.length}</span></div>
          {base.length ? <div className={styles.taskGrid}>{base.map((task) => <article className={styles.taskCard} key={task.id}>
            <div className={styles.taskHead}><div><span className={styles.taskCode}>#{task.codigo || task.id}</span><h3>{task.titulo}</h3></div><span className={styles.priority}>{task.prioridade}</span></div>
            <div className={styles.taskVehicle}><strong>{task.modelo}</strong><span>{task.placa || 'Sem placa'}</span></div>
            <p className={styles.taskInstruction}>{task.instrucoes || 'Aguardando ação operacional.'}</p>
            <TaskFacts task={task} />
          </article>)}</div> : <div className={styles.quiet}><strong>Base sem tarefas abertas.</strong>Nenhuma atividade operacional comum está pendente no recorte carregado.</div>}
        </section>

        {resolved.length > 0 && <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>HISTÓRICO</p><h2>Resolvidas recentemente</h2></div><span className={styles.count}>{resolved.length}</span></div>
          <div className={styles.list}>{resolved.slice(0, 20).map((task) => <article className={styles.row} key={task.id}>
            <div className={styles.avatar}>OK</div>
            <div className={styles.rowBody}><div className={styles.rowTop}><strong>#{task.codigo || task.id} · {task.titulo}</strong><time>{relativeTime(task.criadoEm)}</time></div><p className={styles.preview}>{task.modelo} {task.placa} · {task.responsavel}</p><div className={styles.meta}><span className={`${styles.badge} ${styles.badgeAi}`}>resolvida</span></div></div>
          </article>)}</div>
        </section>}
      </div>
    </AppShell>
  );
}

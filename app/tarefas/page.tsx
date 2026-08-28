import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getDashboardData } from '@/lib/dashboard-data';

function relativeTime(value: string | null) {
  if (!value) return 'sem horário';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return minutes < 1 ? 'agora' : `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `há ${hours}h` : `há ${Math.floor(hours / 24)}d`;
}

export default async function TasksPage() {
  const data = await getDashboardData();
  const active = data.tasks.filter((task) => ['aberta', 'em_execucao', 'aguardando_confirmacao'].includes(task.status));
  const escalated = active.filter((task) => ['alta', 'urgente'].includes(task.prioridade));
  const base = active.filter((task) => !['alta', 'urgente'].includes(task.prioridade));
  const resolved = data.tasks.filter((task) => task.status === 'resolvida');
  const unassigned = active.filter((task) => task.responsavel === 'Sem responsável');
  const waitingConfirmation = active.filter((task) => task.status === 'aguardando_confirmacao');

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

        <section className={styles.darkBand}>
          <div className={styles.darkCopy}>
            <p className={styles.darkLabel}>TOPO DA PIRÂMIDE</p>
            <h2 className={styles.darkTitle}>{escalated.length ? `${escalated.length} ${escalated.length === 1 ? 'situação precisa' : 'situações precisam'} de atenção acima da rotina.` : 'Nenhuma situação crítica chegou ao topo.'}</h2>
            <p className={styles.darkText}>{escalated.length ? 'Essas tarefas estão classificadas como alta ou urgente e não devem competir visualmente com o restante da operação.' : 'As tarefas abertas continuam na base e podem ser resolvidas sem escalar a gestão.'}</p>
          </div>
          <div className={styles.darkStats}>
            <div className={styles.darkStat}><strong>{escalated.length}</strong><span>no topo</span></div>
            <div className={styles.darkStat}><strong>{base.length}</strong><span>na base</span></div>
          </div>
        </section>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Abertas</span><strong>{active.length}</strong><small>em acompanhamento</small></div>
          <div className={styles.summaryItem}><span>Sem responsável</span><strong>{unassigned.length}</strong><small>precisam de distribuição</small></div>
          <div className={styles.summaryItem}><span>Aguardando confirmação</span><strong>{waitingConfirmation.length}</strong><small>pendência de retorno</small></div>
          <div className={styles.summaryItem}><span>Resolvidas</span><strong>{resolved.length}</strong><small>histórico carregado</small></div>
        </div>

        {escalated.length > 0 && <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>EXCEÇÕES</p><h2>Chegaram ao nível administrativo</h2></div><span className={`${styles.count} ${styles.countHot}`}>{escalated.length}</span></div>
          <div className={styles.taskGrid}>{escalated.map((task) => <article className={`${styles.taskCard} ${styles.taskCardCritical}`} key={task.id}>
            <div className={styles.taskHead}><div><span className={styles.taskCode}>#{task.codigo || task.id}</span><h3>{task.titulo}</h3></div><span className={`${styles.priority} ${styles.priorityHot}`}>{task.prioridade}</span></div>
            <div className={styles.taskVehicle}><strong>{task.modelo}</strong><span>{task.placa || 'Sem placa'}</span></div>
            <p className={styles.taskInstruction}>{task.instrucoes || 'Aguardando ação operacional.'}</p>
            <div className={styles.taskFooter}><span>{task.setor}</span><span>{task.responsavel}</span><span>{task.status.replaceAll('_', ' ')}</span><span>{relativeTime(task.criadoEm)}</span></div>
          </article>)}</div>
        </section>}

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>BASE OPERACIONAL</p><h2>Rotina em tratamento</h2></div><span className={styles.count}>{base.length}</span></div>
          {base.length ? <div className={styles.taskGrid}>{base.map((task) => <article className={styles.taskCard} key={task.id}>
            <div className={styles.taskHead}><div><span className={styles.taskCode}>#{task.codigo || task.id}</span><h3>{task.titulo}</h3></div><span className={styles.priority}>{task.prioridade}</span></div>
            <div className={styles.taskVehicle}><strong>{task.modelo}</strong><span>{task.placa || 'Sem placa'}</span></div>
            <p className={styles.taskInstruction}>{task.instrucoes || 'Aguardando ação operacional.'}</p>
            <div className={styles.taskFooter}><span>{task.setor}</span><span>{task.responsavel}</span><span>{task.status.replaceAll('_', ' ')}</span><span>{relativeTime(task.criadoEm)}</span></div>
          </article>)}</div> : <div className={styles.quiet}><strong>Base sem tarefas abertas.</strong>Nenhuma atividade operacional comum está pendente no recorte carregado.</div>}
        </section>

        {resolved.length > 0 && <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>HISTÓRICO</p><h2>Resolvidas recentemente</h2></div><span className={styles.count}>{resolved.length}</span></div>
          <div className={styles.list}>{resolved.slice(0, 20).map((task) => <article className={styles.row} key={task.id}>
            <div className={styles.avatar}>OK</div>
            <div className={styles.rowBody}><div className={styles.rowTop}><strong>#{task.codigo} · {task.titulo}</strong><time>{relativeTime(task.criadoEm)}</time></div><p className={styles.preview}>{task.modelo} {task.placa} · {task.responsavel}</p><div className={styles.meta}><span className={`${styles.badge} ${styles.badgeAi}`}>resolvida</span></div></div>
          </article>)}</div>
        </section>}
      </div>
    </AppShell>
  );
}

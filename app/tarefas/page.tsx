import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';

function ageMinutes(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
}

function relativeTime(value: string | null) {
  const minutes = ageMinutes(value);
  if (!Number.isFinite(minutes)) return 'sem horário';
  if (minutes < 60) return minutes < 1 ? 'agora' : `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `há ${hours}h` : `há ${Math.floor(hours / 24)}d`;
}

function attentionLabel(value: string | null) {
  const minutes = ageMinutes(value);
  if (!Number.isFinite(minutes)) return 'Sem horário de criação: vale revisar manualmente.';
  if (minutes >= 240) return 'Há 4h ou mais sem conclusão: candidato a escalonamento para gerente.';
  if (minutes >= 120) return 'Há 2h ou mais aberta: vale lembrar o responsável.';
  return '';
}

const priorityWeight: Record<string, number> = { urgente: 0, alta: 1, normal: 2, baixa: 3 };

export default async function TasksPage() {
  const data = await getDashboardData();
  const active = data.tasks
    .filter((task) => ['aberta', 'em_execucao', 'aguardando_confirmacao'].includes(task.status))
    .sort((a, b) => (priorityWeight[a.prioridade] ?? 4) - (priorityWeight[b.prioridade] ?? 4) || ageMinutes(b.criadoEm) - ageMinutes(a.criadoEm));
  const resolved = data.tasks.filter((task) => task.status === 'resolvida');
  const unassigned = active.filter((task) => task.responsavel === 'Sem responsável');
  const waitingConfirmation = active.filter((task) => task.status === 'aguardando_confirmacao');
  const delayed = active.filter((task) => ageMinutes(task.criadoEm) >= 120);

  return (
    <AppShell active="tarefas" source={data.source}>
      <header className="topbar"><div><p className="eyebrow">OPERAÇÃO</p><h1>Tarefas</h1><p>Confirmações físicas pedidas pela IA e atividades que ainda precisam da equipe.</p></div></header>
      <section className="metrics compact-metrics">
        <article><div className="metric-icon">AB</div><div><span>Abertas</span><strong>{active.length}</strong><small>em acompanhamento</small></div></article>
        <article><div className="metric-icon">SR</div><div><span>Sem responsável</span><strong>{unassigned.length}</strong><small>precisam de distribuição</small></div></article>
        <article><div className="metric-icon">AT</div><div><span>Abertas há 2h+</span><strong>{delayed.length}</strong><small>merecem lembrete</small></div></article>
        <article><div className="metric-icon">CF</div><div><span>Aguardando confirmação</span><strong>{waitingConfirmation.length}</strong><small>resposta já recebida</small></div></article>
      </section>

      <section className="panel page-panel">
        <div className="panel-head"><div><p className="eyebrow">FILA ATUAL</p><h2>Equipe precisa agir</h2></div><span className="count">{active.length} abertas</span></div>
        <div className="task-board">
          {active.map((task) => {
            const attention = attentionLabel(task.criadoEm);
            return <article className="task-card" key={task.id}><div className="task-card-head"><div className={`task-symbol ${task.prioridade}`}>{task.requerFoto ? 'FT' : 'TK'}</div><div><span className="mini-label">#{task.codigo}</span><h3>{task.titulo}</h3></div><span className={`task-priority ${task.prioridade}`}>{task.prioridade}</span></div><div className="task-vehicle"><strong>{task.modelo}</strong><span>{task.placa || 'Sem placa'}</span></div><p className="task-instruction">{task.instrucoes}</p><dl className="task-meta"><div><dt>Setor</dt><dd>{task.setor}</dd></div><div><dt>Responsável</dt><dd>{task.responsavel}</dd></div><div><dt>Status</dt><dd>{task.status.replaceAll('_', ' ')}</dd></div><div><dt>Criada</dt><dd>{relativeTime(task.criadoEm)}</dd></div></dl>{attention && <div className="task-note">{attention}</div>} {!attention && <div className="task-note">{task.responsavel === 'Sem responsável' ? 'A tarefa permanece aberta sem escolher alguém arbitrariamente.' : 'Com WhatsApp cadastrado, a confirmação pode continuar pelo número do responsável.'}</div>}</article>;
          })}
        </div>
        {!active.length && <div className="empty-state">Nenhuma tarefa operacional aberta.</div>}
      </section>

      {resolved.length > 0 && <section className="panel page-panel"><div className="panel-head"><div><p className="eyebrow">HISTÓRICO</p><h2>Resolvidas recentemente</h2></div><span className="count">{resolved.length} resolvidas</span></div><div className="task-list">{resolved.slice(0, 20).map((task) => <article className="task-row" key={task.id}><div className="task-symbol normal">OK</div><div><strong>#{task.codigo} · {task.titulo}</strong><p>{task.modelo} {task.placa} · {task.responsavel}</p></div><span className="tag ai">resolvida</span></article>)}</div></section>}
    </AppShell>
  );
}

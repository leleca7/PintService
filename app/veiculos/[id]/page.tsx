import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import ops from '@/app/components/precision-atelier-ops.module.css';
import { getVehicleDetail } from '@/lib/dashboard-data';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { updateVehicle } from '../actions';

const STAGES = ['Desmontagem', 'Funilaria', 'Preparação de pintura', 'Pintura', 'Montagem', 'Polimento', 'Lavagem'];
function normalize(value = '') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
function timestamp(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}
function dateTime(value: string | null) {
  const parsed = timestamp(value);
  if (parsed === null) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bahia' }).format(new Date(parsed));
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, user] = await Promise.all([getVehicleDetail(decodeURIComponent(id)), getCurrentAppUser()]);
  if (!data.vehicle) notFound();
  const vehicle = data.vehicle;
  const canManage = userHasPermission(user, 'gerenciar_veiculos');
  const currentIndex = STAGES.findIndex((stage) => normalize(vehicle.etapa).includes(normalize(stage)));
  const activeStatuses = new Set(['aberta', 'em_execucao', 'aguardando_confirmacao']);
  const activeTasks = data.tasks.filter((task) => activeStatuses.has(normalize(task.status)));
  const escalated = activeTasks.filter((task) => ['alta', 'urgente'].includes(normalize(task.prioridade)));
  const humanConversations = data.conversations.filter((conversation) => normalize(conversation.status).includes('humano'));

  return (
    <AppShell active="veiculos" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}><p className={styles.kicker}>FICHA OPERACIONAL · {vehicle.placa}</p><h1 className={styles.title}>{vehicle.modelo}</h1><p className={styles.subtitle}>{vehicle.cliente}{vehicle.cor ? ` · ${vehicle.cor}` : ''}</p></div>
          <Link className={styles.button} href="/veiculos">Voltar aos veículos</Link>
        </header>

        <section className={styles.darkBand}>
          <div className={styles.darkCopy}>
            <p className={styles.darkLabel}>ETAPA ATUAL</p>
            <h2 className={styles.darkTitle}>{vehicle.etapa || 'Etapa não informada'}</h2>
            <p className={styles.darkText}>{vehicle.status || 'Status não informado'}. Última atualização registrada em {dateTime(vehicle.ultimaAtualizacao)}.</p>
          </div>
          <div className={styles.darkStats}>
            <div className={styles.darkStat}><strong>{activeTasks.length}</strong><span>tarefas abertas</span></div>
            <div className={styles.darkStat}><strong>{escalated.length + humanConversations.length}</strong><span>exceções ligadas</span></div>
          </div>
        </section>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Cliente</span><strong className={ops.summaryTextValue}>{vehicle.cliente}</strong><small>responsável pelo veículo</small></div>
          <div className={styles.summaryItem}><span>Placa</span><strong className={ops.summaryPlateValue}>{vehicle.placa}</strong><small>identificação operacional</small></div>
          <div className={styles.summaryItem}><span>Tarefas abertas</span><strong>{activeTasks.length}</strong><small>{escalated.length} escaladas</small></div>
          <div className={styles.summaryItem}><span>Conversas ligadas</span><strong>{data.conversations.length}</strong><small>{humanConversations.length} com humano</small></div>
        </div>

        {canManage && <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>EDIÇÃO INTERNA</p><h2>Atualizar cadastro confirmado</h2></div></div>
          <form action={updateVehicle} className={ops.detailForm}>
            <input type="hidden" name="id" value={vehicle.id}/>
            <label className={ops.detailField}>Modelo<input name="modelo" defaultValue={vehicle.modelo}/></label>
            <label className={ops.detailField}>Cor<input name="cor" defaultValue={vehicle.cor}/></label>
            <label className={ops.detailField}>Etapa / setor<input name="setor" defaultValue={vehicle.etapa}/></label>
            <label className={ops.detailField}>Status<input name="status" defaultValue={vehicle.status}/></label>
            <label className={`${ops.detailField} ${ops.detailFieldWide}`}>Observações<textarea name="observacoes" placeholder="Informação interna confirmada pela equipe"/></label>
            <div className={ops.detailFormActions}><button className={styles.button} type="submit">Salvar alterações</button></div>
          </form>
          <p className={ops.detailHint}>Quando a fonte por link estiver ativa, Fase e Status consultados da planilha continuam sendo a referência operacional para respostas ao cliente.</p>
        </section>}

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>LINHA DE PRODUÇÃO</p><h2>Etapas do veículo</h2></div></div>
          <div className={ops.timeline}>{STAGES.map((stage, index) => {
            const state = currentIndex < 0 ? 'future' : index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'future';
            const stateClass = state === 'done' ? ops.timelineDone : state === 'current' ? ops.timelineCurrent : ops.timelineFuture;
            return <div className={`${ops.timelineStep} ${stateClass}`} key={stage}>
              <span className={ops.timelineIndex}>{state === 'done' ? '✓' : index + 1}</span>
              <div><strong>{stage}</strong><small>{state === 'done' ? 'Concluída anteriormente' : state === 'current' ? 'Etapa registrada agora' : 'Ainda não registrada'}</small></div>
            </div>;
          })}</div>
        </section>

        <div className={styles.split}>
          <section className={styles.section}><div className={styles.sectionHead}><div><p>TAREFAS</p><h2>Tarefas deste veículo</h2></div><Link href="/tarefas" className="link-button">Todas</Link></div>{data.tasks.length ? <div className={styles.list}>{data.tasks.map((task) => {
            const priorityIsHigh = ['alta', 'urgente'].includes(normalize(task.prioridade));
            return <article className={`${styles.row} ${priorityIsHigh ? styles.rowCritical : ''}`} key={task.id}><div className={styles.avatar}>{task.requerFoto ? 'FT' : 'TK'}</div><div className={styles.rowBody}><div className={styles.rowTop}><strong>#{task.codigo || task.id} · {task.titulo}</strong><time>{task.status.replaceAll('_', ' ')}</time></div><p className={styles.preview}>{task.setor} · {task.responsavel}</p><div className={styles.meta}><span className={`${styles.badge} ${priorityIsHigh ? styles.badgeHot : styles.badgeAi}`}>{task.prioridade}</span></div></div></article>;
          })}</div> : <div className={styles.quiet}><strong>Nenhuma tarefa ligada.</strong>Este veículo não possui tarefas no histórico carregado.</div>}</section>

          <section className={styles.section}><div className={styles.sectionHead}><div><p>ATENDIMENTO</p><h2>Conversas relacionadas</h2></div><Link href="/atendimento" className="link-button">Central</Link></div>{data.conversations.length ? <div className={styles.list}>{data.conversations.map((conversation) => {
            const requiresHuman = normalize(conversation.status).includes('humano');
            return <article className={`${styles.row} ${requiresHuman ? styles.rowCritical : ''}`} key={conversation.id}><div className={styles.avatar}>{conversation.cliente.slice(0,2).toUpperCase()}</div><div className={styles.rowBody}><div className={styles.rowTop}><strong>{conversation.cliente}</strong><time>{dateTime(conversation.criadoEm)}</time></div><p className={styles.preview}>{conversation.mensagem}</p><div className={styles.meta}><span className={`${styles.badge} ${requiresHuman ? styles.badgeHuman : styles.badgeAi}`}>{conversation.status}</span></div></div></article>;
          })}</div> : <div className={styles.quiet}><strong>Nenhuma conversa vinculada.</strong>O atendimento deste veículo ainda não aparece no histórico carregado.</div>}</section>
        </div>

        <section className={styles.section}><div className={styles.sectionHead}><div><p>FOTOS E EVIDÊNCIAS</p><h2>Histórico visual</h2></div></div><div className={styles.quiet}><strong>Armazenamento de mídia ainda será conectado.</strong>Fotos recebidas em tarefas ficarão vinculadas ao histórico operacional quando o WhatsApp e o armazenamento real forem ativados.</div></section>
      </div>
    </AppShell>
  );
}

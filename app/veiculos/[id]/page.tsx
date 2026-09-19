import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import ops from '@/app/components/precision-atelier-ops.module.css';
import { getVehicleDetail } from '@/lib/dashboard-data';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { normalizeOperationalStage, OPERATION_STAGES } from '@/lib/operation-stages';
import { updateVehicle } from '../actions';
import { getVehicleMedia } from '@/lib/vehicle-media';

function dateTime(value: string | null) {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bahia' }).format(new Date(value));
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, user, media] = await Promise.all([
    getVehicleDetail(decodeURIComponent(id)),
    getCurrentAppUser(),
    getVehicleMedia(decodeURIComponent(id)),
  ]);
  if (!data.vehicle) notFound();
  const vehicle = data.vehicle;
  const canManage = userHasPermission(user, 'gerenciar_veiculos');
  const currentStage = normalizeOperationalStage(vehicle.etapa);
  const currentIndex = currentStage ? OPERATION_STAGES.indexOf(currentStage) : -1;
  const activeTasks = data.tasks.filter((task) => ['aberta', 'em_execucao', 'aguardando_confirmacao'].includes(task.status));
  const escalated = activeTasks.filter((task) => ['alta', 'urgente'].includes(task.prioridade));
  const humanConversations = data.conversations.filter((conversation) => conversation.status.includes('humano'));

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
            <h2 className={styles.darkTitle}>{currentStage || vehicle.etapa || 'Etapa não informada'}</h2>
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

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div><p>ACESSO RÁPIDO</p><h2>QR do veículo</h2></div>
            <a className="link-button" href={`/api/veiculos/${vehicle.id}/qr`} target="_blank" rel="noreferrer">Abrir para imprimir</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 18, alignItems: 'center' }}>
            <img src={`/api/veiculos/${vehicle.id}/qr`} alt={`QR operacional do veículo ${vehicle.placa}`} width="140" height="140"/>
            <div>
              <strong>{vehicle.placa}</strong>
              <p className={styles.subtitle}>Cole este QR no cartão/ordem do veículo. Funcionários autenticados escaneiam e caem direto nesta ficha, sem pesquisar placa ou cliente.</p>
            </div>
          </div>
        </section>

        {canManage && <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>EDIÇÃO INTERNA</p><h2>Atualizar cadastro confirmado</h2></div></div>
          <form action={updateVehicle} className={ops.detailForm}>
            <input type="hidden" name="id" value={vehicle.id}/>
            <label className={ops.detailField}>Modelo<input name="modelo" defaultValue={vehicle.modelo}/></label>
            <label className={ops.detailField}>Cor<input name="cor" defaultValue={vehicle.cor}/></label>
            <label className={ops.detailField}>Etapa / setor<select name="setor" defaultValue={currentStage ?? ''}><option value="">Não informada</option>{OPERATION_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label>
            <label className={ops.detailField}>Status<input name="status" defaultValue={vehicle.status}/></label>
            <label className={`${ops.detailField} ${ops.detailFieldWide}`}>Observações<textarea name="observacoes" placeholder="Informação interna confirmada pela equipe"/></label>
            <div className={ops.detailFormActions}><button className={styles.button} type="submit">Salvar alterações</button></div>
          </form>
          <p className={ops.detailHint}>A atualização operacional diária deve ser feita pelo Modo Operação. Esta edição permanece disponível para ajustes administrativos confirmados.</p>
        </section>}

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>LINHA DE PRODUÇÃO</p><h2>Etapas do veículo</h2></div></div>
          <div className={ops.timeline}>{OPERATION_STAGES.map((stage, index) => {
            const state = currentIndex < 0 ? 'future' : index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'future';
            const stateClass = state === 'done' ? ops.timelineDone : state === 'current' ? ops.timelineCurrent : ops.timelineFuture;
            return <div className={`${ops.timelineStep} ${stateClass}`} key={stage}>
              <span className={ops.timelineIndex}>{state === 'done' ? '✓' : index + 1}</span>
              <div><strong>{stage}</strong><small>{state === 'done' ? 'Concluída anteriormente' : state === 'current' ? 'Etapa registrada agora' : 'Ainda não registrada'}</small></div>
            </div>;
          })}</div>
        </section>

        <div className={styles.split}>
          <section className={styles.section}><div className={styles.sectionHead}><div><p>TAREFAS</p><h2>Pendências deste veículo</h2></div><Link href="/tarefas" className="link-button">Todas</Link></div>{data.tasks.length ? <div className={styles.list}>{data.tasks.map((task) => <article className={`${styles.row} ${['alta','urgente'].includes(task.prioridade) ? styles.rowCritical : ''}`} key={task.id}><div className={styles.avatar}>{task.requerFoto ? 'FT' : 'TK'}</div><div className={styles.rowBody}><div className={styles.rowTop}><strong>#{task.codigo} · {task.titulo}</strong><time>{task.status.replaceAll('_', ' ')}</time></div><p className={styles.preview}>{task.setor} · {task.responsavel}</p><div className={styles.meta}><span className={`${styles.badge} ${['alta','urgente'].includes(task.prioridade) ? styles.badgeHot : styles.badgeAi}`}>{task.prioridade}</span></div></div></article>)}</div> : <div className={styles.quiet}><strong>Nenhuma pendência ligada.</strong>Este veículo não possui tarefas no histórico carregado.</div>}</section>

          <section className={styles.section}><div className={styles.sectionHead}><div><p>ATENDIMENTO</p><h2>Conversas relacionadas</h2></div><Link href="/atendimento" className="link-button">Central</Link></div>{data.conversations.length ? <div className={styles.list}>{data.conversations.map((conversation) => <article className={`${styles.row} ${conversation.status.includes('humano') ? styles.rowCritical : ''}`} key={conversation.id}><div className={styles.avatar}>{conversation.cliente.slice(0,2).toUpperCase()}</div><div className={styles.rowBody}><div className={styles.rowTop}><strong>{conversation.cliente}</strong><time>{dateTime(conversation.criadoEm)}</time></div><p className={styles.preview}>{conversation.mensagem}</p><div className={styles.meta}><span className={`${styles.badge} ${conversation.status.includes('humano') ? styles.badgeHuman : styles.badgeAi}`}>{conversation.status}</span></div></div></article>)}</div> : <div className={styles.quiet}><strong>Nenhuma conversa vinculada.</strong>O atendimento deste veículo ainda não aparece no histórico carregado.</div>}</section>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>FOTOS E EVIDÊNCIAS</p><h2>Histórico visual</h2></div><span className={styles.count}>{media.length}</span></div>
          {media.length ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
            {media.map((item) => <article key={item.id} style={{border:'1px solid var(--line,#d9dde3)',borderRadius:14,padding:10,display:'grid',gap:8}}>
              {item.mediaType === 'audio'
                ? <audio controls preload="none" src={`/api/media/whatsapp/${encodeURIComponent(item.mediaId)}`} style={{width:'100%'}}/>
                : <img src={`/api/media/whatsapp/${encodeURIComponent(item.mediaId)}`} alt={item.caption || `Evidência de ${vehicle.placa}`} style={{width:'100%',aspectRatio:'4/3',objectFit:'cover',borderRadius:10,background:'#111'}}/>}
              <small>{dateTime(item.createdAt)} · {item.event.replaceAll('_',' ')}</small>
              {item.caption && <p className={styles.preview}>{item.caption}</p>}
            </article>)}
          </div> : <div className={styles.quiet}><strong>Nenhuma mídia vinculada ainda.</strong>Fotos e áudios confirmados pelo WhatsApp aparecerão aqui enquanto estiverem disponíveis na origem.</div>}
        </section>
      </div>
    </AppShell>
  );
}

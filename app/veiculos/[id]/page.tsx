import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '@/app/components/app-shell';
import { getVehicleDetail } from '@/lib/dashboard-data';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { updateVehicle } from '../actions';

const STAGES = ['Desmontagem', 'Funilaria', 'Preparação de pintura', 'Pintura', 'Montagem', 'Polimento', 'Lavagem'];
function normalize(value = '') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function dateTime(value: string | null) {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bahia' }).format(new Date(value));
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, user] = await Promise.all([getVehicleDetail(decodeURIComponent(id)), getCurrentAppUser()]);
  if (!data.vehicle) notFound();
  const vehicle = data.vehicle;
  const canManage = userHasPermission(user, 'gerenciar_veiculos');
  const currentIndex = STAGES.findIndex((stage) => normalize(vehicle.etapa).includes(normalize(stage)));

  return (
    <AppShell active="veiculos" source={data.source}>
      <header className="topbar"><div><p className="eyebrow">FICHA DO VEÍCULO</p><h1>{vehicle.modelo}</h1><p>{vehicle.placa} · {vehicle.cliente}</p></div><div className="top-actions"><Link className="ghost action-link" href="/veiculos">Voltar</Link></div></header>

      <section className="vehicle-hero panel">
        <div className="vehicle-hero-main"><div className="vehicle-big-icon">PS</div><div><span className="mini-label">ETAPA ATUAL</span><h2>{vehicle.etapa}</h2><p>{vehicle.status}{vehicle.cor ? ` · ${vehicle.cor}` : ''}</p></div></div>
        <div className="vehicle-hero-meta"><div><span>Cliente</span><strong>{vehicle.cliente}</strong></div><div><span>Última atualização</span><strong>{dateTime(vehicle.ultimaAtualizacao)}</strong></div><div><span>Tarefas ligadas</span><strong>{data.tasks.length}</strong></div></div>
      </section>

      {canManage && <section className="panel page-panel"><div className="panel-head"><div><p className="eyebrow">EDIÇÃO</p><h2>Atualizar cadastro interno</h2></div></div><form action={updateVehicle} className="settings-grid"><input type="hidden" name="id" value={vehicle.id}/><label>Modelo<input name="modelo" defaultValue={vehicle.modelo}/></label><label>Cor<input name="cor" defaultValue={vehicle.cor}/></label><label>Etapa / setor<input name="setor" defaultValue={vehicle.etapa}/></label><label>Status<input name="status" defaultValue={vehicle.status}/></label><label className="form-wide">Observações<textarea name="observacoes" placeholder="Informação interna confirmada pela equipe"/></label><div><button className="ghost action-link" type="submit">Salvar alterações</button></div></form><p className="section-intro">Quando a fonte por link estiver ativa, Fase e Status consultados da planilha continuam sendo a referência operacional para respostas ao cliente.</p></section>}

      <section className="panel page-panel"><div className="panel-head"><div><p className="eyebrow">LINHA DE PRODUÇÃO</p><h2>Etapas do veículo</h2></div></div><div className="timeline-stages">{STAGES.map((stage, index) => { const state = currentIndex < 0 ? 'future' : index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'future'; return <div className={`timeline-stage ${state}`} key={stage}><span>{state === 'done' ? '✓' : index + 1}</span><div><strong>{stage}</strong><small>{state === 'done' ? 'Concluída anteriormente' : state === 'current' ? 'Etapa registrada agora' : 'Ainda não registrada'}</small></div></div>; })}</div></section>

      <div className="detail-grid">
        <section className="panel page-panel"><div className="panel-head"><div><p className="eyebrow">TAREFAS</p><h2>Pendências deste veículo</h2></div><Link href="/tarefas" className="link-button">Todas</Link></div><div className="task-list">{data.tasks.map((task) => <article className="task-row" key={task.id}><div className={`task-symbol ${task.prioridade}`}>{task.requerFoto ? 'FT' : 'TK'}</div><div><strong>#{task.codigo} · {task.titulo}</strong><p>{task.setor} · {task.responsavel}</p></div><span className={`task-status ${task.status}`}>{task.status.replaceAll('_', ' ')}</span></article>)}{!data.tasks.length && <div className="empty-state compact-empty">Nenhuma tarefa ligada a este veículo.</div>}</div></section>

        <section className="panel page-panel"><div className="panel-head"><div><p className="eyebrow">ATENDIMENTO</p><h2>Conversas relacionadas</h2></div><Link href="/atendimento" className="link-button">Central</Link></div><div className="task-list">{data.conversations.map((conversation) => <article className="message-row" key={conversation.id}><div><strong>{conversation.cliente}</strong><small>{dateTime(conversation.criadoEm)}</small></div><p>{conversation.mensagem}</p><span className={conversation.status.includes('humano') ? 'tag human' : 'tag ai'}>{conversation.status}</span></article>)}{!data.conversations.length && <div className="empty-state compact-empty">Nenhuma conversa vinculada a este veículo.</div>}</div></section>
      </div>

      <section className="panel page-panel evidence-panel"><div className="panel-head"><div><p className="eyebrow">FOTOS E EVIDÊNCIAS</p><h2>Histórico visual</h2></div></div><div className="empty-state">Fotos recebidas em tarefas ficam vinculadas ao histórico operacional. A exibição permanente depende do armazenamento de mídia que será ativado junto com o WhatsApp real.</div></section>
    </AppShell>
  );
}

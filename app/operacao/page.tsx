import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { getCapacityData } from '@/lib/capacity-data';
import { getOperationData } from '@/lib/operation-data';
import { OPERATION_STAGES } from '@/lib/operation-stages';
import { finalizeOperationalVehicle, updateOperationalVehicle } from './actions';
import local from './operacao.module.css';

const STATUS_OPTIONS = [
  'Em serviço',
  'Aguardando peças',
  'Aguardando aprovação',
  'Parado',
  'Pronto para entrega',
];

const STOP_REASON_OPTIONS = [
  '',
  'Aguardando peça',
  'Aguardando seguradora',
  'Aguardando cliente',
  'Retrabalho',
  'Capacidade interna',
  'Problema técnico',
  'Outro',
];

function formatDate(value: string | null) {
  if (!value) return 'Não informada';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Bahia' }).format(new Date(`${value}T12:00:00-03:00`));
}

function daysInShop(value: string | null) {
  if (!value) return null;
  const start = new Date(`${value}T12:00:00-03:00`).getTime();
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12).getTime();
  return Math.max(0, Math.floor((localToday - start) / 86_400_000));
}

function stageElapsed(value: string | null) {
  if (!value) return 'tempo não calculado';
  const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000));
  if (hours < 24) return `${hours}h nesta etapa`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h nesta etapa`;
}

function todayInBahia() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function capacityClass(status: 'ok' | 'limit' | 'over') {
  if (status === 'over') return local.capacityOver;
  if (status === 'limit') return local.capacityLimit;
  return local.capacityOk;
}

export default async function OperationPage() {
  const [data, capacity, user] = await Promise.all([getOperationData(), getCapacityData(), getCurrentAppUser()]);
  const today = todayInBahia();
  const capacityByStage = new Map(capacity.phases.map((phase) => [phase.fase, phase]));
  const overCapacity = capacity.phases.filter((phase) => phase.situacao === 'over').length;
  const blockedQueues = capacity.phases.filter((phase) => phase.filaTravada).length;
  const canManageEntryQueue = userHasPermission(user, 'gerenciar_fila_entrada');
  const canManageParts = userHasPermission(user, 'gerenciar_pecas');
  const canViewTasks = userHasPermission(user, 'ver_todas_tarefas') || userHasPermission(user, 'ver_proprias_tarefas');

  return (
    <AppShell active="operacao" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>OFICINA · ROTINA OPERACIONAL</p>
            <h1 className={styles.title}>Oficina</h1>
            <p className={styles.subtitle}>Veja os veículos em produção e atualize somente o que mudou. O sistema reaproveita essa informação no restante da operação.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {canManageEntryQueue && <Link className={styles.button} href="/operacao/fila">Entradas</Link>}
            {canManageParts && <Link className={styles.button} href="/operacao/pecas">Peças</Link>}
            {canViewTasks && <Link className={styles.button} href="/tarefas">Minhas tarefas</Link>}
            <Link className={styles.button} href="/operacao/pos-entrega">Pós-entrega</Link>
          </div>
        </header>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Em andamento</span><strong>{data.vehicles.length}</strong><small>veículos visíveis para seu acesso</small></div>
          <div className={styles.summaryItem}><span>Acima da capacidade</span><strong>{overCapacity}</strong><small>fases com sobrecarga agora</small></div>
          <div className={styles.summaryItem}><span>Sem previsão</span><strong>{data.vehicles.filter((v) => !v.previsaoSaida).length}</strong><small>precisam de definição operacional</small></div>
          <div className={styles.summaryItem}><span>Fila possivelmente travada</span><strong>{blockedQueues}</strong><small>sobrecarga somada a atraso</small></div>
        </div>

        {capacity.phases.length > 0 && (
          <section className={local.capacityStrip} aria-label="Resumo da capacidade por fase">
            {capacity.phases.map((phase) => (
              <Link href="/operacao/capacidade" className={`${local.capacityItem} ${capacityClass(phase.situacao)}`} key={phase.fase}>
                <span>{phase.fase}</span>
                <strong>{phase.emAndamento}/{phase.capacidadeMaxima}</strong>
                <small>{phase.situacao === 'over' ? 'Acima' : phase.situacao === 'limit' ? 'No limite' : `${phase.vagasLivres} vaga${phase.vagasLivres === 1 ? '' : 's'}`}</small>
              </Link>
            ))}
          </section>
        )}

        {(data.error || capacity.error) && <section className={styles.section}><div className={styles.quiet}><strong>Há uma informação operacional indisponível.</strong>{data.error || capacity.error}</div></section>}

        <section className={styles.section}>
          <div className={local.toolbar}>
            <div className={styles.sectionHead}><div><p>EM PRODUÇÃO</p><h2>Veículos da oficina</h2></div><span className={styles.count}>{data.vehicles.length}</span></div>
          </div>

          {data.vehicles.length ? (
            <div className={local.grid}>
              {data.vehicles.map((vehicle) => {
                const days = daysInShop(vehicle.dataEntrada);
                const phaseCapacity = capacityByStage.get(vehicle.etapa);
                const overdue = Boolean(vehicle.previsaoSaida && vehicle.previsaoSaida < today);
                const queueAlert = Boolean(overdue && phaseCapacity?.situacao === 'over');
                return (
                  <article className={`${local.card} ${queueAlert ? local.cardQueueAlert : ''}`} key={vehicle.id}>
                    <div className={local.cardHead}>
                      <div>
                        <span className={styles.badge}>{vehicle.etapa || 'Etapa não informada'}</span>
                        <h2>{vehicle.modelo}</h2>
                      </div>
                      <span className={local.plate}>{vehicle.placa}</span>
                    </div>

                    {queueAlert && (
                      <div className={local.queueAlert}>
                        <strong>Alerta de fila</strong>
                        <span>Veículo atrasado em uma fase acima da capacidade. Pode estar impactando os carros seguintes.</span>
                      </div>
                    )}

                    <div className={local.meta}>
                      <div><span>Cliente</span><strong>{vehicle.cliente}</strong></div>
                      <div><span>Seguradora</span><strong>{vehicle.seguradora || 'Não informada'}</strong></div>
                      <div><span>Entrada</span><strong>{formatDate(vehicle.dataEntrada)}</strong></div>
                      <div><span>Dias em casa</span><strong>{days == null ? '—' : days}</strong></div>
                      <div><span>Previsão informada</span><strong>{formatDate(vehicle.previsaoSaida)}</strong></div>
                      <div><span>Previsão operacional</span><strong>{formatDate(vehicle.previsaoIa)}</strong></div>
                      <div><span>Responsável</span><strong>{vehicle.responsavel || 'Não definido'}</strong></div>
                      <div><span>Tempo na etapa</span><strong>{stageElapsed(vehicle.etapaIniciadaEm)}</strong></div>
                    </div>

                    <form action={updateOperationalVehicle} className={local.form}>
                      <input type="hidden" name="id" value={vehicle.id}/>

                      <label className={local.field}>
                        <span>Etapa atual</span>
                        <select name="setor" defaultValue={vehicle.etapa} required>
                          <option value="" disabled>Selecione</option>
                          {OPERATION_STAGES.map((stage) => <option value={stage} key={stage}>{stage}</option>)}
                        </select>
                      </label>

                      <label className={local.field}>
                        <span>Status</span>
                        <select name="status" defaultValue={vehicle.status || 'Em serviço'}>
                          {STATUS_OPTIONS.map((status) => <option value={status} key={status}>{status}</option>)}
                        </select>
                      </label>

                      <label className={local.field}>
                        <span>Previsão de saída</span>
                        <input type="date" name="previsao_saida" defaultValue={vehicle.previsaoSaida ?? ''}/>
                      </label>

                      <label className={local.field}>
                        <span>Motivo de parada</span>
                        <select name="motivo_parada" defaultValue={vehicle.motivoParada}>
                          {STOP_REASON_OPTIONS.map((reason) => <option value={reason} key={reason || 'none'}>{reason || 'Sem motivo de parada'}</option>)}
                        </select>
                      </label>

                      <label className={`${local.field} ${local.fieldWide}`}>
                        <span>Detalhe da parada</span>
                        <input name="motivo_parada_detalhe" defaultValue={vehicle.motivoParadaDetalhe} placeholder="Ex.: farol direito sem previsão do fornecedor"/>
                      </label>

                      <label className={`${local.field} ${local.fieldWide}`}>
                        <span>Observação interna</span>
                        <textarea name="observacoes" defaultValue={vehicle.observacoes} placeholder="Ex.: aguardando encaixe, peça secundária pendente, veículo liberado para próxima etapa"/>
                      </label>

                      <div className={local.actions}><button className={local.save} type="submit">Salvar atualização</button></div>
                    </form>

                    <div className={local.actions} style={{ marginTop: 10 }}>
                      <Link className={styles.button} href={`/operacao/qualidade/${vehicle.id}`}>Checklist de qualidade</Link>
                    </div>

                    <details className={local.finalize}>
                      <summary>Finalizar / entregar veículo</summary>
                      <p>Use somente quando o veículo realmente sair da oficina. O pós-entrega será iniciado a partir desta ação.</p>
                      <div className={local.finalizeGrid}>
                        <form action={finalizeOperationalVehicle} className={local.finalizeForm}>
                          <input type="hidden" name="id" value={vehicle.id}/>
                          <input type="hidden" name="finalizacao_tipo" value="sem_pendencias"/>
                          <strong>Sem pendências</strong>
                          <span>Entrega concluída sem obrigação operacional aberta conhecida.</span>
                          <button className={local.finishOk} type="submit">Finalizar sem pendências</button>
                        </form>

                        <form action={finalizeOperationalVehicle} className={local.finalizeForm}>
                          <input type="hidden" name="id" value={vehicle.id}/>
                          <input type="hidden" name="finalizacao_tipo" value="com_pendencias"/>
                          <strong>Com pendência</strong>
                          <span>O veículo sai, mas o item continuará sendo acompanhado até a resolução.</span>
                          <label className={local.field}>
                            <span>O que ficou pendente?</span>
                            <textarea name="pendencia_descricao" required placeholder="Ex.: emblema traseiro aguardando fornecedor"/>
                          </label>
                          <button className={local.finishPending} type="submit">Finalizar com pendência</button>
                        </form>
                      </div>
                    </details>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={local.empty}><strong>Nenhum veículo disponível para este setor.</strong><p>Quando houver veículos vinculados ao seu setor, eles aparecerão aqui.</p></div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

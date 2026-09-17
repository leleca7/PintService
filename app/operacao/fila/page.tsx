import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getEntryQueueData } from '@/lib/entry-queue-data';
import { createEntryQueueItem, registerVehicleEntry, updateEntryQueueItem } from './actions';
import local from './fila.module.css';

const STATUS_OPTIONS = ['Aguardando', 'Contato realizado', 'Confirmado', 'Cancelado'];

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Bahia' }).format(new Date(`${value}T12:00:00-03:00`));
}

function partsClass(status: string) {
  if (status === 'Completo') return local.partsComplete;
  if (status === 'Parcial') return local.partsPartial;
  if (status === 'Nenhuma Recebida') return local.partsNone;
  return local.partsNoOrder;
}

export default async function EntryQueuePage() {
  const data = await getEntryQueueData();
  const released = data.queue.filter((item) => item.liberadoEntrada).length;

  return (
    <AppShell active="operacao" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>ENTRADAS · PLANEJAMENTO</p>
            <h1 className={styles.title}>Fila de Entrada</h1>
            <p className={styles.subtitle}>Organize os veículos autorizados antes de entrarem na oficina. A ordem padrão é a data de autorização; a prioridade manual pode antecipar casos específicos.</p>
          </div>
          <div className={local.headerActions}>
            <Link className={styles.button} href="/operacao/pecas">Controle de peças</Link>
            <Link className={styles.button} href="/operacao/agenda">Agenda de entradas</Link>
            <Link className={styles.button} href="/operacao/capacidade">Capacidade</Link>
          </div>
        </header>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Na fila</span><strong>{data.queue.length}</strong><small>autorizações aguardando entrada</small></div>
          <div className={styles.summaryItem}><span>Vagas hoje</span><strong>{data.vagasHoje}</strong><small>disponíveis em Desmontagem</small></div>
          <div className={styles.summaryItem}><span>Desmontagem</span><strong>{data.emDesmontagem}/{data.capacidadeDesmontagem}</strong><small>ocupação atual</small></div>
          <div className={styles.summaryItem}><span>Liberados por peças</span><strong>{released}</strong><small>decisão humana registrada</small></div>
        </div>

        {data.error && <section className={styles.section}><div className={styles.quiet}><strong>Fila indisponível.</strong>{data.error}</div></section>}

        {data.canManage && (
          <section className={styles.section}>
            <div className={styles.sectionHead}><div><p>NOVA AUTORIZAÇÃO</p><h2>Adicionar veículo à fila</h2></div></div>
            <form action={createEntryQueueItem} className={local.createGrid}>
              <label className={local.field}><span>Placa</span><input name="placa" required placeholder="ABC1D23"/></label>
              <label className={local.field}><span>Modelo</span><input name="modelo" placeholder="Ex.: Corolla"/></label>
              <label className={local.field}><span>Cliente</span><input name="cliente_nome" placeholder="Nome do cliente"/></label>
              <label className={local.field}><span>Telefone</span><input name="telefone" inputMode="tel" placeholder="55..."/></label>
              <label className={local.field}><span>Origem</span><select name="origem" defaultValue="Seguradora"><option>Seguradora</option><option>Particular</option></select></label>
              <label className={local.field}><span>Seguradora</span><input name="seguradora" placeholder="Se aplicável"/></label>
              <label className={local.field}><span>Data de autorização</span><input type="date" name="data_autorizacao" required/></label>
              <label className={local.field}><span>Prioridade manual</span><input type="number" min="0" name="prioridade_manual" placeholder="1, 2, 3..."/></label>
              <label className={`${local.field} ${local.fieldWide}`}><span>Observações</span><textarea name="observacoes" placeholder="Informações úteis antes da entrada"/></label>
              <div className={local.formActions}><button className={local.primaryButton} type="submit">Adicionar à fila</button></div>
            </form>
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>ORDEM ATUAL</p><h2>Próximas entradas</h2></div><span className={styles.count}>{data.queue.length}</span></div>

          {data.queue.length ? (
            <div className={local.queueList}>
              {data.queue.map((item) => (
                <article className={`${local.queueCard} ${item.podeEntrarHoje ? local.queueCardReady : ''}`} key={item.id}>
                  <div className={local.queuePosition}><span>POSIÇÃO</span><strong>{item.posicaoFila}</strong></div>
                  <div className={local.queueBody}>
                    <div className={local.queueHead}>
                      <div><span className={local.plate}>{item.placa}</span><h3>{item.modelo || 'Modelo não informado'}</h3></div>
                      <span className={`${local.entrySignal} ${item.podeEntrarHoje ? local.signalReady : local.signalWait}`}>
                        {item.podeEntrarHoje ? 'Pode entrar hoje' : 'Aguardar vaga'}
                      </span>
                    </div>

                    <div className={local.partsBar}>
                      <div><span>Peças</span><strong className={`${local.partsBadge} ${partsClass(item.statusPecas)}`}>{item.statusPecas}</strong></div>
                      <div><span>Recebidas</span><strong>{item.pecasRecebidas}/{item.pecasTotal}</strong></div>
                      <div><span>Liberação</span><strong className={item.liberadoEntrada ? local.releaseYes : local.releaseNo}>{item.liberadoEntrada ? 'Liberado' : 'Não liberado'}</strong></div>
                      <Link href="/operacao/pecas">Abrir peças</Link>
                    </div>

                    <div className={local.infoGrid}>
                      <div><span>Autorização</span><strong>{formatDate(item.dataAutorizacao)}</strong></div>
                      <div><span>Dias aguardando</span><strong>{item.diasAguardando}</strong></div>
                      <div><span>Prioridade manual</span><strong>{item.prioridadeManual ?? '—'}</strong></div>
                      <div><span>Origem</span><strong>{item.origem}{item.seguradora ? ` · ${item.seguradora}` : ''}</strong></div>
                      <div><span>Data sugerida</span><strong>{item.dataSugerida ? formatDate(item.dataSugerida) : 'Previsão insuficiente'}</strong></div>
                      <div><span>Entrada combinada</span><strong>{formatDate(item.dataEntradaCombinada)}</strong></div>
                    </div>

                    {!item.sugestaoConfiavel && !item.podeEntrarHoje && (
                      <div className={local.forecastWarning}>Atualize as previsões de saída dos veículos em Desmontagem para o sistema conseguir sugerir esta entrada com segurança.</div>
                    )}

                    <form action={updateEntryQueueItem} className={local.editGrid}>
                      <input type="hidden" name="id" value={item.id}/>
                      <label className={local.field}><span>Status</span><select name="status" defaultValue={item.status}>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></label>
                      <label className={local.field}><span>Prioridade</span><input type="number" min="0" name="prioridade_manual" defaultValue={item.prioridadeManual ?? ''}/></label>
                      <label className={local.field}><span>Data combinada</span><input type="date" name="data_entrada_combinada" defaultValue={item.dataEntradaCombinada ?? ''}/></label>
                      <label className={`${local.field} ${local.fieldWide}`}><span>Observações</span><textarea name="observacoes" defaultValue={item.observacoes}/></label>
                      <div className={local.formActions}><button className={local.secondaryButton} type="submit">Salvar fila</button></div>
                    </form>

                    <div className={local.promoteRow}>
                      <div>
                        <strong>{item.liberadoEntrada ? 'O veículo chegou fisicamente?' : 'Entrada aguardando liberação de peças'}</strong>
                        <span>{item.liberadoEntrada ? 'Registrar entrada move o carro para Desmontagem e encerra este item da fila.' : 'O responsável por peças precisa marcar “Liberado para entrada”. Não é necessário que todas as peças estejam completas.'}</span>
                      </div>
                      {item.liberadoEntrada ? (
                        <form action={registerVehicleEntry}><input type="hidden" name="id" value={item.id}/><button className={local.primaryButton} type="submit">Registrar entrada</button></form>
                      ) : (
                        <Link className={local.secondaryLink} href="/operacao/pecas">Revisar peças</Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className={local.empty}><strong>Nenhum veículo aguardando entrada.</strong><p>Novas autorizações aparecerão aqui em ordem de chegada.</p></div>}
        </section>
      </div>
    </AppShell>
  );
}

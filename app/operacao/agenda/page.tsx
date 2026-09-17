import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getEntryQueueData } from '@/lib/entry-queue-data';
import local from '../fila/fila.module.css';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'America/Bahia' }).format(new Date(`${value}T12:00:00-03:00`));
}

export default async function EntryAgendaPage() {
  const data = await getEntryQueueData();
  const groups = new Map<string, typeof data.agenda>();
  for (const item of data.agenda) {
    if (!item.dataEntradaCombinada) continue;
    const list = groups.get(item.dataEntradaCombinada) ?? [];
    list.push(item);
    groups.set(item.dataEntradaCombinada, list);
  }

  return (
    <AppShell active="operacao" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>ENTRADAS · AGENDA</p>
            <h1 className={styles.title}>Agenda de Entradas</h1>
            <p className={styles.subtitle}>Mostra somente os veículos da fila que já possuem uma data de entrada combinada com o cliente.</p>
          </div>
          <div className={local.headerActions}>
            <Link className={styles.button} href="/operacao/fila">Voltar para a fila</Link>
            <Link className={styles.button} href="/operacao">Modo Operação</Link>
          </div>
        </header>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Agendados</span><strong>{data.agenda.length}</strong><small>veículos com data combinada</small></div>
          <div className={styles.summaryItem}><span>Dias com entrada</span><strong>{groups.size}</strong><small>datas distintas na agenda</small></div>
          <div className={styles.summaryItem}><span>Vagas hoje</span><strong>{data.vagasHoje}</strong><small>capacidade livre em Desmontagem</small></div>
          <div className={styles.summaryItem}><span>Na fila total</span><strong>{data.queue.length}</strong><small>autorizações aguardando</small></div>
        </div>

        {data.error && <section className={styles.section}><div className={styles.quiet}><strong>Agenda indisponível.</strong>{data.error}</div></section>}

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>CRONOGRAMA</p><h2>Entradas combinadas</h2></div><span className={styles.count}>{data.agenda.length}</span></div>
          {groups.size ? (
            <div className={local.agendaGroups}>
              {[...groups.entries()].map(([date, items]) => (
                <article className={local.agendaGroup} key={date}>
                  <div className={local.agendaDate}><h2>{formatDate(date)}</h2><span>{items.length} veículo{items.length === 1 ? '' : 's'}</span></div>
                  <div className={local.agendaItems}>
                    {items.map((item) => (
                      <div className={local.agendaItem} key={item.id}>
                        <div><strong>{item.placa}</strong><small>{item.modelo || 'Modelo não informado'}</small></div>
                        <div><strong>{item.clienteNome || 'Cliente não informado'}</strong><small>{item.origem}{item.seguradora ? ` · ${item.seguradora}` : ''}{item.observacoes ? ` · ${item.observacoes}` : ''}</small></div>
                        <span className={local.agendaBadge}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : <div className={local.empty}><strong>Nenhuma entrada combinada.</strong><p>Quando uma data for preenchida na Fila de Entrada, o veículo aparecerá aqui automaticamente.</p></div>}
        </section>
      </div>
    </AppShell>
  );
}

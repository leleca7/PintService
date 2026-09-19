import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getPostDeliveryPendingData } from '@/lib/post-delivery-data';
import { updatePostDeliveryPending } from './actions';
import local from './pos-entrega.module.css';

const STATUS_OPTIONS = [
  ['aberta', 'Aberta'],
  ['aguardando_peca', 'Aguardando peça'],
  ['aguardando_agendamento', 'Aguardando agendamento'],
  ['resolvida', 'Resolvida'],
  ['cancelada', 'Cancelada'],
] as const;

function date(value: string | null) {
  if (!value) return 'Não informada';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Bahia' }).format(new Date(value + 'T12:00:00-03:00'));
}

export default async function PostDeliveryOperationPage() {
  const data = await getPostDeliveryPendingData();
  const ready = data.items.filter((item) => item.status === 'aguardando_agendamento').length;
  const waitingParts = data.items.filter((item) => item.status === 'aguardando_peca').length;

  return (
    <AppShell active="operacao" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>PÓS-ENTREGA · SOMENTE O QUE AINDA EXIGE AÇÃO</p>
            <h1 className={styles.title}>Pendências pós-entrega</h1>
            <p className={styles.subtitle}>O veículo já saiu da oficina, mas a obrigação continua visível até ser concluída.</p>
          </div>
          <Link className={styles.button} href="/operacao">Voltar à operação</Link>
        </header>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Pendências abertas</span><strong>{data.items.length}</strong><small>carros entregues que ainda exigem ação</small></div>
          <div className={styles.summaryItem}><span>Aguardando peça</span><strong>{waitingParts}</strong><small>dependem de recebimento</small></div>
          <div className={styles.summaryItem}><span>Prontas para agendar</span><strong>{ready}</strong><small>já podem retornar à oficina</small></div>
        </div>

        {data.error && <section className={styles.section}><div className={styles.quiet}><strong>Não foi possível carregar o pós-entrega.</strong>{data.error}</div></section>}

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>FILA DE EXCEÇÕES</p><h2>O que ainda precisa ser resolvido</h2></div><span className={styles.count}>{data.items.length}</span></div>

          {data.items.length ? (
            <div className={local.grid}>
              {data.items.map((item) => (
                <article className={local.card} key={item.id}>
                  <div className={local.head}>
                    <div><span className={styles.badge}>{item.status.replaceAll('_', ' ')}</span><h2>{item.modelo}</h2><p>{item.cliente}</p></div>
                    <strong className={local.plate}>{item.placa}</strong>
                  </div>

                  <div className={local.meta}>
                    <div><span>Responsável</span><strong>{item.responsavel || 'Não definido'}</strong></div>
                    <div><span>Previsão</span><strong>{date(item.previsao)}</strong></div>
                  </div>

                  <form action={updatePostDeliveryPending} className={local.form}>
                    <input type="hidden" name="id" value={item.id}/>

                    <label className={`${local.field} ${local.wide}`}>
                      <span>Pendência</span>
                      <textarea name="descricao" defaultValue={item.descricao} required/>
                    </label>

                    <label className={local.field}>
                      <span>Status</span>
                      <select name="status" defaultValue={item.status}>
                        {STATUS_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                    </label>

                    <label className={local.field}>
                      <span>Previsão</span>
                      <input type="date" name="previsao" defaultValue={item.previsao ?? ''}/>
                    </label>

                    <label className={local.field}>
                      <span>Fornecedor</span>
                      <input name="fornecedor" defaultValue={item.fornecedor}/>
                    </label>

                    <label className={local.field}>
                      <span>Pedido</span>
                      <input name="numero_pedido" defaultValue={item.numeroPedido}/>
                    </label>

                    <div className={local.actions}><button type="submit">Salvar atualização</button></div>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.quiet}><strong>Nenhuma pendência pós-entrega aberta.</strong>Quando um veículo for entregue com algum item pendente, ele aparecerá aqui até a conclusão.</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

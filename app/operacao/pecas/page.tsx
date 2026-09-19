import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getPartsData, type PartsStatus } from '@/lib/parts-data';
import {
  addPartsItem,
  createPartsControl,
  createPartsOrder,
  updatePartsItemReceipt,
  updatePartsOrderStatus,
  updatePartsRelease,
} from './actions';
import local from './pecas.module.css';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Bahia' }).format(new Date(`${value}T12:00:00-03:00`));
}

function statusClass(status: PartsStatus) {
  if (status === 'Completo') return local.statusComplete;
  if (status === 'Parcial') return local.statusPartial;
  if (status === 'Nenhuma Recebida') return local.statusNone;
  return local.statusNoOrder;
}

export default async function PartsPage() {
  const data = await getPartsData();
  const partial = data.controls.filter((control) => control.statusPecas === 'Parcial').length;
  const complete = data.controls.filter((control) => control.statusPecas === 'Completo').length;
  const released = data.controls.filter((control) => control.liberadoEntrada).length;

  return (
    <AppShell active="operacao" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>PEÇAS · PEDIDOS E RECEBIMENTO</p>
            <h1 className={styles.title}>Controle de Peças</h1>
            <p className={styles.subtitle}>Acompanhe pedidos por placa e registre o que chegou. O status é calculado automaticamente; a liberação para entrada continua sendo uma decisão humana.</p>
          </div>
          <div className={local.headerActions}>
            <Link className={styles.button} href="/operacao/pecas/scan">Escanear peça</Link>
            <Link className={styles.button} href="/operacao/fila">Fila de entrada</Link>
            <Link className={styles.button} href="/operacao">Modo Operação</Link>
          </div>
        </header>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Controles ativos</span><strong>{data.controls.length}</strong><small>placas acompanhadas</small></div>
          <div className={styles.summaryItem}><span>Parciais</span><strong>{partial}</strong><small>recebimento ainda incompleto</small></div>
          <div className={styles.summaryItem}><span>Completos</span><strong>{complete}</strong><small>todas as quantidades recebidas</small></div>
          <div className={styles.summaryItem}><span>Liberados</span><strong>{released}</strong><small>podem entrar mesmo com pendência secundária</small></div>
        </div>

        {data.error && <section className={styles.section}><div className={styles.quiet}><strong>Controle de peças indisponível.</strong>{data.error}</div></section>}

        {data.canManage && (
          <section className={styles.section}>
            <div className={styles.sectionHead}><div><p>NOVO CONTROLE</p><h2>Começar acompanhamento por placa</h2></div></div>
            <form action={createPartsControl} className={local.startForm}>
              <label className={local.field}><span>Placa</span><input name="placa" required placeholder="ABC1D23"/></label>
              <button className={local.primaryButton} type="submit">Iniciar controle</button>
            </form>
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>ACOMPANHAMENTO ATIVO</p><h2>Pedidos e recebimentos</h2></div><span className={styles.count}>{data.controls.length}</span></div>

          {data.controls.length ? (
            <div className={local.controlList}>
              {data.controls.map((control) => (
                <article className={local.controlCard} key={control.id}>
                  <div className={local.controlHead}>
                    <div>
                      <span className={local.plate}>{control.placa}</span>
                      <h3>{control.modelo || 'Modelo não informado'}</h3>
                      {control.clienteNome && <small>{control.clienteNome}</small>}
                    </div>
                    <div className={local.statusStack}>
                      <span className={`${local.statusBadge} ${statusClass(control.statusPecas)}`}>{control.statusPecas}</span>
                      <strong>{control.recebidas}/{control.total}</strong>
                    </div>
                  </div>

                  <form action={updatePartsRelease} className={`${local.releaseBox} ${control.liberadoEntrada ? local.releaseOn : ''}`}>
                    <input type="hidden" name="id" value={control.id}/>
                    <label className={local.releaseCheck}>
                      <input type="checkbox" name="liberado_entrada" defaultChecked={control.liberadoEntrada}/>
                      <span><strong>Liberado para entrada</strong><small>Decisão humana. Pode ser marcado mesmo com peças parciais quando a pendência não bloqueia o início do reparo.</small></span>
                    </label>
                    <label className={local.field}><span>Motivo / observação</span><input name="observacao_liberacao" defaultValue={control.observacaoLiberacao} placeholder="Ex.: moldura secundária pode chegar depois"/></label>
                    <button className={local.secondaryButton} type="submit">Salvar liberação</button>
                  </form>

                  <div className={local.orders}>
                    {control.orders.map((order) => (
                      <section className={local.orderCard} key={order.id}>
                        <div className={local.orderHead}>
                          <div><strong>{order.numeroPedido || 'Pedido sem número'}</strong><span>{order.fornecedor || 'Fornecedor não informado'}</span></div>
                          <div><small>Pedido {formatDate(order.dataPedido)}</small><small>Previsão {formatDate(order.previsaoEntrega)}</small></div>
                        </div>

                        <form action={updatePartsOrderStatus} className={local.orderStatusForm}>
                          <input type="hidden" name="id" value={order.id}/>
                          <select name="status" defaultValue={order.status}><option>Aberto</option><option>Concluído</option><option>Cancelado</option></select>
                          <button className={local.miniButton} type="submit">Atualizar pedido</button>
                        </form>

                        {order.items.length ? (
                          <div className={local.itemsList}>
                            {order.items.map((item) => (
                              <form action={updatePartsItemReceipt} className={local.itemRow} key={item.id}>
                                <input type="hidden" name="id" value={item.id}/>
                                <div className={local.itemName}><strong>{item.descricao}</strong><span>{item.codigo || 'Sem código'}</span></div>
                                <div className={local.itemQty}><span>Pedido</span><strong>{item.quantidade}</strong></div>
                                <label className={local.compactField}><span>Recebido</span><input type="number" min="0" max={item.quantidade} name="quantidade_recebida" defaultValue={item.quantidadeRecebida}/></label>
                                <label className={local.compactField}><span>Último recebimento</span><input type="date" name="ultimo_recebimento_em" defaultValue={item.ultimoRecebimentoEm ?? ''}/></label>
                                <label className={local.compactField}><span>Observação</span><input name="observacoes" defaultValue={item.observacoes}/></label>
                                <button className={local.miniButton} type="submit">Salvar</button>
                              </form>
                            ))}
                          </div>
                        ) : <div className={local.emptyOrder}>Pedido criado. Adicione as peças abaixo.</div>}

                        <form action={addPartsItem} className={local.addItemForm}>
                          <input type="hidden" name="pedido_id" value={order.id}/>
                          <label className={local.field}><span>Peça</span><input name="descricao" required placeholder="Ex.: Parachoque dianteiro"/></label>
                          <label className={local.field}><span>Código</span><input name="codigo" placeholder="Opcional"/></label>
                          <label className={local.field}><span>Qtd.</span><input type="number" name="quantidade" min="1" defaultValue="1" required/></label>
                          <label className={local.field}><span>Observação</span><input name="observacoes" placeholder="Opcional"/></label>
                          <button className={local.secondaryButton} type="submit">Adicionar peça</button>
                        </form>
                      </section>
                    ))}
                  </div>

                  <details className={local.newOrder}>
                    <summary>Novo pedido de peças</summary>
                    <form action={createPartsOrder} className={local.newOrderForm}>
                      <input type="hidden" name="controle_id" value={control.id}/>
                      <label className={local.field}><span>Fornecedor</span><input name="fornecedor"/></label>
                      <label className={local.field}><span>Nº do pedido</span><input name="numero_pedido"/></label>
                      <label className={local.field}><span>Data do pedido</span><input type="date" name="data_pedido"/></label>
                      <label className={local.field}><span>Previsão de entrega</span><input type="date" name="previsao_entrega"/></label>
                      <label className={`${local.field} ${local.fieldWide}`}><span>Observações</span><input name="observacoes"/></label>
                      <button className={local.primaryButton} type="submit">Criar pedido</button>
                    </form>
                  </details>
                </article>
              ))}
            </div>
          ) : <div className={local.empty}><strong>Nenhum controle de peças ativo.</strong><p>Inicie pelo número da placa ou cadastre uma nova autorização na Fila de Entrada.</p></div>}
        </section>
      </div>
    </AppShell>
  );
}

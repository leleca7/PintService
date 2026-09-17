import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getCapacityData, type CapacitySituation } from '@/lib/capacity-data';
import { updatePhaseCapacity } from './actions';
import local from './capacidade.module.css';

function statusLabel(status: CapacitySituation) {
  if (status === 'over') return 'Acima da capacidade';
  if (status === 'limit') return 'No limite';
  return 'OK';
}

function statusClass(status: CapacitySituation) {
  if (status === 'over') return local.statusOver;
  if (status === 'limit') return local.statusLimit;
  return local.statusOk;
}

export default async function CapacityPage() {
  const data = await getCapacityData();
  const totalActive = data.phases.reduce((sum, phase) => sum + phase.emAndamento, 0);
  const totalCapacity = data.phases.reduce((sum, phase) => sum + phase.capacidadeMaxima, 0);
  const over = data.phases.filter((phase) => phase.situacao === 'over').length;
  const blocked = data.phases.filter((phase) => phase.filaTravada).length;

  return (
    <AppShell active="operacao" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>OPERAÇÃO · CAPACIDADE</p>
            <h1 className={styles.title}>Capacidade por fase</h1>
            <p className={styles.subtitle}>Veja onde a oficina está saudável, no limite ou acima da capacidade. Os alertas não alteram previsões automaticamente.</p>
          </div>
          <Link className={styles.button} href="/operacao">Voltar ao Modo Operação</Link>
        </header>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Veículos ativos</span><strong>{totalActive}</strong><small>somados nas 7 fases</small></div>
          <div className={styles.summaryItem}><span>Capacidade total</span><strong>{totalCapacity}</strong><small>limites configurados</small></div>
          <div className={styles.summaryItem}><span>Acima da capacidade</span><strong>{over}</strong><small>fases precisam de atenção</small></div>
          <div className={styles.summaryItem}><span>Fila possivelmente travada</span><strong>{blocked}</strong><small>sobrecarga com atraso</small></div>
        </div>

        {data.error && <section className={styles.section}><div className={styles.quiet}><strong>Não foi possível carregar a capacidade.</strong>{data.error}</div></section>}

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div><p>VISÃO DA PRODUÇÃO</p><h2>Ocupação atual por fase</h2></div>
            <span className={styles.count}>{data.phases.length}</span>
          </div>

          {data.phases.length ? (
            <div className={local.grid}>
              {data.phases.map((phase) => (
                <article className={`${local.card} ${phase.filaTravada ? local.cardBlocked : ''}`} key={phase.fase}>
                  <div className={local.cardHead}>
                    <div>
                      <span className={local.order}>FASE {phase.ordem}</span>
                      <h2>{phase.fase}</h2>
                    </div>
                    <span className={`${local.status} ${statusClass(phase.situacao)}`}>{statusLabel(phase.situacao)}</span>
                  </div>

                  <div className={local.capacityLine}>
                    <strong>{phase.emAndamento}</strong>
                    <span>de {phase.capacidadeMaxima} vagas ocupadas</span>
                  </div>

                  <div className={local.meter} aria-label={`${phase.ocupacaoPercentual}% da capacidade utilizada`}>
                    <span className={statusClass(phase.situacao)} style={{ width: `${Math.min(100, phase.ocupacaoPercentual)}%` }}/>
                  </div>

                  <div className={local.metrics}>
                    <div><span>Vagas livres</span><strong>{phase.vagasLivres}</strong></div>
                    <div><span>Atrasados</span><strong>{phase.atrasados}</strong></div>
                    <div><span>Ocupação</span><strong>{phase.ocupacaoPercentual}%</strong></div>
                  </div>

                  {phase.filaTravada && (
                    <div className={local.alert}>
                      <strong>Alerta de fila</strong>
                      <span>Há veículo atrasado nesta fase e a ocupação está acima do limite. Isso pode estar travando os próximos carros.</span>
                    </div>
                  )}

                  {data.canManage ? (
                    <form action={updatePhaseCapacity} className={local.form}>
                      <input type="hidden" name="fase" value={phase.fase}/>
                      <label>
                        <span>Capacidade máxima</span>
                        <input type="number" name="capacidade_maxima" min="0" max="99" step="1" defaultValue={phase.capacidadeMaxima}/>
                      </label>
                      <button type="submit">Salvar limite</button>
                    </form>
                  ) : (
                    <p className={local.readOnly}>Somente a gestão pode alterar o limite desta fase.</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.quiet}><strong>Nenhuma capacidade configurada.</strong>As fases aparecerão aqui após a ativação da estrutura de capacidade.</div>
          )}
        </section>

        <section className={local.ruleNote}>
          <strong>Regra operacional desta etapa</strong>
          <p>Uma sobrecarga gera sinalização e alerta de impacto na fila. O sistema não recalcula nem altera automaticamente a previsão de saída de outros veículos.</p>
        </section>
      </div>
    </AppShell>
  );
}

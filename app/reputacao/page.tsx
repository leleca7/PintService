import AppShell from '@/app/components/app-shell';
import ReputationClient from '@/app/reputacao/reputation-client';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getDashboardData } from '@/lib/dashboard-data';
import { getReputationData, type ReputationData } from '@/lib/reputation';

export default async function ReputationPage() {
  const [dashboard, reputation] = await Promise.all([getDashboardData(), getReputationData({ demoFallback: false })]);
  const safeReputation: ReputationData = reputation.reclameAqui.source === 'live' ? reputation : {
    ...reputation,
    reclameAqui: {
      reputationScore: null,
      consumerScore: null,
      answeredPercent: null,
      resolvedPercent: null,
      waitingReplies: null,
      complaintsReceived: null,
      avgReplyDays: null,
      topProblems: [],
      source: 'demo',
    },
  };

  const urgent = safeReputation.items.filter((item) => item.priority === 'urgente' || item.priority === 'alta').length;
  const pendingChannels = safeReputation.channels.filter((channel) => channel.state !== 'ready').length;

  return (
    <AppShell active="reputacao" source={dashboard.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>REPUTAÇÃO · DECISÃO E RESPOSTA</p>
            <h1 className={styles.title}>Central de reputação</h1>
            <p className={styles.subtitle}>Google, Instagram, Reclame Aqui e WhatsApp reunidos em uma única leitura — com prioridade para o que pode virar risco de relacionamento.</p>
          </div>
          <a className={styles.button} href="/configuracoes">Integrações</a>
        </header>

        <section className={styles.darkBand}>
          <div className={styles.darkCopy}>
            <p className={styles.darkLabel}>RISCO DE REPUTAÇÃO</p>
            <h2 className={styles.darkTitle}>{urgent ? `${urgent} ${urgent === 1 ? 'ocorrência pede' : 'ocorrências pedem'} análise prioritária.` : 'Nenhuma ocorrência crítica exige decisão agora.'}</h2>
            <p className={styles.darkText}>A fila comum permanece abaixo. Reclamações, notas baixas e situações sensíveis sobem para uma análise mais cuidadosa antes da resposta.</p>
          </div>
          <div className={styles.darkStats}>
            <div className={styles.darkStat}><strong>{urgent}</strong><span>alta ou urgente</span></div>
            <div className={styles.darkStat}><strong>{pendingChannels}</strong><span>canais pendentes</span></div>
          </div>
        </section>

        {!safeReputation.items.length && <div className="system-banner info-banner"><strong>Canais aguardando conexão ou novas ocorrências</strong><span>Nenhum exemplo fictício é exibido. Quando as contas oficiais estiverem autorizadas, mensagens, avaliações e reclamações aparecem aqui.</span></div>}
        {!!safeReputation.errors.length && <div className="system-banner error-banner"><strong>Alguns canais não sincronizaram</strong><span>{safeReputation.errors.slice(0, 2).join(' · ')}</span></div>}

        <ReputationClient data={safeReputation}/>
      </div>
    </AppShell>
  );
}

import AppShell from '@/app/components/app-shell';
import ReputationClient from '@/app/reputacao/reputation-client';
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

  return (
    <AppShell active="reputacao" source={dashboard.source}>
      <header className="topbar"><div><p className="eyebrow">REPUTAÇÃO E CANAIS</p><h1>Central de reputação</h1><p>Google, Instagram, Reclame Aqui e alertas críticos em uma única fila.</p></div><div className="top-actions"><a className="ghost action-link" href="/configuracoes">Integrações</a></div></header>

      {!safeReputation.items.length && <div className="system-banner info-banner"><strong>Canais aguardando conexão ou novas ocorrências</strong><span>Nenhum exemplo fictício é exibido. Quando as contas oficiais estiverem autorizadas, mensagens, avaliações e reclamações aparecem aqui.</span></div>}
      {!!safeReputation.errors.length && <div className="system-banner error-banner"><strong>Alguns canais não sincronizaram</strong><span>{safeReputation.errors.slice(0, 2).join(' · ')}</span></div>}

      <ReputationClient data={safeReputation}/>
    </AppShell>
  );
}

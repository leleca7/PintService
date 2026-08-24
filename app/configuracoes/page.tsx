import AppShell from '@/app/components/app-shell';
import { getDashboardData, isSupabaseConfigured } from '@/lib/dashboard-data';
import { getChannelStatuses } from '@/lib/reputation';

function configured(...values: Array<string | undefined>) {
  return values.every(Boolean);
}

export default async function SettingsPage() {
  const data = await getDashboardData();
  const reputationChannels = getChannelStatuses();
  const connections = [
    { name: 'Banco de dados', description: 'Hoje mantém o painel em modo demo quando não está conectado. A migração definitiva para Neon fica separada das credenciais públicas.', ready: isSupabaseConfigured(), detail: 'dados operacionais' },
    { name: 'OpenAI', description: 'Triagem, interpretação e redação segura de respostas de atendimento e reputação.', ready: configured(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL), detail: 'OPENAI_API_KEY + OPENAI_MODEL' },
    { name: 'WhatsApp Cloud API', description: 'Recebe e envia mensagens pelo número oficial e também pode receber alertas críticos da reputação.', ready: configured(process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID, process.env.WHATSAPP_VERIFY_TOKEN, process.env.WHATSAPP_APP_SECRET), detail: 'token + phone id + verify token + app secret' },
    { name: 'Google Business Profile', description: 'Lê avaliações da oficina e permite responder diretamente pela Central de reputação.', ready: reputationChannels.find((item) => item.channel === 'google')?.state === 'ready', detail: 'OAuth token + account id + location id' },
    { name: 'Instagram profissional', description: 'Sincroniza DMs e comentários, responde pela API e recebe webhooks em tempo real.', ready: reputationChannels.find((item) => item.channel === 'instagram')?.state === 'ready', detail: 'token + Instagram business id + verify token + app secret' },
    { name: 'Reclame Aqui', description: 'Mostra indicadores da reputação e fica pronto para a API contratada de leitura e resposta de reclamações.', ready: reputationChannels.find((item) => item.channel === 'reclame_aqui')?.state !== 'missing', detail: reputationChannels.find((item) => item.channel === 'reclame_aqui')?.state === 'partial' ? 'indicadores conectados; reclamações individuais dependem do contrato RA API' : 'APIKey + company id + endpoints do contrato' },
    { name: 'Alertas de reputação', description: 'Envia ao WhatsApp interno os casos de prioridade alta/urgente detectados nos canais.', ready: configured(process.env.ALERT_WHATSAPP_TO, process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID), detail: 'ALERT_WHATSAPP_TO + WhatsApp Cloud API' },
    { name: 'Oficina', description: 'Informações operacionais básicas usadas nas respostas.', ready: configured(process.env.OFICINA_HOURS, process.env.OFICINA_ADDRESS), detail: 'horário + endereço' },
  ];

  return (
    <AppShell active="configuracoes" source={data.source}>
      <header className="topbar"><div><p className="eyebrow">SISTEMA</p><h1>Configurações</h1><p>Status das integrações sem exibir nenhuma chave ou segredo.</p></div></header>

      <section className="panel page-panel">
        <div className="panel-head"><div><p className="eyebrow">CONEXÕES</p><h2>Integrações</h2></div><span className="source-chip">{connections.filter((item) => item.ready).length}/{connections.length} configuradas</span></div>
        <div className="connection-list">
          {connections.map((connection) => <article className="connection-card" key={connection.name}><div className={`connection-status ${connection.ready ? 'ready' : 'missing'}`}>{connection.ready ? '✓' : '!'}</div><div><h3>{connection.name}</h3><p>{connection.description}</p><small>{connection.detail}</small></div><span className={connection.ready ? 'tag ai' : 'tag human'}>{connection.ready ? 'configurado' : 'pendente'}</span></article>)}
        </div>
      </section>

      <section className="settings-grid">
        <article className="panel settings-card"><p className="eyebrow">REPUTAÇÃO</p><h2>Como os alertas funcionam</h2><ul><li>Instagram usa webhook para alertas em tempo real quando chega mensagem ou comentário crítico.</li><li>Google e Reclame Aqui entram na varredura programada e também podem ser sincronizados pela Central de reputação.</li><li>No plano Hobby da Vercel, a varredura automática fica diária; um scheduler externo ou plano Pro permite frequência maior.</li><li>Casos críticos exigem aprovação humana antes de publicar uma resposta.</li></ul></article>
        <article className="panel settings-card"><p className="eyebrow">SEGURANÇA</p><h2>Proteções preparadas</h2><ul><li>Segredos ficam apenas no servidor.</li><li>Webhooks da Meta validam assinatura quando o App Secret está configurado.</li><li>IA não confirma fatos físicos, preço, prazo, culpa ou dano sem humano.</li><li>Reclamações e avaliações negativas ficam marcadas para aprovação.</li><li>Resposta do Reclame Aqui só é habilitada com o endpoint fornecido no contrato oficial.</li></ul></article>
      </section>
    </AppShell>
  );
}

import AppShell from '@/app/components/app-shell';
import { getDashboardData, isSupabaseConfigured } from '@/lib/dashboard-data';

function configured(...values: Array<string | undefined>) {
  return values.every(Boolean);
}

export default async function SettingsPage() {
  const data = await getDashboardData();
  const connections = [
    { name: 'Banco de dados', description: 'Opcional agora. Quando conectado, troca os exemplos por clientes, veículos, conversas e tarefas reais.', ready: isSupabaseConfigured(), detail: 'Supabase pode ser conectado futuramente' },
    { name: 'OpenAI', description: 'Triagem, interpretação e redação segura das respostas.', ready: configured(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL), detail: 'OPENAI_API_KEY + OPENAI_MODEL' },
    { name: 'WhatsApp Cloud API', description: 'Recebe e envia mensagens pelo número oficial da oficina.', ready: configured(process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID, process.env.WHATSAPP_VERIFY_TOKEN, process.env.WHATSAPP_APP_SECRET), detail: 'token + phone id + verify token + app secret' },
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
        <article className="panel settings-card"><p className="eyebrow">AGORA</p><h2>Vercel sem banco</h2><ul><li>O painel abre normalmente em modo demonstração.</li><li>Veículos, tarefas e conversas de exemplo deixam a interface navegável.</li><li>Nenhuma chave de Supabase é exigida para publicar.</li><li>As integrações reais podem ser ativadas depois sem refazer o site.</li></ul></article>
        <article className="panel settings-card"><p className="eyebrow">SEGURANÇA</p><h2>Proteções preparadas</h2><ul><li>Segredos ficam apenas no servidor.</li><li>Webhook valida assinatura da Meta quando o App Secret for configurado.</li><li>Número de funcionário não entra como cliente.</li><li>IA não confirma fatos físicos sem humano.</li><li>Escrita no painel continua bloqueada até existir login/RBAC.</li></ul></article>
      </section>
    </AppShell>
  );
}

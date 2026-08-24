import AppShell from '@/app/components/app-shell';
import { getDashboardData, isNeonConfigured } from '@/lib/dashboard-data';

function configured(...values: Array<string | undefined>) {
  return values.every(Boolean);
}

export default async function SettingsPage() {
  const data = await getDashboardData();
  const connections = [
    { name: 'Neon Postgres', description: 'Banco principal de clientes, veículos, funcionários, tarefas, conversas e auditoria.', ready: isNeonConfigured(), detail: 'DATABASE_URL' },
    { name: 'Login e acessos', description: 'Neon Auth identifica o usuário antes de liberar o painel.', ready: configured(process.env.NEON_AUTH_BASE_URL, process.env.NEON_AUTH_COOKIE_SECRET), detail: 'Neon Auth + perfil/setor no banco' },
    { name: 'OpenAI', description: 'Triagem, interpretação e redação segura das respostas.', ready: configured(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL), detail: 'OPENAI_API_KEY + OPENAI_MODEL' },
    { name: 'WhatsApp Cloud API', description: 'Recebe e envia mensagens pelo número oficial da oficina.', ready: configured(process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID, process.env.WHATSAPP_VERIFY_TOKEN, process.env.WHATSAPP_APP_SECRET), detail: 'token + phone id + verify token + app secret' },
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
        <article className="panel settings-card"><p className="eyebrow">DADOS</p><h2>Banco real preparado</h2><ul><li>Neon substitui o banco demonstrativo no painel.</li><li>Usuários são vinculados a perfil, setor e funcionário.</li><li>Administrador e gerente têm visão ampla; funcionário recebe dados filtrados.</li><li>O histórico de auditoria está preparado no banco.</li></ul></article>
        <article className="panel settings-card"><p className="eyebrow">SEGURANÇA</p><h2>Proteções ativas no código</h2><ul><li>Login é exigido nas rotas do painel.</li><li>Webhook e health check continuam públicos por necessidade técnica.</li><li>Segredos ficam apenas no servidor.</li><li>IA não confirma fatos físicos sem informação registrada ou confirmação humana.</li></ul></article>
      </section>
    </AppShell>
  );
}

import AppShell from '@/app/components/app-shell';
import { getDashboardData, isNeonConfigured } from '@/lib/dashboard-data';
import { isAuthConfigured } from '@/lib/auth/server';
import { fetchExternalVehicles } from '@/lib/external-vehicle-source';
import { getOfficeProfile } from '@/lib/office-profile';
import { getChannelStatuses } from '@/lib/reputation';

function configured(...values: Array<string | undefined>) { return values.every((value) => Boolean(value?.trim())); }

export default async function SettingsPage() {
  const [data, vehicleSource] = await Promise.all([getDashboardData(), fetchExternalVehicles()]);
  const reputationChannels = getChannelStatuses();
  const office = getOfficeProfile();
  const vehicleSourceReady = vehicleSource.configured && !vehicleSource.error && vehicleSource.vehicles.length > 0;
  const officeCoreReady = Boolean(office.publicPhone && office.address && office.hours);
  const instagramReady = configured(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID, process.env.INSTAGRAM_VERIFY_TOKEN, process.env.INSTAGRAM_APP_SECRET);
  const connections = [
    { name: 'Neon Postgres', description: 'Guarda clientes, conversas, tarefas, equipe, perfis e auditoria do PintService.', ready: isNeonConfigured() && data.source === 'live', detail: 'DATABASE_URL — segredo do servidor' },
    { name: 'Login e permissões', description: 'Autentica cada pessoa e aplica Administrador, Gerente ou Funcionário com escopo por setor e tarefa.', ready: isAuthConfigured, detail: 'Neon Auth + vínculo em Perfis e acessos' },
    { name: 'Fonte operacional por link', description: 'Relê a planilha da oficina antes de responder status de veículo. Se a placa ou o status não estiverem lá, solicita confirmação humana.', ready: vehicleSourceReady, detail: vehicleSource.error ? `erro ao ler a fonte: ${vehicleSource.error}` : vehicleSourceReady ? `${vehicleSource.vehicles.length} veículo(s) lido(s) agora` : 'VEHICLE_DATA_URL — Google Sheets/CSV somente leitura' },
    { name: 'OpenAI', description: 'Triagem, interpretação e redação segura de respostas de atendimento e reputação.', ready: configured(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL), detail: 'OPENAI_API_KEY + OPENAI_MODEL' },
    { name: 'WhatsApp Cloud API', description: 'Recebe e envia mensagens pelo número oficial, cria tarefas e envia alertas internos.', ready: configured(process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID, process.env.WHATSAPP_VERIFY_TOKEN, process.env.WHATSAPP_APP_SECRET, process.env.WHATSAPP_GRAPH_VERSION), detail: 'token + phone number id + verify token + app secret + Graph version' },
    { name: 'Google Business Profile', description: 'Lê avaliações da oficina e permite resposta controlada pela Central de reputação.', ready: reputationChannels.find((item) => item.channel === 'google')?.state === 'ready', detail: 'OAuth + account id + location id' },
    { name: 'Instagram profissional', description: 'Sincroniza DMs e comentários, responde pela API e recebe webhooks em tempo real.', ready: instagramReady, detail: 'token + Instagram business id + verify token + app secret' },
    { name: 'Reclame Aqui', description: 'Mostra reputação e, quando contratado, lê e responde reclamações pela RA API.', ready: reputationChannels.find((item) => item.channel === 'reclame_aqui')?.state !== 'missing', detail: reputationChannels.find((item) => item.channel === 'reclame_aqui')?.state === 'partial' ? 'indicadores conectados; casos individuais dependem do contrato RA API' : 'APIKey + company id + endpoints do contrato' },
    { name: 'Alertas de reputação', description: 'Envia ao WhatsApp interno novas DMs e casos classificados como alta/urgente.', ready: configured(process.env.ALERT_WHATSAPP_TO, process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID), detail: 'número interno + WhatsApp Cloud API + template recomendado' },
    { name: 'Dados da oficina', description: 'Telefone, horários e endereço usados como informação oficial no atendimento.', ready: officeCoreReady, detail: officeCoreReady ? `${office.publicPhone} · ${office.address}` : 'telefone + horário + endereço confirmados' },
  ];

  return (
    <AppShell active="configuracoes" source={data.source}>
      <header className="topbar"><div><p className="eyebrow">SISTEMA</p><h1>Configurações</h1><p>Status real das conexões sem exibir chaves, tokens ou segredos.</p></div></header>

      <section className="panel page-panel"><div className="panel-head"><div><p className="eyebrow">CONEXÕES</p><h2>Integrações</h2></div><span className="source-chip">{connections.filter((item) => item.ready).length}/{connections.length} configuradas</span></div><div className="connection-list">{connections.map((connection) => <article className="connection-card" key={connection.name}><div className={`connection-status ${connection.ready ? 'ready' : 'missing'}`}>{connection.ready ? '✓' : '!'}</div><div><h3>{connection.name}</h3><p>{connection.description}</p><small>{connection.detail}</small></div><span className={connection.ready ? 'tag ai' : 'tag human'}>{connection.ready ? 'configurado' : 'pendente'}</span></article>)}</div></section>

      <section className="settings-grid">
        <article className="panel settings-card"><p className="eyebrow">CADASTRO OFICIAL</p><h2>{office.name}</h2><ul><li><strong>Telefone:</strong> {office.publicPhone}</li><li><strong>Endereço:</strong> {office.address}</li><li><strong>Horários:</strong> {office.hours}</li><li><strong>Instagram:</strong> <a href={office.instagramUrl} target="_blank" rel="noreferrer">{office.instagramHandle}</a></li><li><strong>Google:</strong> <a href={office.googleBusinessUrl} target="_blank" rel="noreferrer">abrir perfil/localização</a></li><li><strong>Site antigo:</strong> {office.legacySiteUrl} — referência histórica.</li><li><strong>Reclame Aqui:</strong> URL recebida, mas a titularidade do perfil ainda precisa ser confirmada antes de tratá-lo como canal oficial.</li></ul></article>
        <article className="panel settings-card"><p className="eyebrow">DADOS OPERACIONAIS</p><h2>Fonte de verdade</h2><ul><li>O banco Neon guarda atendimento, tarefas, usuários e histórico.</li><li>Quando a fonte por link estiver configurada, o status do veículo é consultado novamente no Google Sheets antes da resposta.</li><li>Se a fonte estiver indisponível, a placa não existir ou Fase/Status estiver vazio, o PintService não usa um dado antigo como verdade.</li><li>Nesse caso uma pendência é criada para a equipe confirmar.</li></ul></article>
        <article className="panel settings-card"><p className="eyebrow">REPUTAÇÃO</p><h2>Alertas e respostas</h2><ul><li>Instagram recebe eventos por webhook em tempo real.</li><li>Google e Reclame Aqui podem ser sincronizados e monitorados pela Central de reputação.</li><li>Respostas externas passam pela permissão <strong>Responder reputação</strong>.</li><li>Casos críticos continuam exigindo revisão humana.</li></ul></article>
        <article className="panel settings-card"><p className="eyebrow">SEGURANÇA</p><h2>Proteções ativas</h2><ul><li>Segredos ficam somente no ambiente do servidor.</li><li>Rotas internas usam sessão e RBAC; webhooks públicos validam assinatura/segredo quando aplicável.</li><li>A IA não confirma fato físico, preço, prazo, culpa ou dano sem fonte ou humano.</li><li>Toda alteração administrativa relevante pode ser registrada na auditoria.</li></ul></article>
      </section>
    </AppShell>
  );
}

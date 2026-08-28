import AppShell from '@/app/components/app-shell';
import core from '@/app/components/precision-atelier-core.module.css';
import admin from '@/app/components/precision-atelier-admin.module.css';
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
    { name: 'Blinko', description: 'Permite que a central Blinko consulte apenas um resumo seguro da operação, sem acesso ao banco completo.', ready: configured(process.env.BLINKO_API_SECRET), detail: 'BLINKO_API_SECRET compartilhado com a Blinko' },
    { name: 'Dados da oficina', description: 'Telefone, horários e endereço usados como informação oficial no atendimento.', ready: officeCoreReady, detail: officeCoreReady ? `${office.publicPhone} · ${office.address}` : 'telefone + horário + endereço confirmados' },
  ];
  const readyCount = connections.filter((item) => item.ready).length;
  const pendingCount = connections.length - readyCount;

  return (
    <AppShell active="configuracoes" source={data.source}>
      <div className={core.page}>
        <header className={core.header}>
          <div className={core.headerCopy}><p className={core.kicker}>SISTEMA · CONEXÕES E GOVERNANÇA</p><h1 className={core.title}>Configurações</h1><p className={core.subtitle}>Uma leitura objetiva do que já está operacional e do que ainda falta conectar, sem expor chaves, tokens ou segredos.</p></div>
        </header>

        <section className={core.darkBand}>
          <div className={core.darkCopy}><p className={core.darkLabel}>PRÉ-GO-LIVE</p><h2 className={core.darkTitle}>{pendingCount ? `${pendingCount} ${pendingCount === 1 ? 'conexão ainda depende' : 'conexões ainda dependem'} de ativação externa.` : 'Todas as conexões previstas estão prontas.'}</h2><p className={core.darkText}>O core permanece separado dos canais externos: banco, autenticação e regras continuam funcionando sem fingir que uma integração está ativa quando ainda não está.</p></div>
          <div className={core.darkStats}><div className={core.darkStat}><strong>{readyCount}</strong><span>configuradas</span></div><div className={core.darkStat}><strong>{pendingCount}</strong><span>pendentes</span></div></div>
        </section>

        <section className={core.section}>
          <div className={core.sectionHead}><div><p>CONEXÕES</p><h2>Estado real das integrações</h2></div><span className={core.count}>{readyCount}/{connections.length}</span></div>
          <div className={admin.connectionGrid}>{connections.map((connection) => <article className={admin.connection} key={connection.name}><div className={`${admin.status} ${connection.ready ? admin.statusReady : ''}`}>{connection.ready ? '✓' : '!'}</div><div><h3>{connection.name}</h3><p>{connection.description}</p><small>{connection.detail}</small></div><span className={`${admin.state} ${connection.ready ? admin.stateReady : ''}`}>{connection.ready ? 'configurado' : 'pendente'}</span></article>)}</div>
        </section>

        <section className={admin.infoGrid}>
          <article className={admin.infoCard}><p>CADASTRO OFICIAL</p><h2>{office.name}</h2><ul><li><strong>Telefone:</strong> {office.publicPhone}</li><li><strong>Endereço:</strong> {office.address}</li><li><strong>Horários:</strong> {office.hours}</li><li><strong>Instagram:</strong> <a href={office.instagramUrl} target="_blank" rel="noreferrer">{office.instagramHandle}</a></li><li><strong>Google:</strong> <a href={office.googleBusinessUrl} target="_blank" rel="noreferrer">abrir perfil/localização</a></li><li><strong>Site antigo:</strong> {office.legacySiteUrl} — referência histórica.</li></ul></article>
          <article className={admin.infoCard}><p>DADOS OPERACIONAIS</p><h2>Fonte de verdade</h2><ul><li>O banco Neon guarda atendimento, tarefas, usuários e histórico.</li><li>Quando a fonte por link estiver configurada, o status do veículo é consultado novamente no Google Sheets antes da resposta.</li><li>Se a fonte estiver indisponível, a placa não existir ou Fase/Status estiver vazio, o PintService não usa um dado antigo como verdade.</li><li>Nesse caso uma pendência é criada para a equipe confirmar.</li></ul></article>
          <article className={admin.infoCard}><p>REPUTAÇÃO</p><h2>Alertas e respostas</h2><ul><li>Instagram recebe eventos por webhook em tempo real.</li><li>Google e Reclame Aqui podem ser sincronizados e monitorados pela Central de reputação.</li><li>Respostas externas passam pela permissão <strong>Responder reputação</strong>.</li><li>Casos críticos continuam exigindo revisão humana.</li></ul></article>
          <article className={admin.infoCard}><p>SEGURANÇA</p><h2>Proteções ativas</h2><ul><li>Segredos ficam somente no ambiente do servidor.</li><li>Rotas internas usam sessão e RBAC; webhooks públicos validam assinatura ou segredo quando aplicável.</li><li>A IA não confirma fato físico, preço, prazo, culpa ou dano sem fonte ou humano.</li><li>Toda alteração administrativa relevante pode ser registrada na auditoria.</li></ul></article>
        </section>
      </div>
    </AppShell>
  );
}

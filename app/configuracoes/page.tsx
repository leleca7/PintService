import AppShell from '@/app/components/app-shell';
import core from '@/app/components/precision-atelier-core.module.css';
import admin from '@/app/components/precision-atelier-admin.module.css';
import { getDashboardData, isNeonConfigured } from '@/lib/dashboard-data';
import { isAuthConfigured } from '@/lib/auth/server';
import { fetchExternalVehicles } from '@/lib/external-vehicle-source';
import { getOfficeProfile } from '@/lib/office-profile';
import { getChannelStatuses } from '@/lib/reputation';
import { getOperationalAutomationConfig } from '@/lib/operational-config';
import { getWhatsAppReadiness } from '@/lib/whatsapp-readiness';
import { sendWhatsAppActivationTest, updateOperationalAutomationConfig } from './actions';

function configured(...values: Array<string | undefined>) { return values.every((value) => Boolean(value?.trim())); }

export default async function SettingsPage() {
  const [data, vehicleSource, automation, whatsapp] = await Promise.all([
    getDashboardData(),
    fetchExternalVehicles(),
    getOperationalAutomationConfig(),
    getWhatsAppReadiness(),
  ]);
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
    { name: 'WhatsApp Cloud API', description: 'Recebe e envia mensagens pelo número oficial, cria tarefas e envia alertas internos.', ready: whatsapp.transportConfigured && whatsapp.phone.reachable, detail: whatsapp.phone.reachable ? `${whatsapp.phone.verifiedName || 'Número validado'} · ${whatsapp.phone.displayPhoneNumber || 'telefone confirmado pela Meta'}` : 'credenciais + validação do número oficial na Meta' },
    { name: 'Google Business Profile', description: 'Lê avaliações da oficina e permite resposta controlada pela Central de reputação.', ready: reputationChannels.find((item) => item.channel === 'google')?.state === 'ready', detail: 'OAuth + account id + location id' },
    { name: 'Instagram profissional', description: 'Sincroniza DMs e comentários, responde pela API e recebe webhooks em tempo real.', ready: instagramReady, detail: 'token + Instagram business id + verify token + app secret' },
    { name: 'Reclame Aqui', description: 'Mostra reputação e, quando contratado, lê e responde reclamações pela RA API.', ready: reputationChannels.find((item) => item.channel === 'reclame_aqui')?.state !== 'missing', detail: reputationChannels.find((item) => item.channel === 'reclame_aqui')?.state === 'partial' ? 'indicadores conectados; casos individuais dependem do contrato RA API' : 'APIKey + company id + endpoints do contrato' },
    { name: 'Alertas de reputação', description: 'Envia ao WhatsApp interno novas DMs e casos classificados como alta/urgente.', ready: configured(process.env.ALERT_WHATSAPP_TO, process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID), detail: 'número interno + WhatsApp Cloud API + template recomendado' },
    { name: 'Blinko', description: 'Permite que a central Blinko consulte apenas um resumo seguro da operação, sem acesso ao banco completo.', ready: configured(process.env.BLINKO_API_SECRET), detail: 'BLINKO_API_SECRET compartilhado com a Blinko' },
    { name: 'Dados da oficina', description: 'Telefone, horários e endereço usados como informação oficial no atendimento.', ready: officeCoreReady, detail: officeCoreReady ? `${office.publicPhone} · ${office.address}` : 'telefone + horário + endereço confirmados' },
    { name: 'Reconciliação Zeta', description: 'Compara a fonte do Zeta com o Sistema da Pint em modo somente leitura e destaca divergências.', ready: configured(process.env.ZETA_SYNC_URL), detail: 'ZETA_SYNC_URL + token opcional; nenhuma escrita no Zeta' },
    { name: 'Inbox de e-mail', description: 'Entrada protegida para conectar um provedor de e-mail à caixa multicanal.', ready: configured(process.env.INBOX_EMAIL_WEBHOOK_SECRET), detail: 'webhook + segredo do provedor' },
    { name: 'Inbox do site', description: 'Entrada protegida para formulários e contatos do site chegarem à mesma central.', ready: configured(process.env.INBOX_SITE_WEBHOOK_SECRET), detail: 'webhook + segredo compartilhado' },
    { name: 'Atualizações operacionais ao cliente', description: 'Envia somente eventos relevantes da oficina quando o template da Meta está disponível.', ready: configured(process.env.WHATSAPP_OPERATION_UPDATE_TEMPLATE), detail: 'template Meta com cliente, veículo, evento e mensagem' },
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

        <section className={core.section}>
          <div className={core.sectionHead}><div><p>WHATSAPP META</p><h2>Ativação e diagnóstico</h2></div><span className={core.count}>{whatsapp.approvedTemplates}/{whatsapp.templates.length} templates aprovados</span></div>
          <div className={admin.infoGrid}>
            <article className={admin.infoCard}>
              <p>WEBHOOK</p>
              <h2>{whatsapp.transportConfigured ? 'Credenciais principais informadas' : 'Configuração incompleta'}</h2>
              <ul>
                <li><strong>Callback:</strong> <code>{whatsapp.callbackUrl}</code></li>
                <li><strong>Graph API:</strong> {whatsapp.graphVersion}</li>
                <li><strong>Access Token:</strong> {whatsapp.credentialChecks.accessToken ? 'configurado' : 'pendente'}</li>
                <li><strong>Phone Number ID:</strong> {whatsapp.credentialChecks.phoneNumberId ? 'configurado' : 'pendente'}</li>
                <li><strong>Verify Token:</strong> {whatsapp.credentialChecks.verifyToken ? 'configurado' : 'pendente'}</li>
                <li><strong>App Secret:</strong> {whatsapp.credentialChecks.appSecret ? 'configurado' : 'pendente'}</li>
                <li><strong>WABA ID:</strong> {whatsapp.credentialChecks.businessAccountId ? 'configurado' : 'pendente'}</li>
              </ul>
            </article>
            <article className={admin.infoCard}>
              <p>NÚMERO OFICIAL</p>
              <h2>{whatsapp.phone.reachable ? (whatsapp.phone.verifiedName || 'Número validado') : 'Ainda não validado'}</h2>
              <ul>
                <li><strong>Telefone:</strong> {whatsapp.phone.displayPhoneNumber || '—'}</li>
                <li><strong>Qualidade:</strong> {whatsapp.phone.qualityRating || '—'}</li>
                <li><strong>Consulta à Meta:</strong> {whatsapp.phone.reachable ? 'OK' : (whatsapp.phone.error || 'aguardando credenciais')}</li>
                <li><strong>Templates listáveis:</strong> {whatsapp.businessAccountIdConfigured ? (whatsapp.templatesError || 'consulta habilitada') : 'aguardando WABA ID'}</li>
              </ul>
            </article>
          </div>

          <div className={admin.connectionGrid} style={{ marginTop: 14 }}>
            {whatsapp.templates.map((template) => <article className={admin.connection} key={template.envKey}>
              <div className={`${admin.status} ${template.approved ? admin.statusReady : ''}`}>{template.approved ? '✓' : '!'}</div>
              <div>
                <h3>{template.label}</h3>
                <p>{template.purpose}</p>
                <small>{template.configuredName || `sugestão: ${template.suggestedName}`} · {template.parameterCount} parâmetro(s) · categoria sugerida {template.categoryHint}</small>
              </div>
              <span className={`${admin.state} ${template.approved ? admin.stateReady : ''}`}>{template.approved ? 'aprovado' : template.remoteStatus || (template.configured ? 'configurado' : 'pendente')}</span>
            </article>)}
          </div>

          <form action={sendWhatsAppActivationTest} style={{ display:'grid', gap:10, marginTop:16, maxWidth:620 }}>
            <strong>Teste controlado de template</strong>
            <small>Use somente depois que o número e pelo menos um template estiverem aprovados. O sistema envia uma única mensagem de teste e registra a ação na auditoria.</small>
            <input name="phone" placeholder="Ex.: 5571999999999" inputMode="tel" style={{ padding:10, border:'1px solid var(--line,#d9dde3)', borderRadius:10 }}/>
            <select name="template" defaultValue="WHATSAPP_OPERATION_UPDATE_TEMPLATE" style={{ padding:10, border:'1px solid var(--line,#d9dde3)', borderRadius:10 }}>
              {whatsapp.templates.map((template) => <option key={template.envKey} value={template.envKey}>{template.label}{template.configured ? '' : ' — ainda não configurado'}</option>)}
            </select>
            <div><button className={core.button} type="submit">Enviar mensagem de teste</button></div>
          </form>
        </section>

        <section className={core.section}>
          <div className={core.sectionHead}><div><p>AUTOMAÇÕES OPERACIONAIS</p><h2>O que o sistema executa sozinho</h2></div></div>
          <form action={updateOperationalAutomationConfig} style={{ display: 'grid', gap: 12 }}>
            {[
              ['detector_atrasos_ativo','Detector de veículos acima do tempo esperado',automation.detectorDelays,'Cria alerta e pede confirmação ao responsável antes de escalar.'],
              ['previsao_operacional_ativa','Previsão operacional interna',automation.smartForecast,'Calcula estimativa somente quando os dados permitem; nunca inventa data quando falta dependência.'],
              ['exigir_checklist_qualidade','Exigir checklist antes da entrega',automation.requireQualityChecklist,'Impede finalização até a conferência final ser aprovada.'],
              ['comunicacao_eventos_ativa','Eventos relevantes para clientes',automation.customerEvents,'Entrada, início do reparo, pintura concluída, montagem e pronto para entrega.'],
              ['resumo_setores_ativo','Resumos por setor',automation.sectorSummaries,'Prepara supervisão por líder/setor; envio depende do canal interno configurado.'],
              ['cobranca_fornecedor_automatica','Cobrança automática de fornecedor',automation.automaticSupplierCharge,'Fica desligada por padrão; exige contato do fornecedor e template aprovado antes do envio automático.'],
            ].map(([name,label,enabled,description]) => <label key={String(name)} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:12, border:'1px solid var(--line,#d9dde3)', borderRadius:12 }}>
              <input type="checkbox" name={String(name)} defaultChecked={Boolean(enabled)} style={{ marginTop:4 }}/>
              <span><strong>{String(label)}</strong><small style={{ display:'block', marginTop:3 }}>{String(description)}</small></span>
            </label>)}
            <div><button className={core.button} type="submit">Salvar automações</button></div>
          </form>
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

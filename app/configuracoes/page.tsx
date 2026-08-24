import AppShell from '@/app/components/app-shell';
import { getDashboardData, isSupabaseConfigured } from '@/lib/dashboard-data';
import { fetchExternalVehicles } from '@/lib/external-vehicle-source';
import { getChannelStatuses } from '@/lib/reputation';

function configured(...values: Array<string | undefined>) {
  return values.every(Boolean);
}

export default async function SettingsPage() {
  const [data, vehicleSource] = await Promise.all([getDashboardData(), fetchExternalVehicles()]);
  const reputationChannels = getChannelStatuses();
  const vehicleSourceReady = vehicleSource.configured && !vehicleSource.error && vehicleSource.vehicles.length > 0;
  const connections = [
    { name: 'Banco de dados', description: 'Guarda clientes, conversas, tarefas e histórico do atendimento. A fonte por link pode ser usada como verdade operacional dos veículos.', ready: isSupabaseConfigured(), detail: 'dados de atendimento e operação' },
    { name: 'Fonte operacional por link', description: 'Lê a planilha atualizada da oficina antes de responder status de veículo. Se a placa ou o status não estiverem lá, a IA solicita confirmação humana.', ready: vehicleSourceReady, detail: vehicleSource.error ? `erro ao ler a fonte: ${vehicleSource.error}` : vehicleSourceReady ? `${vehicleSource.vehicles.length} veículo(s) lido(s) agora` : 'VEHICLE_DATA_URL — link público somente para leitura da aba com Placa/Modelo/Fase/Status' },
    { name: 'OpenAI', description: 'Triagem, interpretação e redação segura de respostas de atendimento e reputação.', ready: configured(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL), detail: 'OPENAI_API_KEY + OPENAI_MODEL' },
    { name: 'WhatsApp Cloud API', description: 'Recebe e envia mensagens pelo número oficial e também pode receber alertas da reputação.', ready: configured(process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID, process.env.WHATSAPP_VERIFY_TOKEN, process.env.WHATSAPP_APP_SECRET), detail: 'token + phone id + verify token + app secret' },
    { name: 'Google Business Profile', description: 'Lê avaliações da oficina e permite responder diretamente pela Central de reputação.', ready: reputationChannels.find((item) => item.channel === 'google')?.state === 'ready', detail: 'OAuth token + account id + location id' },
    { name: 'Instagram profissional', description: 'Sincroniza DMs e comentários, responde pela API e recebe webhooks em tempo real.', ready: reputationChannels.find((item) => item.channel === 'instagram')?.state === 'ready', detail: 'token + Instagram business id + verify token + app secret' },
    { name: 'Reclame Aqui', description: 'Mostra indicadores da reputação e fica pronto para a API contratada de leitura e resposta de reclamações.', ready: reputationChannels.find((item) => item.channel === 'reclame_aqui')?.state !== 'missing', detail: reputationChannels.find((item) => item.channel === 'reclame_aqui')?.state === 'partial' ? 'indicadores conectados; reclamações individuais dependem do contrato RA API' : 'APIKey + company id + endpoints do contrato' },
    { name: 'Alertas de reputação', description: 'Envia ao WhatsApp interno toda nova DM do Instagram e também casos de prioridade alta/urgente.', ready: configured(process.env.ALERT_WHATSAPP_TO, process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID), detail: 'ALERT_WHATSAPP_TO + WhatsApp Cloud API' },
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
        <article className="panel settings-card"><p className="eyebrow">DADOS OPERACIONAIS</p><h2>Como a fonte por link funciona</h2><ul><li>O ideal é um Google Sheets compartilhado como somente leitura e com a aba operacional selecionada no link.</li><li>Antes de responder status, o PintService consulta a fonte novamente; não depende de você anexar uma cópia diária.</li><li>A planilha pode manter as colunas que já existem: Placa, Modelo, Cor, Seguradora, Dt. Entrada, Dt. Produção, Fase, Status, Dias em Casa, Dias p/ Entrega, Status Prazo, Observações e Responsável.</li><li>Se a fonte estiver fora do ar, a placa não existir ou Fase/Status estiver vazio, a IA não usa dado antigo como verdade e encaminha para a equipe confirmar.</li></ul></article>
        <article className="panel settings-card"><p className="eyebrow">REPUTAÇÃO</p><h2>Como os alertas funcionam</h2><ul><li>Instagram usa webhook em tempo real: toda nova DM pode avisar o WhatsApp interno; comentários comuns entram na Central e comentários críticos também geram alerta.</li><li>O modo de alerta do Instagram pode ser alterado para avisar tudo ou somente casos críticos sem mudar o código.</li><li>Google e Reclame Aqui entram na varredura programada e também podem ser sincronizados pela Central de reputação.</li><li>Casos críticos exigem aprovação humana antes de publicar uma resposta.</li></ul></article>
        <article className="panel settings-card"><p className="eyebrow">SEGURANÇA</p><h2>Proteções preparadas</h2><ul><li>Segredos ficam apenas no servidor.</li><li>Webhooks da Meta validam assinatura quando o App Secret está configurado.</li><li>IA não confirma fatos físicos, preço, prazo, culpa ou dano sem humano.</li><li>Reclamações e avaliações negativas ficam marcadas para aprovação.</li><li>Resposta do Reclame Aqui só é habilitada com o endpoint fornecido no contrato oficial.</li></ul></article>
      </section>
    </AppShell>
  );
}

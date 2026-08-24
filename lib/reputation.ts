import 'server-only';

export type ReputationChannel = 'google' | 'instagram' | 'reclame_aqui' | 'whatsapp';
export type ReputationKind = 'avaliacao' | 'mensagem' | 'comentario' | 'reclamacao';
export type ReputationPriority = 'baixa' | 'normal' | 'alta' | 'urgente';
export type ReputationStatus = 'novo' | 'aguardando_resposta' | 'respondido' | 'monitorando';

export type ReplyTarget =
  | { kind: 'google_review'; reviewId: string }
  | { kind: 'instagram_dm'; recipientId: string }
  | { kind: 'instagram_comment'; commentId: string }
  | { kind: 'reclame_aqui'; complaintId: string }
  | null;

export type ReputationItem = {
  id: string;
  channel: ReputationChannel;
  kind: ReputationKind;
  author: string;
  title: string;
  message: string;
  rating: number | null;
  priority: ReputationPriority;
  status: ReputationStatus;
  createdAt: string;
  externalUrl: string | null;
  requiresApproval: boolean;
  canReply: boolean;
  replyTarget: ReplyTarget;
  source: 'demo' | 'live';
};

export type IntegrationState = 'ready' | 'partial' | 'missing';
export type ChannelStatus = {
  channel: ReputationChannel;
  label: string;
  state: IntegrationState;
  detail: string;
  realtime: boolean;
};

export type ReclameAquiSummary = {
  reputationScore: number | null;
  consumerScore: number | null;
  answeredPercent: number | null;
  resolvedPercent: number | null;
  waitingReplies: number | null;
  complaintsReceived: number | null;
  avgReplyDays: number | null;
  topProblems: string[];
  source: 'demo' | 'live';
};

export type ReputationData = {
  source: 'demo' | 'live' | 'mixed';
  items: ReputationItem[];
  channels: ChannelStatus[];
  reclameAqui: ReclameAquiSummary;
  errors: string[];
  generatedAt: string;
};

const channelLabels: Record<ReputationChannel, string> = {
  google: 'Google',
  instagram: 'Instagram',
  reclame_aqui: 'Reclame Aqui',
  whatsapp: 'WhatsApp',
};

function configured(...values: Array<string | undefined>) {
  return values.every((value) => Boolean(value?.trim()));
}

function graphVersion() {
  return process.env.INSTAGRAM_GRAPH_VERSION?.trim() || 'v23.0';
}

export function getChannelStatuses(): ChannelStatus[] {
  const googleReady = configured(
    process.env.GOOGLE_BUSINESS_ACCESS_TOKEN,
    process.env.GOOGLE_BUSINESS_ACCOUNT_ID,
    process.env.GOOGLE_BUSINESS_LOCATION_ID,
  );
  const instagramReady = configured(
    process.env.INSTAGRAM_ACCESS_TOKEN,
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
    process.env.INSTAGRAM_VERIFY_TOKEN,
  );
  const raDataReady = configured(process.env.RECLAME_AQUI_API_KEY, process.env.RECLAME_AQUI_COMPANY_ID);
  const raComplaintsReady = configured(
    process.env.RECLAME_AQUI_API_KEY,
    process.env.RECLAME_AQUI_COMPLAINTS_URL,
  );
  const whatsappReady = configured(
    process.env.WHATSAPP_ACCESS_TOKEN,
    process.env.WHATSAPP_PHONE_NUMBER_ID,
    process.env.WHATSAPP_VERIFY_TOKEN,
    process.env.WHATSAPP_APP_SECRET,
  );

  return [
    {
      channel: 'google', label: 'Google', state: googleReady ? 'ready' : 'missing', realtime: false,
      detail: googleReady ? 'Avaliações e respostas habilitadas.' : 'Faltam OAuth token, account id e location id do Business Profile.',
    },
    {
      channel: 'instagram', label: 'Instagram', state: instagramReady ? 'ready' : 'missing', realtime: instagramReady,
      detail: instagramReady ? 'DMs, comentários, respostas e webhook preparados.' : 'Faltam token, ID da conta profissional e verify token da Meta.',
    },
    {
      channel: 'reclame_aqui', label: 'Reclame Aqui', state: raComplaintsReady ? 'ready' : raDataReady ? 'partial' : 'missing', realtime: false,
      detail: raComplaintsReady ? 'Leitura contratada de reclamações preparada.' : raDataReady ? 'Indicadores de reputação habilitados; leitura/resposta individual depende da RA API contratada.' : 'Faltam APIKey e company id; resposta individual depende do contrato RA API.',
    },
    {
      channel: 'whatsapp', label: 'WhatsApp', state: whatsappReady ? 'ready' : 'missing', realtime: whatsappReady,
      detail: whatsappReady ? 'Canal oficial disponível para atendimento e alertas internos.' : 'Faltam credenciais do WhatsApp Cloud API.',
    },
  ];
}

const demoItems: ReputationItem[] = [
  {
    id: 'demo-google-1', channel: 'google', kind: 'avaliacao', author: 'Marcos Almeida', title: 'Avaliação de 2 estrelas',
    message: 'O serviço ficou bom, mas demorou mais do que eu esperava e ninguém me atualizou durante o processo.', rating: 2,
    priority: 'alta', status: 'aguardando_resposta', createdAt: '2026-08-24T14:48:00-03:00', externalUrl: null,
    requiresApproval: true, canReply: true, replyTarget: { kind: 'google_review', reviewId: 'demo-review-1' }, source: 'demo',
  },
  {
    id: 'demo-instagram-dm-1', channel: 'instagram', kind: 'mensagem', author: '@gabriel.silva', title: 'DM do Instagram',
    message: 'Vocês conseguem verificar por que ninguém me respondeu sobre o carro desde sexta?', rating: null,
    priority: 'alta', status: 'novo', createdAt: '2026-08-24T15:22:00-03:00', externalUrl: null,
    requiresApproval: true, canReply: true, replyTarget: { kind: 'instagram_dm', recipientId: 'demo-igsid-1' }, source: 'demo',
  },
  {
    id: 'demo-ra-1', channel: 'reclame_aqui', kind: 'reclamacao', author: 'Cliente Reclame Aqui', title: 'Reclamação aguardando resposta',
    message: 'Estou tentando contato para entender o andamento do reparo e não tive retorno.', rating: null,
    priority: 'urgente', status: 'aguardando_resposta', createdAt: '2026-08-24T12:10:00-03:00', externalUrl: null,
    requiresApproval: true, canReply: false, replyTarget: null, source: 'demo',
  },
  {
    id: 'demo-instagram-comment-1', channel: 'instagram', kind: 'comentario', author: '@carol.menezes', title: 'Comentário em publicação',
    message: 'Fiz meu carro aí e gostei bastante do acabamento. Atendimento muito bom.', rating: null,
    priority: 'baixa', status: 'novo', createdAt: '2026-08-24T15:44:00-03:00', externalUrl: null,
    requiresApproval: false, canReply: true, replyTarget: { kind: 'instagram_comment', commentId: 'demo-comment-1' }, source: 'demo',
  },
];

const demoRaSummary: ReclameAquiSummary = {
  reputationScore: 8.1,
  consumerScore: 7.6,
  answeredPercent: 92,
  resolvedPercent: 86,
  waitingReplies: 1,
  complaintsReceived: 7,
  avgReplyDays: 1.2,
  topProblems: ['Demora no retorno', 'Prazo de reparo', 'Atualização do veículo'],
  source: 'demo',
};

function starRating(value: string | number | null | undefined) {
  if (typeof value === 'number') return value;
  const map: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return map[String(value ?? '').toUpperCase()] ?? null;
}

export function priorityFor(input: { rating?: number | null; text?: string | null }): ReputationPriority {
  const rating = input.rating ?? null;
  if (rating !== null && rating <= 1) return 'urgente';
  if (rating !== null && rating <= 3) return 'alta';
  const text = (input.text ?? '').toLowerCase();
  const urgent = ['processo', 'procon', 'advogado', 'jurídico', 'juridico', 'danificou', 'batida', 'acidente', 'ameaça', 'ameaca'];
  const negative = ['reclama', 'ninguém respondeu', 'ninguem respondeu', 'sem retorno', 'atras', 'péssim', 'pessim', 'ruim', 'problema', 'insatisfeito', 'insatisfeita'];
  if (urgent.some((term) => text.includes(term))) return 'urgente';
  if (negative.some((term) => text.includes(term))) return 'alta';
  if (rating !== null && rating >= 5) return 'baixa';
  return 'normal';
}

function requiresApproval(priority: ReputationPriority, kind: ReputationKind) {
  return priority === 'alta' || priority === 'urgente' || kind === 'reclamacao';
}

async function fetchJson(url: string, init: RequestInit, label: string) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} (${response.status}): ${body.slice(0, 260)}`);
  }
  return response.json();
}

export async function fetchGoogleReviews(): Promise<ReputationItem[]> {
  const token = process.env.GOOGLE_BUSINESS_ACCESS_TOKEN?.trim();
  const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID?.trim();
  const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID?.trim();
  if (!configured(token, accountId, locationId)) return [];

  const url = `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(accountId!)}/locations/${encodeURIComponent(locationId!)}/reviews?pageSize=50&orderBy=updateTime%20desc`;
  const payload = await fetchJson(url, { headers: { Authorization: `Bearer ${token}` } }, 'Google Business Profile');
  const reviews = Array.isArray(payload?.reviews) ? payload.reviews : [];

  return reviews.map((review: any): ReputationItem => {
    const rating = starRating(review?.starRating);
    const message = String(review?.comment ?? '').trim() || 'Avaliação sem comentário.';
    const priority = priorityFor({ rating, text: message });
    return {
      id: `google-${String(review?.reviewId ?? review?.name ?? crypto.randomUUID())}`,
      channel: 'google', kind: 'avaliacao', author: String(review?.reviewer?.displayName ?? 'Cliente Google'),
      title: rating ? `Avaliação de ${rating} estrela${rating === 1 ? '' : 's'}` : 'Avaliação no Google', message, rating,
      priority, status: review?.reviewReply ? 'respondido' : 'aguardando_resposta',
      createdAt: String(review?.createTime ?? review?.updateTime ?? new Date().toISOString()), externalUrl: String(review?.reviewReplyUrl ?? '') || null,
      requiresApproval: requiresApproval(priority, 'avaliacao'), canReply: true,
      replyTarget: { kind: 'google_review', reviewId: String(review?.reviewId ?? '').trim() }, source: 'live',
    };
  }).filter((item: ReputationItem) => Boolean((item.replyTarget as any)?.reviewId));
}

async function instagramGet(path: string) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) throw new Error('Instagram sem access token.');
  const url = `https://graph.instagram.com/${graphVersion()}/${path}`;
  return fetchJson(url, { headers: { Authorization: `Bearer ${token}` } }, 'Instagram');
}

export async function fetchInstagramInbox(): Promise<ReputationItem[]> {
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!configured(igId, token)) return [];

  const result: ReputationItem[] = [];
  const conversations = await instagramGet(`${encodeURIComponent(igId!)}/conversations?platform=instagram&limit=10`);
  for (const conversation of (Array.isArray(conversations?.data) ? conversations.data : []).slice(0, 8)) {
    const conversationId = String(conversation?.id ?? '');
    if (!conversationId) continue;
    try {
      const messageList = await instagramGet(`${encodeURIComponent(conversationId)}?fields=messages`);
      const ids = (Array.isArray(messageList?.messages?.data) ? messageList.messages.data : []).slice(0, 4).map((entry: any) => String(entry?.id ?? '')).filter(Boolean);
      let incoming: any = null;
      for (const messageId of ids) {
        const detail = await instagramGet(`${encodeURIComponent(messageId)}?fields=id,created_time,from,to,message`);
        if (String(detail?.from?.id ?? '') && String(detail?.from?.id ?? '') !== igId) { incoming = detail; break; }
      }
      if (!incoming) continue;
      const text = String(incoming?.message ?? '').trim();
      if (!text) continue;
      const priority = priorityFor({ text });
      result.push({
        id: `instagram-dm-${incoming.id}`, channel: 'instagram', kind: 'mensagem', author: incoming?.from?.username ? `@${incoming.from.username}` : 'Cliente Instagram',
        title: 'DM do Instagram', message: text, rating: null, priority, status: 'aguardando_resposta',
        createdAt: String(incoming?.created_time ?? conversation?.updated_time ?? new Date().toISOString()), externalUrl: null,
        requiresApproval: requiresApproval(priority, 'mensagem'), canReply: true,
        replyTarget: { kind: 'instagram_dm', recipientId: String(incoming?.from?.id ?? '') }, source: 'live',
      });
    } catch {
      // Uma conversa inválida não impede a leitura das demais.
    }
  }
  return result;
}

export async function fetchInstagramComments(): Promise<ReputationItem[]> {
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!configured(igId, token)) return [];

  const result: ReputationItem[] = [];
  const media = await instagramGet(`${encodeURIComponent(igId!)}/media?fields=id,caption,timestamp&limit=5`);
  for (const post of (Array.isArray(media?.data) ? media.data : []).slice(0, 5)) {
    const mediaId = String(post?.id ?? '');
    if (!mediaId) continue;
    try {
      const comments = await instagramGet(`${encodeURIComponent(mediaId)}/comments?fields=from,text,timestamp&limit=10`);
      for (const comment of Array.isArray(comments?.data) ? comments.data : []) {
        const text = String(comment?.text ?? '').trim();
        if (!text) continue;
        const priority = priorityFor({ text });
        result.push({
          id: `instagram-comment-${comment.id}`, channel: 'instagram', kind: 'comentario', author: comment?.from?.username ? `@${comment.from.username}` : 'Comentário Instagram',
          title: 'Comentário em publicação', message: text, rating: null, priority, status: 'aguardando_resposta',
          createdAt: String(comment?.timestamp ?? post?.timestamp ?? new Date().toISOString()), externalUrl: null,
          requiresApproval: requiresApproval(priority, 'comentario'), canReply: true,
          replyTarget: { kind: 'instagram_comment', commentId: String(comment?.id ?? '') }, source: 'live',
        });
      }
    } catch {
      // Continua com os demais posts.
    }
  }
  return result;
}

function pickFirstObject(payload: any) {
  if (Array.isArray(payload)) return payload[0] ?? null;
  if (Array.isArray(payload?.data)) return payload.data[0] ?? null;
  if (Array.isArray(payload?.items)) return payload.items[0] ?? null;
  return payload?.data && typeof payload.data === 'object' ? payload.data : payload;
}

function numberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchReclameAquiSummary(): Promise<ReclameAquiSummary | null> {
  const apiKey = process.env.RECLAME_AQUI_API_KEY?.trim();
  const companyId = process.env.RECLAME_AQUI_COMPANY_ID?.trim();
  if (!configured(apiKey, companyId)) return null;
  const payload = await fetchJson(
    'https://api-reputacao.obviobrasil.com.br/api/v1/reputation?page=1&pageSize=10',
    {
      method: 'POST', headers: { Authentication: apiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: process.env.RECLAME_AQUI_INTERVAL || '180', companyId: [companyId] }),
    },
    'Reclame Aqui Data Hub',
  );
  const row = pickFirstObject(payload) ?? {};
  const topRaw = row?.top_3_diderot_problema;
  const topProblems = Array.isArray(topRaw) ? topRaw.map(String) : typeof topRaw === 'string' ? topRaw.split(/[,;|]/).map((value: string) => value.trim()).filter(Boolean) : [];
  return {
    reputationScore: numberOrNull(row?.indice_reputacao), consumerScore: numberOrNull(row?.nota_media_consumidores),
    answeredPercent: numberOrNull(row?.percent_reclamacao_respondida), resolvedPercent: numberOrNull(row?.percent_reclamacao_resolvida),
    waitingReplies: numberOrNull(row?.volume_reclamacoes_aguardando_resposta), complaintsReceived: numberOrNull(row?.volume_reclamacao_recebida),
    avgReplyDays: numberOrNull(row?.tempo_medio_respostas_dias), topProblems, source: 'live',
  };
}

function extractComplaintArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  for (const key of ['complaints', 'reclamacoes', 'tickets', 'items', 'data', 'results']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function nested(input: any, paths: string[]) {
  for (const path of paths) {
    const value = path.split('.').reduce((current, key) => current?.[key], input);
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return null;
}

export async function fetchReclameAquiComplaints(): Promise<ReputationItem[]> {
  const apiKey = process.env.RECLAME_AQUI_API_KEY?.trim();
  const url = process.env.RECLAME_AQUI_COMPLAINTS_URL?.trim();
  if (!configured(apiKey, url)) return [];
  const payload = await fetchJson(url!, { headers: { Authentication: apiKey!, Authorization: `Bearer ${apiKey}` } }, 'Reclame Aqui - reclamações');
  return extractComplaintArray(payload).map((complaint: any, index: number): ReputationItem => {
    const complaintId = String(nested(complaint, ['id', 'complaint_id', 'complaintId', 'ticket_id', 'ticketId', 'uuid']) ?? `item-${index}`);
    const message = String(nested(complaint, ['message', 'description', 'complaint', 'text', 'content', 'body']) ?? 'Reclamação recebida no Reclame Aqui.');
    const priority = priorityFor({ text: message });
    const statusRaw = String(nested(complaint, ['status', 'state', 'situation']) ?? '').toLowerCase();
    return {
      id: `ra-${complaintId}`, channel: 'reclame_aqui', kind: 'reclamacao', author: String(nested(complaint, ['customer.name', 'consumer.name', 'author.name', 'name']) ?? 'Consumidor Reclame Aqui'),
      title: String(nested(complaint, ['title', 'subject', 'headline']) ?? 'Reclamação no Reclame Aqui'), message, rating: null,
      priority, status: statusRaw.includes('respond') || statusRaw.includes('closed') || statusRaw.includes('resol') ? 'respondido' : 'aguardando_resposta',
      createdAt: String(nested(complaint, ['created_at', 'createdAt', 'date', 'created']) ?? new Date().toISOString()),
      externalUrl: String(nested(complaint, ['url', 'link', 'public_url']) ?? '') || null,
      requiresApproval: true, canReply: configured(process.env.RECLAME_AQUI_REPLY_URL_TEMPLATE),
      replyTarget: { kind: 'reclame_aqui', complaintId }, source: 'live',
    };
  });
}

export async function getReputationData(options: { demoFallback?: boolean } = {}): Promise<ReputationData> {
  const channels = getChannelStatuses();
  const errors: string[] = [];
  const liveItems: ReputationItem[] = [];
  let raSummary: ReclameAquiSummary | null = null;
  let attemptedLive = false;

  const tasks: Array<Promise<void>> = [];
  if (channels.find((item) => item.channel === 'google')?.state === 'ready') {
    attemptedLive = true;
    tasks.push(fetchGoogleReviews().then((items) => { liveItems.push(...items); }).catch((error) => errors.push(String(error?.message ?? error))));
  }
  if (channels.find((item) => item.channel === 'instagram')?.state === 'ready') {
    attemptedLive = true;
    tasks.push(fetchInstagramInbox().then((items) => { liveItems.push(...items); }).catch((error) => errors.push(String(error?.message ?? error))));
    tasks.push(fetchInstagramComments().then((items) => { liveItems.push(...items); }).catch((error) => errors.push(String(error?.message ?? error))));
  }
  if (channels.find((item) => item.channel === 'reclame_aqui')?.state !== 'missing') {
    attemptedLive = true;
    tasks.push(fetchReclameAquiSummary().then((summary) => { raSummary = summary; }).catch((error) => errors.push(String(error?.message ?? error))));
    tasks.push(fetchReclameAquiComplaints().then((items) => { liveItems.push(...items); }).catch((error) => errors.push(String(error?.message ?? error))));
  }
  await Promise.all(tasks);

  liveItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const useDemo = options.demoFallback !== false && !liveItems.length && !attemptedLive;
  const items = useDemo ? demoItems : liveItems;
  const source: ReputationData['source'] = useDemo ? 'demo' : attemptedLive && errors.length ? 'mixed' : 'live';
  return { source, items, channels, reclameAqui: raSummary ?? demoRaSummary, errors, generatedAt: new Date().toISOString() };
}

function googleConfig() {
  const token = process.env.GOOGLE_BUSINESS_ACCESS_TOKEN?.trim();
  const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID?.trim();
  const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID?.trim();
  if (!configured(token, accountId, locationId)) throw new Error('Google Business Profile não está configurado.');
  return { token: token!, accountId: accountId!, locationId: locationId! };
}

export async function replyGoogleReview(reviewId: string, comment: string) {
  const { token, accountId, locationId } = googleConfig();
  const url = `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(accountId)}/locations/${encodeURIComponent(locationId)}/reviews/${encodeURIComponent(reviewId)}/reply`;
  return fetchJson(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ comment }) }, 'Resposta Google');
}

function instagramConfig() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  if (!configured(token, igId)) throw new Error('Instagram não está configurado.');
  return { token: token!, igId: igId! };
}

export async function replyInstagramDm(recipientId: string, text: string) {
  const { token, igId } = instagramConfig();
  const url = `https://graph.instagram.com/${graphVersion()}/${encodeURIComponent(igId)}/messages`;
  return fetchJson(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }) }, 'Resposta Instagram');
}

export async function replyInstagramComment(commentId: string, text: string) {
  const { token } = instagramConfig();
  const url = `https://graph.instagram.com/${graphVersion()}/${encodeURIComponent(commentId)}/replies`;
  return fetchJson(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) }, 'Resposta a comentário Instagram');
}

export async function replyReclameAqui(complaintId: string, text: string) {
  const apiKey = process.env.RECLAME_AQUI_API_KEY?.trim();
  const template = process.env.RECLAME_AQUI_REPLY_URL_TEMPLATE?.trim();
  if (!configured(apiKey, template)) throw new Error('Resposta do Reclame Aqui depende da URL disponibilizada no contrato da RA API.');
  const url = template!.replaceAll('{id}', encodeURIComponent(complaintId));
  const field = process.env.RECLAME_AQUI_REPLY_BODY_FIELD?.trim() || 'message';
  const method = (process.env.RECLAME_AQUI_REPLY_METHOD?.trim() || 'POST').toUpperCase();
  return fetchJson(url, { method, headers: { Authentication: apiKey!, Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: text }) }, 'Resposta Reclame Aqui');
}

export function channelLabel(channel: ReputationChannel) {
  return channelLabels[channel];
}

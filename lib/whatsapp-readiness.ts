import 'server-only';

export type WhatsAppTemplateSpec = {
  envKey:
    | 'WHATSAPP_OPERATION_UPDATE_TEMPLATE'
    | 'WHATSAPP_POST_DELIVERY_TEMPLATE'
    | 'WHATSAPP_POST_DELIVERY_PENDING_TEMPLATE'
    | 'WHATSAPP_POST_DELIVERY_UPDATE_TEMPLATE'
    | 'WHATSAPP_SUPPLIER_DELAY_TEMPLATE'
    | 'ALERT_WHATSAPP_TEMPLATE';
  label: string;
  suggestedName: string;
  parameterCount: number;
  categoryHint: 'UTILITY';
  purpose: string;
};

export const WHATSAPP_TEMPLATE_SPECS: WhatsAppTemplateSpec[] = [
  {
    envKey: 'WHATSAPP_OPERATION_UPDATE_TEMPLATE',
    label: 'Atualização operacional ao cliente',
    suggestedName: 'pint_atualizacao_operacional',
    parameterCount: 4,
    categoryHint: 'UTILITY',
    purpose: 'Entrada, avanço de etapa e pronto para entrega.',
  },
  {
    envKey: 'WHATSAPP_POST_DELIVERY_TEMPLATE',
    label: 'Pós-entrega sem pendência',
    suggestedName: 'pint_pos_entrega',
    parameterCount: 5,
    categoryHint: 'UTILITY',
    purpose: 'Confirma entrega, garantias registradas e solicita feedback.',
  },
  {
    envKey: 'WHATSAPP_POST_DELIVERY_PENDING_TEMPLATE',
    label: 'Pós-entrega com pendência',
    suggestedName: 'pint_pos_entrega_pendencia',
    parameterCount: 5,
    categoryHint: 'UTILITY',
    purpose: 'Confirma entrega e mantém a pendência explícita em acompanhamento.',
  },
  {
    envKey: 'WHATSAPP_POST_DELIVERY_UPDATE_TEMPLATE',
    label: 'Atualização de pendência pós-entrega',
    suggestedName: 'pint_pos_entrega_atualizacao',
    parameterCount: 4,
    categoryHint: 'UTILITY',
    purpose: 'Avisa somente quando houver mudança real na pendência.',
  },
  {
    envKey: 'WHATSAPP_SUPPLIER_DELAY_TEMPLATE',
    label: 'Cobrança de fornecedor',
    suggestedName: 'pint_cobranca_fornecedor',
    parameterCount: 4,
    categoryHint: 'UTILITY',
    purpose: 'Solicita atualização de pedido de peça já existente.',
  },
  {
    envKey: 'ALERT_WHATSAPP_TEMPLATE',
    label: 'Alerta interno',
    suggestedName: 'pint_alerta_interno',
    parameterCount: 1,
    categoryHint: 'UTILITY',
    purpose: 'Resumo/alerta operacional para equipe interna.',
  },
];

function configured(value: string | undefined) {
  return Boolean(value?.trim());
}

function productionBaseUrl() {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit && !explicit.includes('localhost')) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  return 'https://oficina-ia-demo.vercel.app';
}

async function getJson(url: string, token: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const body = await response.text();
  let data: any = null;
  try { data = JSON.parse(body); } catch { data = { raw: body.slice(0, 300) }; }
  return { ok: response.ok, status: response.status, data };
}

export async function getWhatsAppReadiness() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '';
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim() || '';
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim() || '';
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() || 'v26.0';
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() || '';

  const credentialChecks = {
    accessToken: configured(token),
    phoneNumberId: configured(phoneNumberId),
    verifyToken: configured(verifyToken),
    appSecret: configured(appSecret),
    graphVersion: configured(graphVersion),
    businessAccountId: configured(businessAccountId),
  };

  let phone: {
    reachable: boolean;
    displayPhoneNumber: string | null;
    verifiedName: string | null;
    qualityRating: string | null;
    error: string | null;
  } = {
    reachable: false,
    displayPhoneNumber: null,
    verifiedName: null,
    qualityRating: null,
    error: null,
  };

  if (credentialChecks.accessToken && credentialChecks.phoneNumberId) {
    const result = await getJson(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`,
      token,
    );
    if (result.ok) {
      phone = {
        reachable: true,
        displayPhoneNumber: result.data?.display_phone_number ? String(result.data.display_phone_number) : null,
        verifiedName: result.data?.verified_name ? String(result.data.verified_name) : null,
        qualityRating: result.data?.quality_rating ? String(result.data.quality_rating) : null,
        error: null,
      };
    } else {
      phone.error = `Meta respondeu HTTP ${result.status}: ${String(result.data?.error?.message ?? 'não foi possível validar o número').slice(0, 220)}`;
    }
  }

  let remoteTemplates: Array<{ name: string; status: string; category: string; language: string }> = [];
  let templatesError: string | null = null;
  let appSubscription: {
    checked: boolean;
    subscribed: boolean;
    appCount: number;
    error: string | null;
  } = {
    checked: false,
    subscribed: false,
    appCount: 0,
    error: null,
  };

  if (credentialChecks.accessToken && credentialChecks.businessAccountId) {
    const result = await getJson(
      `https://graph.facebook.com/${graphVersion}/${businessAccountId}/subscribed_apps`,
      token,
    );
    appSubscription.checked = true;
    if (result.ok) {
      const apps = Array.isArray(result.data?.data) ? result.data.data : [];
      appSubscription.subscribed = apps.length > 0;
      appSubscription.appCount = apps.length;
    } else {
      appSubscription.error = `Meta respondeu HTTP ${result.status}: ${String(result.data?.error?.message ?? 'não foi possível consultar a inscrição do app').slice(0, 220)}`;
    }
  }


  if (credentialChecks.accessToken && credentialChecks.businessAccountId) {
    const result = await getJson(
      `https://graph.facebook.com/${graphVersion}/${businessAccountId}/message_templates?fields=name,status,category,language&limit=100`,
      token,
    );
    if (result.ok) {
      remoteTemplates = (result.data?.data ?? []).map((item: any) => ({
        name: String(item?.name ?? ''),
        status: String(item?.status ?? ''),
        category: String(item?.category ?? ''),
        language: String(item?.language ?? ''),
      }));
    } else {
      templatesError = `Meta respondeu HTTP ${result.status}: ${String(result.data?.error?.message ?? 'não foi possível listar templates').slice(0, 220)}`;
    }
  }

  const templates = WHATSAPP_TEMPLATE_SPECS.map((spec) => {
    const configuredName = String(process.env[spec.envKey] ?? '').trim();
    const remote = configuredName
      ? remoteTemplates.find((item) => item.name === configuredName && item.language.toLowerCase().startsWith('pt'))
      : undefined;
    return {
      ...spec,
      configuredName,
      configured: Boolean(configuredName),
      remoteStatus: remote?.status ?? null,
      remoteCategory: remote?.category ?? null,
      approved: remote?.status === 'APPROVED',
    };
  });

  const transportConfigured =
    credentialChecks.accessToken &&
    credentialChecks.phoneNumberId &&
    credentialChecks.verifyToken &&
    credentialChecks.appSecret &&
    credentialChecks.graphVersion;

  return {
    callbackUrl: `${productionBaseUrl()}/api/whatsapp`,
    graphVersion,
    credentialChecks,
    transportConfigured,
    phone,
    businessAccountIdConfigured: credentialChecks.businessAccountId,
    appSubscription,
    templates,
    templatesError,
    approvedTemplates: templates.filter((item) => item.approved).length,
    configuredTemplates: templates.filter((item) => item.configured).length,
  };
}

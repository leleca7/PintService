import 'server-only';
import crypto from 'node:crypto';

export type IncomingWhatsAppMessage = { id: string; phone: string; name: string; type: string; text: string; mediaId: string; contextMessageId: string; interactiveId: string };
export function normalizeWhatsAppPhone(value = '') { return value.replace(/\D/g, ''); }

export function verifyMetaSignature(rawBody: string, signature: string | null) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return process.env.NODE_ENV !== 'production';
  if (!signature?.startsWith('sha256=')) return false;
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(expected); const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function extractIncomingMessages(payload: any): IncomingWhatsAppMessage[] {
  const result: IncomingWhatsAppMessage[] = [];
  for (const entry of payload?.entry ?? []) for (const change of entry?.changes ?? []) {
    const value = change?.value ?? {}; const contact = value.contacts?.[0] ?? {};
    for (const message of value.messages ?? []) {
      const type = message.type ?? 'unknown'; let text = ''; let mediaId = ''; let interactiveId = '';
      if (type === 'text') text = message.text?.body ?? '';
      else if (type === 'interactive') { text = message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title ?? ''; interactiveId = message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id ?? ''; }
      else if (type === 'image') { text = message.image?.caption ?? ''; mediaId = message.image?.id ?? ''; }
      else if (type === 'video') { text = message.video?.caption ?? ''; mediaId = message.video?.id ?? ''; }
      else if (type === 'audio') mediaId = message.audio?.id ?? '';
      else if (type === 'document') { text = message.document?.caption ?? ''; mediaId = message.document?.id ?? ''; }
      result.push({ id: String(message.id ?? ''), phone: normalizeWhatsAppPhone(String(message.from ?? '')), name: String(contact.profile?.name ?? ''), type, text: text.trim(), mediaId, contextMessageId: String(message.context?.id ?? ''), interactiveId: String(interactiveId) });
    }
  }
  return result.filter((message) => message.id && message.phone);
}

function whatsappConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN; const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID; const graphVersion = process.env.WHATSAPP_GRAPH_VERSION;
  if (!token || !phoneNumberId || !graphVersion) throw new Error('WhatsApp não configurado: token, phone number id ou versão da Graph API ausente.');
  return { token, phoneNumberId, graphVersion };
}
async function sendWhatsAppPayload(payload: Record<string, unknown>) {
  const { token, phoneNumberId, graphVersion } = whatsappConfig();
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) { const body = await response.text(); throw new Error(`Falha ao enviar WhatsApp (${response.status}): ${body.slice(0, 500)}`); }
  return response.json();
}
export function sentWhatsAppMessageId(response: any) { return String(response?.messages?.[0]?.id ?? ''); }
export async function sendWhatsAppText(phone: string, text: string, contextMessageId?: string) { return sendWhatsAppPayload({ messaging_product: 'whatsapp', recipient_type: 'individual', to: normalizeWhatsAppPhone(phone), ...(contextMessageId ? { context: { message_id: contextMessageId } } : {}), type: 'text', text: { preview_url: false, body: text } }); }
export async function sendWhatsAppTemplate(phone: string, templateName: string, bodyParameters: string[], languageCode = 'pt_BR') {
  const parameters = bodyParameters.map((text) => ({ type: 'text', text: String(text).slice(0, 900) }));
  return sendWhatsAppPayload({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizeWhatsAppPhone(phone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(parameters.length ? { components: [{ type: 'body', parameters }] } : {}),
    },
  });
}
export async function sendWhatsAppAlert(phone: string, text: string) {
  const templateName = process.env.ALERT_WHATSAPP_TEMPLATE?.trim();
  if (templateName) return sendWhatsAppTemplate(phone, templateName, [text], process.env.ALERT_WHATSAPP_TEMPLATE_LANGUAGE?.trim() || 'pt_BR');
  return sendWhatsAppText(phone, text);
}
export async function sendWhatsAppImageUrl(phone: string, imageUrl: string, caption?: string, contextMessageId?: string) { return sendWhatsAppPayload({ messaging_product: 'whatsapp', recipient_type: 'individual', to: normalizeWhatsAppPhone(phone), ...(contextMessageId ? { context: { message_id: contextMessageId } } : {}), type: 'image', image: { link: imageUrl, ...(caption?.trim() ? { caption: caption.trim().slice(0, 900) } : {}) } }); }
export async function sendWhatsAppImageId(phone: string, mediaId: string, caption?: string, contextMessageId?: string) { return sendWhatsAppPayload({ messaging_product: 'whatsapp', recipient_type: 'individual', to: normalizeWhatsAppPhone(phone), ...(contextMessageId ? { context: { message_id: contextMessageId } } : {}), type: 'image', image: { id: mediaId, ...(caption?.trim() ? { caption: caption.trim().slice(0, 900) } : {}) } }); }

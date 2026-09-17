import 'server-only';
import { getDb } from '@/lib/db';
import { processIncomingMessage } from '@/lib/process-message';
import type { IncomingWhatsAppMessage } from '@/lib/whatsapp';

const STALE_PROCESSING_MINUTES = 5;

function safeErrorSummary(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? 'erro desconhecido');
  return raw
    .replace(/(Bearer\s+)[^\s]+/gi, '$1***')
    .replace(/([?&](?:access_token|token)=)[^&\s]+/gi, '$1***')
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^@\s]+@/gi, '$1***@')
    .slice(0, 500);
}

function normalizeStoredMessage(value: unknown): IncomingWhatsAppMessage | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const message: IncomingWhatsAppMessage = {
    id: String(row.id ?? ''),
    phone: String(row.phone ?? ''),
    name: String(row.name ?? ''),
    type: String(row.type ?? 'unknown'),
    text: String(row.text ?? ''),
    mediaId: String(row.mediaId ?? ''),
    contextMessageId: String(row.contextMessageId ?? ''),
    interactiveId: String(row.interactiveId ?? ''),
  };
  return message.id && message.phone ? message : null;
}

async function claimMessage(message: IncomingWhatsAppMessage) {
  const sql = getDb();
  const payload = JSON.stringify(message);
  const rows = await sql`
    INSERT INTO eventos_whatsapp (message_id, telefone, mensagem, status, tentativas, processando_em, ultimo_erro)
    VALUES (${message.id}, ${message.phone}, ${payload}::jsonb, 'processando', 1, now(), null)
    ON CONFLICT (message_id) DO UPDATE
    SET telefone = EXCLUDED.telefone,
        mensagem = COALESCE(eventos_whatsapp.mensagem, EXCLUDED.mensagem),
        status = 'processando',
        tentativas = eventos_whatsapp.tentativas + 1,
        processando_em = now(),
        ultimo_erro = null
    WHERE eventos_whatsapp.status IN ('recebido', 'falhou')
       OR (
         eventos_whatsapp.status = 'processando'
         AND eventos_whatsapp.processando_em < now() - (${STALE_PROCESSING_MINUTES} * interval '1 minute')
       )
    RETURNING message_id, tentativas
  `;
  return rows[0] ?? null;
}

async function completeMessage(messageId: string) {
  const sql = getDb();
  await sql`
    UPDATE eventos_whatsapp
    SET status = 'concluido', concluido_em = now(), ultimo_erro = null
    WHERE message_id = ${messageId}
  `;
}

async function failMessage(messageId: string, error: unknown) {
  const sql = getDb();
  const summary = safeErrorSummary(error);
  await sql`
    UPDATE eventos_whatsapp
    SET status = 'falhou', ultimo_erro = ${summary}
    WHERE message_id = ${messageId}
  `;
  return summary;
}

export async function processQueuedWhatsAppMessage(message: IncomingWhatsAppMessage) {
  const claim = await claimMessage(message);
  if (!claim) return { duplicateOrInProgress: true };

  try {
    const result = await processIncomingMessage(message, { eventManaged: true });
    await completeMessage(message.id);
    return { ...result, queueAttempt: Number(claim.tentativas ?? 1) };
  } catch (error) {
    const summary = await failMessage(message.id, error);
    console.error('whatsapp_queue_processing_failed', { messageId: message.id, error: summary });
    throw error;
  }
}

export async function retryRecoverableWhatsAppEvents(limit = 10) {
  const sql = getDb();
  const rows = await sql`
    SELECT message_id, mensagem
    FROM eventos_whatsapp
    WHERE mensagem IS NOT NULL
      AND (
        status = 'falhou'
        OR (
          status = 'processando'
          AND processando_em < now() - (${STALE_PROCESSING_MINUTES} * interval '1 minute')
        )
      )
    ORDER BY recebido_em ASC
    LIMIT ${Math.max(1, Math.min(limit, 50))}
  `;

  let recovered = 0;
  let failed = 0;
  let skipped = 0;
  for (const row of rows) {
    const message = normalizeStoredMessage(row.mensagem);
    if (!message) {
      skipped += 1;
      continue;
    }
    try {
      const result = await processQueuedWhatsAppMessage(message);
      if (result.duplicateOrInProgress) skipped += 1;
      else recovered += 1;
    } catch {
      failed += 1;
    }
  }
  return { checked: rows.length, recovered, failed, skipped };
}

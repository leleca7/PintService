import 'server-only';

type DownloadedWhatsAppMedia = {
  buffer: Buffer;
  mimeType: string;
  filename: string;
};

function config() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim();
  if (!token || !graphVersion) throw new Error('WhatsApp não configurado para download de mídia.');
  return { token, graphVersion };
}

function extensionFromMime(mimeType: string) {
  const clean = mimeType.split(';')[0].trim().toLowerCase();
  const known: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
  };
  return known[clean] ?? 'bin';
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<DownloadedWhatsAppMedia> {
  const { token, graphVersion } = config();
  if (!mediaId) throw new Error('ID de mídia ausente.');

  const metadataResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(mediaId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!metadataResponse.ok) {
    const body = await metadataResponse.text();
    throw new Error(`Falha ao obter mídia do WhatsApp (${metadataResponse.status}): ${body.slice(0, 300)}`);
  }

  const metadata = await metadataResponse.json() as { url?: string; mime_type?: string };
  if (!metadata.url) throw new Error('WhatsApp não retornou URL para a mídia.');

  const mediaResponse = await fetch(metadata.url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!mediaResponse.ok) throw new Error(`Falha ao baixar mídia do WhatsApp (${mediaResponse.status}).`);

  const mimeType = String(metadata.mime_type || mediaResponse.headers.get('content-type') || 'application/octet-stream').split(';')[0];
  const buffer = Buffer.from(await mediaResponse.arrayBuffer());
  const maxBytes = 25 * 1024 * 1024;
  if (buffer.byteLength > maxBytes) throw new Error('A mídia ultrapassa o limite de 25 MB para processamento automático.');

  return {
    buffer,
    mimeType,
    filename: `whatsapp-${mediaId}.${extensionFromMime(mimeType)}`,
  };
}

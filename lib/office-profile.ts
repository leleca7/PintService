import 'server-only';

export type OfficeProfile = {
  name: string;
  publicPhone: string;
  address: string;
  hours: string;
  instagramHandle: string;
  instagramUrl: string;
  googleBusinessUrl: string;
  googleRating: number;
  googleReviewCount: number;
  legacySiteUrl: string;
  reclameAquiUrl: string;
};

const defaults: OfficeProfile = {
  name: 'Pint Services Car Center',
  publicPhone: '+55 71 3508-7781',
  address: 'R. Leonardo Rodrigues da Silva, 480 - Vilas do Atlântico, Lauro de Freitas - BA, 42700-000, Brasil',
  hours: 'segunda a quinta das 08h às 18h; sexta das 08h às 17h; sábado e domingo fechado',
  instagramHandle: '@pintservicescarcenter',
  instagramUrl: 'https://www.instagram.com/pintservicescarcenter/',
  googleBusinessUrl: 'https://share.google/g4u3pkUYBNI0GKkVd',
  googleRating: 4.0,
  googleReviewCount: 29,
  legacySiteUrl: 'https://pintservices.com.br/',
  reclameAquiUrl: 'https://www.reclameaqui.com.br/empresa/pint-services-reparos-automotivos/',
};

function value(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

function numberValue(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getOfficeProfile(): OfficeProfile {
  return {
    name: value('OFICINA_NAME', defaults.name),
    publicPhone: value('OFICINA_PUBLIC_PHONE', defaults.publicPhone),
    address: value('OFICINA_ADDRESS', defaults.address),
    hours: value('OFICINA_HOURS', defaults.hours),
    instagramHandle: value('OFICINA_INSTAGRAM_HANDLE', defaults.instagramHandle),
    instagramUrl: value('OFICINA_INSTAGRAM_URL', defaults.instagramUrl),
    googleBusinessUrl: value('OFICINA_GOOGLE_BUSINESS_URL', defaults.googleBusinessUrl),
    googleRating: numberValue('OFICINA_GOOGLE_RATING', defaults.googleRating),
    googleReviewCount: numberValue('OFICINA_GOOGLE_REVIEW_COUNT', defaults.googleReviewCount),
    legacySiteUrl: value('OFICINA_LEGACY_SITE_URL', defaults.legacySiteUrl),
    reclameAquiUrl: value('OFICINA_RECLAME_AQUI_URL', defaults.reclameAquiUrl),
  };
}

export function getOfficeProfileFacts() {
  const office = getOfficeProfile();
  return [
    `Nome público: ${office.name}.`,
    `Telefone comercial: ${office.publicPhone}.`,
    `Endereço: ${office.address}.`,
    `Horários gerais: ${office.hours}.`,
    `Instagram oficial informado: ${office.instagramHandle} (${office.instagramUrl}).`,
    `Perfil/localização do Google informado: ${office.googleBusinessUrl}.`,
    `Avaliação pública do Google verificada em 21/09/2026: ${office.googleRating.toFixed(1)} de 5, com ${office.googleReviewCount} avaliações.`,
    'O site pintservices.com.br é uma referência histórica e pode estar indisponível; não oriente o cliente a depender dele.',
    'Perfil público do Reclame Aqui localizado em 21/09/2026: empresa não verificada e sem reputação definida. Não apresentar esse perfil como selo de confiança ou canal oficial até regularização.',
  ].join('\n');
}

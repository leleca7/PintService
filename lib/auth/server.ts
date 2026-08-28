import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';

function safeAuthBaseUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

const authBaseUrl = safeAuthBaseUrl(process.env.NEON_AUTH_BASE_URL);
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();

export const isAuthConfigured = Boolean(authBaseUrl && cookieSecret);

export const auth = createNeonAuth({
  // Nunca repassar uma connection string do Postgres para o cliente do Neon Auth.
  // Em configuração inválida usamos um domínio neutro apenas para permitir o build;
  // o proxy impede o uso autenticado enquanto isAuthConfigured=false.
  baseUrl: authBaseUrl ?? 'https://auth-not-configured.invalid',
  cookies: {
    secret: cookieSecret ?? 'pintservice-build-only-secret-000000000000',
    sessionDataTtl: 300,
  },
});

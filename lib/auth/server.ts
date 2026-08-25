import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';

export const isAuthConfigured = Boolean(
  process.env.NEON_AUTH_BASE_URL?.trim() && process.env.NEON_AUTH_COOKIE_SECRET?.trim(),
);

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? 'https://auth-not-configured.invalid',
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET ?? 'pintservice-build-only-secret-000000000000',
    sessionDataTtl: 300,
  },
});

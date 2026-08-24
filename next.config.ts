import type { NextConfig } from 'next';

console.log('[PintService env check]', {
  database: Boolean(process.env.DATABASE_URL),
  authBaseUrl: Boolean(process.env.NEON_AUTH_BASE_URL),
  authCookieSecret: Boolean(process.env.NEON_AUTH_COOKIE_SECRET),
  bootstrapAdminEmail: Boolean(process.env.BOOTSTRAP_ADMIN_EMAIL),
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;

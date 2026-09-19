import { NextResponse, type NextRequest } from 'next/server';
import { auth, isAuthConfigured } from '@/lib/auth/server';

const protectedAuth = auth.middleware({ loginUrl: '/auth/sign-in' });

export default function proxy(request: NextRequest) {
  if (!isAuthConfigured) return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  return protectedAuth(request);
}

export const config = {
  matcher: [
    '/((?!api/auth|api/whatsapp|api/instagram/webhook|api/inbox/email|api/inbox/site|api/health|api/reputacao/check|api/operacao/resumo/check|api/operacao/inteligencia/check|api/integracoes/zeta/check|api/blinko/summary|auth|site|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)',
  ],
};

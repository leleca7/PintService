import { NextResponse, type NextRequest } from 'next/server';
import { auth, isAuthConfigured } from '@/lib/auth/server';

const protectedAuth = auth.middleware({ loginUrl: '/auth/sign-in' });

export default function proxy(request: NextRequest) {
  if (!isAuthConfigured) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }
  return protectedAuth(request);
}

export const config = {
  matcher: [
    '/((?!api/auth|api/whatsapp|api/health|auth|preview|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)',
  ],
};

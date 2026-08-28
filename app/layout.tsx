import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import '@neondatabase/auth-ui/css';
import './globals.css';
import './precision-tokens.css';
import './operational.css';
import './system-states.css';
import './access.css';
import './no-emoji.css';
import './reputation.css';
import './production-auth.css';
import './precision-readability.css';
import { Providers } from './providers';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PintService | Pint Services',
  description: 'Central inteligente de atendimento, produção e reputação da Pint Services.',
  applicationName: 'PintService',
  appleWebApp: { capable: true, title: 'PintService', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#111315',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={manrope.className}><Providers>{children}</Providers></body>
    </html>
  );
}

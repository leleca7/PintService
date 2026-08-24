import type { Metadata, Viewport } from 'next';
import './globals.css';
import './operational.css';
import './system-states.css';
import './access.css';
import './pint-services-theme.css';
import './no-emoji.css';
import './visual-polish.css';
import './reputation.css';

export const metadata: Metadata = {
  title: 'PintService | Pint Services',
  description: 'Central inteligente de atendimento, produção e reputação da Pint Services.',
  applicationName: 'PintService',
  appleWebApp: { capable: true, title: 'PintService', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#090a0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

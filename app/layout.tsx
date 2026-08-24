import type { Metadata, Viewport } from 'next';
import '@neondatabase/auth-ui/css';
import './globals.css';
import './operational.css';
import './system-states.css';
import './access.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'PintService | Funilaria & Pintura',
  description: 'Central inteligente de atendimento e produção da oficina.',
  applicationName: 'PintService',
  appleWebApp: { capable: true, title: 'PintService', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = { themeColor: '#12151a', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><Providers>{children}</Providers></body></html>;
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PintService',
    short_name: 'PintService',
    description: 'Central operacional de atendimento, produção e tarefas da oficina.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f6f8',
    theme_color: '#12151a',
    lang: 'pt-BR',
  };
}

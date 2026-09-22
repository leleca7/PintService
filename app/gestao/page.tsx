import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { getDashboardData } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function ManagementPage() {
  const [data, user] = await Promise.all([getDashboardData(), getCurrentAppUser()]);

  const cards = [
    {
      href: '/funcionarios',
      eyebrow: 'EQUIPE',
      title: 'Funcionários',
      text: 'Cadastros, setores, responsáveis e contatos da equipe.',
      visible: userHasPermission(user, 'ver_funcionarios'),
    },
    {
      href: '/operacao/inteligencia',
      eyebrow: 'INDICADORES',
      title: 'Inteligência da operação',
      text: 'Exceções, tempos, causas de parada, desempenho e capacidade.',
      visible: userHasPermission(user, 'ver_relatorios'),
    },
    {
      href: '/configuracoes',
      eyebrow: 'SISTEMA',
      title: 'Automações e integrações',
      text: 'WhatsApp, canais externos, regras automáticas e estado das conexões.',
      visible: userHasPermission(user, 'ver_configuracoes'),
    },
    {
      href: '/acessos',
      eyebrow: 'GOVERNANÇA',
      title: 'Perfis e acessos',
      text: 'Quem pode ver, alterar e administrar cada parte do Sistema da Pint.',
      visible: user?.perfil === 'admin',
    },
  ].filter((item) => item.visible);

  return (
    <AppShell active="gestao" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>GESTÃO · CONFIGURAÇÃO E LEITURA</p>
            <h1 className={styles.title}>Gestão</h1>
            <p className={styles.subtitle}>
              Aqui ficam as decisões de administração. A rotina da oficina continua em Oficina; a conversa com clientes continua em Atendimento.
            </p>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div><p>ADMINISTRAÇÃO</p><h2>O que você precisa gerenciar</h2></div>
            <span className={styles.count}>{cards.length}</span>
          </div>

          <div className={styles.summaryGrid}>
            {cards.map((item) => (
              <Link key={item.href} href={item.href} className={styles.summaryItem} style={{ textDecoration: 'none' }}>
                <span>{item.eyebrow}</span>
                <strong style={{ fontSize: 22 }}>{item.title}</strong>
                <small>{item.text}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.quiet}>
            <strong>Princípio desta área</strong>
            Configuração e análise ficam fora do caminho de quem só precisa fazer a oficina andar.
          </div>
        </section>
      </div>
    </AppShell>
  );
}

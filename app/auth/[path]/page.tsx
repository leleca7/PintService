import { AuthView } from '@neondatabase/auth-ui';
import { authViewPaths } from '@neondatabase/auth-ui/server';
import styles from '../auth-shell.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

function accessCopy(path: string) {
  const normalized = path.toLowerCase();
  if (normalized.includes('sign-up')) {
    return {
      title: 'Crie seu login interno.',
      description: 'O cadastro cria a identidade de acesso. A liberação da operação continua sob controle do administrador.',
    };
  }
  if (normalized.includes('forgot') || normalized.includes('reset')) {
    return {
      title: 'Recupere seu acesso.',
      description: 'Use o e-mail vinculado ao PintService para recuperar a entrada com segurança.',
    };
  }
  if (normalized.includes('sign-out')) {
    return {
      title: 'Encerrando sua sessão.',
      description: 'Seu acesso à central operacional será finalizado com segurança.',
    };
  }
  return {
    title: 'Entre na central de operação.',
    description: 'Acesso restrito à equipe administrativa autorizada da Pint Services.',
  };
}

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  const copy = accessCopy(path);

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <span className={styles.symbol} aria-hidden="true"/>
          <div><strong>PintService</strong><span>Pint Services Car Center</span></div>
        </div>

        <div className={styles.brandStatement}>
          <p className={styles.kicker}>CENTRAL DE OPERAÇÃO</p>
          <h1>Rotina silenciosa.<em>Exceções visíveis.</em></h1>
          <p>O PintService organiza atendimento, veículos e decisões em uma única leitura operacional — sem transformar a rotina em ruído.</p>
        </div>

        <div className={styles.brandFoot}>
          <span>Atendimento</span><span>Veículos</span><span>Operação</span><span>Reputação</span>
        </div>
      </section>

      <section className={styles.authPane}>
        <div className={styles.authInner}>
          <div className={styles.authContext}>
            <p>ACESSO INTERNO</p>
            <strong>{copy.title}</strong>
            <span>{copy.description}</span>
          </div>

          <div className={styles.authFrame}>
            <AuthView path={path} />
          </div>

          <p className={styles.accessNote}><strong>Acesso controlado.</strong> Criar um login não concede automaticamente permissão operacional; perfis e vínculos continuam definidos dentro do PintService.</p>
        </div>
      </section>
    </main>
  );
}

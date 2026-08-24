import Link from 'next/link';
import { getCurrentAppUser } from '@/lib/auth/current-user';

export const dynamic = 'force-dynamic';

export default async function NoAccessPage() {
  const user = await getCurrentAppUser();
  return (
    <main className="auth-page">
      <section className="panel settings-card" style={{ maxWidth: 620 }}>
        <p className="eyebrow">ACESSO</p>
        <h1>Perfil ainda não liberado</h1>
        <p>{user ? 'Seu login existe, mas este perfil não tem permissão para abrir esta área.' : 'Seu login ainda não foi vinculado a um perfil ativo do PintService.'}</p>
        <p>Um administrador precisa vincular o usuário ao perfil e, quando for funcionário, ao setor correspondente.</p>
        <div className="top-actions"><Link className="ghost action-link" href="/inicio">Tentar página inicial</Link><Link className="ghost action-link" href="/auth/sign-out">Sair</Link></div>
      </section>
    </main>
  );
}

import { AuthView } from '@neondatabase/auth-ui';
import { authViewPaths } from '@neondatabase/auth-ui/server';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  return (
    <main className="auth-page">
      <div className="auth-brand">
        <span>PS</span>
        <div><strong>PintService</strong><small>Acesso seguro à operação</small></div>
      </div>
      <AuthView path={path} />
    </main>
  );
}

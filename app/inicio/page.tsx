import { redirect } from 'next/navigation';
import { getCurrentAppUser } from '@/lib/auth/current-user';

export const dynamic = 'force-dynamic';

export default async function StartPage() {
  const user = await getCurrentAppUser();
  if (!user?.ativo) redirect('/sem-acesso');
  if (user.perfil === 'funcionario') redirect('/tarefas');
  redirect('/');
}

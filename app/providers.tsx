'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { NeonAuthUIProvider } from '@neondatabase/auth-ui';
import { authClient } from '@/lib/auth/client';

const ptBRLocalization = {
  SIGN_IN: 'Entrar',
  SIGN_IN_ACTION: 'Entrar',
  SIGN_IN_DESCRIPTION: 'Use seu e-mail e senha para acessar o PintService.',
  SIGN_UP: 'Criar acesso',
  SIGN_UP_ACTION: 'Criar acesso',
  SIGN_UP_DESCRIPTION: 'Preencha seus dados para criar seu acesso.',
  DONT_HAVE_AN_ACCOUNT: 'Ainda não tem um acesso?',
  ALREADY_HAVE_AN_ACCOUNT: 'Já tem um acesso?',
  EMAIL: 'E-mail',
  EMAIL_PLACEHOLDER: 'nome@exemplo.com',
  PASSWORD: 'Senha',
  PASSWORD_PLACEHOLDER: 'Senha',
  FORGOT_PASSWORD_LINK: 'Esqueceu sua senha?',
  FORGOT_PASSWORD: 'Recuperar senha',
  FORGOT_PASSWORD_ACTION: 'Enviar link de recuperação',
  FORGOT_PASSWORD_DESCRIPTION:
    'Informe seu e-mail para receber o link de recuperação.',
  RESET_PASSWORD: 'Definir nova senha',
  RESET_PASSWORD_ACTION: 'Salvar nova senha',
  RESET_PASSWORD_DESCRIPTION: 'Digite sua nova senha abaixo.',
  NEW_PASSWORD: 'Nova senha',
  NAME: 'Nome',
  NAME_PLACEHOLDER: 'Nome completo',
  OR_CONTINUE_WITH: 'Ou continue com',
};

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      redirectTo="/inicio"
      Link={Link}
      localization={ptBRLocalization}
    >
      {children}
    </NeonAuthUIProvider>
  );
}

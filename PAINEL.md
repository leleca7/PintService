# Painel PintService

O painel usa `lib/dashboard-data.ts` como camada central de leitura e o Neon Postgres como persistência real.

## Modos

- `demo`: usado somente quando o banco não está configurado e a tela possui fallback explícito de demonstração.
- `live`: entra quando Neon está configurado e a leitura real funciona.
- `error`: banco configurado, porém leitura falhou; o painel mostra erro em vez de substituir silenciosamente por dados fictícios.

## Produção

O core de produção usa:

- Neon Postgres para dados operacionais;
- Neon Auth para sessão;
- `usuarios_app` + permissões para RBAC;
- rotas internas protegidas por autenticação/permissão;
- webhooks públicos validados por segredo/assinatura.

As integrações de OpenAI, WhatsApp, Instagram, Google Business, Reclame Aqui e fonte externa de veículos são camadas independentes. A ausência de uma delas não deve derrubar o painel administrativo.

## Segurança

- A IA não é fonte de verdade para fatos físicos.
- Status de veículo vem do banco/fonte operacional.
- Falha da IA transfere atendimento para humano.
- Peças, vistorias e casos críticos não têm resposta automática definitiva.
- Credenciais ficam somente no ambiente do servidor/Vercel.
- `NEON_AUTH_BASE_URL` deve ser HTTP(S), nunca uma connection string do Postgres.

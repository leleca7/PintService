# Deploy da PintService

A PintService usa GitHub como fonte de verdade e Vercel como ambiente de publicação.

## Produção

- Repositório: `leleca7/PintService`
- Branch de produção: `main`
- Projeto Vercel: `oficina-ia-demo`
- Runtime: Node.js 24

## Fluxo recomendado

1. Desenvolver em branch isolada.
2. Abrir pull request para `main`.
3. Validar o CI (`npm install` + `npm run build`).
4. Mesclar somente após CI verde.
5. Confirmar que a Vercel criou um deployment da nova SHA.
6. Validar `/api/health` e os logs de runtime antes de considerar a publicação concluída.

A publicação só deve ser considerada concluída quando a SHA servida pela Vercel corresponder à `main` atual.

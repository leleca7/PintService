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
4. Validar o Preview Vercel quando a mudança afetar comportamento, interface ou integração.
5. Mesclar somente após os gates aplicáveis estarem verdes.
6. Confirmar que a Vercel criou um deployment da nova SHA.
7. Validar `/api/health` e os logs de runtime antes de considerar a publicação concluída.

A publicação só deve ser considerada concluída quando a SHA servida pela Vercel corresponder à `main` atual.

## Gate de segurança antes do go-live

Antes de ativar integrações reais ou considerar a PintService pronta para operação definitiva:

- rotacionar credenciais e segredos de autenticação que possam ter aparecido fora do armazenamento seguro de variáveis;
- invalidar os valores anteriores depois da rotação;
- manter segredos somente no gerenciador de variáveis do ambiente, nunca no repositório, documentação, logs ou mensagens de erro;
- revisar permissões e escopo das credenciais de banco, autenticação e integrações externas;
- conferir que webhooks sensíveis validem assinatura ou segredo antes de processar eventos;
- confirmar que `/api/health` e demais endpoints de diagnóstico não retornem credenciais ou dados sensíveis;
- confirmar que integrações ainda não ativadas permaneçam explicitamente marcadas como pendentes;
- revisar logs de produção após a ativação de cada integração real;
- manter fallback humano e mecanismos de interrupção para automações externas antes de qualquer ativação em escala.

Nenhum valor secreto deve ser registrado neste documento. A rotação deve ser executada diretamente nos provedores e nos ambientes protegidos quando chegar a etapa de go-live.

## Bloqueios de plataforma

Falha de Preview ou deployment causada por limite de builds da plataforma não deve ser tratada como falha da aplicação, mas também não deve ser ignorada quando o PR exigir validação de Preview.

Nesses casos:

1. manter a alteração no PR;
2. usar o CI como validação de código disponível;
3. não forçar múltiplos deployments em sequência;
4. concluir o merge apenas quando os gates definidos para aquela mudança tiverem sido satisfeitos.

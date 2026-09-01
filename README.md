# PintService

Sistema de atendimento e operação da Pint Services para funilaria e pintura, com painel web, Neon Postgres, autenticação/RBAC, fila operacional, WhatsApp + IA e Central de reputação.

> **Memória oficial do projeto:** antes de alterar arquitetura, fluxo operacional, veículos ou IA, ler [`docs/PROJECT_CONTEXT_CHECKPOINT.md`](docs/PROJECT_CONTEXT_CHECKPOINT.md). Esse arquivo consolida as decisões de produto e continuidade do **Sistema da Pint**.

## Direção operacional atual

A arquitetura preferida é fazer o **banco do Sistema da Pint ser a fonte oficial da operação**, com um **Modo Operação** simples para o funcionário atualizar veículos diretamente no sistema. A experiência do aplicativo que o funcionário já utiliza deve servir como referência de usabilidade e, preferencialmente, ser incorporada ao Sistema da Pint em vez de manter mais uma plataforma obrigatória.

Google Sheets/CSV permanece suportado como fonte externa e pode ser usado em transição, importação ou contingência, mas não é mais a arquitetura preferida para o fluxo diário se o Modo Operação nativo atender a equipe.

## Estado atual

O core está pronto para produção com **Neon Postgres + Neon Auth**. O sistema continua funcionando mesmo quando integrações externas ainda não estão conectadas.

Já existem estruturas reais para:

- clientes e histórico de conversas;
- veículos e status operacional;
- decisões da IA;
- pendências e fila de atendimento humano;
- tarefas operacionais para a equipe;
- funcionários, usuários, perfis e permissões;
- auditoria;
- reputação e respostas assistidas.

## Páginas principais

- `/` — visão geral da operação
- `/veiculos` — veículos
- `/veiculos/[id]` — ficha do veículo
- `/tarefas` — fila operacional
- `/atendimento` — central de atendimento
- `/funcionarios` — equipe
- `/reputacao` — Google, Instagram e Reclame Aqui
- `/configuracoes` — status das integrações
- `/simulador` — simulação controlada
- `/api/health` — status técnico e conexões pendentes

## O que falta conectar / evoluir

### 1. Operação dos veículos

**Direção preferida:** ampliar o cadastro nativo do Sistema da Pint e criar um Modo Operação simples para que a equipe atualize os veículos diretamente no banco.

**Fonte externa existente:** `VEHICLE_DATA_URL` continua aceitando Google Sheets/CSV somente leitura. Links comuns do Sheets com `#gid=...` são aceitos e a aba selecionada é respeitada.

A fonte externa precisa conter ao menos **Placa** e **Modelo**. Para resposta automática de status, também deve existir **Fase/Etapa/Setor** ou **Status**.

Quando a fonte externa estiver configurada, o sistema relê a fonte antes da resposta. Se a fonte falhar, a placa não existir ou os dados estiverem incompletos, o atendimento é encaminhado para humano.

Detalhes da decisão arquitetural, campos operacionais reais e próximos passos estão em [`docs/PROJECT_CONTEXT_CHECKPOINT.md`](docs/PROJECT_CONTEXT_CHECKPOINT.md).

### 2. OpenAI

Configure:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Se a IA estiver sem chave, crédito ou indisponível, o WhatsApp não perde a mensagem: o PintService cria uma pendência e transfere o atendimento para humano.

### 3. WhatsApp Cloud API

Configure:

- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION`

Callback/webhook:

`https://SEU-DOMINIO/api/whatsapp`

O webhook valida a assinatura da Meta, deduplica mensagens e processa o atendimento após responder o webhook.

### 4. Instagram profissional

Configure:

- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`
- `INSTAGRAM_VERIFY_TOKEN`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_GRAPH_VERSION`

Callback/webhook:

`https://SEU-DOMINIO/api/instagram/webhook`

O segredo do Instagram é independente do segredo do WhatsApp.

### 5. Google Business Profile

Configure token OAuth, account id e location id documentados em `.env.example` para leitura e resposta de avaliações.

### 6. Reclame Aqui

A leitura de indicadores e casos depende das credenciais/endpoints disponibilizados no contrato da RA API. Não tratar o perfil informado como canal oficial antes da confirmação da empresa.

## Regras de segurança operacional da IA

- Nunca inventar preço, orçamento, prazo, data de entrega, status, setor, dano ou disponibilidade.
- Perguntas sobre **peças/reposição** vão para atendimento humano.
- **Vistoria**, orçamento particular, reclamações e situações de baixa confiança vão para humano.
- Confirmações físicas atuais podem virar tarefa operacional para funcionário, mas somente para informações permitidas.
- Prazo registrado só é comunicado automaticamente após a etapa de desmontagem e quando a fonte oficial contém status de prazo.
- Se a fonte de verdade estiver indisponível ou incompleta, não usar dado antigo como certeza.
- Respostas públicas de reputação ficam bloqueadas até `REPUTATION_LIVE_WRITES_ENABLED=true`.

## Segurança de credenciais

O repositório é público. Nunca versionar tokens, senhas ou connection strings.

`DATABASE_URL` e `NEON_AUTH_BASE_URL` são coisas diferentes. `NEON_AUTH_BASE_URL` deve ser uma URL HTTP(S) do Neon Auth e **nunca** uma connection string `postgres://...`.

Uma credencial de banco apareceu anteriormente em logs durante diagnóstico. Ela deve ser rotacionada no Neon e a nova `DATABASE_URL` deve ser cadastrada na Vercel antes do go-live definitivo.

## Checklist de go-live

1. Rotacionar a credencial do Neon e atualizar `DATABASE_URL`.
2. Confirmar login/logout e perfis Administrador, Gerente e Funcionário.
3. Definir/implementar a fonte operacional definitiva dos veículos: preferencialmente Modo Operação nativo; fonte externa apenas quando necessária.
4. Confirmar a chave/modelo da OpenAI.
5. Conectar WhatsApp Cloud API e validar webhook de entrada e saída.
6. Testar status existente, placa inexistente, peça, vistoria, orçamento, reclamação, foto e falha da IA.
7. Conectar Instagram e validar webhook.
8. Conectar Google Business Profile.
9. Conectar Reclame Aqui se houver contrato/API disponível.
10. Manter `REPUTATION_LIVE_WRITES_ENABLED=false` até validar respostas em cada canal; ativar somente depois.

## Deploy e validação

A Vercel usa Node.js 24 e o CI do GitHub está alinhado ao mesmo runtime. Cada pull request executa `npm run build` antes de ser integrado.

Alterações em Environment Variables da Vercel exigem um novo deployment para entrarem em vigor.

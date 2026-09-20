# Ativação do WhatsApp Cloud API — Sistema da Pint

## Objetivo

Ativar o número oficial da Pint Services na WhatsApp Business Platform/Cloud API sem alterar as regras operacionais do sistema.

O webhook já está preparado em:

`https://oficina-ia-demo.vercel.app/api/whatsapp`

O fluxo valida:
- Verify Token no GET de assinatura do webhook;
- `X-Hub-Signature-256` com o App Secret nos POSTs;
- banco Neon antes de processar mensagens;
- assinatura e auditoria antes de qualquer atualização estrutural.

## Credenciais necessárias

Configurar na Vercel, em Production e Preview:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_GRAPH_VERSION=v26.0`

Recomendação: usar token de System User da Meta para produção, e não depender de token temporário de desenvolvimento.

## Webhook Meta

No app da Meta:
1. Produto WhatsApp > Configuration.
2. Callback URL: `https://oficina-ia-demo.vercel.app/api/whatsapp`
3. Verify Token: deve ser exatamente o mesmo valor de `WHATSAPP_VERIFY_TOKEN`.
4. Assinar pelo menos o campo `messages`.
5. O App Secret do mesmo app precisa estar em `WHATSAPP_APP_SECRET`.

## Templates sugeridos

Os nomes abaixo são os nomes esperados/recomendados pelo Sistema da Pint. A categoria sugerida é UTILITY porque as mensagens são ligadas a um atendimento/serviço existente. A Meta pode reclassificar ou pedir ajustes de texto durante a análise.

### 1. pint_atualizacao_operacional

Idioma: Português (Brasil) — `pt_BR`

Corpo:

`Olá, {{1}}. Atualização do seu {{2}}: {{3}}. {{4}}`

Exemplos:
- {{1}} Lucas
- {{2}} Onix ABC1D23
- {{3}} Montagem
- {{4}} O veículo avançou para a etapa de Montagem.

Variável no sistema:
`WHATSAPP_OPERATION_UPDATE_TEMPLATE=pint_atualizacao_operacional`

### 2. pint_pos_entrega

Idioma: `pt_BR`

Corpo:

`Olá, {{1}}. O atendimento do seu {{2}} foi registrado como entregue. Garantia registrada: serviço {{3}}; peças substituídas {{4}}. Situação: {{5}}. Como foi sua experiência com o serviço da Pint Services? Você pode responder por aqui.`

Exemplos:
- {{1}} Lucas
- {{2}} Onix ABC1D23
- {{3}} 1 ano
- {{4}} 6 meses
- {{5}} sem pendências registradas

Variável:
`WHATSAPP_POST_DELIVERY_TEMPLATE=pint_pos_entrega`

### 3. pint_pos_entrega_pendencia

Idioma: `pt_BR`

Corpo:

`Olá, {{1}}. O atendimento do seu {{2}} foi registrado como entregue. Garantia registrada: serviço {{3}}; peças substituídas {{4}}. Pendência registrada: {{5}}. Ela continuará em acompanhamento e enviaremos atualização quando houver mudança real. Como foi sua experiência com o serviço da Pint Services? Você pode responder por aqui.`

Exemplos:
- {{1}} Lucas
- {{2}} Onix ABC1D23
- {{3}} 1 ano
- {{4}} 6 meses
- {{5}} acabamento da moldura direita

Variável:
`WHATSAPP_POST_DELIVERY_PENDING_TEMPLATE=pint_pos_entrega_pendencia`

### 4. pint_pos_entrega_atualizacao

Idioma: `pt_BR`

Corpo:

`Olá, {{1}}. Atualização sobre o seu {{2}}. Pendência: {{3}}. {{4}}`

Exemplos:
- {{1}} Lucas
- {{2}} Onix ABC1D23
- {{3}} moldura direita
- {{4}} A peça foi registrada como recebida e já podemos organizar o agendamento do retorno.

Variável:
`WHATSAPP_POST_DELIVERY_UPDATE_TEMPLATE=pint_pos_entrega_atualizacao`

### 5. pint_cobranca_fornecedor

Idioma: `pt_BR`

Corpo:

`Olá, {{1}}. Precisamos de uma atualização do pedido {{2}}, referente ao veículo {{3}}. A previsão registrada era {{4}}. Podem confirmar a situação atual e uma nova previsão real?`

Exemplos:
- {{1}} Fornecedor Exemplo
- {{2}} 12345
- {{3}} ABC1D23
- {{4}} 19/09/2026

Variável:
`WHATSAPP_SUPPLIER_DELAY_TEMPLATE=pint_cobranca_fornecedor`

A cobrança automática continua desligada até a equipe cadastrar o contato do fornecedor e ativar a chave correspondente em Configurações.

### 6. pint_alerta_interno

Idioma: `pt_BR`

Corpo:

`Alerta do Sistema da Pint: {{1}}`

Exemplo:
- {{1}} ABC1D23 está acima do tempo esperado na etapa de Montagem.

Variável:
`ALERT_WHATSAPP_TEMPLATE=pint_alerta_interno`

## Ordem de ativação

1. Conectar Business Portfolio/WABA/número no app Meta.
2. Gerar System User token com permissões necessárias para WhatsApp.
3. Configurar as 6 credenciais/IDs na Vercel.
4. Validar o número pelo painel Configurações do Sistema da Pint.
5. Configurar o webhook e assinar `messages`.
6. Criar e enviar os templates para análise.
7. Após aprovação, preencher os nomes dos templates nas variáveis Vercel.
8. Executar o teste controlado na tela Configurações.
9. Testar mensagem recebida no número oficial e confirmar criação/continuidade da conversa.
10. Só depois habilitar automações proativas adicionais.

## Regras de segurança

- Não usar token temporário como solução definitiva.
- Não expor Access Token, App Secret ou Verify Token em tela/log.
- Não enviar mensagens proativas fora das regras da Meta sem template aprovado.
- Não ativar cobrança automática de fornecedor antes de testar contato/template.
- Não ativar escrita externa de reputação como efeito colateral dessa etapa.

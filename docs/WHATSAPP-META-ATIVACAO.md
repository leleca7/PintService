# Ativação do WhatsApp Cloud API — Sistema da Pint

## Objetivo

Validar primeiro o WhatsApp Cloud API da Pint Services em ambiente de teste e, somente depois do fluxo ponta a ponta estar estável, conectar o número oficial sem alterar as regras operacionais do sistema.

A ativação deve seguir duas fases:

1. **Teste Meta:** número de teste fornecido pela Meta + destinatário pessoal autorizado.
2. **Produção:** número oficial da Pint Services, somente após entrada, persistência, interpretação e saída estarem validadas.

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
6. Confirmar que a **WABA está inscrita no app**. O Sistema da Pint consulta `/{WABA_ID}/subscribed_apps` no diagnóstico de Configurações.
7. No número de teste, cadastrar e validar o telefone que será usado como **Destinatário** antes de testar respostas.

### Sinais de diagnóstico já conhecidos

- `(#131030) Recipient phone number not in allowed list`: o destinatário ainda não está autorizado na lista de teste da Meta.
- `Authentication Error` / erro de token: normalmente indica token temporário expirado ou credencial inválida.
- Mensagem entra no webhook mas não volta ao telefone: conferir primeiro token, destinatário autorizado e inscrição da WABA no app.
- O webhook deve continuar confirmando recebimento mesmo quando a tentativa de resposta externa falhar; a falha de transporte não deve apagar o evento recebido.

O sistema já normaliza celulares brasileiros para reduzir divergência entre números com e sem o nono dígito.

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

### Fase 1 — ambiente de teste

1. Criar/configurar o app Meta e adicionar WhatsApp.
2. Usar o **número de teste da Meta**; não migrar o número oficial ainda.
3. Cadastrar e validar um destinatário de teste.
4. Configurar na Vercel as credenciais do ambiente de teste.
5. Configurar o webhook e assinar `messages`.
6. Confirmar a inscrição da WABA no app.
7. Enviar a mensagem de teste da Meta e responder pelo WhatsApp.
8. Confirmar o ciclo completo: **WhatsApp → Meta → webhook → Neon → processamento → Graph API → WhatsApp**.
9. Testar texto livre, erro de digitação, áudio/mídia, placa inexistente, orçamento, peça, reclamação e fallback humano.
10. Trocar token temporário por credencial apropriada/permanente antes de qualquer go-live.

### Fase 2 — produção

1. Definir a estratégia segura para o número oficial da Pint Services.
2. Conectar o número oficial somente depois dos testes anteriores estarem estáveis.
3. Criar e enviar os templates para análise.
4. Após aprovação, preencher os nomes dos templates nas variáveis Vercel.
5. Executar o teste controlado na tela Configurações.
6. Validar entrada e saída com o número oficial.
7. Só depois habilitar automações proativas adicionais.

## Regras de segurança

- Não usar token temporário como solução definitiva.
- Não conectar/migrar o número oficial antes de validar o ambiente de teste ponta a ponta.
- Em teste, não interpretar erro de destinatário autorizado como falha do webhook.
- Não expor Access Token, App Secret ou Verify Token em tela/log.
- Não enviar mensagens proativas fora das regras da Meta sem template aprovado.
- Não ativar cobrança automática de fornecedor antes de testar contato/template.
- Não ativar escrita externa de reputação como efeito colateral dessa etapa.

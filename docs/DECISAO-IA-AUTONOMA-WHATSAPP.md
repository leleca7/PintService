# Decisão de arquitetura — IA autônoma no atendimento do WhatsApp

## Status

Decisão registrada para implementação futura. **Não ativar a automação neste momento.**

## Objetivo

A IA do PintService deve atuar como atendente real: conversar diretamente com o cliente, interpretar contexto, consultar dados autorizados, executar ações permitidas e responder de forma autônoma.

Ela não será apenas um gerador de sugestões para um operador humano copiar e enviar.

## Princípio operacional

> A rotina permanece silenciosa; a exceção sobe.

A IA deve resolver sozinha tudo que estiver dentro de sua autoridade. Casos fora de regra, sensíveis, ambíguos ou de maior risco devem ser escalados para atendimento humano.

## Arquitetura-alvo

```text
Cliente
  ↓
WhatsApp
  ↓
Meta WhatsApp Business Platform / Cloud API oficial
  ↓
PintService
  ↓
Orquestrador da IA
  ├─ contexto e memória operacional
  ├─ conhecimento autorizado
  ├─ ferramentas controladas
  └─ regras de autonomia
  ↓
IA gera decisão e resposta
  ↓
Governança da IA
  ↓
Compliance/Gateway da Meta
  ↓
Cloud API oficial
  ↓
Cliente
```

## Separação obrigatória de responsabilidades

### 1. IA Governance

Responde à pergunta: **o que a IA pode falar e fazer?**

A IA poderá, conforme permissões configuradas:

- responder dúvidas sobre serviços;
- consultar cliente, veículo, ordem de serviço e andamento;
- consultar orçamento e valores já registrados;
- solicitar informações ou fotos;
- registrar observações;
- criar tarefas;
- verificar agenda;
- agendar quando houver autoridade explícita;
- negociar apenas dentro de faixas previamente autorizadas;
- escalar para humano quando sair de sua autoridade.

A IA não poderá:

- inventar preço, prazo ou condição comercial;
- conceder desconto fora da faixa autorizada;
- alterar valores ou dados críticos sem permissão;
- prometer uma ação que o sistema não confirmou;
- divulgar dados de outro cliente;
- contornar regras de segurança ou de comunicação;
- executar comandos genéricos diretamente no banco de dados.

### 2. Meta Compliance Gateway

Responde à pergunta: **essa mensagem pode ser enviada pelo WhatsApp neste contexto?**

A camada deve ser independente da IA e validar automaticamente, antes de qualquer envio:

- uso exclusivo da integração oficial da Meta;
- regras vigentes da WhatsApp Business Platform;
- janela de atendimento e necessidade de template, quando aplicável;
- opt-in e opt-out;
- frequência e limites internos;
- estado de qualidade e erros de envio;
- bloqueios internos, pausa de automação e circuit breaker;
- trilha de auditoria.

As regras atuais da Meta devem ser verificadas novamente no momento da implementação, pois podem mudar.

## Ferramentas da IA

A IA não deve receber acesso irrestrito ao banco. Deve operar por ferramentas específicas, por exemplo:

```text
consultar_cliente()
consultar_veiculo()
consultar_os()
consultar_previsao()
consultar_orcamento()
criar_tarefa()
registrar_observacao()
solicitar_foto()
verificar_agenda()
agendar_servico()
```

Cada ferramenta deve ter validação própria de entrada, autorização, auditoria e resultado confirmado.

## Níveis de autonomia

### Verde — autônomo

A IA decide, executa e responde sem intervenção humana.

Exemplos: informações de funcionamento, consulta de andamento, coleta de dados e dúvidas comuns.

### Amarelo — autônomo com regra

A IA pode decidir desde que permaneça dentro de limites previamente definidos.

Exemplos: agendamento em horários disponíveis ou negociação dentro de uma faixa comercial autorizada.

### Vermelho — escalonamento

A IA não possui autoridade para concluir a decisão.

Exemplos: indenização, ameaça jurídica, desconto fora da política, cancelamento sensível, conflito de orçamento ou qualquer caso classificado como risco elevado.

## Comportamento durante escalonamento

A IA não precisa abandonar a conversa abruptamente. Deve informar o cliente de forma natural que precisa confirmar o ponto específico e criar a exceção para o responsável adequado.

O histórico e o contexto devem acompanhar o escalonamento para evitar que o cliente tenha que repetir toda a situação.

## Proteções obrigatórias antes do go-live

- integração somente pela Cloud API oficial da Meta;
- nenhum uso de automação de WhatsApp Web ou bibliotecas que simulem sessão de usuário;
- rate limit interno;
- fila de saída;
- idempotência;
- retry com backoff;
- timeout;
- circuit breaker;
- kill switch para interromper envios automáticos sem interromper recebimento;
- logs estruturados de decisões, ferramentas e envios;
- métricas de saúde da operação do WhatsApp;
- fallback humano;
- testes em ambiente controlado antes da ativação geral.

## Decisão atual

Por decisão do projeto, esta arquitetura fica **documentada e preservada**, mas a implementação da automação do WhatsApp será feita em uma etapa posterior.

O desenvolvimento atual do PintService deve continuar sem acoplar novas funções diretamente a essa automação até que essa etapa seja retomada conscientemente.

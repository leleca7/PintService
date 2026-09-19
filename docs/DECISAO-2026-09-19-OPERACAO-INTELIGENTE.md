# PINT SERVICES — DECISÃO 19/09/2026 — OPERAÇÃO INTELIGENTE

Este documento registra a segunda evolução operacional do Sistema da Pint.

## Princípio

O funcionário não deve permanecer no sistema para repetir informações que já informou no WhatsApp, em uma foto, em um áudio ou por leitura de código.

A rotina normal deve ser silenciosa. O sistema chama uma pessoa quando existe exceção, falta de dado, conflito ou decisão.

Regra permanente:

> IA interpreta; sistema aplica regras; banco confirma fatos; humano resolve exceção.

## 1. WhatsApp como controle remoto da operação

Funcionários podem iniciar uma atualização sem tarefa anterior, desde que a placa esteja explícita ou seja identificada com segurança.

Exemplos:
- “ABC1D23 está na Montagem.”
- “ABC1D23 parado aguardando seguradora.”
- áudio com a mesma informação;
- foto do carro com placa legível ou placa na legenda.

O sistema prepara a atualização e exige SIM antes de gravar qualquer mudança estrutural.

## 2. Detector de veículo parado

Cada etapa possui tempo de atenção e tempo crítico configuráveis.

Quando o tempo é excedido:
- cria alerta operacional;
- tenta acionar o responsável pelo veículo;
- cria tarefa de confirmação;
- somente escala como exceção enquanto o problema continuar.

Os limites podem ser ajustados pela gestão na Central de Inteligência.

## 3. Motivo de parada estruturado

Motivos principais:
- Aguardando peça;
- Aguardando seguradora;
- Aguardando cliente;
- Retrabalho;
- Capacidade interna;
- Problema técnico;
- Outro.

Podem ser preenchidos no painel ou extraídos de resposta confirmada do funcionário.

## 4. Previsão operacional interna

O sistema calcula uma previsão interna baseada em etapa atual, tempo consumido, etapas restantes e dependências confirmadas.

Quando estiver aguardando aprovação sem horizonte ou peça sem previsão, nenhuma data é inventada.

A previsão operacional é apoio à gestão e não deve ser tratada automaticamente como promessa ao cliente.

## 5. Check-in por foto

Foto de veículo com placa identificada pode iniciar um check-in pelo WhatsApp.

Após SIM do funcionário:
- registra data física de entrada se ainda estiver vazia;
- registra horário do check-in;
- vincula a mídia ao histórico.

Se a placa não estiver legível, nenhuma atualização é realizada.

## 6. QR por veículo

Cada veículo possui token QR próprio.

O QR leva um funcionário autenticado diretamente para a ficha operacional do carro, reduzindo pesquisa manual.

## 7. Código / etiqueta de peças

Existe uma rota rápida para procurar peça por código e uma interface de câmera quando o navegador oferece BarcodeDetector.

Há campo manual de código como fallback.

Após conferir veículo, pedido e item, o usuário registra uma unidade recebida.

## 8. Cobrança de fornecedor

Pedidos com previsão vencida geram alerta e mensagem de cobrança preparada.

Contato de fornecedor pode ser cadastrado na Central de Inteligência.

O envio automático existe, mas permanece desligado por padrão. Para ativar, é necessário contato válido, template Meta aprovado e opção interna habilitada.

## 9. Peça pós-entrega recebida

Quando uma peça totalmente recebida corresponde a uma pendência pós-entrega, o sistema pode avançar a pendência para “aguardando agendamento”.

Com template configurado, o cliente pode ser comunicado sobre a disponibilidade para organizar o retorno.

## 10. Checklist de qualidade

Antes da entrega, o veículo passa por checklist de:
- pintura/polimento;
- montagem/alinhamento;
- acabamento;
- limpeza;
- luzes/sensores;
- itens do cliente;
- pendências;
- evidência final quando aplicável.

Com a exigência ativa, veículo sem checklist aprovado não pode ser finalizado.

## 11. Comunicação apenas em eventos relevantes

Alterações internas normais não geram mensagem ao cliente.

Eventos preparados:
- entrada na oficina;
- início do reparo;
- pintura concluída;
- montagem;
- pronto para entrega.

Eventos ficam registrados e deduplicados.

## 12. Supervisor por setor

O sistema consegue montar resumos por líder/supervisor/encarregado contendo:
- quantidade de veículos;
- alertas;
- tarefas;
- tempo na etapa;
- motivo de parada.

Envio automático pelo WhatsApp permanece controlado por configuração externa/canal.

## 13. Gestão por causa e desempenho

A Central de Inteligência reúne:
- alertas e exceções;
- permanência por etapa;
- causas de parada;
- ciclo médio;
- percentual entregue dentro da previsão registrada;
- percentual da carteira aguardando peças;
- retrabalho aberto;
- desempenho histórico por seguradora;
- pedidos e atrasos por fornecedor;
- cobertura e confiança das previsões operacionais.

## 14. Reconciliação Pint × Zeta

Integração preparada em modo somente leitura.

A fonte externa do Zeta pode ser comparada com a Pint por placa, encerramento e opcionalmente status.

Divergências geram alerta. O Sistema da Pint não altera dados no Zeta.

## 15. Caixa multicanal

WhatsApp e Instagram passam a ser espelhados numa caixa comum.

Entradas protegidas também foram preparadas para:
- e-mail;
- formulário/site.

A fila permite triagem: novo, triado, em atendimento e resolvido.

## Segurança e dependências externas

Código e banco podem operar sem fingir que integrações externas estão ativas.

Dependências que exigem configuração externa permanecem desligadas até existirem credenciais, templates ou fonte real:
- templates Meta para eventos operacionais e fornecedores;
- fonte/endpoint de leitura do Zeta;
- provedor de e-mail/site;
- armazenamento permanente de mídia fora da Meta, caso seja desejado;
- envio automático de resumo por setor.

Nenhum desses itens deve impedir o restante da operação nativa do Sistema da Pint.

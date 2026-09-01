# SISTEMA DA PINT — CONTEXTO E CHECKPOINT OFICIAL DO PROJETO

> Última consolidação: 01/09/2026
>
> Este arquivo é a **memória oficial de continuidade** do projeto Sistema da Pint. Antes de mudar arquitetura, fluxo de veículos, IA, atendimento, Meta/WhatsApp, comunicação ou operação, revisar este documento.
>
> **Repositório público:** não registrar aqui senhas, tokens, connection strings, links privados, telefones, placas reais, dados pessoais de clientes, arquivos operacionais reais da oficina nem valores comerciais/confidenciais. Esses itens devem ficar em ambientes privados/variáveis de ambiente.

---

## 1. Identidade do produto

- Cliente: **Pint Services**, operação de funilaria e pintura automotiva.
- Nome comercial: **SISTEMA DA PINT**.
- Descrição recomendada: **central operacional digital da Pint Services** ou **sistema operacional desenvolvido sob medida para a Pint Services**.
- O nome técnico do repositório é `PintService`, mas **não usar “PintService” comercialmente**.
- Não vender como “chatbot”, “robô”, “software de IA” ou “ferramenta de WhatsApp”.
- A IA é uma **camada de entendimento, atendimento e automação**, não o produto principal.

### Proposta central

Reduzir:
- informação espalhada;
- busca manual por status;
- dependência da memória das pessoas;
- interrupções constantes ao gerente;
- retrabalho;
- duplicidade de atualização;
- respostas sem rastreabilidade.

Aumentar:
- organização operacional;
- histórico;
- responsabilidades claras;
- pendências visíveis;
- acompanhamento de veículos;
- fluxo de informação;
- capacidade de atendimento com segurança.

Frases de referência:

> **Menos tempo procurando informação. Mais tempo fazendo a oficina andar.**

> **O objetivo não é colocar mais software. É transformar informação solta em operação organizada.**

Conceito operacional:

> **A rotina permanece simples; a exceção chega a quem precisa resolver.**

Regra de ouro da arquitetura:

> **A equipe não alimenta a IA. A equipe atualiza a operação. O Sistema da Pint utiliza essa atualização em todo o restante do fluxo.**

---

## 2. Estrutura comercial do projeto

Existem quatro frentes comerciais definidas:

1. **Operação / Sistema da Pint**
2. **Operação + Comunicação**
3. **Plano Completo: Sistema + Comunicação + Audiovisual**
4. **Site institucional**, como entrega separada

Também existe uma **fase de teste/validação/implantação assistida**, que não deve ser confundida com o preço definitivo da operação.

Os valores comerciais aprovados existem em contexto privado e **não devem ser publicados neste repositório público**.

A comunicação não deve ser apresentada apenas como “social media”. O conceito correto é:

> **Gestão de Comunicação, Presença Digital e Reputação**

No plano completo, o audiovisual é parte da entrega global. Custos internos de videomaker/fotógrafo e margem **não devem ser expostos ao cliente**.

---

## 3. Repositório, deploy e infraestrutura

- GitHub: `leleca7/PintService`
- Branch principal: `main`
- Vercel: projeto `oficina-ia-demo`
- URL atual: `https://oficina-ia-demo.vercel.app`
- Banco principal: **Neon Postgres**
- Autenticação: **Neon Auth**
- IA: integração OpenAI presente no core
- Runtime de deploy: alinhado ao ambiente atual da Vercel

### Health conhecido em 01/09/2026

O endpoint `/api/health` indicava:

- database: ativo
- auth: ativo
- openai: ativo
- vehicleSource: não configurado
- whatsapp: não ativo
- instagram: não ativo
- google: não ativo
- reclameAqui: não ativo
- blinko: não ativo

Observação: `vehicleSource` no health atual representa apenas existência de `VEHICLE_DATA_URL`. Isso **não prova que a fonte é legível**. Se a fonte externa continuar existindo como contingência, melhorar o health para diferenciar:

- configurado;
- alcançável;
- válido;
- última leitura bem-sucedida.

---

## 4. Estado atual relevante do código

### Veículos internos

O sistema já possui criação e edição interna de veículos no banco, principalmente em:

- `app/veiculos/actions.ts`
- `app/veiculos/page.tsx`
- `app/veiculos/[id]`

Hoje o fluxo interno já trabalha com itens como:
- cliente;
- telefone;
- placa;
- modelo;
- cor;
- status;
- setor;
- observações.

Isso permite evoluir para o **Modo Operação nativo** sem depender obrigatoriamente de planilha.

### Fonte externa

Arquivo principal:

- `lib/external-vehicle-source.ts`

O leitor atual entende CSV/texto e converte Google Sheets automaticamente para CSV por `VEHICLE_DATA_URL`.

Campos externos suportados incluem:
- placa;
- modelo;
- cor;
- seguradora;
- data de entrada;
- data de produção;
- fase/etapa/setor;
- status;
- dias em casa;
- dias para entrega;
- status de prazo;
- observações;
- responsável;
- data de saída real.

A leitura usa `cache: no-store` para evitar tratar uma cópia em cache como status atual.

### Resolução operacional

Arquivo:

- `lib/operational-vehicle.ts`

Com fonte externa configurada:
- busca na fonte externa;
- sincroniza dados básicos no banco;
- trata erro, placa inexistente e informação incompleta;
- evita usar silenciosamente informação velha como atual.

Sem fonte externa:
- utiliza o banco local do Sistema da Pint.

### IA / processamento

Arquivos centrais:

- `lib/process-message.ts`
- `lib/agent.ts`

A IA deve atuar como camada de interpretação e roteamento, sempre subordinada às regras operacionais e dados reais.

---

## 5. Segurança da IA — regras congeladas

A IA **nunca deve inventar**:
- preço;
- orçamento;
- prazo;
- data de entrega;
- status;
- fase/setor;
- dano físico;
- disponibilidade de peça;
- informação operacional não confirmada.

Quando houver:
- dado ausente;
- conflito;
- baixa confiança;
- pergunta sensível;
- necessidade de confirmação física;

então:
- não estimar;
- criar pendência/tarefa quando aplicável;
- transferir ou acionar humano.

### Itens que tendem a exigir humano

- orçamento particular/preço não registrado;
- vistoria;
- peça/reposição quando depende de confirmação atual;
- reclamações sensíveis;
- pedido de gerente;
- acidente/situação grave;
- informação contraditória;
- confirmação física atual;
- foto atual da oficina/veículo quando não existe dado confiável.

---

## 6. Investigação Excel / OneDrive / Google Sheets

Inicialmente foi considerada integração direta com o Excel que a Pint utiliza no OneDrive.

Problemas encontrados:
- leitor atual entende CSV/Google Sheets, não `.xlsx`;
- leitura robusta do OneDrive exigiria Microsoft Graph/autenticação;
- houve atrito com Microsoft Entra/Azure para a conta envolvida;
- essa integração adicionaria complexidade desnecessária para a fase atual.

Também foi considerada a migração única para Google Sheets.

Essa opção continua tecnicamente válida como **transição/contingência**, mas deixou de ser a arquitetura preferida após descobrir que o funcionário já utiliza uma interface própria para preencher os dados.

---

## 7. Planilha real da operação — estrutura identificada

Foi recebida uma exportação CSV da planilha operacional real.

A estrutura visível possuía 19 campos:

- `#`
- `Placa`
- `Modelo`
- `Cor`
- `Seguradora`
- `Dt. Entrada`
- `Dt. Produção`
- `Fase`
- `Status`
- `Dias em Casa`
- `Dias p/ Entrega`
- `Status Prazo`
- `Responsável`
- `Observações`
- `Dt. Saída Real`
- `Concluído?`
- `Alerta de Fila`
- `_sort`
- `Prio. Fase`

Foi criada uma versão reorganizada/automatizada como estudo, incluindo:
- painel;
- listas suspensas;
- cálculo de dias;
- status de prazo;
- organização visual Pint Services;
- separação entre observação interna e observação autorizada ao atendimento;
- aba técnica `DADOS SISTEMA`.

### Limitação importante

O arquivo recebido era CSV. Portanto ele preserva os dados/cabeçalhos visíveis, mas não garante preservação de:
- Power Query;
- fórmulas ocultas;
- outras abas;
- automações do Excel original;
- formatação original.

A planilha real e seus registros **não devem ser versionados no repositório público**.

---

## 8. Descoberta decisiva: funcionário já usa um aplicativo/interface na nuvem

O funcionário responsável pelo preenchimento criou/usa uma interface na nuvem para alimentar os dados operacionais.

Isso mudou a direção do projeto.

### Decisão fechada

**Não manter quatro camadas obrigatórias:**

`aplicativo dele → planilha → Sistema da Pint → IA`

Isso geraria:
- trabalho duplicado;
- mais pontos de falha;
- divergência de dados;
- confusão;
- baixa adesão;
- sensação de “coisa demais”.

### Direção correta

Usar o aplicativo existente como **referência de experiência e fluxo**, e implementar essa experiência dentro do **Sistema da Pint**.

Arquitetura preferida:

`Funcionário → Modo Operação → Banco do Sistema da Pint → Painel / Veículos / Tarefas / Atendimento / IA`

Assim, uma única atualização alimenta todo o sistema.

---

## 9. Modo Operação x Modo Gestão

O Sistema da Pint não deve parecer complexo para quem só precisa atualizar veículos.

### Modo Operação

Interface simples, rápida e focada em chão de oficina.

Possível tela:
- busca por placa;
- veículos em andamento;
- fase;
- status;
- prazo;
- responsável;
- ação rápida **Atualizar**.

Ficha operacional sugerida:

#### Identificação
- placa;
- modelo;
- cor;
- seguradora.

#### Operação
- data de entrada;
- data de produção/previsão operacional;
- fase atual;
- status;
- responsável;
- prioridade da fase.

#### Prazo
- dias na oficina — automático;
- dias para entrega — automático;
- status do prazo — automático.

#### Informação
- observação interna;
- observação/informação autorizada ao atendimento.

#### Finalização
- data de saída real;
- concluído — automático quando aplicável.

### Modo Gestão

Pode oferecer:
- dashboard;
- veículos;
- clientes;
- conversas;
- tarefas;
- pendências;
- funcionários;
- usuários/permissões;
- auditoria;
- integrações;
- reputação;
- indicadores.

Usuários operacionais não precisam ver tudo.

---

## 10. Fonte oficial da operação

Direção atual:

> **O banco do Sistema da Pint deve ser a fonte oficial da operação.**

A planilha passa a ser opcional para:
- importação inicial;
- exportação;
- relatório;
- backup;
- contingência;
- transição.

Evitar exigir atualização diária em planilha externa se o Modo Operação já puder cumprir a função.

---

## 11. Evolução necessária do modelo de veículo

O modelo atual do banco deve ser ampliado para representar a operação real.

Campos candidatos:
- placa;
- modelo;
- cor;
- seguradora;
- data de entrada;
- data de produção/previsão, com significado definido;
- fase/etapa;
- status;
- responsável;
- prioridade da fase;
- observação interna;
- observação autorizada ao atendimento;
- data de saída real;
- última atualização;
- autor/origem da atualização;
- histórico de mudança de fase/status.

Campos preferencialmente derivados/calculados:
- dias em casa/oficina;
- dias para entrega;
- status do prazo;
- concluído;
- ordenação operacional (`_sort`) se ainda necessária;
- alertas de fila.

Antes de migrar, definir o significado exato de:
- `Dt. Produção`;
- `Alerta de Fila`;
- `_sort`;
- `Prio. Fase`.

Não copiar a planilha cegamente para o banco.

---

## 12. Papel do aplicativo antigo

O aplicativo/site criado pelo funcionário deve servir como **benchmark interno de usabilidade**.

Se houver acesso ao código, existem duas possibilidades:

1. reaproveitar temporariamente a interface e mudar o destino do `Salvar` para uma API segura do Sistema da Pint;
2. reproduzir a experiência dentro do próprio Sistema da Pint.

Preferência atual: **opção 2**.

Se houver integração temporária externa, usar API autenticada. Conceitualmente:

- `POST /api/operacao/veiculos`
- `PATCH /api/operacao/veiculos/[id]`

Nunca entregar credencial direta do Neon para uma aplicação externa.

A API deve:
- autenticar;
- validar permissão;
- validar payload;
- normalizar placa;
- registrar auditoria;
- atualizar timestamp;
- proteger campos internos.

---

## 13. IA e dados de veículo

A IA não deve receber a tabela inteira nem dados de outros clientes.

Para cada intenção, carregar somente os dados necessários daquele veículo.

### Geralmente seguros quando oficialmente registrados
- placa;
- modelo;
- cor;
- seguradora;
- data de entrada;
- fase;
- status;
- dias em oficina quando calculado com fonte confiável.

### Exigem política explícita
- responsável;
- previsão/data de entrega;
- status de prazo;
- observações;
- peça/disponibilidade;
- informação física atual.

### Separação obrigatória recomendada

- `observacao_interna`
- `observacao_autorizada_atendimento`

A IA não deve receber observações internas brutas por padrão.

---

## 14. Fluxo de atendimento desejado

Exemplo de status:

`cliente → mensagem → intenção → localizar veículo → consultar banco → aplicar regras → responder fato permitido`

Exemplo de pergunta física:

`cliente → “a peça chegou?” → dado não confirmado → gerar verificação humana → não inventar`

Exemplo de orçamento:

`cliente → pergunta preço → sem orçamento oficial → humano`

O conceito é:

> **IA interpreta; sistema decide; banco confirma; humano resolve exceção.**

---

## 15. WhatsApp / Meta — estado técnico atual

Já existe infraestrutura de webhook e envio no código.

### Entrada

Arquivo:

- `app/api/whatsapp/route.ts`

O endpoint:
- responde ao desafio de verificação da Meta;
- compara `WHATSAPP_VERIFY_TOKEN`;
- recebe POST do webhook;
- valida assinatura `x-hub-signature-256`;
- processa mensagens após responder o webhook;
- encaminha mensagens para `processIncomingMessage`.

### Biblioteca WhatsApp

Arquivo:

- `lib/whatsapp.ts`

Já há suporte para:
- normalizar telefone;
- validar assinatura com `WHATSAPP_APP_SECRET`;
- extrair texto;
- interactive/button/list;
- imagem;
- vídeo;
- áudio;
- documento;
- enviar texto;
- enviar template;
- enviar imagem por URL;
- enviar imagem por media id.

### Variáveis esperadas

- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION`

Segredos devem ficar somente na Vercel/ambiente seguro.

---

## 16. Estratégia de teste Meta/WhatsApp — decisão fechada

**Não conectar nem migrar o número oficial da Pint no início.**

Primeiro usar **número de teste fornecido pela Meta** e um telefone pessoal autorizado como destinatário/testador.

Objetivo: permitir quebrar, corrigir e repetir testes sem interferir no WhatsApp real da empresa.

### Sequência segura de validação

1. Criar/configurar app Meta.
2. Adicionar WhatsApp Cloud API.
3. Usar o número de teste da Meta.
4. Cadastrar apenas números de teste permitidos.
5. Configurar callback:
   - `https://oficina-ia-demo.vercel.app/api/whatsapp`
6. Validar `WHATSAPP_VERIFY_TOKEN`.
7. Confirmar recebimento do webhook.
8. Confirmar persistência/registro no sistema.
9. Confirmar interpretação da IA.
10. Confirmar envio da resposta pela Graph API.
11. Testar status de veículo.
12. Testar placa inexistente.
13. Testar pedido de peça.
14. Testar orçamento.
15. Testar reclamação/humano.
16. Testar imagem/mídia quando aplicável.
17. Testar falha da IA e fallback.
18. Testar falha de fonte/dado operacional.
19. Só depois estudar a migração/conexão do número oficial.

### Regra de proteção

> **O número oficial da Pint não deve ser registrado/migrado como remetente da Cloud API enquanto o ambiente de teste não estiver validado ponta a ponta.**

---

## 17. Comunicação e audiovisual

A comunicação deve construir uma presença automotiva **premium, contemporânea e real**, sem aparência genérica/artificial.

### Direção de conteúdo

Priorizar:
- antes e depois;
- transformação real;
- processos de funilaria;
- preparação;
- pintura;
- polimento;
- acabamento;
- reflexos e detalhes da lataria;
- equipe;
- estrutura;
- bastidores;
- operação acontecendo de verdade.

As referências visuais servem para linguagem, **não para copiar vídeos**.

### Formato audiovisual atualmente buscado

Direção preferida para a fase atual:
- parceria recorrente;
- **1 captação presencial por mês**;
- necessariamente em dia útil;
- aproveitar oficina funcionando;
- aproximadamente **4 Reels gravados/editados**, sujeito à negociação final;
- seleção de fotografias tratadas na mesma captação;
- criação progressiva de banco de imagens proprietário.

A estratégia, pautas, roteiros, conceito e direção estética ficam sob responsabilidade da gestão do projeto, com espaço para colaboração criativa do profissional audiovisual.

### Critérios para selecionar fornecedor

Comparar:
- portfólio;
- fotografia;
- vídeo;
- edição;
- estética automotiva;
- equipamento;
- disponibilidade em dia útil;
- domínio de Reels/tendências;
- criatividade;
- capacidade de trabalhar com direção;
- consistência;
- preço;
- flexibilidade de contrato.

Foram contatados vários profissionais. Existem candidatos com qualidade alta, porém acima da verba adequada para a fase atual. **Não assumir compromisso anual apenas para obter desconto enquanto o projeto ainda está em validação.**

Valores individuais e dados pessoais dos fornecedores não devem ser registrados aqui.

---

## 18. Planilha/exportação como recurso do Sistema

Mesmo com o banco como fonte oficial, manter utilidade tabular.

Possíveis recursos futuros:
- **Exportar para Excel**;
- relatório CSV;
- importar base inicial;
- filtro por fase/status;
- exportação de veículos ativos;
- relatório gerencial;
- backup controlado.

O usuário não deve ser obrigado a editar planilha para a IA funcionar.

---

## 19. Princípio de produto: não deixar o sistema “grande demais”

A quantidade de funcionalidades pode crescer, mas cada perfil deve ver apenas o necessário.

Funcionário operacional:
- busca;
- veículo;
- atualização rápida;
- tarefas que lhe dizem respeito.

Gestão:
- painel;
- operação;
- atendimento;
- equipe;
- auditoria;
- indicadores;
- configurações.

Isso evita transformar uma ferramenta de produtividade em burocracia.

---

## 20. Próximas etapas priorizadas

### Prioridade 1 — Operação nativa

1. Conhecer melhor o fluxo/interface criada pelo funcionário.
2. Definir exatamente os campos reais e a semântica deles.
3. Projetar o **Modo Operação** dentro do Sistema da Pint.
4. Ampliar modelo do banco.
5. Criar migração segura.
6. Atualizar criação/edição de veículos.
7. Registrar histórico/auditoria das mudanças.
8. Fazer cálculos automáticos de prazo/dias.

### Prioridade 2 — IA usando o banco como fonte oficial

1. Ajustar `resolveOperationalVehicle` para o modelo novo.
2. Determinar campos permitidos por intenção.
3. Implementar `observacao_autorizada_atendimento`.
4. Garantir que observação interna não vaze.
5. Testar status, prazo, peça, foto, orçamento e humano.

### Prioridade 3 — Meta/WhatsApp em ambiente de teste

1. Criar/configurar app Meta.
2. Usar número de teste.
3. Conectar webhook.
4. Configurar variáveis de ambiente.
5. Validar fluxo ponta a ponta.
6. Só depois planejar número oficial.

### Prioridade 4 — Comunicação/audiovisual

1. Finalizar seleção do parceiro audiovisual.
2. Fechar formato piloto compatível com orçamento.
3. Planejar primeira captação.
4. Criar banco de imagens.
5. Consolidar calendário/pautas.

### Prioridade 5 — Integrações externas

Depois do core:
- Instagram;
- Google Business Profile;
- Reclame Aqui, se houver API/contrato disponível;
- outras integrações apenas se gerarem valor operacional real.

---

## 21. Checklist antes do go-live oficial

- [ ] Modo Operação validado com a rotina real da oficina.
- [ ] Campos operacionais definidos.
- [ ] Banco como fonte oficial funcionando.
- [ ] Histórico/auditoria funcionando.
- [ ] IA sem acesso indevido a observação interna.
- [ ] Status real testado.
- [ ] Placa inexistente testada.
- [ ] Peça testada.
- [ ] Orçamento testado.
- [ ] Reclamação testada.
- [ ] Transferência para humano testada.
- [ ] Meta testada com número de teste.
- [ ] Webhook validado.
- [ ] Envio WhatsApp validado.
- [ ] Falha de IA testada.
- [ ] Variáveis/segredos somente em ambiente seguro.
- [ ] Número oficial da Pint mantido intacto até aprovação dos testes.
- [ ] Perfis e permissões revisados.
- [ ] Comunicação/audiovisual com fluxo de aprovação definido.

---

## 22. Regra de continuidade

Sempre que houver uma decisão estrutural importante neste projeto:

1. implementar/testar quando aplicável;
2. atualizar este arquivo;
3. evitar depender apenas da memória da conversa;
4. não inserir dados sensíveis no GitHub público.

Este documento deve permitir que o projeto seja retomado mesmo após perda de contexto de uma conversa.
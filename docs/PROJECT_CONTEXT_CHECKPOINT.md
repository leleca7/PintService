# SISTEMA DA PINT — CONTEXTO E CHECKPOINT DO PROJETO

> Última consolidação: 01/09/2026
>
> Este arquivo existe para preservar decisões de produto, arquitetura, operação e próximos passos do projeto. Ele deve ser atualizado sempre que houver uma mudança estrutural importante.
>
> **Importante:** o repositório é público. Não registrar aqui senhas, tokens, links privados, dados pessoais de clientes, placas reais, telefones, arquivos operacionais com dados da oficina ou valores comerciais confidenciais.

---

## 1. Identidade do produto

- Cliente: **Pint Services** — operação de funilaria e pintura automotiva.
- Nome comercial do sistema: **SISTEMA DA PINT**.
- Descrição recomendada: **central operacional digital da Pint Services** ou **sistema operacional desenvolvido sob medida para a Pint Services**.
- O nome técnico do repositório é `PintService`, mas **não usar “PintService” comercialmente**.
- Não vender o produto como “chatbot”, “robô”, “software de IA” ou “ferramenta de WhatsApp”. A IA é uma camada do sistema, não o produto principal.

### Proposta central

Reduzir:
- informação espalhada;
- busca manual por status;
- dependência da memória das pessoas;
- interrupções constantes ao gerente;
- retrabalho;
- respostas sem rastreabilidade.

Aumentar:
- organização operacional;
- histórico;
- responsabilidades claras;
- pendências visíveis;
- acompanhamento de veículos;
- fluxo de informação;
- capacidade de atendimento sem inventar informação.

Frases de referência:

> **Menos tempo procurando informação. Mais tempo fazendo a oficina andar.**

> **O objetivo não é colocar mais software. É transformar informação solta em operação organizada.**

Conceito operacional:

> **A rotina permanece simples; a exceção chega a quem precisa resolver.**

---

## 2. Repositório, deploy e infraestrutura

- GitHub: `leleca7/PintService`
- Branch principal: `main`
- Deploy Vercel atual: projeto `oficina-ia-demo`
- URL pública atual: `https://oficina-ia-demo.vercel.app`
- Banco / persistência principal: Neon Postgres
- Autenticação: Neon Auth / estrutura já existente no projeto
- OpenAI: integração presente no core

### Health check conhecido em 01/09/2026

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

Observação importante: o health atual considera `vehicleSource` ativo apenas pela presença da variável `VEHICLE_DATA_URL`; isso **não prova que a fonte está realmente legível**. Evolução recomendada: separar “configurado” de “válido/alcançável”.

---

## 3. Estado atual relevante do código

### Cadastro e edição interna de veículos

O sistema já possui ações internas para criar e atualizar veículos no banco:

- `app/veiculos/actions.ts`
- `app/veiculos/page.tsx`
- `app/veiculos/[id]`

Hoje o cadastro interno já lida com campos como:
- cliente;
- telefone;
- placa;
- modelo;
- cor;
- status;
- setor;
- observações.

Isso é importante porque permite evoluir para um **modo operacional interno**, sem depender obrigatoriamente de planilha externa.

### Fonte externa de veículos

Arquivo principal:

- `lib/external-vehicle-source.ts`

O leitor atual foi feito para CSV/texto e possui conversão automática de Google Sheets para CSV. Ele aceita uma URL via:

- `VEHICLE_DATA_URL`

Campos suportados pelo leitor externo incluem, entre outros:
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

O leitor usa `cache: no-store`, portanto a intenção é consultar a fonte atualizada antes de responder.

### Resolução operacional

Arquivo:

- `lib/operational-vehicle.ts`

Com fonte externa configurada:
- busca o veículo na fonte externa;
- sincroniza dados básicos no banco local;
- trata erro da fonte, placa não encontrada e dado incompleto;
- evita tratar informação antiga como atual.

Sem fonte externa configurada:
- usa o banco local do Sistema da Pint.

### Atendimento / IA

Arquivos centrais:

- `lib/process-message.ts`
- `lib/agent.ts`

A IA funciona como camada de entendimento e roteamento, com regras fortes de segurança.

Nunca inventar:
- preço;
- orçamento;
- prazo;
- data de entrega;
- status;
- setor/fase;
- dano físico;
- disponibilidade de peça;
- informação operacional não confirmada.

Quando faltar informação, houver conflito ou baixa confiança:
- criar/acionar pendência quando aplicável;
- encaminhar para humano;
- não responder como se soubesse.

Perguntas físicas atuais, como verificar uma peça, foto, situação visível no carro ou confirmação no pátio/oficina, devem gerar **verificação operacional humana**.

---

## 4. Decisão importante sobre planilhas e fonte operacional

### O que foi investigado

Inicialmente foi considerada integração direta com Excel no OneDrive.

Problemas encontrados:
- o leitor atual do sistema entende CSV/Google Sheets, não `.xlsx`;
- integração robusta com OneDrive exigiria Microsoft Graph / autenticação;
- conta Microsoft pessoal criou atrito com Microsoft Entra/Azure;
- isso acrescentaria complexidade para a fase atual.

Também foi considerada migração para Google Sheets.

### Planilha operacional encontrada

Foi recebida uma exportação CSV da planilha real utilizada na operação. A estrutura visível continha **19 campos**, incluindo:

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

Foi montada uma versão estruturada/automatizada da planilha, com separação entre:
- `Observações` internas;
- `Observação autorizada ao atendimento`.

Também foi criada uma ideia de aba técnica `DADOS SISTEMA` para expor somente campos seguros para leitura técnica.

**Não subir a planilha real nem seus dados operacionais ao repositório público.**

### Limitação da exportação recebida

A exportação recebida era CSV, então preserva dados e cabeçalhos visíveis, mas não carrega necessariamente:
- Power Query;
- fórmulas ocultas;
- outras abas do Excel original;
- formatação original;
- automações internas do arquivo fonte.

---

## 5. Descoberta mais recente: funcionário já utiliza um “aplicativo” para preencher

Foi informado que o funcionário responsável pelo controle **não trabalha necessariamente editando a planilha diretamente**. Ele criou/usa uma interface/aplicativo na nuvem para preencher os dados operacionais.

### Decisão atual

**Não criar mais uma ferramenta separada.**

Evitar esta arquitetura:

`aplicativo do funcionário → planilha → Sistema da Pint → IA`

Isso geraria:
- duplicidade;
- mais pontos de falha;
- confusão para a equipe;
- risco de dados divergentes;
- sensação de “sistema demais”.

### Arquitetura preferida

Pegar a **ideia/experiência de uso** do aplicativo que o funcionário já utiliza e **incorporar essa experiência ao Sistema da Pint**.

Arquitetura desejada:

`Funcionário → Modo Operação do Sistema da Pint → Banco do Sistema da Pint → Painel / Veículos / Tarefas / Atendimento / IA`

Assim:
- o funcionário atualiza uma única vez;
- o banco vira a fonte oficial;
- a IA consulta a mesma fonte;
- o painel reflete o mesmo dado;
- a ficha do veículo reflete o mesmo dado;
- auditoria e histórico podem ser preservados;
- tarefas e pendências podem ser geradas a partir da mesma operação.

### Papel do aplicativo antigo

O site/aplicativo antigo do funcionário deve ser tratado como **referência de usabilidade e fluxo**, não como uma plataforma adicional obrigatória.

Se houver acesso ao código dele, duas opções:

1. aproveitar o front-end e fazer o botão Salvar chamar uma API segura do Sistema da Pint; ou
2. reproduzir a experiência diretamente dentro do Sistema da Pint.

A preferência atual é **incorporar dentro do Sistema da Pint**, salvo se o código antigo for tão útil que valha reaproveitar a interface temporariamente.

---

## 6. Modo Operação x Modo Gestão

Para evitar que o Sistema da Pint pareça “grande demais” para quem só atualiza carros, trabalhar com experiências diferentes por perfil/permissão.

### Modo Operação

Objetivo: extremamente simples e rápido.

Possível tela inicial:

- busca por placa;
- lista de veículos;
- fase;
- status;
- prazo;
- botão Atualizar.

Ao editar um veículo:

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

#### Informações
- observação interna;
- informação/observação autorizada ao atendimento.

#### Finalização
- data de saída;
- concluído — automático quando aplicável.

### Modo Gestão

Pode continuar oferecendo visão mais completa:

- painel;
- veículos;
- clientes;
- atendimento;
- tarefas;
- funcionários;
- usuários/permissões;
- auditoria;
- configurações;
- indicadores.

A equipe operacional não precisa enxergar tudo isso.

---

## 7. Fonte oficial de dados — direção atual

A direção preferida mudou de “planilha como banco principal” para:

> **Banco do Sistema da Pint como fonte oficial da operação.**

Planilha passa a ser opcional para:
- exportação;
- relatório;
- backup;
- importação inicial;
- apoio de transição.

A planilha não deve ser uma obrigação diária se o funcionário já possui/receber uma interface operacional adequada.

### Regra de ouro

> **A equipe não alimenta a IA. A equipe atualiza a operação. O Sistema da Pint usa essa atualização no restante do fluxo.**

---

## 8. Evolução do banco / modelo de veículo

O cadastro interno atual precisa ser ampliado para comportar os campos reais da operação.

Campos candidatos à persistência nativa:
- placa;
- modelo;
- cor;
- seguradora;
- data de entrada;
- data de produção / previsão oficial, com semântica claramente definida;
- fase/etapa;
- status;
- responsável;
- prioridade da fase;
- observação interna;
- observação autorizada ao atendimento;
- data de saída real;
- campos derivados de prazo;
- estado concluído;
- última atualização;
- origem/autor da atualização.

Campos derivados devem preferencialmente ser calculados, não digitados:
- dias em casa;
- dias para entrega;
- status do prazo;
- concluído, quando regra permitir;
- ordenação operacional (`_sort`) se ainda fizer sentido;
- alertas de fila.

Não copiar cegamente a planilha para o banco: primeiro definir semântica exata de cada campo, principalmente `Dt. Produção`, `Alerta de Fila`, `_sort` e `Prio. Fase`.

---

## 9. Integração futura do aplicativo operacional

Se for necessário integrar uma interface externa ao Sistema da Pint, usar API autenticada.

Exemplo conceitual:

- `POST /api/operacao/veiculos`
- `PATCH /api/operacao/veiculos/[id]`

Regras:
- não entregar credencial direta do banco ao aplicativo;
- autenticar a chamada;
- validar permissões;
- validar payload;
- normalizar placa;
- registrar auditoria;
- atualizar `ultima_atualizacao`;
- revalidar telas necessárias.

Mas a preferência atual é que o próprio **Modo Operação** viva dentro do Sistema da Pint.

---

## 10. IA usando dados do veículo

A IA deve receber apenas o necessário para responder a intenção atual.

### Campos geralmente seguros, quando registrados e permitidos
- modelo;
- placa;
- cor;
- seguradora;
- data de entrada;
- fase/etapa;
- status;
- dias na oficina, se calculado de fonte confiável.

### Campos que precisam de política explícita
- responsável — decidir se pode ser exposto ao cliente;
- previsão/data de entrega — só quando oficialmente validada;
- status de prazo — depende da regra comercial/operacional;
- observações — nunca expor observação interna de forma bruta;
- disponibilidade de peças — exigir confirmação quando não for dado estruturado confiável.

### Separação recomendada

Ter no modelo algo equivalente a:
- `observacoes_internas`
- `informacao_atendimento` ou `observacao_autorizada_atendimento`

A IA **não deve receber a observação interna completa por padrão**.

---

## 11. Comunicação / atendimento

O atendimento deve usar o sistema como fonte de contexto operacional, mantendo as regras de segurança.

Exemplos:

### Pergunta de status
Cliente pergunta pelo carro usando a placa.

Sistema:
1. identifica intenção;
2. localiza veículo;
3. consulta o estado atual;
4. responde apenas com fatos permitidos.

### Pergunta física atual
Ex.: “A peça já chegou?”, “consegue mandar uma foto?”, “o carro já está montado de verdade?”

Sistema:
- não inventa;
- cria/aciona uma verificação operacional humana quando necessário.

### Pergunta de prazo
Se não houver prazo oficialmente registrado e permitido:
- não estimar;
- encaminhar verificação humana.

---

## 12. Planilha / exportação dentro do Sistema da Pint

Mesmo com banco como fonte oficial, manter utilidade tabular.

Possíveis recursos futuros:
- botão **Exportar para Excel**;
- baixar CSV;
- relatório filtrado;
- abrir visão tabular;
- importar base inicial;
- exportação para auditoria/backup.

Evitar embutir Google Sheets como editor principal se o sistema já oferecer um Modo Operação simples.

---

## 13. Próximos passos recomendados

Ordem sugerida:

1. **Obter/ver o aplicativo que o funcionário já usa**
   - link, prints, vídeo ou código;
   - entender fluxo de preenchimento;
   - identificar quais campos realmente usa;
   - observar atalhos e UX que funcionam na rotina.

2. **Mapear o modelo de dados real**
   - comparar app antigo + planilha exportada + banco atual;
   - definir campos manuais x derivados;
   - confirmar semântica de `Dt. Produção`, `Prio. Fase`, `Alerta de Fila` e `_sort`.

3. **Expandir schema do banco**
   - adicionar os campos operacionais necessários;
   - preservar histórico/auditoria;
   - evitar campos duplicados sem necessidade.

4. **Criar Modo Operação**
   - rápido;
   - mobile-friendly;
   - busca por placa;
   - edição em poucos toques;
   - dropdowns para fase/status;
   - salvamento claro;
   - feedback imediato.

5. **Ajustar IA para consultar banco nativo ampliado**
   - manter guardrails atuais;
   - responder campos seguros;
   - preservar encaminhamento humano para exceções.

6. **Criar exportação/relatório**
   - Excel/CSV sob demanda;
   - não como fonte operacional principal.

7. **Validar com o funcionário que atualiza os veículos**
   - ele deve conseguir trabalhar tão rápido quanto ou melhor que no app antigo.

8. **Validar com gerente/dono**
   - painel;
   - responsabilidades;
   - exceções;
   - rastreabilidade;
   - informações que podem ou não aparecer para clientes.

---

## 14. Decisões que NÃO devem ser esquecidas

- Comercialmente, chamar de **Sistema da Pint**, não PintService.
- O produto é uma **central operacional**, não um chatbot.
- IA não pode inventar informação operacional.
- Não criar trabalho duplicado para a equipe.
- Não exigir “alimentar a IA” manualmente.
- A atualização deve acontecer uma única vez.
- Preferir banco do Sistema da Pint como fonte oficial.
- Incorporar a experiência boa do app do funcionário ao sistema.
- Separar Modo Operação de Modo Gestão.
- Observações internas não devem ser expostas ao cliente.
- Planilha deve ser exportação/transição/relatório, não necessariamente o centro do fluxo.
- Google Sheets continua tecnicamente suportável como fonte externa, mas deixou de ser a arquitetura preferida após descobrir o aplicativo operacional existente.
- OneDrive/Azure/Microsoft Graph não é prioridade nesta fase.
- Não salvar dados reais da oficina em repositório público.

---

## 15. Regra de continuidade para futuras implementações

Antes de alterar arquitetura de veículos, fonte operacional, IA ou interface de operação, reler este documento.

Quando uma decisão nova substituir uma decisão antiga:
- atualizar este arquivo;
- registrar a data;
- marcar claramente a decisão substituída;
- evitar manter duas arquiteturas concorrentes sem motivo.

Este documento deve funcionar como **memória técnica e de produto do Sistema da Pint**.

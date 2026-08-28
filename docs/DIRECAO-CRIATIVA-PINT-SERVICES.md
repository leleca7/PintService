# Direção criativa — Pint Services

> Documento de referência para o redesenho do PintService e, em uma etapa posterior, para o site público da Pint Services. Não implementar redesign antes da escolha formal de uma direção visual.

## Contexto

A prioridade imediata é concluir e validar o **PintService**, sistema operacional exclusivo da Pint Services. O site público institucional será tratado depois que a empresa analisar e aprovar o sistema.

O sistema deve equilibrar duas percepções:

1. **Conforto e velocidade para quem usa todos os dias** — administração, atendimento, gerência e equipe operacional.
2. **Confiança e percepção de valor para o dono** — o produto precisa parecer claramente mais sofisticado, sólido e exclusivo do que softwares genéricos prontos para oficinas.

A IA deve ficar **nos bastidores**. Ela é infraestrutura de apoio, não personagem visual nem protagonista da interface.

A experiência deverá ser desenhada para **desktop, tablet e mobile**, porque atendimento e operação podem acontecer em diferentes pontos da oficina.

## Referência atual da marca

Referência pública principal: Instagram `@pintservicescarcenter`.

### O que funciona e deve ser preservado/elevado

- Base cromática escura com **preto/grafite + laranja quente + branco/off-white**.
- Geometria simples do símbolo da marca.
- Fotografia real de veículos, oficina e equipe.
- Conteúdo de prova: antes/depois, resultado, processo e pessoas reais.
- Associação com seguradoras e elementos que reforçam confiança operacional.
- Energia automotiva direta, sem tentar transformar a marca em algo delicado ou ornamental.

### Diagnóstico visual do Instagram atual

A identidade tem uma base promissora — automotiva, forte e reconhecível — porém a execução visual é inconsistente. O feed mistura:

- fontes manuscritas/brush;
- fontes condensadas muito pesadas;
- vários estilos tipográficos simultâneos;
- texturas, brilhos, contornos e efeitos;
- composições densas e com pouca respiração;
- peças que parecem pertencer a linguagens visuais diferentes.

Isso deixa a comunicação mais **crua, pesada e artesanal** do que a qualidade e a confiança que a empresa deveria transmitir.

## Auditoria visual do PintService atual

A estrutura funcional do dashboard está no caminho certo: existe visão geral, bloco explícito de atenção, fluxo da oficina, atendimentos recentes e veículos atualizados. Essa hierarquia operacional deve ser preservada.

O problema atual é principalmente de **direção de arte**, não de estrutura básica.

A interface usa hoje:

- Inter como fonte principal;
- fundo cinza-claro;
- painéis brancos;
- sidebar preta/grafite;
- laranja como cor de destaque;
- muitos cards, chips e badges arredondados;
- linguagem visual típica de dashboard SaaS contemporâneo.

É limpa e funcional, mas ainda parece um bom **admin template genérico**, não um software exclusivo que represente a Pint Services.

### O que preservar da UI atual

- separação clara entre navegação e conteúdo;
- leitura rápida dos indicadores;
- bloco “O que precisa de atenção” como prioridade da home;
- etapas visuais da oficina;
- atalhos diretos para veículos, tarefas e atendimento;
- estados de prioridade e saúde do sistema;
- densidade moderada de informação.

### O que deve evoluir

- tipografia mais proprietária e refinada;
- identidade visual menos genérica;
- hierarquia de informação mais sofisticada;
- menos sensação de “coleção de cards”;
- tratamento melhor de estados críticos e operação saudável;
- componentes próprios que remetam a precisão automotiva e processo;
- iconografia mais consistente;
- tratamento de dados e tabelas mais premium;
- microinterações úteis, sem efeitos decorativos gratuitos;
- versão de tablet pensada especificamente para balcão e oficina;
- mobile pensado como interface operacional, não apenas desktop empilhado.

A responsividade atual é tecnicamente funcional, mas ainda simples: em telas menores a navegação vira uma faixa horizontal e os blocos passam para uma coluna. A versão final deverá ter arquitetura mobile/tablet própria.

## Sensação desejada

A evolução não deve apagar a personalidade automotiva. O objetivo é transformar a base atual em uma linguagem:

- premium;
- contemporânea;
- limpa;
- tecnológica sem parecer startup genérica;
- segura;
- precisa;
- confortável;
- com personalidade própria.

A referência de qualidade é a diferença entre uma produção visual tecnicamente funcional e uma produção com **direção de arte, acabamento, ritmo e hierarquia de estúdio premium**.

## O que evitar

- aparência de template;
- “site feito por IA”;
- estética SaaS genérica;
- interface que pareça painel administrativo barato;
- fonte manuscrita/brush como linguagem principal;
- excesso de sombras, glow e contornos;
- excesso de cards sem hierarquia;
- degradês decorativos sem função;
- visual gamer/neon;
- ícones coloridos aleatórios;
- excesso de preto chapado sem áreas de respiro;
- textura/grunge que deixe a interface suja;
- design excessivamente minimalista a ponto de perder personalidade.

## Princípios para o PintService

### 1. O sistema precisa mostrar o que exige ação

O dashboard não deve ser apenas um conjunto de números. Ao abrir, a pessoa precisa saber imediatamente:

- o que está atrasado;
- o que está parado;
- o que precisa de decisão humana;
- quais atendimentos precisam de resposta;
- quais tarefas estão críticas;
- se alguma integração está com problema;
- qual é a próxima ação recomendada.

Se não houver nada crítico, o sistema deve transmitir explicitamente que a operação está saudável.

### 2. Informação em camadas

A interface precisa ser limpa sem esconder a operação. Priorizar:

**atenção imediata → resumo → contexto → detalhe**.

Não colocar todo o banco de dados na primeira tela.

### 3. IA invisível

Evitar mascote, chat flutuante chamativo ou linguagem visual “mágica”. A IA deve aparecer por meio de pequenas indicações úteis, como:

- “priorizado automaticamente”;
- “resumo preparado”;
- “sugestão de resposta”;
- “precisa de confirmação humana”.

### 4. Responsividade real

Desktop, tablet e mobile não serão apenas a mesma tela encolhida.

- **Desktop:** visão ampla da operação e múltiplos contextos.
- **Tablet:** uso em balcão/oficina, touch, leitura rápida e ações maiores.
- **Mobile:** atendimento, alertas, tarefas, aprovação e consulta rápida.

## Site público — etapa posterior

Quando a Pint Services aprovar o sistema, criar um projeto separado para o site institucional público. Ele deve compartilhar o mesmo DNA visual, mas não a mesma arquitetura de interface.

**PintService:** produto operacional.

**Site Pint Services:** aquisição, credibilidade, serviços, prova de qualidade e conversão.

Não misturar os dois produtos apenas para economizar desenvolvimento.

## Próxima etapa de design

Antes de escrever código de redesign:

1. concluir o levantamento funcional;
2. fechar prioridades dos usuários;
3. propor **3 direções criativas realmente diferentes**;
4. escolher uma;
5. construir arquitetura de informação e fluxos;
6. definir design system;
7. só então implementar.

Este documento deve ser atualizado quando a direção visual final for aprovada.
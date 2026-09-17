# PINT SERVICES — CHECKPOINT 17/09/2026

> Documento de continuidade do projeto. Não registrar aqui dados pessoais de clientes, placas reais, telefones privados, senhas, tokens, connection strings ou valores comerciais confidenciais.

## 1. Estado geral

O projeto possui hoje duas frentes complementares:

1. **Sistema da Pint / PintService** — operação interna da oficina.
2. **Site institucional Pint Services** — frente pública/comercial, separada do sistema interno.

Repositório atual: `leleca7/PintService`.
Deploy atual do sistema: projeto Vercel `oficina-ia-demo`.
Banco operacional: Neon Postgres.

## 2. Arquitetura operacional consolidada

A regra principal continua sendo:

> A equipe atualiza a operação. O sistema usa essa atualização para organizar fila, capacidade, produção, peças, histórico e automações.

Planilhas/CSV permanecem apenas como transição, importação ou contingência. O banco do sistema é a fonte operacional preferida.

## 3. Etapa 1 — núcleo operacional de veículos

Concluída e publicada no `main`.

Principais entregas:
- campos operacionais em `veiculos`;
- responsável, prioridade, previsão e saída real;
- histórico em `historico_veiculos`;
- Modo Operação;
- atualização operacional com permissões e auditoria;
- fases de produção normalizadas.

Merge de referência: `18ab8c72b6a5a076839a644456751c9819e54cda`.

## 4. Etapa 2 — capacidade por fase

Concluída e publicada no `main`.

Regras:
- capacidade inicial: 5 veículos por fase;
- capacidade editável;
- calendário corrido;
- atraso e sobrecarga apenas sinalizam impacto;
- o sistema nunca altera datas automaticamente;
- status operacional: OK / No Limite / Acima da Capacidade;
- possibilidade de sinalizar fila travada quando atraso e sobrecarga coexistem.

Tabela: `capacidade_fases`.

Merge de referência: `8c74eaf63e8052da50d6d3d32fcc9ddbbce41152`.

## 5. Etapa 3 — Fila de Entrada e Agenda

Concluída e publicada no `main`.

Regras:
- ordem padrão pela data de autorização;
- prioridade manual pode antecipar veículo;
- entrada operacional ocorre pela Desmontagem;
- `Pode entrar hoje?` usa vagas reais da Desmontagem;
- data sugerida usa liberações previstas da Desmontagem;
- se não houver previsão suficiente, o sistema não inventa data;
- data de entrada combinada alimenta a Agenda;
- entrada física só ocorre por ação manual `Registrar entrada`.

Tabela: `fila_entrada`.

Rotas:
- `/operacao/fila`
- `/operacao/agenda`

Merge de referência: `04fe49a21f77a353dcce51b5495d898cd643ca35`.

## 6. Etapa 4 — controle nativo de peças

Concluída e publicada no `main`.

Tabelas:
- `controle_pecas`;
- `pedidos_pecas`;
- `itens_pedido_pecas`.

Regras:
- vínculo principal por placa;
- múltiplos pedidos e fornecedores;
- itens e quantidades por pedido;
- status automático: `Sem Pedido`, `Nenhuma Recebida`, `Parcial`, `Completo`;
- contador `recebidas/total`;
- peças parciais não bloqueiam obrigatoriamente a entrada;
- `Liberado para entrada` é decisão humana e independente do status automático;
- registrar entrada exige liberação humana, não exige 100% das peças.

Rota: `/operacao/pecas`.

Merge de referência: `418625b04c6854e09185a01c2a5dffb5d08b4d1b`.

## 7. Fases de produção

Sequência de referência:

1. Desmontagem
2. Funilaria
3. Prep. Pintura
4. Pintura
5. Polimento de Pint.
6. Montagem
7. Lavagem/Acabamento

A Desmontagem é o gargalo usado para planejamento de entrada.

## 8. Identidade visual congelada em 17/09/2026

O laranja deixou de fazer parte da identidade decorativa do sistema.

Paleta de trabalho derivada da marca fornecida:
- dourado Pint Services: `#BD9558`;
- preto: `#000000`;
- grafite: `#111315` / `#1C1C1C`;
- branco: `#FFFFFF`;
- cinzas neutros para suporte.

Cores semânticas podem existir:
- verde: OK, concluído, disponível;
- vermelho: erro, urgência, sobrecarga crítica;
- dourado: atenção, espera, parcial, seleção e destaque de marca.

Não reintroduzir laranja como cor institucional em novas telas.

PR de referência: #44.
Merge: `3116026aa4eae3c319f7f31830f223a9cafa0f9e`.

## 9. Domínio e estratégia do site

Domínio informado: `pintservices.com.br`.

Estrutura planejada caso o cliente aprove o novo site:
- `pintservices.com.br` → site institucional público;
- `app.pintservices.com.br` ou `sistema.pintservices.com.br` → sistema interno.

Não alterar DNS antes de confirmar:
- registrador do domínio;
- zona DNS atual;
- registros de e-mail (MX/SPF/DKIM/DMARC);
- serviços existentes ligados ao domínio.

Não é necessário comprar outro domínio para separar site e sistema: subdomínios podem usar o mesmo domínio principal.

## 10. Landing page institucional

Em 17/09/2026 foi iniciada uma landing page pública de demonstração para a Pint Services.

Objetivo comercial:
- ter o site pronto antes da aprovação/compra;
- permitir apresentação visual ao cliente;
- evitar interferência no sistema interno;
- facilitar publicação posterior no domínio oficial.

Direção de arte:
- premium e automotiva;
- fundo preto/grafite;
- dourado `#BD9558`;
- branco e cinza;
- composição limpa;
- sem laranja;
- tipografia forte e editorial;
- responsiva.

Conteúdo inicial previsto:
- posicionamento da Pint Services;
- funilaria e pintura;
- recuperação e acabamento automotivo;
- martelinho de ouro;
- pintura de rodas;
- polimento e higienização;
- processo de atendimento;
- atendimento a seguradoras e particulares;
- presença em Lauro de Freitas, Bahia;
- CTA para avaliação/contato.

Dados que devem ser confirmados antes da publicação definitiva:
- telefone/WhatsApp oficial;
- endereço completo;
- horário de funcionamento;
- Instagram oficial;
- e-mail comercial;
- fotos autorizadas da estrutura e dos serviços;
- marcas, certificações e seguradoras que podem ser exibidas publicamente.

## 11. Próximas decisões recomendadas

Para o sistema:
- revisão fina da nomenclatura `Prep. Pintura` em todos os pontos legados;
- validação operacional com usuários reais;
- integração progressiva das fontes externas restantes;
- revisão de deploy e observabilidade em produção.

Para o site:
- concluir landing de preview;
- validar conteúdo com o cliente;
- inserir fotos reais;
- conectar WhatsApp/Maps/Instagram;
- só então preparar apontamento de domínio e publicação definitiva.

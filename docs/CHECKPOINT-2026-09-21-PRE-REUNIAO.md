# CHECKPOINT — PRÉ-REUNIÃO PINT SERVICES — 21/09/2026

## 1. Estado executivo

O **Sistema da Pint** está com o core ativo em produção:

- Neon Postgres: **ativo**
- Neon Auth: **ativo**
- OpenAI: **configurado**
- dados oficiais da oficina: **configurados**
- fonte oficial da operação: **banco nativo do Sistema da Pint**
- fonte externa Google Sheets/CSV: **opcional / contingência**, não bloqueia o core

URL atual:
`https://oficina-ia-demo.vercel.app`

Projeto Vercel:
`oficina-ia-demo`

Banco Neon:
`PintService`

## 2. Atualizações realizadas em 21/09

### Funcionários — foto/avatar

Foi implementado suporte real a foto no cadastro de funcionários:

- novo campo `funcionarios.foto_data_url`;
- upload JPG, PNG ou WEBP;
- limite de 700 KB por avatar;
- criação e edição aceitam foto;
- edição permite remover foto;
- listagem usa a foto quando existir e mantém iniciais como fallback;
- alteração versionada em `docs/migrations/2026-09-21-foto-funcionarios.sql`.

Esse armazenamento é propositalmente limitado a **avatar pequeno da equipe**. Fotos grandes de veículos e evidências devem continuar em fluxo de mídia próprio.

### Health / Configurações

O health foi alinhado à arquitetura atual:

- não considera mais `VEHICLE_DATA_URL` requisito obrigatório;
- informa que o banco nativo é a fonte operacional;
- passou a expor também estado de WABA, Zeta, Inbox de e-mail, Inbox do site, alertas internos e template operacional;
- mantém integrações externas separadas do core.

### WhatsApp — aprendizados incorporados

A ativação foi atualizada com o fluxo já validado em outro ambiente:

- testar primeiro com número de teste da Meta;
- cadastrar destinatário autorizado;
- assinar `messages`;
- verificar inscrição da WABA no app via `/{WABA_ID}/subscribed_apps`;
- diagnosticar `#131030` como destinatário fora da lista de teste;
- tratar `Authentication Error` como provável token expirado/inválido;
- normalizar celulares brasileiros com/sem nono dígito;
- trocar token temporário por credencial adequada antes do go-live;
- não migrar o número oficial antes do teste ponta a ponta.

A tela Configurações agora consulta também o estado da inscrição da WABA no app.

## 3. Estado real das conexões

Último health público verificado em 21/09 antes destas melhorias de diagnóstico:

### Ativos

- Database / Neon: **SIM**
- Auth / Neon Auth: **SIM**
- OpenAI: **SIM**
- Dados da oficina: **SIM**

### Ainda não conectados

- WhatsApp Cloud API: **NÃO**
- Instagram profissional: **NÃO**
- Google Business Profile: **NÃO**
- Reclame Aqui API: **NÃO**
- Blinko: **NÃO**

### Conexões adicionais previstas no código

- Zeta somente leitura;
- Inbox de e-mail;
- Inbox do site;
- alertas internos por WhatsApp;
- templates de atualização operacional.

Essas conexões devem ser ativadas somente quando houver necessidade operacional real.

## 4. Estado dos dados no Neon

Leitura feita em 21/09:

- funcionários cadastrados: **0**
- usuários do sistema: **1**
- veículos: **1**
- clientes: **1**
- tarefas operacionais: **0**
- conversas: **0**
- pendências: **0**
- itens no controle de peças: **0**

Conclusão: a infraestrutura existe, mas a base ainda está praticamente vazia. A reunião deve fechar quem será cadastrado, quais veículos/dados entram primeiro e quem atualiza cada informação.

## 5. Ordem recomendada para continuidade

### Prioridade A — fechar operação real

1. Cadastrar equipe real e setores.
2. Definir perfis de acesso: Administrador, Gerente e Funcionário.
3. Validar o Modo Operação com a rotina real da oficina.
4. Confirmar campos de veículo, fases, responsáveis e prazo.
5. Alimentar alguns veículos reais controlados para teste.
6. Validar tarefas, auditoria e atualização por funcionário.

### Prioridade B — WhatsApp em teste

1. Criar/configurar app Meta.
2. Usar número de teste da Meta.
3. Autorizar somente telefones de teste.
4. Configurar credenciais na Vercel.
5. Configurar webhook `/api/whatsapp`.
6. Confirmar `messages` e WABA inscrita no app.
7. Testar entrada → Neon → regras/IA → saída.
8. Testar texto ruim, áudio, mídia e falhas.
9. Fechar gates de recuperação/idempotência.
10. Somente depois decidir o número oficial.

### Prioridade C — canais de reputação

1. Instagram profissional.
2. Google Business Profile.
3. Reclame Aqui somente se houver API/contrato.

Manter `REPUTATION_LIVE_WRITES_ENABLED=false` até cada canal estar validado.

### Prioridade D — integrações secundárias

Depois do core funcionar na rotina:

- Zeta;
- Inbox e-mail/site;
- Blinko;
- automações proativas;
- fonte externa de veículos, apenas se ainda gerar valor.

## 6. Gates técnicos que continuam abertos

Issues relevantes antes do go-live real:

- #35 — retry recuperável de webhook após falha parcial;
- #38 — entrega externa recuperável após conclusão de tarefa;
- #36 — revalidar alvo canônico de resposta de reputação no servidor.

PRs técnicos ainda abertos:

- #39 — gates de entrega e reputação;
- #30 — robustez da carteira/ficha de veículos.

Esses itens devem ser revisados antes de ativar WhatsApp oficial e escritas externas.

## 7. Site público

Há múltiplas branches/PRs de evolução visual ainda abertas:

- #55 — refino conforme feedback visual da Pint;
- #48 — landing imersiva;
- #46 — segunda linha da landing imersiva.

Não mesclar todas em sequência. Para a reunião, escolher **uma única direção visual** como base e encerrar/arquivar as alternativas que perderem.

## 8. Decisões que a reunião precisa fechar

Para sair da reunião com execução clara:

1. Quem serão os usuários reais e qual perfil de cada um?
2. Quais funcionários entram no sistema e quais setores?
3. Qual é o fluxo real de atualização de um veículo do início à entrega?
4. Quais informações o funcionário precisa editar no celular em poucos segundos?
5. Quem pode confirmar prazo, peça e informação física?
6. O WhatsApp será inicialmente só organizador/triagem ou também responderá clientes?
7. Qual telefone será usado para o ambiente de teste Meta?
8. Qual direção do site público será aprovada?
9. Instagram/Google entram já na primeira fase ou depois do operacional?
10. Qual é a data-alvo para teste assistido com a equipe?

## 9. Princípio de implantação

> Primeiro fazer a operação real funcionar com pouca fricção. Depois conectar os canais.

Evitar colocar WhatsApp, Instagram, Google, Reclame Aqui, Zeta e automações simultaneamente antes de a equipe estar atualizando os dados corretamente no Sistema da Pint.

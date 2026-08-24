# PintService

Sistema de atendimento e operação para funilaria e pintura, com painel web, simulador e backend preparado para WhatsApp + IA.

## Publicar na Vercel agora

O projeto está pronto para ser importado diretamente na Vercel. O Next.js fica na raiz do repositório, então não é necessário escolher uma subpasta como Root Directory.

1. Na Vercel, escolha **Add New → Project**.
2. Importe o repositório **leleca7/PintService**.
3. Framework: **Next.js** (detecção automática).
4. Root Directory: deixe na raiz (`./`).
5. Pode clicar em **Deploy sem adicionar variáveis de ambiente**.

Sem banco configurado, o site funciona em **modo demonstração** com dados de exemplo. Isso permite publicar e testar a interface agora.

## Páginas

- `/` — visão geral da operação
- `/veiculos` — veículos
- `/veiculos/[id]` — ficha do veículo
- `/tarefas` — fila operacional
- `/atendimento` — central de atendimento
- `/funcionarios` — equipe
- `/configuracoes` — status das integrações
- `/simulador` — simulação sem gastar API
- `/api/health` — status técnico

## Integrações futuras

O painel não exige Supabase para ser publicado. A pasta `supabase/` guarda o esquema para uso futuro. O fluxo real de WhatsApp + IA precisa de persistência de clientes, veículos, conversas e tarefas antes de ser ativado.

As variáveis possíveis estão documentadas em `.env.example`. Nunca coloque chaves reais no GitHub; cadastre-as nas Environment Variables da Vercel.

## Segurança operacional

A IA não deve inventar preço, prazo ou fatos físicos. Confirmações sobre etapa real do veículo, chegada de peça e evidências dependem de informação registrada ou confirmação humana. Fotos não são interpretadas como confirmação automática de etapa/peça/status.

## Validação

Cada novo commit na `main` roda um build automático do Next.js pelo GitHub Actions.

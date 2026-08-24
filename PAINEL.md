# Painel PintService

O painel usa `lib/dashboard-data.ts` como camada única de leitura.

## Modos

- `demo`: padrão atual. Não exige banco e usa exemplos identificados como demonstração.
- `live`: entra automaticamente quando as variáveis do Supabase forem configuradas no futuro e a leitura funcionar.
- `error`: banco configurado, porém leitura falhou; o painel mostra erro em vez de substituir silenciosamente por dados fictícios.

A escrita pelo painel permanece bloqueada até existir autenticação/RBAC. O simulador funciona sem OpenAI, WhatsApp ou banco.

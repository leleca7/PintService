-- PintService — fila recuperável de eventos do WhatsApp
-- Preparada para aplicação controlada no Neon antes de ativar o webhook real.
-- Não contém credenciais nem dados de clientes.

ALTER TABLE public.eventos_whatsapp ADD COLUMN IF NOT EXISTS mensagem jsonb;
ALTER TABLE public.eventos_whatsapp ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'recebido';
ALTER TABLE public.eventos_whatsapp ADD COLUMN IF NOT EXISTS tentativas integer NOT NULL DEFAULT 0;
ALTER TABLE public.eventos_whatsapp ADD COLUMN IF NOT EXISTS processando_em timestamptz;
ALTER TABLE public.eventos_whatsapp ADD COLUMN IF NOT EXISTS concluido_em timestamptz;
ALTER TABLE public.eventos_whatsapp ADD COLUMN IF NOT EXISTS ultimo_erro text;

-- Registros anteriores à fila recuperável são históricos concluídos.
UPDATE public.eventos_whatsapp
SET status = 'concluido',
    concluido_em = COALESCE(concluido_em, recebido_em),
    tentativas = GREATEST(tentativas, 1)
WHERE status = 'recebido'
  AND mensagem IS NULL;

CREATE INDEX IF NOT EXISTS idx_eventos_whatsapp_recuperacao
ON public.eventos_whatsapp (status, processando_em, recebido_em);

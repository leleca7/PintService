-- Avatar operacional de funcionários.
-- Arquivo pequeno (JPG/PNG/WEBP) armazenado como data URL no Neon.
-- Uso restrito a avatar da equipe; fotos grandes de veículos/mídia continuam em fluxo próprio.

ALTER TABLE public.funcionarios
ADD COLUMN IF NOT EXISTS foto_data_url text;

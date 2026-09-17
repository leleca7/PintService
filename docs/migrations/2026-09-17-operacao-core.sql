ALTER TABLE public.veiculos
  ADD COLUMN IF NOT EXISTS seguradora text,
  ADD COLUMN IF NOT EXISTS data_entrada date,
  ADD COLUMN IF NOT EXISTS previsao_saida date,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prioridade integer,
  ADD COLUMN IF NOT EXISTS observacao_atendimento text,
  ADD COLUMN IF NOT EXISTS data_saida_real date;

CREATE INDEX IF NOT EXISTS idx_veiculos_setor_previsao
  ON public.veiculos (setor, previsao_saida);

CREATE INDEX IF NOT EXISTS idx_veiculos_responsavel
  ON public.veiculos (responsavel_id);

CREATE TABLE IF NOT EXISTS public.historico_veiculos (
  id bigserial PRIMARY KEY,
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  usuario_app_id uuid REFERENCES public.usuarios_app(id) ON DELETE SET NULL,
  evento text NOT NULL,
  dados_anteriores jsonb NOT NULL DEFAULT '{}'::jsonb,
  dados_novos jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historico_veiculos_veiculo_data
  ON public.historico_veiculos (veiculo_id, criado_em DESC);

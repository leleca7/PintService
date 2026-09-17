CREATE TABLE IF NOT EXISTS public.capacidade_fases (
  fase text PRIMARY KEY,
  capacidade_maxima integer NOT NULL DEFAULT 5 CHECK (capacidade_maxima >= 0),
  ordem smallint NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.capacidade_fases (fase, capacidade_maxima, ordem)
VALUES
  ('Desmontagem', 5, 1),
  ('Funilaria', 5, 2),
  ('Prep. Pintura', 5, 3),
  ('Pintura', 5, 4),
  ('Polimento de Pint.', 5, 5),
  ('Montagem', 5, 6),
  ('Lavagem/Acabamento', 5, 7)
ON CONFLICT (fase) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_capacidade_fases_ordem
  ON public.capacidade_fases (ordem);

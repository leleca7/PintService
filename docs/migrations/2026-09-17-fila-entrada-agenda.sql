CREATE TABLE IF NOT EXISTS public.fila_entrada (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placa text NOT NULL,
  modelo text,
  cliente_nome text,
  telefone text,
  origem text NOT NULL DEFAULT 'Seguradora',
  seguradora text,
  data_autorizacao date NOT NULL,
  prioridade_manual integer CHECK (prioridade_manual IS NULL OR prioridade_manual >= 0),
  status text NOT NULL DEFAULT 'Aguardando',
  data_entrada_combinada date,
  observacoes text,
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE SET NULL,
  criado_por uuid REFERENCES public.usuarios_app(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fila_entrada_status_check CHECK (status IN ('Aguardando','Contato realizado','Confirmado','Movido para Produção','Cancelado'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_fila_entrada_placa_ativa
  ON public.fila_entrada (upper(placa))
  WHERE status NOT IN ('Movido para Produção','Cancelado');

CREATE INDEX IF NOT EXISTS idx_fila_entrada_ordem
  ON public.fila_entrada (prioridade_manual NULLS LAST, data_autorizacao, criado_em);

CREATE INDEX IF NOT EXISTS idx_fila_entrada_agenda
  ON public.fila_entrada (data_entrada_combinada)
  WHERE data_entrada_combinada IS NOT NULL AND status NOT IN ('Movido para Produção','Cancelado');

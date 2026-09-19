ALTER TABLE public.veiculos
  ADD COLUMN IF NOT EXISTS finalizacao_tipo text,
  ADD COLUMN IF NOT EXISTS finalizacao_observacao text,
  ADD COLUMN IF NOT EXISTS finalizado_em timestamptz,
  ADD COLUMN IF NOT EXISTS garantia_servico_ate date,
  ADD COLUMN IF NOT EXISTS garantia_pecas_ate date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'veiculos_finalizacao_tipo_check'
  ) THEN
    ALTER TABLE public.veiculos
      ADD CONSTRAINT veiculos_finalizacao_tipo_check
      CHECK (finalizacao_tipo IS NULL OR finalizacao_tipo IN ('sem_pendencias','com_pendencias'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.configuracao_pos_entrega (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  garantia_servico_meses integer NOT NULL DEFAULT 12 CHECK (garantia_servico_meses > 0),
  garantia_pecas_meses integer NOT NULL DEFAULT 6 CHECK (garantia_pecas_meses > 0),
  link_avaliacao text,
  ativo boolean NOT NULL DEFAULT true,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.configuracao_pos_entrega (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.pendencias_pos_entrega (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  status text NOT NULL DEFAULT 'aberta',
  fornecedor text,
  numero_pedido text,
  previsao date,
  responsavel_id uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  criado_por uuid REFERENCES public.usuarios_app(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  resolvido_em timestamptz,
  CONSTRAINT pendencias_pos_entrega_status_check CHECK (status IN ('aberta','aguardando_peca','aguardando_agendamento','resolvida','cancelada'))
);

CREATE INDEX IF NOT EXISTS idx_pendencias_pos_entrega_veiculo_status
  ON public.pendencias_pos_entrega (veiculo_id, status, criado_em DESC);

CREATE TABLE IF NOT EXISTS public.fluxos_pos_entrega (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL UNIQUE REFERENCES public.veiculos(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  telefone text NOT NULL,
  tipo_finalizacao text NOT NULL,
  pendencia_id uuid REFERENCES public.pendencias_pos_entrega(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'aguardando_envio',
  feedback text,
  feedback_sentimento text,
  mensagem_inicial_em timestamptz,
  avaliacao_enviada_em timestamptz,
  encerrado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fluxos_pos_entrega_tipo_check CHECK (tipo_finalizacao IN ('sem_pendencias','com_pendencias')),
  CONSTRAINT fluxos_pos_entrega_status_check CHECK (status IN ('aguardando_envio','aguardando_satisfacao','feedback_neutro','avaliacao_enviada','atendimento_humano','encerrado','erro_envio'))
);

CREATE INDEX IF NOT EXISTS idx_fluxos_pos_entrega_cliente_status
  ON public.fluxos_pos_entrega (cliente_id, status, atualizado_em DESC);

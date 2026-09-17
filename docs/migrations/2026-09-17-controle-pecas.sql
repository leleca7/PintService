CREATE TABLE IF NOT EXISTS public.controle_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placa text NOT NULL,
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE SET NULL,
  fila_entrada_id uuid REFERENCES public.fila_entrada(id) ON DELETE SET NULL,
  liberado_entrada boolean NOT NULL DEFAULT false,
  observacao_liberacao text,
  encerrado_em timestamptz,
  criado_por uuid REFERENCES public.usuarios_app(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_controle_pecas_placa_ativo
  ON public.controle_pecas (upper(placa))
  WHERE encerrado_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_controle_pecas_fila ON public.controle_pecas (fila_entrada_id);
CREATE INDEX IF NOT EXISTS idx_controle_pecas_veiculo ON public.controle_pecas (veiculo_id);

CREATE TABLE IF NOT EXISTS public.pedidos_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  controle_pecas_id uuid NOT NULL REFERENCES public.controle_pecas(id) ON DELETE CASCADE,
  fornecedor text,
  numero_pedido text,
  data_pedido date NOT NULL DEFAULT CURRENT_DATE,
  previsao_entrega date,
  status text NOT NULL DEFAULT 'Aberto',
  observacoes text,
  criado_por uuid REFERENCES public.usuarios_app(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pedidos_pecas_status_check CHECK (status IN ('Aberto','Concluído','Cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_pedidos_pecas_controle ON public.pedidos_pecas (controle_pecas_id, data_pedido DESC);

CREATE TABLE IF NOT EXISTS public.itens_pedido_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos_pecas(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  codigo text,
  quantidade integer NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  quantidade_recebida integer NOT NULL DEFAULT 0 CHECK (quantidade_recebida >= 0 AND quantidade_recebida <= quantidade),
  ultimo_recebimento_em date,
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itens_pedido_pecas_pedido ON public.itens_pedido_pecas (pedido_id);

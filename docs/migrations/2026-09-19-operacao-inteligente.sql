ALTER TABLE public.veiculos
  ADD COLUMN IF NOT EXISTS etapa_iniciada_em timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_parada text,
  ADD COLUMN IF NOT EXISTS motivo_parada_detalhe text,
  ADD COLUMN IF NOT EXISTS qr_token text,
  ADD COLUMN IF NOT EXISTS checkin_realizado_em timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_media_id text,
  ADD COLUMN IF NOT EXISTS previsao_ia date,
  ADD COLUMN IF NOT EXISTS previsao_ia_confianca numeric(4,3),
  ADD COLUMN IF NOT EXISTS previsao_ia_atualizada_em timestamptz,
  ADD COLUMN IF NOT EXISTS zeta_referencia text,
  ADD COLUMN IF NOT EXISTS zeta_ultima_sincronizacao timestamptz;

UPDATE public.veiculos
SET etapa_iniciada_em = COALESCE(etapa_iniciada_em, ultima_atualizacao, criado_em, now()),
    qr_token = COALESCE(qr_token, replace(gen_random_uuid()::text, '-', ''));

CREATE UNIQUE INDEX IF NOT EXISTS uq_veiculos_qr_token
  ON public.veiculos (qr_token)
  WHERE qr_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_veiculos_etapa_iniciada
  ON public.veiculos (setor, etapa_iniciada_em)
  WHERE data_saida_real IS NULL;

ALTER TABLE public.conversas
  ADD COLUMN IF NOT EXISTS canal text NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS identificador_externo text;

ALTER TABLE public.conversas
  DROP CONSTRAINT IF EXISTS conversas_canal_check;

ALTER TABLE public.conversas
  ADD CONSTRAINT conversas_canal_check
  CHECK (canal IN ('whatsapp','instagram','email','site','interno'));

CREATE INDEX IF NOT EXISTS idx_conversas_canal_data
  ON public.conversas (canal, criado_em DESC);

ALTER TABLE public.pedidos_pecas
  ADD COLUMN IF NOT EXISTS ultima_cobranca_em timestamptz,
  ADD COLUMN IF NOT EXISTS cobranca_status text,
  ADD COLUMN IF NOT EXISTS cobranca_mensagem text;

CREATE TABLE IF NOT EXISTS public.configuracao_tempo_etapas (
  fase text PRIMARY KEY,
  horas_alerta integer NOT NULL CHECK (horas_alerta > 0),
  horas_critico integer NOT NULL CHECK (horas_critico >= horas_alerta),
  ativo boolean NOT NULL DEFAULT true,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.configuracao_tempo_etapas (fase, horas_alerta, horas_critico)
VALUES
  ('Desmontagem', 24, 48),
  ('Funilaria', 72, 120),
  ('Prep. de Pintura', 48, 72),
  ('Pintura', 48, 72),
  ('Polimento de Pint.', 24, 48),
  ('Montagem', 48, 72),
  ('Lavagem/Acabamento', 24, 36)
ON CONFLICT (fase) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.alertas_operacionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE CASCADE,
  pedido_pecas_id uuid REFERENCES public.pedidos_pecas(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  chave_dedupe text NOT NULL,
  nivel text NOT NULL DEFAULT 'atencao',
  titulo text NOT NULL,
  mensagem text NOT NULL,
  responsavel_id uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'aberto',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  resolvido_em timestamptz,
  CONSTRAINT alertas_operacionais_nivel_check CHECK (nivel IN ('atencao','alto','critico')),
  CONSTRAINT alertas_operacionais_status_check CHECK (status IN ('aberto','em_tratamento','resolvido','ignorado'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_alertas_operacionais_ativos
  ON public.alertas_operacionais (chave_dedupe)
  WHERE status IN ('aberto','em_tratamento');

CREATE INDEX IF NOT EXISTS idx_alertas_operacionais_fila
  ON public.alertas_operacionais (status, nivel, criado_em);

CREATE TABLE IF NOT EXISTS public.checklists_qualidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente',
  itens jsonb NOT NULL DEFAULT '{}'::jsonb,
  observacoes text,
  concluido_por uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  concluido_em timestamptz,
  CONSTRAINT checklists_qualidade_status_check CHECK (status IN ('pendente','em_revisao','aprovado','reprovado'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_checklist_qualidade_aberto
  ON public.checklists_qualidade (veiculo_id)
  WHERE status IN ('pendente','em_revisao','aprovado');

CREATE TABLE IF NOT EXISTS public.comunicacoes_operacionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  evento text NOT NULL,
  chave_dedupe text NOT NULL UNIQUE,
  canal text NOT NULL DEFAULT 'whatsapp',
  mensagem text,
  status text NOT NULL DEFAULT 'preparada',
  erro text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  enviado_em timestamptz,
  CONSTRAINT comunicacoes_operacionais_status_check CHECK (status IN ('preparada','enviada','ignorada','erro'))
);

CREATE INDEX IF NOT EXISTS idx_comunicacoes_operacionais_veiculo
  ON public.comunicacoes_operacionais (veiculo_id, criado_em DESC);

CREATE TABLE IF NOT EXISTS public.fornecedores_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_fornecedores_contatos_nome
  ON public.fornecedores_contatos (lower(nome));

CREATE TABLE IF NOT EXISTS public.zeta_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE SET NULL,
  placa text NOT NULL,
  referencia_zeta text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  divergencias jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'sincronizado',
  sincronizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT zeta_snapshots_status_check CHECK (status IN ('sincronizado','divergente','nao_encontrado','erro'))
);

CREATE INDEX IF NOT EXISTS idx_zeta_snapshots_placa_data
  ON public.zeta_snapshots (upper(placa), sincronizado_em DESC);

CREATE TABLE IF NOT EXISTS public.previsoes_operacionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  previsao date,
  confianca numeric(4,3),
  metodo text NOT NULL DEFAULT 'regras_operacionais',
  explicacao text,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_previsoes_operacionais_veiculo
  ON public.previsoes_operacionais (veiculo_id, criado_em DESC);

CREATE TABLE IF NOT EXISTS public.inbox_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal text NOT NULL,
  identificador_externo text,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE SET NULL,
  autor text,
  mensagem text NOT NULL,
  prioridade text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'novo',
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inbox_eventos_canal_check CHECK (canal IN ('whatsapp','instagram','email','site')),
  CONSTRAINT inbox_eventos_status_check CHECK (status IN ('novo','triado','em_atendimento','resolvido')),
  CONSTRAINT inbox_eventos_prioridade_check CHECK (prioridade IN ('baixa','normal','alta','urgente'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inbox_eventos_externo
  ON public.inbox_eventos (canal, identificador_externo)
  WHERE identificador_externo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inbox_eventos_fila
  ON public.inbox_eventos (status, prioridade, criado_em DESC);

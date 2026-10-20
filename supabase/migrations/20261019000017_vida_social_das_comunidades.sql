-- =============================================================================
-- 20261019000017 — Vida social das comunidades (fundação de dados)
-- ADR 0012 / Cartão 0026. Aditiva: não altera tabelas/RPCs legadas.
-- A UI só poderá consumir estes objetos depois da aplicação confirmada.
-- =============================================================================
SET LOCAL lock_timeout = '5s';

CREATE TABLE public.votos_conversa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topico_id uuid REFERENCES public.topicos(id) ON DELETE CASCADE,
  resposta_id uuid REFERENCES public.respostas(id) ON DELETE CASCADE,
  valor smallint NOT NULL CHECK (valor IN (-1, 1)),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT votos_conversa_um_alvo CHECK (num_nonnulls(topico_id, resposta_id) = 1)
);
CREATE UNIQUE INDEX votos_conversa_topico_por_usuario ON public.votos_conversa (usuario_id, topico_id) WHERE topico_id IS NOT NULL;
CREATE UNIQUE INDEX votos_conversa_resposta_por_usuario ON public.votos_conversa (usuario_id, resposta_id) WHERE resposta_id IS NOT NULL;
CREATE INDEX votos_conversa_topico_por_alvo ON public.votos_conversa (topico_id) WHERE topico_id IS NOT NULL;
CREATE INDEX votos_conversa_resposta_por_alvo ON public.votos_conversa (resposta_id) WHERE resposta_id IS NOT NULL;

CREATE TABLE public.itens_salvos_conversa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topico_id uuid REFERENCES public.topicos(id) ON DELETE CASCADE,
  resposta_id uuid REFERENCES public.respostas(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT itens_salvos_conversa_um_alvo CHECK (num_nonnulls(topico_id, resposta_id) = 1)
);
CREATE UNIQUE INDEX itens_salvos_conversa_topico_por_usuario ON public.itens_salvos_conversa (usuario_id, topico_id) WHERE topico_id IS NOT NULL;
CREATE UNIQUE INDEX itens_salvos_conversa_resposta_por_usuario ON public.itens_salvos_conversa (usuario_id, resposta_id) WHERE resposta_id IS NOT NULL;

CREATE TABLE public.papeis_comunidade (
  comunidade_id uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  papel text NOT NULL CHECK (papel IN ('fundador', 'moderador')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comunidade_id, usuario_id, papel)
);
CREATE TABLE public.regras_comunidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  posicao smallint NOT NULL CHECK (posicao BETWEEN 1 AND 10),
  texto text NOT NULL CHECK (char_length(btrim(texto)) BETWEEN 3 AND 500),
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comunidade_id, posicao)
);
CREATE TABLE public.presencas_comunidade (
  comunidade_id uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expira_em timestamptz NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comunidade_id, usuario_id)
);
CREATE INDEX presencas_comunidade_expiracao ON public.presencas_comunidade (comunidade_id, expira_em);

CREATE TABLE public.notificacoes_sociais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('voto', 'resposta', 'moderacao')),
  topico_id uuid REFERENCES public.topicos(id) ON DELETE CASCADE,
  resposta_id uuid REFERENCES public.respostas(id) ON DELETE CASCADE,
  chave_de_origem text NOT NULL UNIQUE CHECK (char_length(chave_de_origem) BETWEEN 3 AND 200),
  lida_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notificacoes_sociais_sem_autoaviso CHECK (ator_id IS NULL OR ator_id <> destinatario_id)
);
CREATE INDEX notificacoes_sociais_caixa_entrada ON public.notificacoes_sociais (destinatario_id, criado_em DESC, id DESC);

CREATE TABLE public.acoes_moderacao_conversa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  ator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  topico_id uuid REFERENCES public.topicos(id) ON DELETE CASCADE,
  resposta_id uuid REFERENCES public.respostas(id) ON DELETE CASCADE,
  acao text NOT NULL CHECK (acao IN ('fechar','reabrir','fixar','desfixar','ocultar','restaurar')),
  motivo text CHECK (motivo IS NULL OR char_length(btrim(motivo)) BETWEEN 3 AND 500),
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT acoes_moderacao_conversa_um_alvo CHECK (num_nonnulls(topico_id, resposta_id) = 1)
);
CREATE INDEX acoes_moderacao_conversa_por_alvo ON public.acoes_moderacao_conversa (comunidade_id, criado_em DESC);

ALTER TABLE public.votos_conversa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_salvos_conversa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papeis_comunidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_comunidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas_comunidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_sociais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acoes_moderacao_conversa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.votos_conversa, public.itens_salvos_conversa, public.papeis_comunidade,
  public.regras_comunidade, public.presencas_comunidade, public.notificacoes_sociais,
  public.acoes_moderacao_conversa FROM PUBLIC, anon, authenticated;

-- As RPCs vêm na migração seguinte após a revisão SQL/RLS desta fundação.

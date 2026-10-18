-- =============================================================================
-- 20261018000002 — Contrato do feed de causos (Auê 3.0)
--
-- POR QUE EXISTE (auditoria de 18/10/2026)
--   O adaptador do feed lia `resultados` direto, com nomes de coluna anteriores
--   à 036 e depois da 034 ter fechado a leitura. A denúncia gravava colunas que
--   não existem. Reação com emoji nunca ia ao banco. Esta migração dá ao feed
--   o contrato que faltava, no mesmo formato das outras RPCs (SECURITY DEFINER,
--   user_id sempre de auth.uid()).
--
-- O QUE FAZ
--   1. posts_comunidade: esconder por denúncia + consentimento gravado.
--   2. Só publica áudio de resultado que é seu, e só com consentimento.
--   3. denuncias passa a aceitar alvo = post.
--   4. reacoes aceita os tipos do feed; uma linha por (post, pessoa, tipo).
--   5. RPCs: listar_feed_de_causos, alternar_reacao_do_causo.
--
-- NÃO VALIDADO: sem Postgres neste ambiente. Revisão por leitura apenas.
-- Aplicar à mão no SQL Editor, como as demais (docs/technical/banco-sem-consumidor.md).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. posts_comunidade: esconder e consentir
-- -----------------------------------------------------------------------------

ALTER TABLE public.posts_comunidade
  ADD COLUMN IF NOT EXISTS esta_escondido boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consentimento_audio_publico boolean NOT NULL DEFAULT false;

-- Predicado SECURITY DEFINER: `resultados` não tem policy de SELECT (034), então
-- a policy de INSERT do post não consegue consultá-la sozinha.
CREATE OR REPLACE FUNCTION public.aue_resultado_e_meu(p_resultado_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.resultados r
     WHERE r.id = p_resultado_id
       AND r.usuario_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.aue_resultado_e_meu(uuid) TO authenticated;

DROP POLICY IF EXISTS "Community posts are viewable by everyone" ON public.posts_comunidade;
CREATE POLICY "Causos visiveis, ou meus"
ON public.posts_comunidade FOR SELECT TO public
USING (esta_escondido = false OR user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts_comunidade;
CREATE POLICY "Publica causo proprio, com consentimento se tem arroto"
ON public.posts_comunidade FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND esta_escondido = false
  AND (
    result_id IS NULL
    OR (consentimento_audio_publico AND public.aue_resultado_e_meu(result_id))
  )
);


-- -----------------------------------------------------------------------------
-- 2. denuncias: alvo pode ser post
-- -----------------------------------------------------------------------------

ALTER TABLE public.denuncias
  ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES public.posts_comunidade(id) ON DELETE CASCADE;

ALTER TABLE public.denuncias ALTER COLUMN result_id DROP NOT NULL;

ALTER TABLE public.denuncias
  DROP CONSTRAINT IF EXISTS denuncias_alvo_unico,
  ADD CONSTRAINT denuncias_alvo_unico CHECK (num_nonnulls(result_id, post_id) = 1);

CREATE UNIQUE INDEX IF NOT EXISTS denuncias_uma_por_pessoa_por_post
  ON public.denuncias (post_id, user_id)
  WHERE post_id IS NOT NULL;

-- Três pessoas distintas denunciando escondem o post (mesmo limiar do áudio).
CREATE OR REPLACE FUNCTION public.esconder_post_por_denuncias()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_denunciantes integer;
BEGIN
  IF NEW.post_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(DISTINCT user_id) INTO v_denunciantes
    FROM public.denuncias
   WHERE post_id = NEW.post_id
     AND user_id IS NOT NULL;

  IF v_denunciantes >= 3 THEN
    UPDATE public.posts_comunidade SET esta_escondido = true WHERE id = NEW.post_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS esconde_post_por_denuncias ON public.denuncias;
CREATE TRIGGER esconde_post_por_denuncias
  AFTER INSERT ON public.denuncias
  FOR EACH ROW EXECUTE FUNCTION public.esconder_post_por_denuncias();


-- -----------------------------------------------------------------------------
-- 3. reacoes: tipos do feed, uma linha por (post, pessoa, tipo)
-- -----------------------------------------------------------------------------

ALTER TABLE public.reacoes DROP CONSTRAINT IF EXISTS reacoes_reaction_type_check;
ALTER TABLE public.reacoes
  ADD CONSTRAINT reacoes_reaction_type_check
  CHECK (reaction_type IN ('like', 'dislike', 'fogo', 'nojo', 'trofeu', 'repost'));

-- A unicidade antiga (post, pessoa) impedia curtir E reagir com emoji. A nova
-- vale por tipo; a exclusão entre fogo/nojo/trofeu é feita na RPC.
DROP INDEX IF EXISTS public.reacoes_uma_por_pessoa_por_post;
CREATE UNIQUE INDEX IF NOT EXISTS reacoes_uma_por_pessoa_por_post_e_tipo
  ON public.reacoes (post_id, user_id, reaction_type)
  WHERE post_id IS NOT NULL;


-- -----------------------------------------------------------------------------
-- 4. alternar_reacao_do_causo
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.alternar_reacao_do_causo(p_post_id uuid, p_tipo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_removeu integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário precisa estar autenticado' USING ERRCODE = '28000';
  END IF;

  IF p_tipo IS NULL OR p_tipo NOT IN ('like', 'fogo', 'nojo', 'trofeu', 'repost') THEN
    RAISE EXCEPTION 'Tipo de reação inválido: %', p_tipo USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.posts_comunidade WHERE id = p_post_id AND esta_escondido = false
  ) THEN
    RAISE EXCEPTION 'Causo não encontrado' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.reacoes
   WHERE post_id = p_post_id AND user_id = v_user_id AND reaction_type = p_tipo;
  GET DIAGNOSTICS v_removeu = ROW_COUNT;

  IF v_removeu = 0 THEN
    -- fogo, nojo e troféu são excludentes entre si.
    IF p_tipo IN ('fogo', 'nojo', 'trofeu') THEN
      DELETE FROM public.reacoes
       WHERE post_id = p_post_id AND user_id = v_user_id
         AND reaction_type IN ('fogo', 'nojo', 'trofeu');
    END IF;

    INSERT INTO public.reacoes (post_id, user_id, reaction_type)
    VALUES (p_post_id, v_user_id, p_tipo)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'like',   count(*) FILTER (WHERE reaction_type = 'like'),
      'repost', count(*) FILTER (WHERE reaction_type = 'repost'),
      'fogo',   count(*) FILTER (WHERE reaction_type = 'fogo'),
      'nojo',   count(*) FILTER (WHERE reaction_type = 'nojo'),
      'trofeu', count(*) FILTER (WHERE reaction_type = 'trofeu'),
      'minhas', coalesce(
        jsonb_agg(reaction_type) FILTER (WHERE user_id = v_user_id), '[]'::jsonb)
    )
    FROM public.reacoes WHERE post_id = p_post_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.alternar_reacao_do_causo(uuid, text) TO authenticated;


-- -----------------------------------------------------------------------------
-- 5. listar_feed_de_causos
--
-- Nota, duração, origem e caminho do áudio vêm do RESULTADO no servidor — o
-- cliente não afirma nota nenhuma. O caminho do áudio só sai quando o post tem
-- consentimento e o resultado não está escondido nem sem áudio.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.listar_feed_de_causos(
  p_topico text DEFAULT NULL,
  p_limite integer DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  apelido text,
  topico text,
  conteudo text,
  resultado_id uuid,
  nota numeric,
  duracao numeric,
  subtipo_de_origem text,
  caminho_do_audio text,
  criado_em timestamptz,
  total_comentarios bigint,
  curtidas bigint,
  reposts bigint,
  fogo bigint,
  nojo bigint,
  trofeu bigint,
  minhas text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id,
    p.user_id,
    pf.apelido,
    p.topic,
    p.content,
    p.result_id,
    r.nota::numeric,
    r.duracao::numeric,
    r.subtipo_de_origem,
    CASE WHEN p.consentimento_audio_publico AND NOT r.esta_escondido
         THEN r.caminho_do_audio END,
    p.created_at,
    (SELECT count(*) FROM public.comentarios c WHERE c.post_id = p.id),
    (SELECT count(*) FROM public.reacoes x WHERE x.post_id = p.id AND x.reaction_type = 'like'),
    (SELECT count(*) FROM public.reacoes x WHERE x.post_id = p.id AND x.reaction_type = 'repost'),
    (SELECT count(*) FROM public.reacoes x WHERE x.post_id = p.id AND x.reaction_type = 'fogo'),
    (SELECT count(*) FROM public.reacoes x WHERE x.post_id = p.id AND x.reaction_type = 'nojo'),
    (SELECT count(*) FROM public.reacoes x WHERE x.post_id = p.id AND x.reaction_type = 'trofeu'),
    coalesce(
      (SELECT array_agg(x.reaction_type) FROM public.reacoes x
        WHERE x.post_id = p.id AND x.user_id = auth.uid()),
      ARRAY[]::text[])
  FROM public.posts_comunidade p
  LEFT JOIN public.perfis pf ON pf.id = p.user_id
  LEFT JOIN public.resultados r ON r.id = p.result_id
  WHERE p.esta_escondido = false
    AND (p_topico IS NULL OR p.topic = p_topico)
  ORDER BY p.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limite, 30), 100));
$$;

GRANT EXECUTE ON FUNCTION public.listar_feed_de_causos(text, integer) TO anon, authenticated;

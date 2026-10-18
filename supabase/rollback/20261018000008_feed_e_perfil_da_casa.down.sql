-- =============================================================================
-- Rollback da 20261018000008 (feed e perfil enxergam a conta da casa)
--
-- Devolve listar_feed_de_causos ao corpo da 20261018000004 e
-- obter_perfil_publico ao corpo da 20261018000005. Não perde dado.
-- Se a 20261018000007 também será desfeita, rode este arquivo ANTES.
-- =============================================================================

DROP FUNCTION IF EXISTS public.listar_feed_de_causos(text, integer, uuid, uuid, uuid);

CREATE FUNCTION public.listar_feed_de_causos(
  p_topico text DEFAULT NULL,
  p_limite integer DEFAULT 30,
  p_autor_id uuid DEFAULT NULL,
  p_curtidos_por uuid DEFAULT NULL,
  p_post_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  apelido text,
  handle text,
  url_do_avatar text,
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
    pf.handle,
    pf.url_do_avatar,
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
    AND (p_post_id IS NULL OR p.id = p_post_id)
    AND (p_autor_id IS NULL OR p.user_id = p_autor_id)
    AND (p_curtidos_por IS NULL OR EXISTS (
          SELECT 1 FROM public.reacoes x
           WHERE x.post_id = p.id AND x.user_id = p_curtidos_por AND x.reaction_type = 'like'))
  ORDER BY p.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limite, 30), 100));
$$;

GRANT EXECUTE ON FUNCTION public.listar_feed_de_causos(text, integer, uuid, uuid, uuid) TO anon, authenticated;


DROP FUNCTION IF EXISTS public.obter_perfil_publico(text);

CREATE FUNCTION public.obter_perfil_publico(p_handle text)
RETURNS TABLE (
  id uuid,
  handle text,
  apelido text,
  url_do_avatar text,
  bio text,
  cidade text,
  titulo text,
  e_fundador boolean,
  criado_em timestamptz,
  instagram text,
  tiktok text,
  youtube text,
  twitter text,
  total_causos bigint,
  melhor_nota numeric,
  total_seguidores bigint,
  total_seguindo bigint,
  eu_sigo boolean,
  sou_eu boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id,
    p.handle,
    p.apelido,
    p.url_do_avatar,
    p.bio,
    p.cidade,
    p.titulo,
    p.e_fundador,
    p.criado_em,
    p.instagram,
    p.tiktok,
    p.youtube,
    p.twitter,
    (SELECT count(*) FROM public.posts_comunidade c
       WHERE c.user_id = p.id AND c.esta_escondido = false),
    (SELECT max(r.nota)::numeric
       FROM public.posts_comunidade c
       JOIN public.resultados r ON r.id = c.result_id
      WHERE c.user_id = p.id AND c.esta_escondido = false AND r.esta_escondido = false),
    (SELECT count(*) FROM public.seguidores s WHERE s.following_id = p.id),
    (SELECT count(*) FROM public.seguidores s WHERE s.follower_id = p.id),
    EXISTS (SELECT 1 FROM public.seguidores s
             WHERE s.following_id = p.id AND s.follower_id = auth.uid()),
    (p.id = auth.uid())
  FROM public.perfis p
  WHERE lower(p.handle) = lower(regexp_replace(btrim(p_handle), '^@', ''));
$$;

GRANT EXECUTE ON FUNCTION public.obter_perfil_publico(text) TO anon, authenticated;

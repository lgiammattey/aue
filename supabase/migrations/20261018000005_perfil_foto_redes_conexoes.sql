-- =============================================================================
-- 20261018000005 — Perfil: foto, redes sociais e lista de quem segue
--
-- 1. atualizar_meu_perfil ganha foto (URL do bucket `avatars`, só da própria
--    pessoa) e as redes sociais (instagram, tiktok, youtube, twitter).
-- 2. obter_perfil_publico devolve as redes.
-- 3. listar_conexoes_do_perfil: seguidores e seguindo de um perfil.
--
-- NÃO VALIDADO: sem Postgres neste ambiente. Revisão por leitura apenas.
-- Depende da 20261018000004.
-- =============================================================================

DROP FUNCTION IF EXISTS public.atualizar_meu_perfil(text, text, text, text);

CREATE FUNCTION public.atualizar_meu_perfil(
  p_apelido text DEFAULT NULL,
  p_handle text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_cidade text DEFAULT NULL,
  p_url_do_avatar text DEFAULT NULL,
  p_remover_avatar boolean DEFAULT false,
  p_instagram text DEFAULT NULL,
  p_tiktok text DEFAULT NULL,
  p_youtube text DEFAULT NULL,
  p_twitter text DEFAULT NULL
)
RETURNS public.perfis
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid := auth.uid();
  v_handle text;
  v_linha public.perfis;
  v_insta text;
  v_tiktok text;
  v_youtube text;
  v_twitter text;
BEGIN
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Usuário precisa estar autenticado' USING ERRCODE = '28000';
  END IF;

  IF p_apelido IS NOT NULL AND char_length(btrim(p_apelido)) NOT BETWEEN 2 AND 30 THEN
    RAISE EXCEPTION 'Apelido precisa ter de 2 a 30 caracteres' USING ERRCODE = '22023';
  END IF;
  IF p_bio IS NOT NULL AND char_length(p_bio) > 160 THEN
    RAISE EXCEPTION 'Bio passa de 160 caracteres' USING ERRCODE = '22023';
  END IF;
  IF p_cidade IS NOT NULL AND char_length(p_cidade) > 60 THEN
    RAISE EXCEPTION 'Cidade passa de 60 caracteres' USING ERRCODE = '22023';
  END IF;

  IF p_handle IS NOT NULL THEN
    v_handle := lower(regexp_replace(btrim(p_handle), '^@', ''));
    IF v_handle !~ '^[a-z0-9_]{3,20}$' THEN
      RAISE EXCEPTION 'Handle: de 3 a 20 letras minúsculas, números ou _' USING ERRCODE = '22023';
    END IF;
    IF v_handle IN ('aue', 'admin', 'suporte', 'moderacao', 'oficial', 'perfil', 'feed', 'arena') THEN
      RAISE EXCEPTION 'Esse handle é reservado' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- A foto só pode ser um arquivo da PRÓPRIA pasta do bucket público `avatars`.
  IF p_url_do_avatar IS NOT NULL THEN
    IF char_length(p_url_do_avatar) > 500
       OR p_url_do_avatar !~ '^https://'
       OR position('/storage/v1/object/public/avatars/' || v_id::text || '/' IN p_url_do_avatar) = 0 THEN
      RAISE EXCEPTION 'Foto inválida' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- Rede social: "" limpa, NULL não mexe. Aceita com ou sem @.
  IF p_instagram IS NOT NULL THEN v_insta := nullif(regexp_replace(btrim(p_instagram), '^@', ''), ''); END IF;
  IF p_tiktok    IS NOT NULL THEN v_tiktok := nullif(regexp_replace(btrim(p_tiktok), '^@', ''), ''); END IF;
  IF p_youtube   IS NOT NULL THEN v_youtube := nullif(regexp_replace(btrim(p_youtube), '^@', ''), ''); END IF;
  IF p_twitter   IS NOT NULL THEN v_twitter := nullif(regexp_replace(btrim(p_twitter), '^@', ''), ''); END IF;

  IF (v_insta IS NOT NULL AND v_insta !~ '^[A-Za-z0-9._-]{1,30}$')
     OR (v_tiktok IS NOT NULL AND v_tiktok !~ '^[A-Za-z0-9._-]{1,30}$')
     OR (v_youtube IS NOT NULL AND v_youtube !~ '^[A-Za-z0-9._-]{1,30}$')
     OR (v_twitter IS NOT NULL AND v_twitter !~ '^[A-Za-z0-9._-]{1,30}$') THEN
    RAISE EXCEPTION 'Rede social: só o @ da conta, sem link' USING ERRCODE = '22023';
  END IF;

  BEGIN
    UPDATE public.perfis
       SET apelido = COALESCE(btrim(p_apelido), apelido),
           handle  = COALESCE(v_handle, handle),
           bio     = CASE WHEN p_bio IS NULL THEN bio ELSE nullif(btrim(p_bio), '') END,
           cidade  = CASE WHEN p_cidade IS NULL THEN cidade ELSE nullif(btrim(p_cidade), '') END,
           url_do_avatar = CASE WHEN p_remover_avatar THEN NULL
                                WHEN p_url_do_avatar IS NOT NULL THEN p_url_do_avatar
                                ELSE url_do_avatar END,
           instagram = CASE WHEN p_instagram IS NULL THEN instagram ELSE v_insta END,
           tiktok    = CASE WHEN p_tiktok    IS NULL THEN tiktok    ELSE v_tiktok END,
           youtube   = CASE WHEN p_youtube   IS NULL THEN youtube   ELSE v_youtube END,
           twitter   = CASE WHEN p_twitter   IS NULL THEN twitter   ELSE v_twitter END
     WHERE id = v_id
     RETURNING * INTO v_linha;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Esse handle já é de outra pessoa' USING ERRCODE = '23505';
  END;

  RETURN v_linha;
END;
$$;

GRANT EXECUTE ON FUNCTION public.atualizar_meu_perfil(text, text, text, text, text, boolean, text, text, text, text) TO authenticated;


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


CREATE FUNCTION public.listar_conexoes_do_perfil(
  p_handle text,
  p_tipo text,
  p_limite integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  handle text,
  apelido text,
  url_do_avatar text,
  eu_sigo boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_alvo uuid;
BEGIN
  IF p_tipo NOT IN ('seguidores', 'seguindo') THEN
    RAISE EXCEPTION 'Tipo inválido: %', p_tipo USING ERRCODE = '22023';
  END IF;

  SELECT pf.id INTO v_alvo FROM public.perfis pf
   WHERE lower(pf.handle) = lower(regexp_replace(btrim(p_handle), '^@', ''));
  IF v_alvo IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    pf.id,
    pf.handle,
    pf.apelido,
    pf.url_do_avatar,
    EXISTS (SELECT 1 FROM public.seguidores x
             WHERE x.following_id = pf.id AND x.follower_id = auth.uid())
  FROM public.seguidores s
  JOIN public.perfis pf
    ON pf.id = CASE WHEN p_tipo = 'seguidores' THEN s.follower_id ELSE s.following_id END
  WHERE (p_tipo = 'seguidores' AND s.following_id = v_alvo)
     OR (p_tipo = 'seguindo' AND s.follower_id = v_alvo)
  ORDER BY s.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limite, 100), 200));
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_conexoes_do_perfil(text, text, integer) TO anon, authenticated;

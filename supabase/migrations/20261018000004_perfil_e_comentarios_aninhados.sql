-- =============================================================================
-- 20261018000004 — Perfil público de verdade e comentário em níveis
--
-- O QUE FAZ
--   1. perfis ganha `handle` ÚNICO e `cidade`; atualizar_meu_perfil valida e
--      devolve erro legível quando o handle já é de outra pessoa.
--   2. obter_perfil_publico: o que qualquer pessoa pode ver de um perfil.
--      "Melhor nota" vem só de causo PUBLICADO — nota de jogo privado não vaza.
--   3. listar_feed_de_causos ganha filtro por autor e por curtidos, e devolve
--      handle e avatar (substitui a versão da 20261018000002).
--   4. comentários em níveis: `resposta_a_id` + `nivel` (0, 1 ou 2). Responder
--      um nível 2 fica no nível 2, apontando para o comentário respondido.
--
-- NÃO VALIDADO: sem Postgres neste ambiente. Revisão por leitura apenas.
-- Depende da 20261018000002.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. perfis: handle único e cidade
-- -----------------------------------------------------------------------------

ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS handle text,
  ADD COLUMN IF NOT EXISTS cidade text;

-- Gera um handle livre a partir do apelido. Usado no backfill e no gatilho.
CREATE OR REPLACE FUNCTION public.aue_gerar_handle(p_apelido text, p_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_base text;
  v_candidato text;
  v_tentativa integer := 0;
BEGIN
  v_base := lower(translate(
    coalesce(p_apelido, ''),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucaaaaaeeeeiiiiooooouuuuc'
  ));
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '_', 'g');
  v_base := btrim(v_base, '_');
  v_base := left(v_base, 14);
  IF char_length(v_base) < 3 THEN
    v_base := 'arrotador';
  END IF;

  v_candidato := v_base;
  WHILE EXISTS (SELECT 1 FROM public.perfis WHERE lower(handle) = v_candidato AND id <> p_id) LOOP
    v_tentativa := v_tentativa + 1;
    v_candidato := left(v_base, 14) || '_' || substr(md5(p_id::text || v_tentativa::text), 1, 4);
  END LOOP;
  RETURN v_candidato;
END;
$$;

-- Perfil que já existe ganha handle. Um UPDATE por linha, de propósito: num único
-- UPDATE em massa a função não enxerga os handles gerados na mesma instrução, e
-- dois apelidos iguais ("Arrotador a1b2c3" à parte) colidiriam no índice único.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id, apelido FROM public.perfis WHERE handle IS NULL ORDER BY criado_em, id LOOP
    UPDATE public.perfis SET handle = public.aue_gerar_handle(r.apelido, r.id) WHERE id = r.id;
  END LOOP;
END;
$$;

ALTER TABLE public.perfis
  DROP CONSTRAINT IF EXISTS perfis_handle_formato,
  ADD CONSTRAINT perfis_handle_formato CHECK (handle IS NULL OR handle ~ '^[a-z0-9_]{3,20}$');

CREATE UNIQUE INDEX IF NOT EXISTS perfis_handle_unico ON public.perfis (lower(handle));

-- Perfil novo (anônimo ou não) nasce com handle.
CREATE OR REPLACE FUNCTION public.definir_handle_do_perfil()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.handle IS NULL THEN
    NEW.handle := public.aue_gerar_handle(NEW.apelido, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ao_definir_handle_do_perfil ON public.perfis;
CREATE TRIGGER ao_definir_handle_do_perfil
  BEFORE INSERT ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.definir_handle_do_perfil();

-- A policy de UPDATE da própria linha continua (apelido, bio e redes seguem por
-- ela), e a constraint de formato + o índice único valem para qualquer caminho.
-- A RPC abaixo é o caminho com mensagem legível e a lista de handles reservados.

-- -----------------------------------------------------------------------------
-- 2. atualizar_meu_perfil
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.atualizar_meu_perfil(
  p_apelido text DEFAULT NULL,
  p_handle text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_cidade text DEFAULT NULL
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

  BEGIN
    UPDATE public.perfis
       SET apelido = COALESCE(btrim(p_apelido), apelido),
           handle  = COALESCE(v_handle, handle),
           bio     = CASE WHEN p_bio IS NULL THEN bio ELSE nullif(btrim(p_bio), '') END,
           cidade  = CASE WHEN p_cidade IS NULL THEN cidade ELSE nullif(btrim(p_cidade), '') END
     WHERE id = v_id
     RETURNING * INTO v_linha;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Esse handle já é de outra pessoa' USING ERRCODE = '23505';
  END;

  RETURN v_linha;
END;
$$;

GRANT EXECUTE ON FUNCTION public.atualizar_meu_perfil(text, text, text, text) TO authenticated;


-- -----------------------------------------------------------------------------
-- 3. obter_perfil_publico
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.obter_perfil_publico(p_handle text)
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
    (SELECT count(*) FROM public.posts_comunidade c
       WHERE c.user_id = p.id AND c.esta_escondido = false),
    -- Só nota de causo publicado: jogo privado não aparece no perfil dos outros.
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


-- -----------------------------------------------------------------------------
-- 4. listar_feed_de_causos: filtros por autor/curtidos, handle e avatar
-- -----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.listar_feed_de_causos(text, integer);

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


-- -----------------------------------------------------------------------------
-- 5. Comentários em níveis
-- -----------------------------------------------------------------------------

ALTER TABLE public.comentarios
  ADD COLUMN IF NOT EXISTS resposta_a_id uuid REFERENCES public.comentarios(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS nivel smallint NOT NULL DEFAULT 0;

ALTER TABLE public.comentarios
  DROP CONSTRAINT IF EXISTS comentarios_nivel_valido,
  ADD CONSTRAINT comentarios_nivel_valido CHECK (nivel BETWEEN 0 AND 2);

CREATE INDEX IF NOT EXISTS comentarios_por_resposta
  ON public.comentarios (resposta_a_id) WHERE resposta_a_id IS NOT NULL;

DROP FUNCTION IF EXISTS public.listar_comentarios(uuid, uuid);

CREATE FUNCTION public.listar_comentarios(p_post_id uuid DEFAULT NULL, p_result_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  content text,
  created_at timestamptz,
  user_id uuid,
  apelido text,
  avatar_url text,
  resposta_a_id uuid,
  nivel smallint,
  handle text
)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    c.id,
    c.content,
    c.created_at,
    c.user_id,
    p.apelido,
    p.url_do_avatar AS avatar_url,
    c.resposta_a_id,
    c.nivel,
    p.handle
  FROM public.comentarios c
  LEFT JOIN public.perfis p ON p.id = c.user_id
  WHERE (p_post_id   IS NOT NULL AND c.post_id   = p_post_id)
     OR (p_result_id IS NOT NULL AND c.result_id = p_result_id)
  ORDER BY c.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.listar_comentarios(uuid, uuid) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.criar_comentario(text, uuid, uuid);

CREATE FUNCTION public.criar_comentario(
  p_conteudo text,
  p_post_id uuid DEFAULT NULL,
  p_result_id uuid DEFAULT NULL,
  p_resposta_a_id uuid DEFAULT NULL
)
RETURNS public.comentarios
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_conteudo text;
  v_pai public.comentarios;
  v_nivel smallint := 0;
  v_linha public.comentarios;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário precisa estar autenticado' USING ERRCODE = '28000';
  END IF;

  IF num_nonnulls(p_post_id, p_result_id) <> 1 THEN
    RAISE EXCEPTION 'Informe exatamente um alvo: post ou resultado' USING ERRCODE = '22023';
  END IF;

  v_conteudo := btrim(coalesce(p_conteudo, ''));
  IF char_length(v_conteudo) = 0 THEN
    RAISE EXCEPTION 'Comentário vazio' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_conteudo) > 500 THEN
    RAISE EXCEPTION 'Comentário passa de 500 caracteres' USING ERRCODE = '22023';
  END IF;

  IF p_resposta_a_id IS NOT NULL THEN
    SELECT * INTO v_pai FROM public.comentarios WHERE id = p_resposta_a_id;
    IF NOT FOUND
       OR v_pai.post_id   IS DISTINCT FROM p_post_id
       OR v_pai.result_id IS DISTINCT FROM p_result_id THEN
      RAISE EXCEPTION 'Comentário respondido não existe neste causo' USING ERRCODE = '22023';
    END IF;
    -- Três níveis no máximo (0, 1, 2). Responder o nível 2 fica no nível 2.
    v_nivel := least(v_pai.nivel + 1, 2);
  END IF;

  INSERT INTO public.comentarios (post_id, result_id, user_id, content, resposta_a_id, nivel)
  VALUES (p_post_id, p_result_id, v_user_id, v_conteudo, p_resposta_a_id, v_nivel)
  RETURNING * INTO v_linha;

  RETURN v_linha;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_comentario(text, uuid, uuid, uuid) TO authenticated;

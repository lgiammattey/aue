-- =============================================================================
-- 20261020180000 — mídia recortada das comunidades
--
-- Avatar e capa não guardam URL livre. O browser envia só JPEG normalizado para
-- um caminho determinístico; esta migração confere o objeto no Storage, grava a
-- referência e avança uma revisão usada como cache-buster pela plataforma web.
-- Quem pode fazer isso é o criador da comunidade ou um membro com role `admin`.
-- =============================================================================

ALTER TABLE public.grupos
  ADD COLUMN IF NOT EXISTS caminho_do_avatar text,
  ADD COLUMN IF NOT EXISTS revisao_do_avatar bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS caminho_da_capa text,
  ADD COLUMN IF NOT EXISTS revisao_da_capa bigint NOT NULL DEFAULT 0;

ALTER TABLE public.grupos
  DROP CONSTRAINT IF EXISTS grupos_caminho_do_avatar_proprio,
  ADD CONSTRAINT grupos_caminho_do_avatar_proprio
    CHECK (
      caminho_do_avatar IS NULL
      OR caminho_do_avatar ~ ('^' || id::text || '/avatar/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]jpg$')
    ),
  DROP CONSTRAINT IF EXISTS grupos_caminho_da_capa_proprio,
  ADD CONSTRAINT grupos_caminho_da_capa_proprio
    CHECK (
      caminho_da_capa IS NULL
      OR caminho_da_capa ~ ('^' || id::text || '/capa/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]jpg$')
    ),
  DROP CONSTRAINT IF EXISTS grupos_revisao_do_avatar_nao_negativa,
  ADD CONSTRAINT grupos_revisao_do_avatar_nao_negativa CHECK (revisao_do_avatar >= 0),
  DROP CONSTRAINT IF EXISTS grupos_revisao_da_capa_nao_negativa,
  ADD CONSTRAINT grupos_revisao_da_capa_nao_negativa CHECK (revisao_da_capa >= 0);

-- Impede o UPDATE direto da tabela de apontar uma comunidade para uma mídia de
-- outra origem. As RPCs abaixo liberam só estes quatro campos, na transação.
CREATE OR REPLACE FUNCTION public.proteger_midias_da_comunidade()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('aue.midia_comunidade', true) IS DISTINCT FROM 'sim' THEN
    NEW.caminho_do_avatar := OLD.caminho_do_avatar;
    NEW.revisao_do_avatar := OLD.revisao_do_avatar;
    NEW.caminho_da_capa := OLD.caminho_da_capa;
    NEW.revisao_da_capa := OLD.revisao_da_capa;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proteger_midias_da_comunidade ON public.grupos;
CREATE TRIGGER proteger_midias_da_comunidade
  BEFORE UPDATE ON public.grupos
  FOR EACH ROW EXECUTE FUNCTION public.proteger_midias_da_comunidade();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'midias_de_comunidades',
  'midias_de_comunidades',
  true,
  3145728,
  ARRAY['image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.aue_pode_gerir_midia_da_comunidade(p_grupo_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL
     AND public.aue_e_conta_promovida(auth.uid())
     AND EXISTS (
       SELECT 1 FROM public.grupos g
        WHERE g.id = p_grupo_id
          AND (
            g.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.membros_grupo m
               WHERE m.group_id = g.id AND m.user_id = auth.uid() AND m.role = 'admin'
            )
          )
     )
$$;

DROP POLICY IF EXISTS "midias_de_comunidades_leitura_publica" ON storage.objects;
CREATE POLICY "midias_de_comunidades_leitura_publica"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'midias_de_comunidades');

DROP POLICY IF EXISTS "midias_de_comunidades_gravar_de_moderador" ON storage.objects;
CREATE POLICY "midias_de_comunidades_gravar_de_moderador"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'midias_de_comunidades'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(avatar|capa)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]jpg$'
    AND public.aue_pode_gerir_midia_da_comunidade(
      CASE WHEN split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           THEN split_part(name, '/', 1)::uuid ELSE NULL END
    )
  );

DROP POLICY IF EXISTS "midias_de_comunidades_atualizar_de_moderador" ON storage.objects;
CREATE POLICY "midias_de_comunidades_atualizar_de_moderador"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'midias_de_comunidades'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(avatar|capa)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]jpg$'
    AND public.aue_pode_gerir_midia_da_comunidade(
      CASE WHEN split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           THEN split_part(name, '/', 1)::uuid ELSE NULL END
    )
  )
  WITH CHECK (
    bucket_id = 'midias_de_comunidades'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(avatar|capa)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]jpg$'
    AND public.aue_pode_gerir_midia_da_comunidade(
      CASE WHEN split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           THEN split_part(name, '/', 1)::uuid ELSE NULL END
    )
  );

DROP POLICY IF EXISTS "midias_de_comunidades_remover_de_moderador" ON storage.objects;
CREATE POLICY "midias_de_comunidades_remover_de_moderador"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'midias_de_comunidades'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(avatar|capa)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]jpg$'
    AND public.aue_pode_gerir_midia_da_comunidade(
      CASE WHEN split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           THEN split_part(name, '/', 1)::uuid ELSE NULL END
    )
  );

-- A leitura mantém os contadores já canônicos, agora com caminhos (não URLs),
-- revisões e autorização calculada no servidor.
-- O retorno de uma função PostgreSQL não pode trocar de formato com
-- CREATE OR REPLACE; estas três leituras são recriadas juntas, na mesma migração.
DROP FUNCTION IF EXISTS public.listar_comunidades_do_forum();
DROP FUNCTION IF EXISTS public.obter_comunidade_do_forum(text);
DROP FUNCTION IF EXISTS public.aue_ler_comunidades_do_forum(text);

CREATE OR REPLACE FUNCTION public.aue_ler_comunidades_do_forum(p_slug text)
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  caminho_do_avatar text, revisao_do_avatar bigint, caminho_da_capa text, revisao_da_capa bigint,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean,
  posso_gerir_midia boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT g.id, g.slug, g.nome::text, g.descricao, g.icone,
         g.caminho_do_avatar, g.revisao_do_avatar, g.caminho_da_capa, g.revisao_da_capa,
         (SELECT count(*) FROM public.membros_grupo m
           WHERE m.group_id = g.id AND public.aue_e_conta_promovida(m.user_id)),
         tp.total, tp.ultima,
         coalesce(
           auth.uid() IS NOT NULL
           AND public.aue_e_conta_promovida(auth.uid())
           AND EXISTS (SELECT 1 FROM public.membros_grupo m WHERE m.group_id = g.id AND m.user_id = auth.uid()),
           false),
         public.aue_pode_gerir_midia_da_comunidade(g.id)
    FROM public.grupos g
    CROSS JOIN LATERAL (
      SELECT count(*) AS total, max(t.ultima_atividade_em) AS ultima
        FROM public.topicos t
       WHERE t.comunidade_id = g.id
         AND t.status IN ('aberto', 'fechado')
         AND public.aue_e_conta_promovida(t.autor_id)
    ) tp
   WHERE nullif(btrim(g.slug), '') IS NOT NULL
     AND (p_slug IS NULL OR lower(g.slug) = lower(btrim(p_slug)))
     AND (lower(g.slug) <> 'acervo' OR tp.total > 0)
   ORDER BY g.nome, g.id
$$;

CREATE OR REPLACE FUNCTION public.listar_comunidades_do_forum()
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  caminho_do_avatar text, revisao_do_avatar bigint, caminho_da_capa text, revisao_da_capa bigint,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean,
  posso_gerir_midia boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT * FROM public.aue_ler_comunidades_do_forum(NULL) $$;

CREATE OR REPLACE FUNCTION public.obter_comunidade_do_forum(p_slug text)
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  caminho_do_avatar text, revisao_do_avatar bigint, caminho_da_capa text, revisao_da_capa bigint,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean,
  posso_gerir_midia boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.aue_ler_comunidades_do_forum(p_slug)
   WHERE nullif(btrim(coalesce(p_slug, '')), '') IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.definir_midia_da_comunidade(
  p_slug text,
  p_tipo text,
  p_caminho text
)
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  caminho_do_avatar text, revisao_do_avatar bigint, caminho_da_capa text, revisao_da_capa bigint,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean,
  posso_gerir_midia boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_grupo public.grupos;
  v_prefixo text;
  v_limite bigint;
  v_tamanho bigint;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT * INTO v_grupo FROM public.grupos g
   WHERE lower(g.slug) = lower(btrim(coalesce(p_slug, '')))
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comunidade não existe' USING ERRCODE = '22023', HINT = 'comunidade_inexistente'; END IF;
  IF NOT public.aue_pode_gerir_midia_da_comunidade(v_grupo.id) THEN
    RAISE EXCEPTION 'Só quem criou ou modera a comunidade pode trocar a mídia' USING ERRCODE = '42501', HINT = 'nao_pode_gerir_midia';
  END IF;
  IF p_tipo NOT IN ('avatar', 'capa') THEN RAISE EXCEPTION 'Tipo de mídia inválido' USING ERRCODE = '22023', HINT = 'midia_invalida'; END IF;
  v_prefixo := v_grupo.id::text || '/' || p_tipo || '/';
  v_limite := CASE WHEN p_tipo = 'avatar' THEN 2097152 ELSE 3145728 END;
  IF p_caminho !~ ('^' || v_prefixo || '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]jpg$') THEN
    RAISE EXCEPTION 'Caminho de mídia inválido' USING ERRCODE = '22023', HINT = 'midia_invalida';
  END IF;
  SELECT CASE WHEN (o.metadata->>'size') ~ '^[0-9]+$' THEN (o.metadata->>'size')::bigint ELSE -1 END
    INTO v_tamanho
    FROM storage.objects o
   WHERE o.bucket_id = 'midias_de_comunidades'
     AND o.name = p_caminho
     AND o.metadata->>'mimetype' = 'image/jpeg';
  IF v_tamanho IS NULL OR v_tamanho < 1 OR v_tamanho > v_limite THEN
    RAISE EXCEPTION 'JPEG da comunidade inválido ou acima do limite' USING ERRCODE = '22023', HINT = 'midia_invalida';
  END IF;
  PERFORM set_config('aue.midia_comunidade', 'sim', true);
  IF p_tipo = 'avatar' THEN
    UPDATE public.grupos SET caminho_do_avatar = p_caminho, revisao_do_avatar = revisao_do_avatar + 1 WHERE id = v_grupo.id;
  ELSE
    UPDATE public.grupos SET caminho_da_capa = p_caminho, revisao_da_capa = revisao_da_capa + 1 WHERE id = v_grupo.id;
  END IF;
  RETURN QUERY SELECT * FROM public.aue_ler_comunidades_do_forum(v_grupo.slug);
END;
$$;

CREATE OR REPLACE FUNCTION public.remover_midia_da_comunidade(p_slug text, p_tipo text)
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  caminho_do_avatar text, revisao_do_avatar bigint, caminho_da_capa text, revisao_da_capa bigint,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean,
  posso_gerir_midia boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_grupo public.grupos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT * INTO v_grupo FROM public.grupos g
   WHERE lower(g.slug) = lower(btrim(coalesce(p_slug, '')))
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comunidade não existe' USING ERRCODE = '22023', HINT = 'comunidade_inexistente'; END IF;
  IF NOT public.aue_pode_gerir_midia_da_comunidade(v_grupo.id) THEN
    RAISE EXCEPTION 'Só quem criou ou modera a comunidade pode trocar a mídia' USING ERRCODE = '42501', HINT = 'nao_pode_gerir_midia';
  END IF;
  IF p_tipo NOT IN ('avatar', 'capa') THEN RAISE EXCEPTION 'Tipo de mídia inválido' USING ERRCODE = '22023', HINT = 'midia_invalida'; END IF;
  PERFORM set_config('aue.midia_comunidade', 'sim', true);
  IF p_tipo = 'avatar' THEN
    UPDATE public.grupos SET caminho_do_avatar = NULL, revisao_do_avatar = revisao_do_avatar + 1 WHERE id = v_grupo.id;
  ELSE
    UPDATE public.grupos SET caminho_da_capa = NULL, revisao_da_capa = revisao_da_capa + 1 WHERE id = v_grupo.id;
  END IF;
  RETURN QUERY SELECT * FROM public.aue_ler_comunidades_do_forum(v_grupo.slug);
END;
$$;

REVOKE ALL ON FUNCTION
  public.aue_pode_gerir_midia_da_comunidade(uuid),
  public.definir_midia_da_comunidade(text, text, text),
  public.remover_midia_da_comunidade(text, text)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  public.listar_comunidades_do_forum(),
  public.obter_comunidade_do_forum(text)
TO anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.definir_midia_da_comunidade(text, text, text),
  public.remover_midia_da_comunidade(text, text)
TO authenticated;

-- =============================================================================
-- 20261020000017 — Capa pública do perfil social
--
-- A capa não guarda URL arbitrária: o banco conhece somente um caminho do
-- bucket próprio e uma revisão. A URL pública nasce no adaptador web, sempre
-- derivada desses dois valores. Assim não há imagem externa nem capa de outra
-- pessoa apontada pelo cliente.
-- =============================================================================

ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS caminho_da_capa text,
  ADD COLUMN IF NOT EXISTS revisao_da_capa bigint NOT NULL DEFAULT 0;

ALTER TABLE public.perfis
  DROP CONSTRAINT IF EXISTS perfis_caminho_da_capa_proprio,
  ADD CONSTRAINT perfis_caminho_da_capa_proprio
    CHECK (caminho_da_capa IS NULL OR caminho_da_capa = id::text || '/capa.jpg'),
  DROP CONSTRAINT IF EXISTS perfis_revisao_da_capa_nao_negativa,
  ADD CONSTRAINT perfis_revisao_da_capa_nao_negativa CHECK (revisao_da_capa >= 0);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'capas_de_perfil',
  'capas_de_perfil',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "capas_de_perfil_leitura_publica" ON storage.objects;
CREATE POLICY "capas_de_perfil_leitura_publica"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'capas_de_perfil');

DROP POLICY IF EXISTS "capas_de_perfil_inserir_propria" ON storage.objects;
CREATE POLICY "capas_de_perfil_inserir_propria"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'capas_de_perfil'
    AND public.aue_e_conta_promovida(auth.uid())
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "capas_de_perfil_atualizar_propria" ON storage.objects;
CREATE POLICY "capas_de_perfil_atualizar_propria"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'capas_de_perfil'
    AND public.aue_e_conta_promovida(auth.uid())
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'capas_de_perfil'
    AND public.aue_e_conta_promovida(auth.uid())
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "capas_de_perfil_remover_propria" ON storage.objects;
CREATE POLICY "capas_de_perfil_remover_propria"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'capas_de_perfil'
    AND public.aue_e_conta_promovida(auth.uid())
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- A trava dos campos sociais também protege a capa de UPDATE direto.
CREATE OR REPLACE FUNCTION public.proteger_campos_sociais_do_perfil()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('aue.perfil_social', true) IS DISTINCT FROM 'sim' THEN
    NEW.handle := OLD.handle; NEW.bio := OLD.bio; NEW.cidade := OLD.cidade;
    NEW.url_do_avatar := OLD.url_do_avatar; NEW.instagram := OLD.instagram;
    NEW.tiktok := OLD.tiktok; NEW.youtube := OLD.youtube; NEW.twitter := OLD.twitter;
    NEW.caminho_da_capa := OLD.caminho_da_capa;
    NEW.revisao_da_capa := OLD.revisao_da_capa;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.definir_minha_capa(p_caminho_da_capa text)
RETURNS public.perfis
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_linha public.perfis; v_caminho_esperado text;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  v_caminho_esperado := auth.uid()::text || '/capa.jpg';
  IF p_caminho_da_capa IS DISTINCT FROM v_caminho_esperado THEN
    RAISE EXCEPTION 'Capa inválida' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects
     WHERE bucket_id = 'capas_de_perfil' AND name = v_caminho_esperado
  ) THEN
    RAISE EXCEPTION 'Arquivo da capa não encontrado' USING ERRCODE = '22023';
  END IF;
  PERFORM set_config('aue.perfil_social', 'sim', true);
  UPDATE public.perfis
     SET caminho_da_capa = v_caminho_esperado,
         revisao_da_capa = revisao_da_capa + 1
   WHERE id = auth.uid()
   RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

CREATE OR REPLACE FUNCTION public.remover_minha_capa()
RETURNS public.perfis
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_linha public.perfis;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  PERFORM set_config('aue.perfil_social', 'sim', true);
  UPDATE public.perfis
     SET caminho_da_capa = NULL,
         revisao_da_capa = revisao_da_capa + 1
   WHERE id = auth.uid()
   RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

DROP FUNCTION IF EXISTS public.obter_perfil_publico(text);
CREATE FUNCTION public.obter_perfil_publico(p_handle text)
RETURNS TABLE (
  id uuid, handle text, apelido text, url_do_avatar text,
  caminho_da_capa text, revisao_da_capa bigint,
  bio text, cidade text, titulo text, e_fundador boolean, criado_em timestamptz,
  instagram text, tiktok text, youtube text, twitter text,
  total_causos bigint, melhor_nota numeric, total_seguidores bigint,
  total_seguindo bigint, eu_sigo boolean, sou_eu boolean, conta_da_casa boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT
    p.id, p.handle, p.apelido, p.url_do_avatar, p.caminho_da_capa, p.revisao_da_capa,
    p.bio, p.cidade, p.titulo, p.e_fundador, p.criado_em,
    p.instagram, p.tiktok, p.youtube, p.twitter,
    (SELECT count(*) FROM public.posts_comunidade c WHERE c.user_id = p.id AND NOT c.esta_escondido),
    (SELECT max(r.nota)::numeric FROM public.posts_comunidade c JOIN public.resultados r ON r.id = c.result_id WHERE c.user_id = p.id AND NOT c.esta_escondido AND NOT r.esta_escondido),
    (SELECT count(*) FROM public.seguidores s WHERE s.following_id = p.id),
    (SELECT count(*) FROM public.seguidores s WHERE s.follower_id = p.id),
    EXISTS(SELECT 1 FROM public.seguidores s WHERE s.following_id = p.id AND s.follower_id = auth.uid()),
    p.id = auth.uid(),
    EXISTS(SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id = p.id)
  FROM public.perfis p
  WHERE public.aue_e_conta_promovida(p.id)
    AND lower(p.handle) = lower(regexp_replace(btrim(p_handle), '^@', ''));
$$;

REVOKE ALL ON FUNCTION public.definir_minha_capa(text), public.remover_minha_capa() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.definir_minha_capa(text), public.remover_minha_capa() TO authenticated;
GRANT EXECUTE ON FUNCTION public.obter_perfil_publico(text) TO anon, authenticated;

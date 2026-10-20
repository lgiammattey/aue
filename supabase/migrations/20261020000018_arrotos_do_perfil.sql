-- =============================================================================
-- 20261020000018 — Arrotos entregues em perfis
--
-- Gravação direta, sem Arena, resultado, comunidade ou feed. O objeto de áudio
-- fica privado; o navegador só recebe URL assinada curta depois de consultar
-- o grupo Arrotos de um perfil.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.arrotos_do_perfil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  perfil_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  caminho_do_audio text NOT NULL UNIQUE,
  duracao_segundos numeric(7, 3),
  estado text NOT NULL DEFAULT 'rascunho' CHECK (estado IN ('rascunho', 'publicado', 'oculto')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  publicado_em timestamptz,
  ocultado_em timestamptz,
  ocultado_por uuid REFERENCES public.perfis(id),
  CONSTRAINT arrotos_do_perfil_caminho_imutavel
    CHECK (caminho_do_audio = autor_id::text || '/' || id::text),
  CONSTRAINT arrotos_do_perfil_duracao_publicada
    CHECK ((estado = 'publicado') = (duracao_segundos IS NOT NULL AND publicado_em IS NOT NULL)),
  CONSTRAINT arrotos_do_perfil_duracao_valida
    CHECK (duracao_segundos IS NULL OR (duracao_segundos > 0 AND duracao_segundos <= 90))
);

CREATE INDEX IF NOT EXISTS arrotos_do_perfil_visiveis_por_perfil
  ON public.arrotos_do_perfil (perfil_id, publicado_em DESC)
  WHERE estado = 'publicado';

ALTER TABLE public.arrotos_do_perfil ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.arrotos_do_perfil FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arrotos_de_perfil', 'arrotos_de_perfil', false, 12582912,
  ARRAY['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- A policy não confia no caminho fornecido pelo cliente. O rascunho, criado
-- pela RPC, é a autorização pontual de upload e o nome nunca pode ser reusado.
CREATE OR REPLACE FUNCTION public.aue_pode_enviar_arroto_do_perfil(p_caminho text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.arrotos_do_perfil a
     WHERE a.caminho_do_audio = p_caminho
       AND a.autor_id = auth.uid()
       AND a.estado = 'rascunho'
       AND a.criado_em > now() - interval '1 hour'
  );
$$;

REVOKE ALL ON FUNCTION public.aue_pode_enviar_arroto_do_perfil(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aue_pode_enviar_arroto_do_perfil(text) TO authenticated;

DROP POLICY IF EXISTS "arrotos_de_perfil_inserir_rascunho_proprio" ON storage.objects;
CREATE POLICY "arrotos_de_perfil_inserir_rascunho_proprio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'arrotos_de_perfil'
    AND public.aue_e_conta_promovida(auth.uid())
    AND public.aue_pode_enviar_arroto_do_perfil(name)
  );

CREATE OR REPLACE FUNCTION public.aue_pode_ler_arroto_do_perfil(p_caminho text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.aue_e_conta_promovida(auth.uid())
     AND EXISTS (
       SELECT 1
         FROM public.arrotos_do_perfil a
        WHERE a.caminho_do_audio = p_caminho
          AND a.estado = 'publicado'
     );
$$;

REVOKE ALL ON FUNCTION public.aue_pode_ler_arroto_do_perfil(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aue_pode_ler_arroto_do_perfil(text) TO authenticated;

DROP POLICY IF EXISTS "arrotos_de_perfil_ler_publicado" ON storage.objects;
CREATE POLICY "arrotos_de_perfil_ler_publicado"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'arrotos_de_perfil'
    AND public.aue_pode_ler_arroto_do_perfil(name)
  );

-- Não existe UPDATE nem DELETE do objeto para o cliente: o caminho é imutável
-- e ocultar remove a permissão de obter novas URLs assinadas.

CREATE OR REPLACE FUNCTION public.preparar_arroto_do_perfil(p_handle_destino text DEFAULT NULL)
RETURNS TABLE (
  id uuid, caminho_do_audio text, perfil_destino_id uuid,
  perfil_destino_handle text, perfil_destino_apelido text
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_destino public.perfis;
  v_arroto public.arrotos_do_perfil;
  v_arroto_id uuid := gen_random_uuid();
  v_handle text := nullif(lower(regexp_replace(btrim(coalesce(p_handle_destino, '')), '^@', '')), '');
BEGIN
  PERFORM public.aue_exigir_conta_promovida();

  IF v_handle IS NULL THEN
    SELECT p.* INTO v_destino FROM public.perfis p WHERE p.id = auth.uid() AND public.aue_e_conta_promovida(p.id);
  ELSE
    SELECT * INTO v_destino
      FROM public.perfis p
     WHERE lower(p.handle) = v_handle AND public.aue_e_conta_promovida(p.id);
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de destino não existe' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.arrotos_do_perfil (id, autor_id, perfil_id, caminho_do_audio)
  VALUES (v_arroto_id, auth.uid(), v_destino.id, auth.uid()::text || '/' || v_arroto_id::text)
  RETURNING * INTO v_arroto;

  RETURN QUERY SELECT v_arroto.id, v_arroto.caminho_do_audio, v_destino.id, v_destino.handle, v_destino.apelido;
END;
$$;

CREATE OR REPLACE FUNCTION public.publicar_arroto_do_perfil(p_arroto_id uuid, p_duracao_segundos numeric)
RETURNS TABLE (
  id uuid, perfil_id uuid, autor_id uuid, autor_handle text, autor_apelido text,
  caminho_do_audio text, duracao_segundos numeric, criado_em timestamptz,
  meu boolean, posso_ocultar boolean
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_arroto public.arrotos_do_perfil;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF p_duracao_segundos IS NULL OR p_duracao_segundos <= 0 OR p_duracao_segundos > 90 THEN
    RAISE EXCEPTION 'Duração inválida' USING ERRCODE = '22023';
  END IF;

  SELECT a.* INTO v_arroto FROM public.arrotos_do_perfil a
   WHERE a.id = p_arroto_id AND a.autor_id = auth.uid() AND a.estado = 'rascunho'
     AND a.criado_em > now() - interval '1 hour'
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rascunho indisponível' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects
     WHERE bucket_id = 'arrotos_de_perfil'
       AND name = v_arroto.caminho_do_audio
       AND (metadata->>'mimetype') IN ('audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg')
  ) THEN RAISE EXCEPTION 'Áudio do rascunho não encontrado' USING ERRCODE = '22023'; END IF;

  UPDATE public.arrotos_do_perfil
     SET estado = 'publicado', duracao_segundos = p_duracao_segundos, publicado_em = now()
   WHERE id = v_arroto.id
  RETURNING * INTO v_arroto;

  RETURN QUERY
  SELECT v_arroto.id, v_arroto.perfil_id, v_arroto.autor_id, p.handle, p.apelido,
         v_arroto.caminho_do_audio, v_arroto.duracao_segundos, v_arroto.criado_em,
         true, true
    FROM public.perfis p WHERE p.id = v_arroto.autor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_arrotos_do_perfil(p_handle text)
RETURNS TABLE (
  id uuid, perfil_id uuid, autor_id uuid, autor_handle text, autor_apelido text,
  caminho_do_audio text, duracao_segundos numeric, criado_em timestamptz,
  meu boolean, posso_ocultar boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT a.id, a.perfil_id, a.autor_id, autor.handle, autor.apelido,
         a.caminho_do_audio, a.duracao_segundos, a.criado_em,
         a.autor_id = auth.uid(), (a.autor_id = auth.uid() OR a.perfil_id = auth.uid())
    FROM public.arrotos_do_perfil a
    JOIN public.perfis destino ON destino.id = a.perfil_id AND public.aue_e_conta_promovida(destino.id)
    JOIN public.perfis autor ON autor.id = a.autor_id
   WHERE lower(destino.handle) = lower(regexp_replace(btrim(p_handle), '^@', ''))
     AND a.estado = 'publicado'
   ORDER BY a.publicado_em DESC;
$$;

CREATE OR REPLACE FUNCTION public.ocultar_arroto_do_perfil(p_arroto_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  UPDATE public.arrotos_do_perfil
     SET estado = 'oculto', ocultado_em = now(), ocultado_por = auth.uid()
   WHERE id = p_arroto_id
     AND estado = 'publicado'
     AND (autor_id = auth.uid() OR perfil_id = auth.uid());
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.preparar_arroto_do_perfil(text), public.publicar_arroto_do_perfil(uuid, numeric), public.listar_arrotos_do_perfil(text), public.ocultar_arroto_do_perfil(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preparar_arroto_do_perfil(text), public.publicar_arroto_do_perfil(uuid, numeric), public.listar_arrotos_do_perfil(text), public.ocultar_arroto_do_perfil(uuid) TO authenticated;

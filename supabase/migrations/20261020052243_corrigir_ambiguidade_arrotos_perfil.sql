-- Corrige colisões entre parâmetros/colunas e os campos de retorno das RPCs.

CREATE OR REPLACE FUNCTION public.preparar_arroto_do_perfil(p_handle_destino text DEFAULT NULL)
RETURNS TABLE (id uuid, caminho_do_audio text, perfil_destino_id uuid, perfil_destino_handle text, perfil_destino_apelido text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
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
    SELECT p.* INTO v_destino FROM public.perfis p WHERE lower(p.handle) = v_handle AND public.aue_e_conta_promovida(p.id);
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfil de destino não existe' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.arrotos_do_perfil (id, autor_id, perfil_id, caminho_do_audio)
  VALUES (v_arroto_id, auth.uid(), v_destino.id, auth.uid()::text || '/' || v_arroto_id::text)
  RETURNING * INTO v_arroto;
  RETURN QUERY SELECT v_arroto.id, v_arroto.caminho_do_audio, v_destino.id, v_destino.handle, v_destino.apelido;
END;
$$;

CREATE OR REPLACE FUNCTION public.publicar_arroto_do_perfil(p_arroto_id uuid, p_duracao_segundos numeric)
RETURNS TABLE (id uuid, perfil_id uuid, autor_id uuid, autor_handle text, autor_apelido text, caminho_do_audio text, duracao_segundos numeric, criado_em timestamptz, meu boolean, posso_ocultar boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_arroto public.arrotos_do_perfil;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF p_duracao_segundos IS NULL OR p_duracao_segundos <= 0 OR p_duracao_segundos > 90 THEN
    RAISE EXCEPTION 'Duração inválida' USING ERRCODE = '22023';
  END IF;
  SELECT a.* INTO v_arroto FROM public.arrotos_do_perfil a
   WHERE a.id = p_arroto_id AND a.autor_id = auth.uid() AND a.estado = 'rascunho'
     AND a.criado_em > now() - interval '1 hour' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rascunho indisponível' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects
     WHERE bucket_id = 'arrotos_de_perfil' AND name = v_arroto.caminho_do_audio
       AND (metadata->>'mimetype') IN ('audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg')
  ) THEN RAISE EXCEPTION 'Áudio do rascunho não encontrado' USING ERRCODE = '22023'; END IF;
  UPDATE public.arrotos_do_perfil a
     SET estado = 'publicado', duracao_segundos = p_duracao_segundos, publicado_em = now()
   WHERE a.id = v_arroto.id
  RETURNING * INTO v_arroto;
  RETURN QUERY
  SELECT v_arroto.id, v_arroto.perfil_id, v_arroto.autor_id, p.handle, p.apelido,
         v_arroto.caminho_do_audio, v_arroto.duracao_segundos, v_arroto.criado_em, true, true
    FROM public.perfis p WHERE p.id = v_arroto.autor_id;
END;
$$;

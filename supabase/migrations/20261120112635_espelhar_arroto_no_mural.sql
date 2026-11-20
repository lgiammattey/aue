-- A criação do post e a ligação acontecem na mesma transação. Os ETags são
-- usados apenas para conferir o vínculo explícito indicado pelo autor; nunca
-- para juntar gravações independentes automaticamente.
CREATE FUNCTION public.criar_publicacao_pessoal_espelho(
  p_arroto_id uuid, p_titulo text, p_corpo text, p_anexo_tipo text,
  p_anexo_caminho text, p_anexo_mime text, p_anexo_tamanho_bytes integer,
  p_anexo_duracao_ms integer, p_url_video text
) RETURNS public.topicos LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_arroto public.arrotos_do_perfil;
  v_etag_perfil text;
  v_etag_anexo text;
  v_topico public.topicos;
BEGIN
  IF v_uid IS NULL OR NOT public.aue_e_conta_promovida(v_uid) OR p_anexo_tipo IS DISTINCT FROM 'audio' THEN
    RAISE EXCEPTION 'Publicação sem autoria ou áudio válido' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_arroto FROM public.arrotos_do_perfil a
    WHERE a.id = p_arroto_id AND a.autor_id = v_uid AND a.perfil_id = v_uid AND a.estado = 'publicado'
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Áudio de perfil indisponível' USING ERRCODE = '42501'; END IF;
  SELECT metadata->>'eTag' INTO v_etag_perfil FROM storage.objects
    WHERE bucket_id='arrotos_de_perfil' AND name=v_arroto.caminho_do_audio;
  SELECT metadata->>'eTag' INTO v_etag_anexo FROM storage.objects
    WHERE bucket_id='anexos_do_forum' AND name=p_anexo_caminho;
  IF v_etag_perfil IS NULL OR v_etag_anexo IS NULL OR v_etag_perfil <> v_etag_anexo THEN
    RAISE EXCEPTION 'Os áudios não correspondem' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_topico FROM public.criar_publicacao_pessoal_com_anexo(
    p_titulo, p_corpo, p_anexo_tipo, p_anexo_caminho, p_anexo_mime,
    p_anexo_tamanho_bytes, p_anexo_duracao_ms, p_url_video
  );
  INSERT INTO aue_privado.espelhos_de_arroto(arroto_id,topico_id) VALUES (v_arroto.id,v_topico.id);
  RETURN v_topico;
END;
$$;
REVOKE ALL ON FUNCTION public.criar_publicacao_pessoal_espelho(uuid,text,text,text,text,text,integer,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.criar_publicacao_pessoal_espelho(uuid,text,text,text,text,text,integer,integer,text) TO authenticated;

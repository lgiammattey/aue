-- Reservada para desenvolvimento: o cliente não pode registrar notas enquanto
-- não houver análise independente do áudio em serviço confiável. Autoria e
-- identidade do arquivo não comprovam a nota fornecida pelo navegador.
CREATE FUNCTION public.registrar_nota_de_audio_publicado(p_tipo text, p_id uuid, p_nota numeric)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_bucket text;
  v_caminho text;
  v_etag text;
  v_inseriu integer;
BEGIN
  IF v_uid IS NULL OR NOT public.aue_e_conta_promovida(v_uid)
     OR p_nota IS NULL OR p_nota < 0 OR p_nota > 100 OR p_nota <> round(p_nota)
  THEN RETURN false; END IF;

  IF p_tipo = 'topico' THEN
    SELECT 'anexos_do_forum', t.anexo_caminho INTO v_bucket, v_caminho
      FROM public.topicos t
      WHERE t.id = p_id AND t.autor_id = v_uid AND t.status IN ('aberto','fechado')
        AND t.anexo_tipo = 'audio' AND t.resultado_id IS NULL;
  ELSIF p_tipo = 'resposta' THEN
    SELECT 'anexos_do_forum', r.anexo_caminho INTO v_bucket, v_caminho
      FROM public.respostas r JOIN public.topicos t ON t.id = r.topico_id
      WHERE r.id = p_id AND r.autor_id = v_uid AND r.status = 'visivel'
        AND t.status IN ('aberto','fechado') AND r.anexo_tipo = 'audio';
  ELSIF p_tipo = 'perfil' THEN
    SELECT 'arrotos_de_perfil', a.caminho_do_audio INTO v_bucket, v_caminho
      FROM public.arrotos_do_perfil a
      WHERE a.id = p_id AND a.autor_id = v_uid AND a.estado = 'publicado';
  ELSE RETURN false;
  END IF;
  IF v_caminho IS NULL THEN RETURN false; END IF;
  SELECT o.metadata->>'eTag' INTO v_etag FROM storage.objects o
    WHERE o.bucket_id = v_bucket AND o.name = v_caminho;
  IF v_etag IS NULL THEN RETURN false; END IF;

  INSERT INTO aue_privado.notas_retrospectivas(bucket,caminho,etag,nota,versao)
  VALUES (v_bucket,v_caminho,v_etag,p_nota,'publicacao-acustica-legado-v1')
  ON CONFLICT (bucket,caminho) DO NOTHING;
  GET DIAGNOSTICS v_inseriu = ROW_COUNT;
  IF v_inseriu > 0 THEN RETURN true; END IF;
  RETURN EXISTS (SELECT 1 FROM aue_privado.notas_retrospectivas n
    WHERE n.bucket=v_bucket AND n.caminho=v_caminho AND n.etag=v_etag
      AND n.nota=p_nota AND n.versao='publicacao-acustica-legado-v1');
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_nota_de_audio_publicado(text,uuid,numeric) FROM PUBLIC,anon,authenticated;

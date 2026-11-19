-- O mural reúne publicações públicas: a conta promovida pode responder sem
-- ingressar na comunidade legada. Mesma função, mesma assinatura e demais
-- verificações; CREATE OR REPLACE mantém os privilégios existentes.
SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.responder_topico_com_anexo(
  p_topico_id uuid, p_corpo text, p_pai_id uuid DEFAULT NULL, p_anexo_tipo text DEFAULT NULL,
  p_anexo_caminho text DEFAULT NULL, p_anexo_mime text DEFAULT NULL,
  p_anexo_tamanho_bytes integer DEFAULT NULL, p_anexo_duracao_ms integer DEFAULT NULL,
  p_url_video text DEFAULT NULL
) RETURNS public.respostas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_corpo text := public.aue_aparar_texto(p_corpo); v_topico public.topicos; v_pai public.respostas;
  v_nivel smallint := 0; v_anexo record; v_linha public.respostas;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT * INTO v_anexo FROM public.aue_validar_anexo_do_forum(p_anexo_tipo, p_anexo_caminho, p_anexo_mime, p_anexo_tamanho_bytes, p_anexo_duracao_ms, p_url_video);
  IF char_length(v_corpo) > 1000 OR (char_length(v_corpo) = 0 AND v_anexo.tipo IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Resposta precisa ter até 1000 caracteres ou um anexo', 'resposta_invalida');
  END IF;
  SELECT * INTO v_topico FROM public.topicos t WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado') AND public.aue_e_conta_promovida(t.autor_id) FOR NO KEY UPDATE;
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Tópico não encontrado', 'topico_nao_encontrado'); END IF;
  IF v_topico.status = 'fechado' THEN PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado para respostas', 'topico_fechado'); END IF;
  IF p_pai_id IS NOT NULL THEN
    SELECT * INTO v_pai FROM public.respostas r WHERE r.id = p_pai_id AND r.topico_id = v_topico.id AND r.status = 'visivel';
    IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Resposta respondida não existe neste tópico', 'pai_invalido'); END IF;
    v_nivel := least(v_pai.nivel + 1, 2);
  END IF;
  INSERT INTO public.respostas (topico_id, pai_id, nivel, autor_id, corpo, anexo_tipo, anexo_caminho, anexo_mime, anexo_tamanho_bytes, anexo_duracao_ms, video_externo_url)
  VALUES (v_topico.id, p_pai_id, v_nivel, auth.uid(), v_corpo, v_anexo.tipo, v_anexo.caminho, v_anexo.mime, v_anexo.tamanho_bytes, v_anexo.duracao_ms, v_anexo.url_video)
  RETURNING * INTO v_linha;
  UPDATE public.topicos SET ultima_atividade_em = greatest(ultima_atividade_em, v_linha.criado_em) WHERE id = v_topico.id;
  RETURN v_linha;
END;
$$;

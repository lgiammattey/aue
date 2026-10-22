-- Tópicos: 2000 caracteres. Respostas: 1000. Mantém anexos e permissões.
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.respostas DROP CONSTRAINT respostas_corpo_tamanho;
ALTER TABLE public.respostas ADD CONSTRAINT respostas_corpo_tamanho CHECK (char_length(corpo) <= 1000);

CREATE OR REPLACE FUNCTION public.criar_topico_com_anexo(
  p_slug text, p_titulo text, p_corpo text, p_anexo_tipo text DEFAULT NULL,
  p_anexo_caminho text DEFAULT NULL, p_anexo_mime text DEFAULT NULL,
  p_anexo_tamanho_bytes integer DEFAULT NULL, p_anexo_duracao_ms integer DEFAULT NULL,
  p_url_video text DEFAULT NULL
) RETURNS public.topicos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_corpo text := public.aue_aparar_texto(p_corpo); v_titulo text := regexp_replace(public.aue_aparar_texto(p_titulo), '\s+', ' ', 'g');
  v_grupo public.grupos; v_anexo record; v_linha public.topicos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT * INTO v_anexo FROM public.aue_validar_anexo_do_forum(p_anexo_tipo, p_anexo_caminho, p_anexo_mime, p_anexo_tamanho_bytes, p_anexo_duracao_ms, p_url_video);
  IF char_length(v_corpo) > 2000 OR (char_length(v_corpo) = 0 AND v_anexo.tipo IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Texto do tópico precisa ter até 2000 caracteres ou um anexo', 'corpo_invalido');
  END IF;
  IF char_length(v_titulo) = 0 THEN v_titulo := coalesce(nullif(left(v_corpo, 120), ''), 'Mídia da comunidade'); END IF;
  IF char_length(v_titulo) > 120 THEN PERFORM public.aue_falhar_conversa('22023', 'Título inválido', 'titulo_invalido'); END IF;
  SELECT * INTO v_grupo FROM public.grupos g WHERE lower(g.slug) = lower(btrim(coalesce(p_slug, '')));
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Comunidade não existe', 'comunidade_inexistente'); END IF;
  PERFORM public.aue_exigir_participacao(v_grupo.id);
  INSERT INTO public.topicos (comunidade_id, autor_id, titulo, corpo, anexo_tipo, anexo_caminho, anexo_mime, anexo_tamanho_bytes, anexo_duracao_ms, video_externo_url)
  VALUES (v_grupo.id, auth.uid(), v_titulo, v_corpo, v_anexo.tipo, v_anexo.caminho, v_anexo.mime, v_anexo.tamanho_bytes, v_anexo.duracao_ms, v_anexo.url_video)
  RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

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
  IF v_topico.origem = 'comunidade' THEN PERFORM public.aue_exigir_participacao(v_topico.comunidade_id); END IF;
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

CREATE OR REPLACE FUNCTION public.editar_topico(p_topico_id uuid, p_titulo text DEFAULT NULL, p_corpo text DEFAULT NULL)
RETURNS public.topicos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_titulo text := CASE WHEN p_titulo IS NULL THEN NULL ELSE regexp_replace(public.aue_aparar_texto(p_titulo), '\s+', ' ', 'g') END;
  v_corpo text := CASE WHEN p_corpo IS NULL THEN NULL ELSE public.aue_aparar_texto(p_corpo) END;
  v_topico public.topicos; v_linha public.topicos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF v_titulo IS NULL AND v_corpo IS NULL THEN PERFORM public.aue_falhar_conversa('22023', 'Nada para editar', 'nada_para_editar'); END IF;
  IF v_titulo IS NOT NULL AND char_length(v_titulo) NOT BETWEEN 1 AND 120 THEN PERFORM public.aue_falhar_conversa('22023', 'Título inválido', 'titulo_invalido'); END IF;
  IF v_corpo IS NOT NULL AND char_length(v_corpo) > 2000 THEN PERFORM public.aue_falhar_conversa('22023', 'Texto do tópico precisa ter até 2000 caracteres', 'corpo_invalido'); END IF;
  SELECT * INTO v_topico FROM public.topicos t WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado') FOR UPDATE;
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Tópico não encontrado', 'topico_nao_encontrado'); END IF;
  IF v_topico.autor_id <> auth.uid() THEN PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor'); END IF;
  IF v_topico.status = 'fechado' THEN PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado', 'topico_fechado'); END IF;
  UPDATE public.topicos SET titulo = coalesce(v_titulo, titulo), corpo = coalesce(v_corpo, corpo), editado_em = now() WHERE id = v_topico.id RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

CREATE OR REPLACE FUNCTION public.editar_resposta(p_resposta_id uuid, p_corpo text)
RETURNS public.respostas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_corpo text := public.aue_aparar_texto(p_corpo); v_resposta public.respostas; v_status text; v_linha public.respostas;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF char_length(v_corpo) > 1000 OR (char_length(v_corpo) = 0 AND NOT EXISTS (SELECT 1 FROM public.respostas x WHERE x.id = p_resposta_id AND x.anexo_tipo IS NOT NULL)) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Resposta precisa ter até 1000 caracteres ou um anexo', 'resposta_invalida');
  END IF;
  SELECT r.* INTO v_resposta FROM public.respostas r JOIN public.topicos t ON t.id = r.topico_id AND t.status IN ('aberto', 'fechado') WHERE r.id = p_resposta_id AND r.status = 'visivel' FOR UPDATE OF r;
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Resposta não encontrada', 'resposta_nao_encontrada'); END IF;
  IF v_resposta.autor_id <> auth.uid() THEN PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor'); END IF;
  SELECT t.status INTO v_status FROM public.topicos t WHERE t.id = v_resposta.topico_id;
  IF v_status = 'fechado' THEN PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado', 'topico_fechado'); END IF;
  UPDATE public.respostas SET corpo = v_corpo, editado_em = now() WHERE id = v_resposta.id RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;


-- Desfaz anexos livres. Execute apenas em ambiente onde apagar as mídias e os
-- posts/respostas com anexo já foi uma decisão explícita: remover as colunas
-- perde os metadados e pode deixar objetos privados órfãos no Storage.

DROP POLICY IF EXISTS anexos_do_forum_ler_publicado_ou_proprio ON storage.objects;
DROP POLICY IF EXISTS anexos_do_forum_apagar_rascunho_proprio ON storage.objects;
DROP POLICY IF EXISTS anexos_do_forum_inserir_proprio ON storage.objects;

DROP FUNCTION IF EXISTS public.listar_anexos_do_forum(uuid[], uuid[]);
DROP FUNCTION IF EXISTS public.aue_ler_anexo_do_forum(text, integer);
DROP FUNCTION IF EXISTS public.responder_topico_com_anexo(uuid, text, uuid, text, text, text, integer, integer, text);
DROP FUNCTION IF EXISTS public.criar_topico_com_anexo(text, text, text, text, text, text, integer, integer, text);
DROP FUNCTION IF EXISTS public.aue_validar_anexo_do_forum(text, text, text, integer, integer, text);
DROP FUNCTION IF EXISTS public.aue_url_video_externo_canonica(text);
DROP FUNCTION IF EXISTS public.aue_anexo_do_forum_publicado(text);

ALTER TABLE public.topicos DROP CONSTRAINT IF EXISTS topicos_anexo_valido;
ALTER TABLE public.respostas DROP CONSTRAINT IF EXISTS respostas_anexo_valido;
ALTER TABLE public.respostas DROP CONSTRAINT IF EXISTS respostas_corpo_tamanho;
ALTER TABLE public.respostas ADD CONSTRAINT respostas_corpo_tamanho CHECK (char_length(corpo) BETWEEN 1 AND 500);

ALTER TABLE public.topicos
  DROP COLUMN IF EXISTS video_externo_url,
  DROP COLUMN IF EXISTS anexo_duracao_ms,
  DROP COLUMN IF EXISTS anexo_tamanho_bytes,
  DROP COLUMN IF EXISTS anexo_mime,
  DROP COLUMN IF EXISTS anexo_caminho,
  DROP COLUMN IF EXISTS anexo_tipo;
ALTER TABLE public.respostas
  DROP COLUMN IF EXISTS video_externo_url,
  DROP COLUMN IF EXISTS anexo_duracao_ms,
  DROP COLUMN IF EXISTS anexo_tamanho_bytes,
  DROP COLUMN IF EXISTS anexo_mime,
  DROP COLUMN IF EXISTS anexo_caminho,
  DROP COLUMN IF EXISTS anexo_tipo;

-- Restaura as RPCs com as assinaturas originais da 20261019000014.
CREATE OR REPLACE FUNCTION public.criar_topico(
  p_slug text, p_titulo text, p_corpo text, p_resultado_id uuid DEFAULT NULL,
  p_consentimento_audio_publico boolean DEFAULT false
) RETURNS public.topicos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_titulo text := regexp_replace(public.aue_aparar_texto(p_titulo), '\s+', ' ', 'g');
  v_corpo text := public.aue_aparar_texto(p_corpo); v_grupo public.grupos; v_linha public.topicos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF char_length(v_titulo) NOT BETWEEN 1 AND 120 THEN PERFORM public.aue_falhar_conversa('22023', 'Título precisa ter de 1 a 120 caracteres', 'titulo_invalido'); END IF;
  IF char_length(v_corpo) NOT BETWEEN 1 AND 1000 THEN PERFORM public.aue_falhar_conversa('22023', 'Texto do tópico precisa ter de 1 a 1000 caracteres', 'corpo_invalido'); END IF;
  SELECT * INTO v_grupo FROM public.grupos g WHERE lower(g.slug) = lower(btrim(coalesce(p_slug, '')));
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Comunidade não existe', 'comunidade_inexistente'); END IF;
  PERFORM public.aue_exigir_participacao(v_grupo.id);
  IF p_resultado_id IS NOT NULL AND (NOT coalesce(p_consentimento_audio_publico, false) OR NOT public.aue_resultado_e_meu(p_resultado_id)) THEN
    PERFORM public.aue_falhar_conversa('42501', 'Resultado sem consentimento ou não pertence à conta', 'audio_sem_consentimento');
  END IF;
  INSERT INTO public.topicos (comunidade_id, autor_id, titulo, corpo, resultado_id, consentimento_audio_publico)
  VALUES (v_grupo.id, auth.uid(), v_titulo, v_corpo, p_resultado_id, (p_resultado_id IS NOT NULL AND coalesce(p_consentimento_audio_publico, false))) RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

CREATE OR REPLACE FUNCTION public.responder_topico(p_topico_id uuid, p_corpo text, p_pai_id uuid DEFAULT NULL)
RETURNS public.respostas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_corpo text := public.aue_aparar_texto(p_corpo); v_topico public.topicos; v_pai public.respostas; v_nivel smallint := 0; v_linha public.respostas;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF char_length(v_corpo) NOT BETWEEN 1 AND 500 THEN PERFORM public.aue_falhar_conversa('22023', 'Resposta precisa ter de 1 a 500 caracteres', 'resposta_invalida'); END IF;
  SELECT * INTO v_topico FROM public.topicos t WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado') AND public.aue_e_conta_promovida(t.autor_id) FOR NO KEY UPDATE;
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Tópico não encontrado', 'topico_nao_encontrado'); END IF;
  IF v_topico.status = 'fechado' THEN PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado para respostas', 'topico_fechado'); END IF;
  PERFORM public.aue_exigir_participacao(v_topico.comunidade_id);
  IF p_pai_id IS NOT NULL THEN
    SELECT * INTO v_pai FROM public.respostas r WHERE r.id = p_pai_id AND r.topico_id = v_topico.id AND r.status = 'visivel';
    IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Resposta respondida não existe neste tópico', 'pai_invalido'); END IF;
    v_nivel := least(v_pai.nivel + 1, 2);
  END IF;
  INSERT INTO public.respostas (topico_id, pai_id, nivel, autor_id, corpo) VALUES (v_topico.id, p_pai_id, v_nivel, auth.uid(), v_corpo) RETURNING * INTO v_linha;
  UPDATE public.topicos SET ultima_atividade_em = greatest(ultima_atividade_em, v_linha.criado_em) WHERE id = v_topico.id;
  RETURN v_linha;
END;
$$;

CREATE OR REPLACE FUNCTION public.editar_resposta(p_resposta_id uuid, p_corpo text)
RETURNS public.respostas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_corpo text := public.aue_aparar_texto(p_corpo); v_resposta public.respostas; v_status text; v_linha public.respostas;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF char_length(v_corpo) NOT BETWEEN 1 AND 500 THEN PERFORM public.aue_falhar_conversa('22023', 'Resposta precisa ter de 1 a 500 caracteres', 'resposta_invalida'); END IF;
  SELECT r.* INTO v_resposta FROM public.respostas r JOIN public.topicos t ON t.id = r.topico_id AND t.status IN ('aberto', 'fechado') WHERE r.id = p_resposta_id AND r.status = 'visivel' FOR UPDATE OF r;
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Resposta não encontrada', 'resposta_nao_encontrada'); END IF;
  IF v_resposta.autor_id <> auth.uid() THEN PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor'); END IF;
  SELECT t.status INTO v_status FROM public.topicos t WHERE t.id = v_resposta.topico_id;
  IF v_status = 'fechado' THEN PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado', 'topico_fechado'); END IF;
  UPDATE public.respostas SET corpo = v_corpo, editado_em = now() WHERE id = v_resposta.id RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

-- O bucket pode ter objetos. Não o apagamos em rollback automático.

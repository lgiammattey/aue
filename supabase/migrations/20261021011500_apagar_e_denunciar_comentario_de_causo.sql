-- Apagar e denunciar comentário de causo.
--
-- Comentário de causo mora em `comentarios`, sem como apagar nem denunciar, e
-- apagar de verdade levaria junto as respostas dos outros (FK em cascata). Todo
-- comentário tem uma resposta espelho em `respostas` (gatilho do acervo), que já
-- sabe de status e de denúncia. Aqui o espelho manda:
--   - apagar_meu_comentario: marca o espelho como 'removido'. O comentário vira
--     um marcador e as respostas dos outros continuam;
--   - denunciar_comentario: denuncia o espelho (mesma regra de 3 denunciantes);
--   - listar_comentarios: devolve `removido` e, nos removidos/ocultos, esconde
--     texto e autor.

DROP FUNCTION IF EXISTS public.listar_comentarios(uuid, uuid);
CREATE FUNCTION public.listar_comentarios(p_post_id uuid DEFAULT NULL, p_result_id uuid DEFAULT NULL)
RETURNS TABLE(id uuid, content text, created_at timestamptz, user_id uuid, apelido text, avatar_url text,
              resposta_a_id uuid, nivel smallint, handle text, removido boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT c.id,
         CASE WHEN rm.removido THEN '' ELSE c.content END,
         c.created_at,
         CASE WHEN rm.removido THEN NULL ELSE c.user_id END,
         CASE WHEN rm.removido THEN NULL ELSE p.apelido END,
         CASE WHEN rm.removido THEN NULL ELSE p.url_do_avatar END,
         c.resposta_a_id, c.nivel,
         CASE WHEN rm.removido THEN NULL ELSE p.handle END,
         rm.removido
    FROM public.comentarios c
    JOIN public.posts_comunidade post ON post.id = c.post_id AND NOT post.esta_escondido
    JOIN public.perfis p ON p.id = c.user_id AND public.aue_e_conta_promovida(p.id)
   CROSS JOIN LATERAL (
     SELECT EXISTS (SELECT 1 FROM public.respostas r WHERE r.legado_comentario_id = c.id AND r.status <> 'visivel') AS removido
   ) rm
   WHERE p_post_id IS NOT NULL AND c.post_id = p_post_id AND p_result_id IS NULL
   ORDER BY c.created_at;
$$;
REVOKE ALL ON FUNCTION public.listar_comentarios(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_comentarios(uuid, uuid) TO anon, authenticated;

CREATE FUNCTION public.apagar_meu_comentario(p_comentario_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_dono uuid; v_resposta uuid; v_status text;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT c.user_id INTO v_dono FROM public.comentarios c WHERE c.id = p_comentario_id AND c.post_id IS NOT NULL;
  IF v_dono IS NULL THEN
    PERFORM public.aue_falhar_conversa('22023', 'Comentário não encontrado', 'resposta_nao_encontrada');
  END IF;
  IF v_dono <> auth.uid() THEN
    PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor');
  END IF;
  SELECT r.id, r.status INTO v_resposta, v_status FROM public.respostas r WHERE r.legado_comentario_id = p_comentario_id;
  IF v_resposta IS NULL THEN
    -- Sem espelho não há como deixar marcador; só apaga de vez se ninguém respondeu.
    IF EXISTS (SELECT 1 FROM public.comentarios f WHERE f.resposta_a_id = p_comentario_id) THEN
      PERFORM public.aue_falhar_conversa('22023', 'Comentário com respostas não pode ser apagado', 'resposta_nao_encontrada');
    END IF;
    DELETE FROM public.comentarios WHERE id = p_comentario_id AND user_id = auth.uid();
    RETURN true;
  END IF;
  IF v_status <> 'visivel' THEN
    PERFORM public.aue_falhar_conversa('22023', 'Comentário não encontrado', 'resposta_nao_encontrada');
  END IF;
  -- Apagar não leva as respostas dos outros junto: o comentário vira um marcador.
  UPDATE public.respostas SET status = 'removido' WHERE id = v_resposta;
  RETURN true;
END;
$$;

CREATE FUNCTION public.denunciar_comentario(p_comentario_id uuid, p_motivo text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_resposta uuid;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT r.id INTO v_resposta
    FROM public.comentarios c
    JOIN public.posts_comunidade post ON post.id = c.post_id AND NOT post.esta_escondido
    JOIN public.respostas r ON r.legado_comentario_id = c.id AND r.status = 'visivel'
   WHERE c.id = p_comentario_id;
  IF v_resposta IS NULL THEN
    PERFORM public.aue_falhar_conversa('22023', 'Comentário não encontrado', 'resposta_nao_encontrada');
  END IF;
  RETURN public.denunciar_resposta(v_resposta, p_motivo);
END;
$$;

REVOKE ALL ON FUNCTION public.apagar_meu_comentario(uuid), public.denunciar_comentario(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apagar_meu_comentario(uuid), public.denunciar_comentario(uuid, text) TO authenticated;

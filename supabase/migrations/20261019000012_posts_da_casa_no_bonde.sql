-- Posts da casa são posts normais do Bonde: autoria especial não pode deixar
-- `group_id` nulo e fazê-los desaparecer do feed que junta comunidades reais.
UPDATE public.posts_comunidade p
   SET group_id = g.id
  FROM public.grupos g
 WHERE p.group_id IS NULL
   AND g.slug = CASE lower(p.topic)
     WHEN 'eu arroto, e daí?' THEN 'eu-arroto-e-dai'
     ELSE 'bonde-geral'
   END;

CREATE OR REPLACE FUNCTION public.publicar_da_casa(
  p_id uuid, p_usuario_id uuid, p_topico text, p_conteudo text,
  p_criado_em timestamptz, p_caminho_do_audio text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_inseridos integer; v_grupo_id uuid;
BEGIN
  IF p_id IS NULL THEN RAISE EXCEPTION 'O id do post é obrigatório' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contas_da_casa WHERE usuario_id=p_usuario_id) THEN RAISE EXCEPTION 'Só conta da casa publica por aqui' USING ERRCODE='42501'; END IF;
  IF p_criado_em IS NULL OR NOT public.aue_dentro_da_janela_da_casa(p_criado_em) THEN RAISE EXCEPTION 'created_at fora da janela da casa' USING ERRCODE='22023'; END IF;
  IF p_topico IS NULL OR char_length(btrim(p_topico))=0 OR p_conteudo IS NULL OR char_length(btrim(p_conteudo)) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Post da casa inválido' USING ERRCODE='22023'; END IF;
  IF p_caminho_do_audio IS NOT NULL AND p_caminho_do_audio <> ('burpzilla/' || p_id::text || '.m4a') THEN RAISE EXCEPTION 'Caminho do áudio não é o do post' USING ERRCODE='22023'; END IF;
  SELECT id INTO v_grupo_id FROM public.grupos WHERE slug=CASE lower(btrim(p_topico)) WHEN 'eu arroto, e daí?' THEN 'eu-arroto-e-dai' ELSE 'bonde-geral' END;
  IF v_grupo_id IS NULL THEN RAISE EXCEPTION 'Comunidade da casa ausente' USING ERRCODE='22023'; END IF;
  INSERT INTO public.posts_comunidade(id,group_id,user_id,post_type,result_id,topic,content,created_at,consentimento_audio_publico,caminho_do_audio_da_casa)
  VALUES(p_id,v_grupo_id,p_usuario_id,'text_announcement',NULL,btrim(p_topico),p_conteudo,p_criado_em,true,p_caminho_do_audio)
  ON CONFLICT(id) DO NOTHING;
  GET DIAGNOSTICS v_inseridos=ROW_COUNT;
  IF v_inseridos = 0 THEN
    UPDATE public.posts_comunidade
       SET group_id = v_grupo_id
     WHERE id = p_id
       AND group_id IS NULL;
  END IF;
  RETURN v_inseridos=1;
END; $$;

REVOKE ALL ON FUNCTION public.publicar_da_casa(uuid,uuid,text,text,timestamptz,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publicar_da_casa(uuid,uuid,text,text,timestamptz,text) TO service_role;

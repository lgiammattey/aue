-- A RPC declarava comunidade_nome como text, mas grupos.nome é varchar(50).
-- Em PL/pgSQL o RETURN QUERY não coage isso implicitamente e o feed inteiro
-- falhava antes de devolver a primeira linha.
CREATE OR REPLACE FUNCTION public.listar_feed_de_causos(p_topico text DEFAULT NULL, p_limite integer DEFAULT 30, p_autor_id uuid DEFAULT NULL, p_curtidos_por uuid DEFAULT NULL, p_post_id uuid DEFAULT NULL, p_seguindo boolean DEFAULT false)
RETURNS TABLE (
  id uuid,user_id uuid,apelido text,handle text,url_do_avatar text,topico text,conteudo text,resultado_id uuid,nota numeric,duracao numeric,subtipo_de_origem text,caminho_do_audio text,criado_em timestamptz,total_comentarios bigint,curtidas bigint,reposts bigint,fogo bigint,nojo bigint,trofeu bigint,minhas text[],caminho_do_audio_da_casa text,comunidade_id uuid,comunidade_slug text,comunidade_nome text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_curtidos_por IS NOT NULL AND (NOT public.aue_e_conta_promovida(auth.uid()) OR p_curtidos_por IS DISTINCT FROM auth.uid()) THEN RAISE EXCEPTION 'Curtidos só podem ser consultados pela própria conta' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT p.id,p.user_id,pf.apelido,pf.handle,pf.url_do_avatar,p.topic,p.content,p.result_id,r.nota::numeric,r.duracao::numeric,r.subtipo_de_origem,
    CASE WHEN p.consentimento_audio_publico AND NOT r.esta_escondido THEN r.caminho_do_audio END,p.created_at,
    (SELECT count(*) FROM public.comentarios c WHERE c.post_id=p.id),(SELECT count(*) FROM public.reacoes x WHERE x.post_id=p.id AND x.reaction_type='like'),(SELECT count(*) FROM public.reacoes x WHERE x.post_id=p.id AND x.reaction_type='repost'),(SELECT count(*) FROM public.reacoes x WHERE x.post_id=p.id AND x.reaction_type='fogo'),(SELECT count(*) FROM public.reacoes x WHERE x.post_id=p.id AND x.reaction_type='nojo'),(SELECT count(*) FROM public.reacoes x WHERE x.post_id=p.id AND x.reaction_type='trofeu'),coalesce((SELECT array_agg(x.reaction_type) FROM public.reacoes x WHERE x.post_id=p.id AND x.user_id=auth.uid()),ARRAY[]::text[]),
    CASE WHEN p.consentimento_audio_publico AND EXISTS(SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id=p.user_id) THEN p.caminho_do_audio_da_casa END,g.id,g.slug,g.nome::text
  FROM public.posts_comunidade p JOIN public.perfis pf ON pf.id=p.user_id AND public.aue_e_conta_promovida(p.user_id) JOIN public.grupos g ON g.id=p.group_id LEFT JOIN public.resultados r ON r.id=p.result_id
  WHERE NOT p.esta_escondido AND (p_topico IS NULL OR p.topic=p_topico) AND (p_post_id IS NULL OR p.id=p_post_id) AND (p_autor_id IS NULL OR p.user_id=p_autor_id)
    AND (p_curtidos_por IS NULL OR EXISTS(SELECT 1 FROM public.reacoes x WHERE x.post_id=p.id AND x.user_id=auth.uid() AND x.reaction_type='like'))
    AND (NOT p_seguindo OR EXISTS(SELECT 1 FROM public.seguidores s WHERE s.follower_id=auth.uid() AND s.following_id=p.user_id))
  ORDER BY p.created_at DESC,p.id LIMIT greatest(1,least(coalesce(p_limite,30),100));
END; $$;

REVOKE ALL ON FUNCTION public.listar_feed_de_causos(text,integer,uuid,uuid,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_feed_de_causos(text,integer,uuid,uuid,uuid,boolean) TO anon, authenticated;

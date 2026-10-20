-- A antiga galeria pública vira conversa dentro do Auê. Os links permanecem
-- apontando para o YouTube original e cada post tem uma conta oficial rastreável.
INSERT INTO public.grupos (nome, descricao, slug, icone)
VALUES ('Arrotos no YouTube', 'Vídeos de arroto que a roda trouxe do YouTube.', 'arrotos-youtube', '▶')
ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao, slug = EXCLUDED.slug, icone = EXCLUDED.icone;

WITH videos(autor, conteudo, url, criado_em) AS (
  VALUES
    ('lucas_aue','Gamer Burps 38 — som no headset e reação na hora.','https://youtu.be/n2kD2qIshnY','2026-09-02T20:13:00-03:00'::timestamptz),
    ('marcelo_aue','SirBzrk — o estrondo no microfone. Ouve e tira tua própria conclusão.','https://youtu.be/czYHjMNtJzU','2026-09-05T18:42:00-03:00'::timestamptz),
    ('rian_aue','Garoto Arroto é relíquia de internet. Essa aqui merece uma roda só pra ela.','https://youtu.be/EgRmHFsiK6A','2026-09-09T21:06:00-03:00'::timestamptz),
    ('tiago_aue','Aula de Arroto com Professor Moises. Quem tá aprendendo começa por aqui.','https://youtu.be/ZCBGRL_UGO0','2026-09-13T16:24:00-03:00'::timestamptz),
    ('iury_aue','O Arroto Supersônico entrou na roda. Dá play e fala se aguenta.','https://youtu.be/XHu6ERu0e7c','2026-09-17T19:31:00-03:00'::timestamptz),
    ('kayky_aue','GTA 5 Online Burping. O lobby não tava pronto pra isso.','https://youtu.be/jfQ9Lkzy0RM','2026-09-21T22:11:00-03:00'::timestamptz),
    ('rodrigo_aue','Concurso de Rap em Arrotos. Tem coisa que você só descobre quando a roda acha.','https://youtu.be/nXazacLACYw','2026-09-26T17:08:00-03:00'::timestamptz),
    ('camillo_aue','O Arroto do Demônio: aperta play sabendo onde tá se metendo.','https://youtu.be/psINs2wRvbE','2026-09-30T20:47:00-03:00'::timestamptz),
    ('lucas_aue','P*S*D* Arrotos Oakley, parte 1. Arquivo vivo da zoeira dos anos 2000.','https://youtu.be/aP8KXALnAGA','2026-10-03T18:19:00-03:00'::timestamptz),
    ('rian_aue','P*S*D* Arrotos, parte 2. A continuação não pediu licença.','https://youtu.be/8eLSMcbQDBo','2026-10-06T21:03:00-03:00'::timestamptz),
    ('iury_aue','P*S*D* La Nu Clidaao. Relíquia pra quem viveu aquela internet.','https://youtu.be/Gidcdw9uqdA','2026-10-10T16:36:00-03:00'::timestamptz),
    ('rodrigo_aue','Arroto: Comunicação Fora do Habitat Natural. A resenha atravessa espécie.','https://youtu.be/oxzvxLkwAkU','2026-10-14T19:14:00-03:00'::timestamptz)
), grupo AS (SELECT id FROM public.grupos WHERE slug = 'arrotos-youtube')
INSERT INTO public.posts_comunidade (group_id,user_id,post_type,social_network,social_url,topic,content,created_at)
SELECT grupo.id,p.id,'social_link','YouTube',v.url,'Arrotos no YouTube',v.conteudo,v.criado_em
FROM videos v JOIN public.perfis p ON p.handle = v.autor CROSS JOIN grupo
WHERE NOT EXISTS (SELECT 1 FROM public.posts_comunidade antigo WHERE antigo.social_url = v.url AND antigo.group_id = grupo.id);

DROP FUNCTION IF EXISTS public.listar_feed_de_causos(text,integer,uuid,uuid,uuid,boolean);
CREATE FUNCTION public.listar_feed_de_causos(p_topico text DEFAULT NULL, p_limite integer DEFAULT 30, p_autor_id uuid DEFAULT NULL, p_curtidos_por uuid DEFAULT NULL, p_post_id uuid DEFAULT NULL, p_seguindo boolean DEFAULT false)
RETURNS TABLE (id uuid,user_id uuid,apelido text,handle text,url_do_avatar text,topico text,conteudo text,resultado_id uuid,nota numeric,duracao numeric,subtipo_de_origem text,caminho_do_audio text,criado_em timestamptz,total_comentarios bigint,curtidas bigint,reposts bigint,fogo bigint,nojo bigint,trofeu bigint,minhas text[],caminho_do_audio_da_casa text,comunidade_id uuid,comunidade_slug text,comunidade_nome text,rede_social text,url_social text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_curtidos_por IS NOT NULL AND (NOT public.aue_e_conta_promovida(auth.uid()) OR p_curtidos_por IS DISTINCT FROM auth.uid()) THEN RAISE EXCEPTION 'Curtidos só podem ser consultados pela própria conta' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT p.id,p.user_id,pf.apelido,pf.handle,pf.url_do_avatar,p.topic,p.content,p.result_id,r.nota::numeric,r.duracao::numeric,r.subtipo_de_origem,CASE WHEN p.consentimento_audio_publico AND NOT r.esta_escondido THEN r.caminho_do_audio END,p.created_at,(SELECT count(*) FROM public.comentarios c WHERE c.post_id=p.id),(SELECT count(*) FROM public.reacoes x WHERE x.post_id=p.id AND x.reaction_type='like'),(SELECT count(*) FROM public.reacoes x WHERE x.post_id=p.id AND x.reaction_type='repost'),(SELECT count(*) FROM public.reacoes x WHERE x.post_id=p.id AND x.reaction_type='fogo'),(SELECT count(*) FROM public.reacoes x WHERE x.post_id=p.id AND x.reaction_type='nojo'),(SELECT count(*) FROM public.reacoes x WHERE x.post_id=p.id AND x.reaction_type='trofeu'),coalesce((SELECT array_agg(x.reaction_type) FROM public.reacoes x WHERE x.post_id=p.id AND x.user_id=auth.uid()),ARRAY[]::text[]),CASE WHEN p.consentimento_audio_publico AND EXISTS(SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id=p.user_id) THEN p.caminho_do_audio_da_casa END,g.id,g.slug,g.nome::text,p.social_network,p.social_url FROM public.posts_comunidade p JOIN public.perfis pf ON pf.id=p.user_id AND public.aue_e_conta_promovida(p.user_id) JOIN public.grupos g ON g.id=p.group_id LEFT JOIN public.resultados r ON r.id=p.result_id WHERE NOT p.esta_escondido AND (p_topico IS NULL OR p.topic=p_topico) AND (p_post_id IS NULL OR p.id=p_post_id) AND (p_autor_id IS NULL OR p.user_id=p_autor_id) AND (p_curtidos_por IS NULL OR EXISTS(SELECT 1 FROM public.reacoes x WHERE x.post_id=p.id AND x.user_id=auth.uid() AND x.reaction_type='like')) AND (NOT p_seguindo OR EXISTS(SELECT 1 FROM public.seguidores s WHERE s.follower_id=auth.uid() AND s.following_id=p.user_id)) ORDER BY p.created_at DESC,p.id LIMIT greatest(1,least(coalesce(p_limite,30),100));
END; $$;
REVOKE ALL ON FUNCTION public.listar_feed_de_causos(text,integer,uuid,uuid,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_feed_de_causos(text,integer,uuid,uuid,uuid,boolean) TO anon, authenticated;

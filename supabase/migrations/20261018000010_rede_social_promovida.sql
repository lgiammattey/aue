-- =============================================================================
-- 20261018000010 — Rede social só para conta promovida
-- ADR 0009 / Cartão 0014. Sessão anônima joga e lê; nunca vira perfil social.
-- =============================================================================

ALTER TABLE public.grupos ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.grupos ADD COLUMN IF NOT EXISTS icone text;
CREATE UNIQUE INDEX IF NOT EXISTS grupos_slug_unico ON public.grupos (lower(slug)) WHERE slug IS NOT NULL;

-- O catálogo é servidor, não preferência local. Esses espaços são públicos;
-- entrar neles cria o vínculo persistente que autoriza a publicação.
INSERT INTO public.grupos (nome, slug, descricao, icone)
VALUES
  ('Bonde Geral', 'bonde-geral', 'A praça central da zoeira. Todo mundo arrota aqui.', '📢'),
  ('Cerveja Gelada', 'cerveja-gelada', 'Arroto de long neck, chope e lata trincando.', '🍺'),
  ('Refri & Cia', 'refri-cia', 'Gás de refrigerante. Grave no peito é lei.', '🥤'),
  ('Histórias de Arroto', 'historias-de-arroto', 'Casos, vexames e lendas de família.', '📖'),
  ('Churrasco Raiz', 'churrasco-raiz', 'Pós-picanha e farofa. Respeito máximo.', '🥩'),
  ('Eu arroto, e daí?', 'eu-arroto-e-dai', 'A comunidade mãe do Auê.', '🦍'),
  ('Na reunião da firma', 'reuniao-da-firma', 'A culpa jogada no ar condicionado.', '💼'),
  ('Primeiro encontro', 'primeiro-encontro', 'Romance, trauma e gases.', '💔'),
  ('Arroto trovão', 'trovao-da-madrugada', 'Acorda o cachorro e o vizinho.', '⚡')
ON CONFLICT (nome) DO UPDATE SET slug = EXCLUDED.slug, descricao = EXCLUDED.descricao, icone = EXCLUDED.icone;

UPDATE public.posts_comunidade p
   SET group_id = g.id
  FROM public.grupos g
 WHERE p.group_id IS NULL
   AND g.slug = CASE lower(p.topic)
     WHEN 'cerveja gelada' THEN 'cerveja-gelada'
     WHEN 'refri & cia' THEN 'refri-cia'
     WHEN 'histórias de arroto' THEN 'historias-de-arroto'
     WHEN 'churrasco raiz' THEN 'churrasco-raiz'
     WHEN 'eu arroto, e daí?' THEN 'eu-arroto-e-dai'
     WHEN 'na reunião da firma' THEN 'reuniao-da-firma'
     WHEN 'primeiro encontro' THEN 'primeiro-encontro'
     WHEN 'arroto trovão' THEN 'trovao-da-madrugada'
     ELSE 'bonde-geral'
   END;

CREATE OR REPLACE FUNCTION public.aue_e_conta_promovida(p_usuario_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_usuario_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.users u
     WHERE u.id = p_usuario_id
       AND coalesce((to_jsonb(u)->>'is_anonymous')::boolean, false) = false
       AND nullif(btrim(u.email), '') IS NOT NULL
  );
$$;

-- O Bonde Geral é a praça de entrada da rede: conta promovida já participa
-- dele. Outras comunidades continuam dependendo de entrada explícita.
INSERT INTO public.membros_grupo (group_id, user_id)
SELECT g.id, p.id
  FROM public.grupos g
 CROSS JOIN public.perfis p
 WHERE g.slug = 'bonde-geral'
   AND public.aue_e_conta_promovida(p.id)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.aue_exigir_conta_promovida()
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.aue_e_conta_promovida(auth.uid()) THEN
    RAISE EXCEPTION 'Ação social exige conta promovida' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- O perfil técnico continua existindo para Arena/X1, mas só o promovido é público.
CREATE OR REPLACE FUNCTION public.meu_handle_social()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT p.handle FROM public.perfis p WHERE p.id = auth.uid() AND public.aue_e_conta_promovida(p.id) $$;

CREATE OR REPLACE FUNCTION public.preparar_promocao_social(p_apelido text, p_handle text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_handle text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessão ausente' USING ERRCODE = '28000'; END IF;
  PERFORM set_config('aue.perfil_social', 'sim', true);
  IF char_length(btrim(coalesce(p_apelido, ''))) NOT BETWEEN 2 AND 30 THEN RAISE EXCEPTION 'Apelido precisa ter de 2 a 30 caracteres' USING ERRCODE = '22023'; END IF;
  v_handle := lower(regexp_replace(btrim(coalesce(p_handle, '')), '^@', ''));
  IF v_handle = '' THEN v_handle := public.aue_gerar_handle(p_apelido, auth.uid()); END IF;
  IF v_handle !~ '^[a-z0-9_]{3,20}$' OR v_handle IN ('aue','admin','suporte','moderacao','oficial','perfil','feed','arena') THEN
    RAISE EXCEPTION 'Handle inválido ou reservado' USING ERRCODE = '22023';
  END IF;
  UPDATE public.perfis SET apelido = btrim(p_apelido), handle = v_handle WHERE id = auth.uid();
  INSERT INTO public.membros_grupo (group_id, user_id)
    SELECT id, auth.uid() FROM public.grupos WHERE slug = 'bonde-geral'
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Esse handle já é de outra pessoa' USING ERRCODE = '23505';
END;
$$;

-- Impede UPDATE direto de transformar visitante em perfil público. A Arena ainda
-- pode alterar apelido técnico; a RPC social usa uma marca local e auditável.
CREATE OR REPLACE FUNCTION public.proteger_campos_sociais_do_perfil()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('aue.perfil_social', true) IS DISTINCT FROM 'sim' THEN
    NEW.handle := OLD.handle; NEW.bio := OLD.bio; NEW.cidade := OLD.cidade;
    NEW.url_do_avatar := OLD.url_do_avatar; NEW.instagram := OLD.instagram;
    NEW.tiktok := OLD.tiktok; NEW.youtube := OLD.youtube; NEW.twitter := OLD.twitter;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protege_campos_sociais_do_perfil ON public.perfis;
CREATE TRIGGER protege_campos_sociais_do_perfil BEFORE UPDATE ON public.perfis
FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_sociais_do_perfil();

-- Toda escrita social fica em RPC; grants e policies antigas deixam de ser uma
-- rota paralela para visitante autenticado.
REVOKE ALL ON public.posts_comunidade, public.comentarios, public.reacoes, public.seguidores, public.membros_grupo, public.denuncias FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.listar_comunidades_sociais()
RETURNS TABLE(id uuid, slug text, nome text, descricao text, icone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT id, slug, nome, descricao, icone FROM public.grupos WHERE slug IS NOT NULL ORDER BY nome $$;

CREATE OR REPLACE FUNCTION public.entrar_na_comunidade(p_slug text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ DECLARE v_grupo uuid;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT id INTO v_grupo FROM public.grupos WHERE lower(slug) = lower(btrim(p_slug));
  IF v_grupo IS NULL THEN RAISE EXCEPTION 'Comunidade não existe' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.membros_grupo(group_id, user_id) VALUES (v_grupo, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.sair_da_comunidade(p_slug text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  DELETE FROM public.membros_grupo m USING public.grupos g
   WHERE m.group_id = g.id AND m.user_id = auth.uid() AND lower(g.slug) = lower(btrim(p_slug));
  RETURN FOUND;
END; $$;

CREATE OR REPLACE FUNCTION public.listar_minhas_comunidades()
RETURNS TABLE(slug text) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.aue_e_conta_promovida(auth.uid()) THEN
    INSERT INTO public.membros_grupo(group_id,user_id)
      SELECT id,auth.uid() FROM public.grupos WHERE slug='bonde-geral'
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN QUERY SELECT g.slug FROM public.membros_grupo m JOIN public.grupos g ON g.id=m.group_id WHERE m.user_id=auth.uid() AND public.aue_e_conta_promovida(auth.uid()) ORDER BY g.nome;
END; $$;

CREATE OR REPLACE FUNCTION public.publicar_causo(p_slug_da_comunidade text, p_conteudo text, p_resultado_id uuid DEFAULT NULL, p_consentimento_audio_publico boolean DEFAULT false)
RETURNS public.posts_comunidade LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ DECLARE v_grupo public.grupos; v_post public.posts_comunidade; v_texto text := btrim(coalesce(p_conteudo,''));
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF char_length(v_texto) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Causo precisa ter de 1 a 1000 caracteres' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_grupo FROM public.grupos WHERE lower(slug)=lower(btrim(p_slug_da_comunidade));
  IF NOT FOUND THEN RAISE EXCEPTION 'Comunidade não existe' USING ERRCODE='22023'; END IF;
  -- Uma conta que acabou de confirmar e-mail pode chegar antes da primeira
  -- leitura das comunidades. Bonde Geral é a única entrada automática.
  IF v_grupo.slug = 'bonde-geral' THEN
    INSERT INTO public.membros_grupo(group_id,user_id) VALUES(v_grupo.id,auth.uid()) ON CONFLICT DO NOTHING;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.membros_grupo WHERE group_id=v_grupo.id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Entre na comunidade antes de postar' USING ERRCODE='42501'; END IF;
  IF p_resultado_id IS NOT NULL AND (NOT p_consentimento_audio_publico OR NOT public.aue_resultado_e_meu(p_resultado_id)) THEN RAISE EXCEPTION 'Resultado sem consentimento ou não pertence à conta' USING ERRCODE='42501'; END IF;
  INSERT INTO public.posts_comunidade(group_id,user_id,post_type,result_id,consentimento_audio_publico,topic,content)
  VALUES(v_grupo.id,auth.uid(),CASE WHEN p_resultado_id IS NULL THEN 'text_announcement' ELSE 'audio_result' END,p_resultado_id,coalesce(p_consentimento_audio_publico,false),v_grupo.nome,v_texto)
  RETURNING * INTO v_post;
  RETURN v_post;
END; $$;

CREATE OR REPLACE FUNCTION public.apagar_meu_causo(p_post_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ BEGIN PERFORM public.aue_exigir_conta_promovida(); DELETE FROM public.posts_comunidade WHERE id=p_post_id AND user_id=auth.uid(); RETURN FOUND; END; $$;

CREATE OR REPLACE FUNCTION public.denunciar_causo(p_post_id uuid, p_motivo text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF NOT EXISTS (SELECT 1 FROM public.posts_comunidade WHERE id=p_post_id AND NOT esta_escondido) THEN RAISE EXCEPTION 'Causo não encontrado' USING ERRCODE='22023'; END IF;
  INSERT INTO public.denuncias(post_id,user_id,reason) VALUES(p_post_id,auth.uid(),left(coalesce(nullif(btrim(p_motivo),''),'Conteúdo impróprio'),500)) ON CONFLICT (post_id,user_id) WHERE post_id IS NOT NULL DO NOTHING;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.alternar_seguir(p_usuario_alvo_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF p_usuario_alvo_id=auth.uid() THEN RAISE EXCEPTION 'Não é possível seguir a si mesmo' USING ERRCODE='22023'; END IF;
  IF NOT public.aue_e_conta_promovida(p_usuario_alvo_id) THEN RAISE EXCEPTION 'Perfil não existe' USING ERRCODE='22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.seguidores WHERE follower_id=auth.uid() AND following_id=p_usuario_alvo_id) THEN DELETE FROM public.seguidores WHERE follower_id=auth.uid() AND following_id=p_usuario_alvo_id; RETURN false; END IF;
  INSERT INTO public.seguidores(follower_id,following_id) VALUES(auth.uid(),p_usuario_alvo_id); RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.alternar_reacao_do_causo(p_post_id uuid, p_tipo text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ DECLARE v_removeu integer;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF p_tipo NOT IN ('like','fogo','nojo','trofeu','repost') THEN RAISE EXCEPTION 'Tipo de reação inválido' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.posts_comunidade WHERE id=p_post_id AND NOT esta_escondido) THEN RAISE EXCEPTION 'Causo não encontrado' USING ERRCODE='22023'; END IF;
  DELETE FROM public.reacoes WHERE post_id=p_post_id AND user_id=auth.uid() AND reaction_type=p_tipo; GET DIAGNOSTICS v_removeu = ROW_COUNT;
  IF v_removeu=0 THEN
    IF p_tipo IN ('fogo','nojo','trofeu') THEN DELETE FROM public.reacoes WHERE post_id=p_post_id AND user_id=auth.uid() AND reaction_type IN ('fogo','nojo','trofeu'); END IF;
    INSERT INTO public.reacoes(post_id,user_id,reaction_type) VALUES(p_post_id,auth.uid(),p_tipo) ON CONFLICT DO NOTHING;
  END IF;
  RETURN (SELECT jsonb_build_object('like',count(*) FILTER(WHERE reaction_type='like'),'repost',count(*) FILTER(WHERE reaction_type='repost'),'fogo',count(*) FILTER(WHERE reaction_type='fogo'),'nojo',count(*) FILTER(WHERE reaction_type='nojo'),'trofeu',count(*) FILTER(WHERE reaction_type='trofeu'),'minhas',coalesce(jsonb_agg(reaction_type) FILTER(WHERE user_id=auth.uid()),'[]'::jsonb)) FROM public.reacoes WHERE post_id=p_post_id);
END; $$;

CREATE OR REPLACE FUNCTION public.criar_comentario(p_conteudo text, p_post_id uuid DEFAULT NULL, p_result_id uuid DEFAULT NULL, p_resposta_a_id uuid DEFAULT NULL)
RETURNS public.comentarios LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ DECLARE v_texto text:=btrim(coalesce(p_conteudo,'')); v_pai public.comentarios; v_linha public.comentarios; v_nivel smallint:=0;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF p_post_id IS NULL OR p_result_id IS NOT NULL THEN RAISE EXCEPTION 'Comentário social precisa de um causo' USING ERRCODE='22023'; END IF;
  IF char_length(v_texto) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Comentário inválido' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.posts_comunidade WHERE id=p_post_id AND NOT esta_escondido) THEN RAISE EXCEPTION 'Causo não encontrado' USING ERRCODE='22023'; END IF;
  IF p_resposta_a_id IS NOT NULL THEN
    SELECT * INTO v_pai FROM public.comentarios WHERE id=p_resposta_a_id AND post_id=p_post_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Comentário respondido não existe neste causo' USING ERRCODE='22023'; END IF;
    v_nivel:=least(v_pai.nivel+1,2);
  END IF;
  INSERT INTO public.comentarios(post_id,user_id,content,resposta_a_id,nivel) VALUES(p_post_id,auth.uid(),v_texto,p_resposta_a_id,v_nivel) RETURNING * INTO v_linha;
  RETURN v_linha;
END; $$;

CREATE OR REPLACE FUNCTION public.listar_comentarios(p_post_id uuid DEFAULT NULL, p_result_id uuid DEFAULT NULL)
RETURNS TABLE(id uuid, content text, created_at timestamptz, user_id uuid, apelido text, avatar_url text, resposta_a_id uuid, nivel smallint, handle text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT c.id,c.content,c.created_at,c.user_id,p.apelido,p.url_do_avatar,c.resposta_a_id,c.nivel,p.handle
  FROM public.comentarios c JOIN public.posts_comunidade post ON post.id=c.post_id AND NOT post.esta_escondido
  JOIN public.perfis p ON p.id=c.user_id AND public.aue_e_conta_promovida(p.id)
  WHERE p_post_id IS NOT NULL AND c.post_id=p_post_id AND p_result_id IS NULL ORDER BY c.created_at;
$$;

DROP FUNCTION IF EXISTS public.listar_feed_de_causos(text, integer, uuid, uuid, uuid);
CREATE FUNCTION public.listar_feed_de_causos(p_topico text DEFAULT NULL, p_limite integer DEFAULT 30, p_autor_id uuid DEFAULT NULL, p_curtidos_por uuid DEFAULT NULL, p_post_id uuid DEFAULT NULL, p_seguindo boolean DEFAULT false)
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
    CASE WHEN p.consentimento_audio_publico AND EXISTS(SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id=p.user_id) THEN p.caminho_do_audio_da_casa END,g.id,g.slug,g.nome
  FROM public.posts_comunidade p JOIN public.perfis pf ON pf.id=p.user_id AND public.aue_e_conta_promovida(p.user_id) JOIN public.grupos g ON g.id=p.group_id LEFT JOIN public.resultados r ON r.id=p.result_id
  WHERE NOT p.esta_escondido AND (p_topico IS NULL OR p.topic=p_topico) AND (p_post_id IS NULL OR p.id=p_post_id) AND (p_autor_id IS NULL OR p.user_id=p_autor_id)
    AND (p_curtidos_por IS NULL OR EXISTS(SELECT 1 FROM public.reacoes x WHERE x.post_id=p.id AND x.user_id=auth.uid() AND x.reaction_type='like'))
    AND (NOT p_seguindo OR EXISTS(SELECT 1 FROM public.seguidores s WHERE s.follower_id=auth.uid() AND s.following_id=p.user_id))
  ORDER BY p.created_at DESC,p.id LIMIT greatest(1,least(coalesce(p_limite,30),100));
END; $$;

DROP FUNCTION IF EXISTS public.obter_perfil_publico(text);
CREATE FUNCTION public.obter_perfil_publico(p_handle text)
RETURNS TABLE (
  id uuid,handle text,apelido text,url_do_avatar text,bio text,cidade text,titulo text,e_fundador boolean,criado_em timestamptz,instagram text,tiktok text,youtube text,twitter text,total_causos bigint,melhor_nota numeric,total_seguidores bigint,total_seguindo bigint,eu_sigo boolean,sou_eu boolean,conta_da_casa boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT p.id,p.handle,p.apelido,p.url_do_avatar,p.bio,p.cidade,p.titulo,p.e_fundador,p.criado_em,p.instagram,p.tiktok,p.youtube,p.twitter,(SELECT count(*) FROM public.posts_comunidade c WHERE c.user_id=p.id AND NOT c.esta_escondido),(SELECT max(r.nota)::numeric FROM public.posts_comunidade c JOIN public.resultados r ON r.id=c.result_id WHERE c.user_id=p.id AND NOT c.esta_escondido AND NOT r.esta_escondido),(SELECT count(*) FROM public.seguidores s WHERE s.following_id=p.id),(SELECT count(*) FROM public.seguidores s WHERE s.follower_id=p.id),EXISTS(SELECT 1 FROM public.seguidores s WHERE s.following_id=p.id AND s.follower_id=auth.uid()),p.id=auth.uid(),EXISTS(SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id=p.id) FROM public.perfis p WHERE public.aue_e_conta_promovida(p.id) AND lower(p.handle)=lower(regexp_replace(btrim(p_handle),'^@','')); $$;

-- A RPC continua sendo o único caminho para os campos públicos; ela também
-- abre a marca local usada pelo trigger que bloqueia UPDATE direto.
CREATE OR REPLACE FUNCTION public.atualizar_meu_perfil(p_apelido text DEFAULT NULL,p_handle text DEFAULT NULL,p_bio text DEFAULT NULL,p_cidade text DEFAULT NULL,p_url_do_avatar text DEFAULT NULL,p_remover_avatar boolean DEFAULT false,p_instagram text DEFAULT NULL,p_tiktok text DEFAULT NULL,p_youtube text DEFAULT NULL,p_twitter text DEFAULT NULL)
RETURNS public.perfis LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ DECLARE v_linha public.perfis; v_handle text;
BEGIN
  PERFORM public.aue_exigir_conta_promovida(); PERFORM set_config('aue.perfil_social','sim',true);
  IF p_apelido IS NOT NULL AND char_length(btrim(p_apelido)) NOT BETWEEN 2 AND 30 THEN RAISE EXCEPTION 'Apelido inválido' USING ERRCODE='22023'; END IF;
  v_handle:=CASE WHEN p_handle IS NULL THEN NULL ELSE lower(regexp_replace(btrim(p_handle),'^@','')) END;
  IF v_handle IS NOT NULL AND (v_handle !~ '^[a-z0-9_]{3,20}$' OR v_handle IN ('aue','admin','suporte','moderacao','oficial','perfil','feed','arena')) THEN RAISE EXCEPTION 'Handle inválido ou reservado' USING ERRCODE='22023'; END IF;
  UPDATE public.perfis SET apelido=coalesce(btrim(p_apelido),apelido),handle=coalesce(v_handle,handle),bio=CASE WHEN p_bio IS NULL THEN bio ELSE nullif(btrim(p_bio),'') END,cidade=CASE WHEN p_cidade IS NULL THEN cidade ELSE nullif(btrim(p_cidade),'') END,url_do_avatar=CASE WHEN p_remover_avatar THEN NULL WHEN p_url_do_avatar IS NOT NULL THEN p_url_do_avatar ELSE url_do_avatar END,instagram=CASE WHEN p_instagram IS NULL THEN instagram ELSE nullif(regexp_replace(btrim(p_instagram),'^@',''),'') END,tiktok=CASE WHEN p_tiktok IS NULL THEN tiktok ELSE nullif(regexp_replace(btrim(p_tiktok),'^@',''),'') END,youtube=CASE WHEN p_youtube IS NULL THEN youtube ELSE nullif(regexp_replace(btrim(p_youtube),'^@',''),'') END,twitter=CASE WHEN p_twitter IS NULL THEN twitter ELSE nullif(regexp_replace(btrim(p_twitter),'^@',''),'') END WHERE id=auth.uid() RETURNING * INTO v_linha;
  RETURN v_linha;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Esse handle já é de outra pessoa' USING ERRCODE='23505'; END; $$;

CREATE OR REPLACE FUNCTION public.listar_conexoes_do_perfil(p_handle text,p_tipo text,p_limite integer DEFAULT 100)
RETURNS TABLE(id uuid,handle text,apelido text,url_do_avatar text,eu_sigo boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ DECLARE v_alvo uuid;
BEGIN
  IF p_tipo NOT IN ('seguidores','seguindo') THEN RAISE EXCEPTION 'Tipo inválido' USING ERRCODE='22023'; END IF;
  SELECT pf.id INTO v_alvo FROM public.perfis pf WHERE lower(pf.handle)=lower(regexp_replace(btrim(p_handle),'^@','')) AND public.aue_e_conta_promovida(pf.id);
  IF v_alvo IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT pf.id,pf.handle,pf.apelido,pf.url_do_avatar,EXISTS(SELECT 1 FROM public.seguidores x WHERE x.following_id=pf.id AND x.follower_id=auth.uid())
  FROM public.seguidores s JOIN public.perfis pf ON pf.id=CASE WHEN p_tipo='seguidores' THEN s.follower_id ELSE s.following_id END
  WHERE public.aue_e_conta_promovida(pf.id) AND ((p_tipo='seguidores' AND s.following_id=v_alvo) OR (p_tipo='seguindo' AND s.follower_id=v_alvo))
  ORDER BY s.created_at DESC LIMIT greatest(1,least(coalesce(p_limite,100),200));
END; $$;

REVOKE ALL ON FUNCTION public.aue_e_conta_promovida(uuid),public.aue_exigir_conta_promovida(),public.meu_handle_social(),public.preparar_promocao_social(text,text),public.listar_comunidades_sociais(),public.entrar_na_comunidade(text),public.sair_da_comunidade(text),public.listar_minhas_comunidades(),public.publicar_causo(text,text,uuid,boolean),public.apagar_meu_causo(uuid),public.denunciar_causo(uuid,text),public.alternar_seguir(uuid),public.alternar_reacao_do_causo(uuid,text),public.criar_comentario(text,uuid,uuid,uuid),public.atualizar_meu_perfil(text,text,text,text,text,boolean,text,text,text,text),public.listar_feed_de_causos(text,integer,uuid,uuid,uuid,boolean),public.obter_perfil_publico(text),public.listar_comentarios(uuid,uuid),public.listar_conexoes_do_perfil(text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_comunidades_sociais(),public.listar_feed_de_causos(text,integer,uuid,uuid,uuid,boolean),public.obter_perfil_publico(text),public.listar_comentarios(uuid,uuid),public.listar_conexoes_do_perfil(text,text,integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.meu_handle_social(),public.preparar_promocao_social(text,text),public.entrar_na_comunidade(text),public.sair_da_comunidade(text),public.listar_minhas_comunidades(),public.publicar_causo(text,text,uuid,boolean),public.apagar_meu_causo(uuid),public.denunciar_causo(uuid,text),public.alternar_seguir(uuid),public.alternar_reacao_do_causo(uuid,text),public.criar_comentario(text,uuid,uuid,uuid),public.atualizar_meu_perfil(text,text,text,text,text,boolean,text,text,text,text) TO authenticated;

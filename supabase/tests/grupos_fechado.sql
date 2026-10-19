-- =============================================================================
-- Testes SQL da 20261019000017 (fecha a escrita direta em public.grupos)
--
-- Roda num banco LOCAL com TODAS as migrações aplicadas (nunca no remoto):
--   psql -q -v ON_ERROR_STOP=1 -d <banco> < supabase/tests/grupos_fechado.sql
-- Depende do prelude.sql, que dá a `grupos` os mesmos grants do Supabase vivo.
-- Sem isso o teste passaria vazio. Uma transação, termina em ROLLBACK.
-- =============================================================================
\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA t_grupos;
GRANT USAGE ON SCHEMA t_grupos TO PUBLIC;
CREATE TABLE t_grupos.placar (n integer NOT NULL);
INSERT INTO t_grupos.placar VALUES (0);
GRANT ALL ON t_grupos.placar TO PUBLIC;

CREATE FUNCTION t_grupos.ok(p_condicao boolean, p_mensagem text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE t_grupos.placar SET n = n + 1;
  IF p_condicao IS NOT TRUE THEN RAISE EXCEPTION 'TESTE FALHOU: %', p_mensagem; END IF;
END $$;

CREATE FUNCTION t_grupos.erro(p_sql text, p_state text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_state text; v_msg text;
BEGIN
  UPDATE t_grupos.placar SET n = n + 1;
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    v_state := SQLSTATE; v_msg := SQLERRM;
    IF v_state <> p_state THEN
      RAISE EXCEPTION 'TESTE FALHOU: esperava % mas veio % (%) em: %', p_state, v_state, v_msg, p_sql;
    END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'TESTE FALHOU: esperava erro % em: %', p_state, p_sql;
END $$;

INSERT INTO auth.users (id, email, is_anonymous) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'a@teste.aue', false),
  ('a0000000-0000-0000-0000-000000000002', NULL, true);
UPDATE public.perfis SET perfil_social_concluido_em = now() WHERE id = 'a0000000-0000-0000-0000-000000000001';

\set como_admin 'RESET ROLE;'
\set como_visitante 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'','''',true); END$$; SET ROLE anon;'
\set como_a 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''a0000000-0000-0000-0000-000000000001'',true); END$$; SET ROLE authenticated;'
\set como_anonima 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''a0000000-0000-0000-0000-000000000002'',true); END$$; SET ROLE authenticated;'

-- 1. Privilégios e policies (a fonte da verdade do fechamento)
:como_admin
DO $t$
DECLARE r text; p text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    PERFORM t_grupos.ok(has_table_privilege(r, 'public.grupos', 'SELECT'), r || ' ainda lê grupos');
    FOREACH p IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
      PERFORM t_grupos.ok(NOT has_table_privilege(r, 'public.grupos', p), r || ' não pode ter ' || p || ' em grupos');
    END LOOP;
  END LOOP;
  PERFORM t_grupos.ok((SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'grupos') = 1, 'só uma policy em grupos');
  PERFORM t_grupos.ok((SELECT cmd FROM pg_policies WHERE schemaname = 'public' AND tablename = 'grupos') = 'SELECT', 'a policy que sobra é a de SELECT');
  PERFORM t_grupos.ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.grupos'::regclass), 'RLS de grupos segue ligada');
  PERFORM t_grupos.ok((SELECT count(*) FROM public.grupos WHERE slug IS NOT NULL) >= 9, 'as comunidades originais continuam lá');
END $t$;

-- 2. Escrita direta barrada: visitante, conta promovida e sessão anônima (todas 42501)
:como_visitante
SELECT t_grupos.erro('INSERT INTO public.grupos(nome, slug) VALUES (''Spam'', ''spam'')', '42501');
SELECT t_grupos.erro('UPDATE public.grupos SET descricao = ''x''', '42501');
SELECT t_grupos.erro('DELETE FROM public.grupos', '42501');
SELECT t_grupos.erro('TRUNCATE public.grupos CASCADE', '42501');
:como_a
SELECT t_grupos.erro('INSERT INTO public.grupos(nome, slug, created_by) VALUES (''Spam'', ''spam'', auth.uid())', '42501');
SELECT t_grupos.erro('UPDATE public.grupos SET descricao = ''x''', '42501');
SELECT t_grupos.erro('DELETE FROM public.grupos', '42501');
SELECT t_grupos.erro('TRUNCATE public.grupos CASCADE', '42501');
:como_anonima
SELECT t_grupos.erro('INSERT INTO public.grupos(nome, slug, created_by) VALUES (''Spam'', ''spam'', auth.uid())', '42501');
SELECT t_grupos.erro('UPDATE public.grupos SET nome = ''x'' WHERE created_by = auth.uid()', '42501');
:como_admin
DO $t$ BEGIN
  PERFORM t_grupos.ok(NOT EXISTS (SELECT 1 FROM public.grupos WHERE slug = 'spam' OR descricao = 'x' OR nome = 'x'), 'nada foi escrito em grupos');
END $t$;

-- 3. Leitura continua (visitante e conta)
:como_visitante
DO $t$ BEGIN
  PERFORM t_grupos.ok((SELECT count(*) FROM public.grupos) >= 9, 'visitante lê grupos');
  PERFORM t_grupos.ok((SELECT count(*) FROM public.listar_comunidades_do_forum()) >= 9, 'diretório do fórum lista as comunidades');
  PERFORM t_grupos.ok((SELECT count(*) FROM public.listar_comunidades_sociais()) >= 9, 'listar_comunidades_sociais lista as comunidades');
  PERFORM t_grupos.ok((SELECT count(*) FROM public.obter_comunidade_do_forum('bonde-geral')) = 1, 'obter_comunidade_do_forum acha o bonde-geral');
END $t$;
:como_a
DO $t$ BEGIN
  PERFORM t_grupos.ok((SELECT count(*) FROM public.grupos) >= 9, 'conta lê grupos');
END $t$;

-- 4. As RPCs que passam por grupos seguem funcionando (SECURITY DEFINER do dono, sem grant do cliente)
:como_a
DO $t$
DECLARE v_id uuid;
BEGIN
  PERFORM t_grupos.ok(public.entrar_na_comunidade('cerveja-gelada'), 'entrar_na_comunidade');
  PERFORM t_grupos.ok((SELECT sou_membro FROM public.obter_comunidade_do_forum('cerveja-gelada')), 'virou membro');
  SELECT id INTO v_id FROM public.criar_topico('cerveja-gelada', 'Título', 'Texto do tópico');
  PERFORM t_grupos.ok(v_id IS NOT NULL, 'criar_topico em comunidade');
  PERFORM t_grupos.ok((SELECT count(*) FROM public.listar_topicos('cerveja-gelada')) = 1, 'listar_topicos devolve o tópico');
  PERFORM t_grupos.ok((SELECT count(*) FROM public.explorar_topicos(10)) = 1, 'explorar_topicos devolve o tópico');
  PERFORM t_grupos.ok((SELECT count(*) FROM public.listar_comunidades_do_forum() WHERE slug = 'cerveja-gelada' AND topicos_total = 1 AND membros_total = 1) = 1, 'diretório conta tópico e membro');
  PERFORM public.publicar_causo('bonde-geral', 'Causo pela RPC antiga');
  PERFORM t_grupos.ok(public.sair_da_comunidade('cerveja-gelada'), 'sair_da_comunidade');
  PERFORM t_grupos.ok((SELECT NOT sou_membro FROM public.obter_comunidade_do_forum('cerveja-gelada')), 'saiu mesmo');
END $t$;

:como_admin
SELECT t_grupos.ok(true, 'fim') ;
DO $t$ BEGIN RAISE NOTICE 'TODOS OS TESTES DE GRUPOS PASSARAM: % asserções', (SELECT n FROM t_grupos.placar); END $t$;
ROLLBACK;

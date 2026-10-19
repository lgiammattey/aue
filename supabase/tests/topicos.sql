-- =============================================================================
-- Testes SQL de Comunidade → Tópico → Resposta (migrações 20261019000014 e 000015)
--
-- Roda num banco LOCAL com TODAS as migrações aplicadas (nunca no remoto):
--   psql -q -v ON_ERROR_STOP=1 -d <banco> < supabase/tests/topicos.sql
-- Falha alto: qualquer asserção quebrada dá RAISE EXCEPTION e o psql sai com
-- erro. Tudo roda em UMA transação que termina em ROLLBACK: não deixa rastro.
--
-- Papéis: o script age como visitante (anon) e como conta (authenticated, com o
-- sub do JWT em request.jwt.claim.sub, que é o que auth.uid() lê).
-- Em Supabase real os objetos novos nascem com grant para anon/authenticated
-- (default privileges); os testes dependem de a migração REVOGAR isso. Para
-- provar, rode antes das migrações:
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
-- =============================================================================
\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA t_topicos;
GRANT USAGE ON SCHEMA t_topicos TO PUBLIC;
CREATE TABLE t_topicos.placar (n integer NOT NULL);
INSERT INTO t_topicos.placar VALUES (0);
CREATE TABLE t_topicos.ids (chave text PRIMARY KEY, id uuid NOT NULL);
GRANT ALL ON t_topicos.placar, t_topicos.ids TO PUBLIC;

CREATE FUNCTION t_topicos.ok(p_condicao boolean, p_mensagem text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE t_topicos.placar SET n = n + 1;
  IF p_condicao IS NOT TRUE THEN RAISE EXCEPTION 'TESTE FALHOU: %', p_mensagem; END IF;
END $$;

-- Executa p_sql e exige erro com o SQLSTATE (e o HINT, se informado).
CREATE FUNCTION t_topicos.erro(p_sql text, p_state text, p_hint text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_state text; v_hint text; v_msg text;
BEGIN
  UPDATE t_topicos.placar SET n = n + 1;
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_hint = PG_EXCEPTION_HINT;
    v_state := SQLSTATE; v_msg := SQLERRM;
    IF v_state <> p_state OR (p_hint IS NOT NULL AND v_hint IS DISTINCT FROM p_hint) THEN
      RAISE EXCEPTION 'TESTE FALHOU: esperava % / % mas veio % / % (%) em: %', p_state, p_hint, v_state, v_hint, v_msg, p_sql;
    END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'TESTE FALHOU: esperava erro % em: %', p_state, p_sql;
END $$;

CREATE FUNCTION t_topicos.guardar(p_chave text, p_id uuid) RETURNS void LANGUAGE sql AS $$
  INSERT INTO t_topicos.ids VALUES (p_chave, p_id) ON CONFLICT (chave) DO UPDATE SET id = EXCLUDED.id $$;
CREATE FUNCTION t_topicos.pegar(p_chave text) RETURNS uuid LANGUAGE sql AS $$
  SELECT id FROM t_topicos.ids WHERE chave = p_chave $$;

-- Atores. Promovida = e-mail e não anônima (aue_e_conta_promovida).
INSERT INTO auth.users (id, email, is_anonymous) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'a@teste.aue', false),
  ('a0000000-0000-0000-0000-000000000002', 'b@teste.aue', false),
  ('a0000000-0000-0000-0000-000000000003', 'c@teste.aue', false),
  ('a0000000-0000-0000-0000-000000000004', 'd@teste.aue', false),
  ('a0000000-0000-0000-0000-000000000005', NULL, true),
  ('a0000000-0000-0000-0000-000000000006', 'casa@teste.aue', false);
-- Promovida também exige o perfil social concluído (20261018000011).
UPDATE public.perfis SET perfil_social_concluido_em = now()
 WHERE id IN (SELECT id FROM auth.users WHERE email IS NOT NULL AND NOT is_anonymous AND id::text LIKE 'a0000000-%');
INSERT INTO public.contas_da_casa (usuario_id, papel) VALUES ('a0000000-0000-0000-0000-000000000006', 'personagem');

\set como_admin 'RESET ROLE;'
\set como_visitante 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'','''',true); END$$; SET ROLE anon;'
\set como_a 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''a0000000-0000-0000-0000-000000000001'',true); END$$; SET ROLE authenticated;'
\set como_b 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''a0000000-0000-0000-0000-000000000002'',true); END$$; SET ROLE authenticated;'
\set como_c 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''a0000000-0000-0000-0000-000000000003'',true); END$$; SET ROLE authenticated;'
\set como_d 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''a0000000-0000-0000-0000-000000000004'',true); END$$; SET ROLE authenticated;'
\set como_sessao_anonima 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''a0000000-0000-0000-0000-000000000005'',true); END$$; SET ROLE authenticated;'

-- =============================================================================
-- 1. Estrutura, grants e RLS
-- =============================================================================
:como_admin
DO $t$
DECLARE v_tabela text; v_papel text; v_priv text; v_fn text;
BEGIN
  FOREACH v_tabela IN ARRAY ARRAY['topicos', 'respostas', 'denuncias_conversa'] LOOP
    PERFORM t_topicos.ok((SELECT relrowsecurity FROM pg_class WHERE oid = ('public.' || v_tabela)::regclass), 'RLS ligada em ' || v_tabela);
    FOREACH v_papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      FOREACH v_priv IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
        PERFORM t_topicos.ok(NOT has_table_privilege(v_papel, 'public.' || v_tabela, v_priv), v_papel || ' sem ' || v_priv || ' em ' || v_tabela);
      END LOOP;
    END LOOP;
    PERFORM t_topicos.ok(NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = v_tabela), 'sem policy em ' || v_tabela);
  END LOOP;

  -- leituras: anon e authenticated
  FOREACH v_fn IN ARRAY ARRAY[
    'public.listar_topicos(text,integer,timestamptz,uuid,text,boolean)',
    'public.obter_topico(uuid)',
    'public.listar_respostas_do_topico(uuid,integer,timestamptz,uuid)'] LOOP
    PERFORM t_topicos.ok(has_function_privilege('anon', v_fn, 'EXECUTE') AND has_function_privilege('authenticated', v_fn, 'EXECUTE'), 'leitura pública ' || v_fn);
  END LOOP;
  -- escritas: só authenticated
  FOREACH v_fn IN ARRAY ARRAY[
    'public.criar_topico(text,text,text,uuid,boolean)', 'public.responder_topico(uuid,text,uuid)',
    'public.editar_topico(uuid,text,text)', 'public.editar_resposta(uuid,text)',
    'public.apagar_topico(uuid)', 'public.apagar_resposta(uuid)',
    'public.denunciar_topico(uuid,text)', 'public.denunciar_resposta(uuid,text)'] LOOP
    PERFORM t_topicos.ok(NOT has_function_privilege('anon', v_fn, 'EXECUTE') AND has_function_privilege('authenticated', v_fn, 'EXECUTE'), 'escrita só authenticated ' || v_fn);
    -- Autor nunca é parâmetro: nenhum argumento chama autor/user/usuario.
    PERFORM t_topicos.ok(NOT EXISTS (
      SELECT 1 FROM pg_proc p, unnest(p.proargnames) n
       WHERE p.oid = v_fn::regprocedure AND n ~* '(autor|user|usuario)'), 'sem parâmetro de autor em ' || v_fn);
  END LOOP;
  -- internos: ninguém de fora executa
  FOREACH v_fn IN ARRAY ARRAY[
    'public.aue_ler_topicos(text,uuid,integer,text,timestamptz,uuid,boolean)', 'public.aue_exigir_participacao(uuid)',
    'public.aue_falhar_conversa(text,text,text)', 'public.aue_aparar_texto(text)',
    'public.aue_espelhar_post(uuid)', 'public.aue_espelhar_comentario(uuid)', 'public.aue_conferir_acervo()',
    'public.aue_migrar_acervo_para_topicos()', 'public.aue_obter_comunidade_acervo()', 'public.aue_titulo_do_acervo(text,text,text)',
    'public.aue_trigger_espelhar_post()', 'public.aue_trigger_espelhar_comentario()', 'public.aue_trigger_espelhar_escondido()',
    'public.aue_trigger_espelhar_post_apagado()', 'public.aue_trigger_espelhar_comentario_apagado()'] LOOP
    PERFORM t_topicos.ok(NOT has_function_privilege('anon', v_fn, 'EXECUTE') AND NOT has_function_privilege('authenticated', v_fn, 'EXECUTE'), 'interno fechado ' || v_fn);
  END LOOP;

  -- resposta.pai_id do mesmo tópico: FK composta existe
  PERFORM t_topicos.ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'respostas_pai_do_mesmo_topico' AND contype = 'f'), 'FK composta pai do mesmo tópico');
END $t$;

-- As RPCs antigas mantêm assinatura e retorno (o frontend atual ainda as usa).
DO $t$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('publicar_causo', 'p_slug_da_comunidade text, p_conteudo text, p_resultado_id uuid, p_consentimento_audio_publico boolean', 'posts_comunidade'),
    ('criar_comentario', 'p_conteudo text, p_post_id uuid, p_result_id uuid, p_resposta_a_id uuid', 'comentarios'),
    ('apagar_meu_causo', 'p_post_id uuid', 'boolean'),
    ('denunciar_causo', 'p_post_id uuid, p_motivo text', 'boolean'),
    ('listar_comentarios', 'p_post_id uuid, p_result_id uuid', 'TABLE(id uuid, content text, created_at timestamp with time zone, user_id uuid, apelido text, avatar_url text, resposta_a_id uuid, nivel smallint, handle text)'),
    ('listar_feed_de_causos', 'p_topico text, p_limite integer, p_autor_id uuid, p_curtidos_por uuid, p_post_id uuid, p_seguindo boolean',
     'TABLE(id uuid, user_id uuid, apelido text, handle text, url_do_avatar text, topico text, conteudo text, resultado_id uuid, nota numeric, duracao numeric, subtipo_de_origem text, caminho_do_audio text, criado_em timestamp with time zone, total_comentarios bigint, curtidas bigint, reposts bigint, fogo bigint, nojo bigint, trofeu bigint, minhas text[], caminho_do_audio_da_casa text, comunidade_id uuid, comunidade_slug text, comunidade_nome text)')
  ) AS v(nome, args, retorno) LOOP
    PERFORM t_topicos.ok((SELECT count(*) FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = r.nome) = 1,
      'RPC antiga ' || r.nome || ' continua com uma só assinatura');
    PERFORM t_topicos.ok(EXISTS (
      SELECT 1 FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = r.nome
         AND pg_get_function_identity_arguments(p.oid) = r.args AND pg_get_function_result(p.oid) = r.retorno),
      'RPC antiga ' || r.nome || ' mantém argumentos e retorno');
  END LOOP;
END $t$;

-- =============================================================================
-- 2. Visitante e conta sem promoção não escrevem
-- =============================================================================
:como_visitante
DO $t$ BEGIN
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 'x', 'y')$$, '42501');
  PERFORM t_topicos.erro($$SELECT public.responder_topico(gen_random_uuid(), 'y')$$, '42501');
  PERFORM t_topicos.erro($$SELECT public.editar_topico(gen_random_uuid(), 'y')$$, '42501');
  PERFORM t_topicos.erro($$SELECT public.editar_resposta(gen_random_uuid(), 'y')$$, '42501');
  PERFORM t_topicos.erro($$SELECT public.apagar_topico(gen_random_uuid())$$, '42501');
  PERFORM t_topicos.erro($$SELECT public.apagar_resposta(gen_random_uuid())$$, '42501');
  PERFORM t_topicos.erro($$SELECT public.denunciar_topico(gen_random_uuid(), 'spam')$$, '42501');
  PERFORM t_topicos.erro($$SELECT public.denunciar_resposta(gen_random_uuid(), 'spam')$$, '42501');
  -- e as tabelas não abrem para visitante
  PERFORM t_topicos.erro($$SELECT * FROM public.topicos$$, '42501');
  PERFORM t_topicos.erro($$SELECT * FROM public.respostas$$, '42501');
  PERFORM t_topicos.erro($$INSERT INTO public.topicos (comunidade_id, autor_id, titulo) SELECT id, gen_random_uuid(), 'x' FROM public.grupos LIMIT 1$$, '42501');
END $t$;

:como_sessao_anonima
DO $t$ BEGIN
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 'x', 'y')$$, '42501');
  PERFORM t_topicos.erro($$SELECT public.responder_topico(gen_random_uuid(), 'y')$$, '42501');
  PERFORM t_topicos.erro($$SELECT public.denunciar_topico(gen_random_uuid(), 'spam')$$, '42501');
  PERFORM t_topicos.erro($$SELECT public.apagar_topico(gen_random_uuid())$$, '42501');
END $t$;

-- =============================================================================
-- 3. Membro cria tópico e responde; não-membro não
-- =============================================================================
:como_a
DO $t$
DECLARE v_t public.topicos;
BEGIN
  -- Bonde Geral é a entrada automática da conta promovida.
  v_t := public.criar_topico('bonde-geral', '  Primeiro tópico  ', E'Corpo do tópico\ncom duas linhas');
  PERFORM t_topicos.guardar('t1', v_t.id);
  PERFORM t_topicos.ok(v_t.autor_id = 'a0000000-0000-0000-0000-000000000001', 'autor é auth.uid()');
  PERFORM t_topicos.ok(v_t.titulo = 'Primeiro tópico', 'título aparado');
  PERFORM t_topicos.ok(v_t.status = 'aberto' AND NOT v_t.fixado AND v_t.editado_em IS NULL, 'nasce aberto, não fixado, não editado');
  PERFORM t_topicos.ok(NOT v_t.consentimento_audio_publico AND v_t.resultado_id IS NULL, 'sem áudio por padrão');
  PERFORM public.entrar_na_comunidade('cerveja-gelada');
END $t$;

:como_b
DO $t$
DECLARE v_t public.topicos;
BEGIN
  PERFORM t_topicos.erro($$SELECT public.criar_topico('cerveja-gelada', 'Quero postar', 'sem ter entrado')$$, '42501', 'nao_e_membro');
  PERFORM public.entrar_na_comunidade('cerveja-gelada');
  v_t := public.criar_topico('cerveja-gelada', 'Long neck ou lata?', 'Qual arrota melhor.');
  PERFORM t_topicos.guardar('t2', v_t.id);
END $t$;

:como_c
DO $t$
BEGIN
  -- Conta promovida, mas nunca entrou na cerveja-gelada: não cria nem responde.
  PERFORM t_topicos.erro($$SELECT public.criar_topico('cerveja-gelada', 'Posso?', 'não')$$, '42501', 'nao_e_membro');
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, 'não sou membro')$$, t_topicos.pegar('t2')), '42501', 'nao_e_membro');
  -- Comunidade que não existe.
  PERFORM t_topicos.erro($$SELECT public.criar_topico('nao-existe', 'x', 'y')$$, '22023', 'comunidade_inexistente');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('', 'x', 'y')$$, '22023', 'comunidade_inexistente');
  PERFORM t_topicos.erro($$SELECT public.criar_topico(NULL, 'x', 'y')$$, '22023', 'comunidade_inexistente');
END $t$;

-- Respostas e árvore (níveis 0, 1, 2 e teto no 2).
:como_a
DO $t$
DECLARE v_t2 uuid := t_topicos.pegar('t2'); v_r public.respostas;
BEGIN
  PERFORM public.entrar_na_comunidade('cerveja-gelada');
  v_r := public.responder_topico(v_t2, 'Lata, sem dúvida');
  PERFORM t_topicos.guardar('r1', v_r.id);
  PERFORM t_topicos.ok(v_r.nivel = 0 AND v_r.pai_id IS NULL AND v_r.autor_id = 'a0000000-0000-0000-0000-000000000001' AND v_r.status = 'visivel', 'resposta raiz');
END $t$;
:como_b
DO $t$
DECLARE v_r public.respostas;
BEGIN
  v_r := public.responder_topico(t_topicos.pegar('t2'), 'Discordo', t_topicos.pegar('r1'));
  PERFORM t_topicos.guardar('r2', v_r.id);
  PERFORM t_topicos.ok(v_r.nivel = 1 AND v_r.pai_id = t_topicos.pegar('r1'), 'resposta a resposta: nível 1');
END $t$;
:como_a
DO $t$
DECLARE v_r public.respostas;
BEGIN
  v_r := public.responder_topico(t_topicos.pegar('t2'), 'Prove', t_topicos.pegar('r2'));
  PERFORM t_topicos.guardar('r3', v_r.id);
  PERFORM t_topicos.ok(v_r.nivel = 2, 'nível 2');
END $t$;
:como_b
DO $t$
DECLARE v_r public.respostas;
BEGIN
  v_r := public.responder_topico(t_topicos.pegar('t2'), 'Provei', t_topicos.pegar('r3'));
  PERFORM t_topicos.guardar('r4', v_r.id);
  PERFORM t_topicos.ok(v_r.nivel = 2 AND v_r.pai_id = t_topicos.pegar('r3'), 'responder o nível 2 fica no 2, apontando para o respondido');
END $t$;

-- Resposta cujo pai é de outro tópico (ou não existe) é recusada.
:como_a
DO $t$ BEGIN
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, 'pai de outro tópico', %L)$$, t_topicos.pegar('t1'), t_topicos.pegar('r1')), '22023', 'pai_invalido');
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, 'pai fantasma', %L)$$, t_topicos.pegar('t1'), gen_random_uuid()), '22023', 'pai_invalido');
  PERFORM t_topicos.erro($$SELECT public.responder_topico(gen_random_uuid(), 'tópico fantasma')$$, '22023', 'topico_nao_encontrado');
  PERFORM t_topicos.erro($$SELECT public.responder_topico(NULL, 'tópico nulo')$$, '22023', 'topico_nao_encontrado');
END $t$;
-- E a FK composta barra o mesmo vício por qualquer outro caminho.
:como_admin
DO $t$ BEGIN
  PERFORM t_topicos.erro(format($$INSERT INTO public.respostas (topico_id, pai_id, nivel, autor_id, corpo)
    VALUES (%L, %L, 1, 'a0000000-0000-0000-0000-000000000001', 'cross-topic')$$, t_topicos.pegar('t1'), t_topicos.pegar('r1')), '23503');
  PERFORM t_topicos.erro(format($$INSERT INTO public.respostas (topico_id, pai_id, nivel, autor_id, corpo)
    VALUES (%L, NULL, 1, 'a0000000-0000-0000-0000-000000000001', 'nivel sem pai')$$, t_topicos.pegar('t1')), '23514');
END $t$;

-- Atividade e contagem real.
DO $t$
DECLARE v_antes timestamptz; v_depois timestamptz; v_total bigint;
BEGIN
  UPDATE public.topicos SET ultima_atividade_em = '2020-01-01 00:00:00+00' WHERE id = t_topicos.pegar('t2');
END $t$;
:como_a
DO $t$
DECLARE v_total bigint; v_ult timestamptz;
BEGIN
  PERFORM public.responder_topico(t_topicos.pegar('t2'), 'Mais uma');
  SELECT respostas_total, ultima_atividade_em INTO v_total, v_ult FROM public.obter_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(v_total = 5, 'respostas_total real (5), veio ' || v_total);
  PERFORM t_topicos.ok(v_ult > '2021-01-01', 'responder atualiza ultima_atividade_em');
END $t$;

-- =============================================================================
-- 4. Visitante lê o que é público
-- =============================================================================
:como_visitante
DO $t$
DECLARE v_n integer; v_l record;
BEGIN
  SELECT count(*) INTO v_n FROM public.listar_comunidades_sociais();
  PERFORM t_topicos.ok(v_n >= 9, 'visitante lê comunidades');
  SELECT * INTO v_l FROM public.listar_topicos('cerveja-gelada');
  PERFORM t_topicos.ok(v_l.id = t_topicos.pegar('t2') AND v_l.respostas_total = 5, 'visitante lê tópicos com contagem');
  PERFORM t_topicos.ok(v_l.apelido IS NOT NULL AND v_l.handle IS NOT NULL AND v_l.comunidade_slug = 'cerveja-gelada' AND v_l.autor_id = 'a0000000-0000-0000-0000-000000000002', 'autor e comunidade no tópico');
  PERFORM t_topicos.ok(NOT v_l.sou_autor, 'visitante não é autor');
  SELECT count(*) INTO v_n FROM public.obter_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(v_n = 1, 'visitante obtém tópico');
  SELECT count(*) INTO v_n FROM public.listar_respostas_do_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(v_n = 5, 'visitante lê as 5 respostas');
  SELECT count(*) INTO v_n FROM public.listar_respostas_do_topico(t_topicos.pegar('t2')) WHERE apelido IS NOT NULL AND handle IS NOT NULL;
  PERFORM t_topicos.ok(v_n = 5, 'respostas trazem autor');
  -- slug inexistente: lista vazia, sem erro
  SELECT count(*) INTO v_n FROM public.listar_topicos('nao-existe');
  PERFORM t_topicos.ok(v_n = 0, 'comunidade inexistente lista vazio');
  PERFORM t_topicos.erro($$SELECT * FROM public.listar_topicos(NULL)$$, '22023', 'comunidade_inexistente');
END $t$;
:como_a
DO $t$
DECLARE v_l record;
BEGIN
  SELECT * INTO v_l FROM public.listar_topicos('cerveja-gelada');
  PERFORM t_topicos.ok(NOT v_l.sou_autor, 'A não é autora do t2');
  SELECT * INTO v_l FROM public.listar_topicos('bonde-geral');
  PERFORM t_topicos.ok(v_l.sou_autor AND v_l.id = t_topicos.pegar('t1'), 'A é autora do t1');
END $t$;

-- =============================================================================
-- 5. Tópico fechado / oculto / removido recusa resposta e some da leitura
-- =============================================================================
:como_admin
UPDATE public.topicos SET status = 'fechado' WHERE id = (SELECT t_topicos.pegar('t2'));
:como_a
DO $t$
DECLARE v_n integer;
BEGIN
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, 'em fechado')$$, t_topicos.pegar('t2')), '55000', 'topico_fechado');
  PERFORM t_topicos.erro(format($$SELECT public.editar_resposta(%L, 'em fechado')$$, t_topicos.pegar('r1')), '55000', 'topico_fechado');
  SELECT count(*) INTO v_n FROM public.obter_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(v_n = 1, 'fechado continua legível');
END $t$;
:como_b
DO $t$ BEGIN
  PERFORM t_topicos.erro(format($$SELECT public.editar_topico(%L, 'novo título')$$, t_topicos.pegar('t2')), '55000', 'topico_fechado');
END $t$;
:como_admin
UPDATE public.topicos SET status = 'oculto' WHERE id = (SELECT t_topicos.pegar('t2'));
:como_a
DO $t$
DECLARE v_n integer;
BEGIN
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, 'em oculto')$$, t_topicos.pegar('t2')), '22023', 'topico_nao_encontrado');
  PERFORM t_topicos.erro(format($$SELECT public.denunciar_topico(%L, 'em oculto')$$, t_topicos.pegar('t2')), '22023', 'topico_nao_encontrado');
  SELECT count(*) INTO v_n FROM public.obter_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(v_n = 0, 'oculto não é obtido');
  SELECT count(*) INTO v_n FROM public.listar_topicos('cerveja-gelada');
  PERFORM t_topicos.ok(v_n = 0, 'oculto não é listado');
  SELECT count(*) INTO v_n FROM public.listar_respostas_do_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(v_n = 0, 'respostas de tópico oculto não vazam');
END $t$;
:como_b
DO $t$ BEGIN
  -- nem o autor edita ou apaga tópico oculto pela moderação
  PERFORM t_topicos.erro(format($$SELECT public.editar_topico(%L, 'x')$$, t_topicos.pegar('t2')), '22023', 'topico_nao_encontrado');
  PERFORM t_topicos.erro(format($$SELECT public.apagar_topico(%L)$$, t_topicos.pegar('t2')), '22023', 'topico_nao_encontrado');
END $t$;
:como_visitante
DO $t$
DECLARE v_n integer;
BEGIN
  SELECT count(*) INTO v_n FROM public.obter_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(v_n = 0, 'visitante não vê oculto');
  SELECT count(*) INTO v_n FROM public.listar_respostas_do_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(v_n = 0, 'visitante não vê respostas de oculto');
END $t$;
:como_admin
UPDATE public.topicos SET status = 'removido' WHERE id = (SELECT t_topicos.pegar('t2'));
:como_a
DO $t$
DECLARE v_n integer;
BEGIN
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, 'em removido')$$, t_topicos.pegar('t2')), '22023', 'topico_nao_encontrado');
  SELECT count(*) INTO v_n FROM public.listar_topicos('cerveja-gelada');
  PERFORM t_topicos.ok(v_n = 0, 'removido não é listado');
END $t$;
:como_admin
UPDATE public.topicos SET status = 'aberto' WHERE id = (SELECT t_topicos.pegar('t2'));

-- =============================================================================
-- 6. Autor não se forja: tabelas fechadas para escrita direta
-- =============================================================================
:como_a
DO $t$ BEGIN
  PERFORM t_topicos.erro(format($$UPDATE public.topicos SET autor_id = 'a0000000-0000-0000-0000-000000000001' WHERE id = %L$$, t_topicos.pegar('t2')), '42501');
  PERFORM t_topicos.erro(format($$UPDATE public.topicos SET titulo = 'sequestrado' WHERE id = %L$$, t_topicos.pegar('t2')), '42501');
  PERFORM t_topicos.erro(format($$UPDATE public.respostas SET autor_id = 'a0000000-0000-0000-0000-000000000001' WHERE id = %L$$, t_topicos.pegar('r2')), '42501');
  PERFORM t_topicos.erro($$INSERT INTO public.topicos (comunidade_id, autor_id, titulo) SELECT id, 'a0000000-0000-0000-0000-000000000002', 'forjado' FROM public.grupos LIMIT 1$$, '42501');
  PERFORM t_topicos.erro(format($$INSERT INTO public.respostas (topico_id, autor_id, corpo) VALUES (%L, 'a0000000-0000-0000-0000-000000000002', 'forjada')$$, t_topicos.pegar('t2')), '42501');
  PERFORM t_topicos.erro(format($$DELETE FROM public.topicos WHERE id = %L$$, t_topicos.pegar('t2')), '42501');
  PERFORM t_topicos.erro($$SELECT * FROM public.denuncias_conversa$$, '42501');
END $t$;
:como_admin
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT titulo FROM public.topicos WHERE id = t_topicos.pegar('t2')) = 'Long neck ou lata?', 'título não mudou');
  PERFORM t_topicos.ok((SELECT autor_id FROM public.respostas WHERE id = t_topicos.pegar('r2')) = 'a0000000-0000-0000-0000-000000000002', 'autor da resposta não mudou');
END $t$;

-- =============================================================================
-- 7. Limites de título, corpo e resposta (borda; emoji conta 1)
-- =============================================================================
:como_a
DO $t$
DECLARE v_t public.topicos; v_r public.respostas;
BEGIN
  v_t := public.criar_topico('bonde-geral', repeat('a', 120), 'ok');
  PERFORM t_topicos.ok(char_length(v_t.titulo) = 120, 'título de 120 passa');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', repeat('a', 121), 'ok')$$, '22023', 'titulo_invalido');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', '', 'ok')$$, '22023', 'titulo_invalido');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', E'  \n\t ', 'ok')$$, '22023', 'titulo_invalido');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', NULL, 'ok')$$, '22023', 'titulo_invalido');
  v_t := public.criar_topico('bonde-geral', ' ' || repeat('a', 120) || ' ', 'ok');
  PERFORM t_topicos.ok(char_length(v_t.titulo) = 120, 'espaço nas pontas não conta');
  v_t := public.criar_topico('bonde-geral', repeat('😀', 120), 'ok');
  PERFORM t_topicos.ok(char_length(v_t.titulo) = 120 AND octet_length(v_t.titulo) > 120, 'emoji conta 1 (120 emojis passam)');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', repeat('😀', 121), 'ok')$$, '22023', 'titulo_invalido');
  v_t := public.criar_topico('bonde-geral', E'quebra\n\n   de   linha', 'ok');
  PERFORM t_topicos.ok(v_t.titulo = 'quebra de linha', 'título colapsa espaço e quebra de linha');

  v_t := public.criar_topico('bonde-geral', 't', repeat('b', 1000));
  PERFORM t_topicos.ok(char_length(v_t.corpo) = 1000, 'corpo de 1000 passa');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 't', repeat('b', 1001))$$, '22023', 'corpo_invalido');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 't', '')$$, '22023', 'corpo_invalido');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 't', E' \n ')$$, '22023', 'corpo_invalido');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 't', NULL)$$, '22023', 'corpo_invalido');
  v_t := public.criar_topico('bonde-geral', 't', repeat('😀', 1000));
  PERFORM t_topicos.ok(char_length(v_t.corpo) = 1000, 'emoji conta 1 no corpo');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 't', repeat('😀', 1001))$$, '22023', 'corpo_invalido');

  v_r := public.responder_topico(t_topicos.pegar('t1'), repeat('c', 500));
  PERFORM t_topicos.ok(char_length(v_r.corpo) = 500, 'resposta de 500 passa');
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, repeat('c', 501))$$, t_topicos.pegar('t1')), '22023', 'resposta_invalida');
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, '')$$, t_topicos.pegar('t1')), '22023', 'resposta_invalida');
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, NULL)$$, t_topicos.pegar('t1')), '22023', 'resposta_invalida');
  v_r := public.responder_topico(t_topicos.pegar('t1'), repeat('😀', 500));
  PERFORM t_topicos.ok(char_length(v_r.corpo) = 500, 'emoji conta 1 na resposta');
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, repeat('😀', 501))$$, t_topicos.pegar('t1')), '22023', 'resposta_invalida');

  -- Mesmos limites na edição.
  PERFORM t_topicos.erro(format($$SELECT public.editar_topico(%L, repeat('a', 121))$$, t_topicos.pegar('t1')), '22023', 'titulo_invalido');
  PERFORM t_topicos.erro(format($$SELECT public.editar_topico(%L, NULL, repeat('b', 1001))$$, t_topicos.pegar('t1')), '22023', 'corpo_invalido');
  PERFORM t_topicos.erro(format($$SELECT public.editar_topico(%L)$$, t_topicos.pegar('t1')), '22023', 'nada_para_editar');
  PERFORM t_topicos.erro(format($$SELECT public.editar_resposta(%L, repeat('c', 501))$$, t_topicos.pegar('r1')), '22023', 'resposta_invalida');
END $t$;
:como_admin
DO $t$ BEGIN
  -- o banco também segura o limite, sem passar pela RPC
  PERFORM t_topicos.erro($$INSERT INTO public.topicos (comunidade_id, autor_id, titulo) SELECT id, 'a0000000-0000-0000-0000-000000000001', repeat('a', 121) FROM public.grupos LIMIT 1$$, '23514');
  PERFORM t_topicos.erro($$INSERT INTO public.topicos (comunidade_id, autor_id, titulo, status) SELECT id, 'a0000000-0000-0000-0000-000000000001', 't', 'qualquer' FROM public.grupos LIMIT 1$$, '23514');
END $t$;

-- =============================================================================
-- 8. Editar e apagar: só o autor; apagar não é DELETE físico
-- =============================================================================
:como_b
DO $t$ BEGIN
  PERFORM t_topicos.erro(format($$SELECT public.editar_topico(%L, 'invasão')$$, t_topicos.pegar('t1')), '42501', 'nao_e_autor');
  PERFORM t_topicos.erro(format($$SELECT public.apagar_topico(%L)$$, t_topicos.pegar('t1')), '42501', 'nao_e_autor');
  PERFORM t_topicos.erro(format($$SELECT public.editar_resposta(%L, 'invasão')$$, t_topicos.pegar('r1')), '42501', 'nao_e_autor');
  PERFORM t_topicos.erro(format($$SELECT public.apagar_resposta(%L)$$, t_topicos.pegar('r1')), '42501', 'nao_e_autor');
END $t$;
:como_a
DO $t$
DECLARE v_t public.topicos; v_r public.respostas;
BEGIN
  v_t := public.editar_topico(t_topicos.pegar('t1'), 'Título editado');
  PERFORM t_topicos.ok(v_t.titulo = 'Título editado' AND v_t.editado_em IS NOT NULL AND v_t.corpo LIKE 'Corpo do tópico%', 'editar só o título mantém o corpo');
  v_t := public.editar_topico(t_topicos.pegar('t1'), NULL, 'Corpo novo');
  PERFORM t_topicos.ok(v_t.titulo = 'Título editado' AND v_t.corpo = 'Corpo novo', 'editar só o corpo mantém o título');
  v_r := public.editar_resposta(t_topicos.pegar('r1'), 'Lata, e ponto');
  PERFORM t_topicos.ok(v_r.corpo = 'Lata, e ponto' AND v_r.editado_em IS NOT NULL, 'autor edita a resposta');
END $t$;

-- Apagar resposta com filhas: vira casca (sem corpo nem autor) e a árvore fica de pé.
:como_a
DO $t$
DECLARE v_ok boolean;
BEGIN
  v_ok := public.apagar_resposta(t_topicos.pegar('r1'));
  PERFORM t_topicos.ok(v_ok, 'apagar_resposta devolve true');
  PERFORM t_topicos.erro(format($$SELECT public.apagar_resposta(%L)$$, t_topicos.pegar('r1')), '22023', 'resposta_nao_encontrada');
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, 'a removida', %L)$$, t_topicos.pegar('t2'), t_topicos.pegar('r1')), '22023', 'pai_invalido');
END $t$;
:como_admin
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT status FROM public.respostas WHERE id = t_topicos.pegar('r1')) = 'removido', 'resposta apagada fica no banco como removido');
END $t$;
:como_visitante
DO $t$
DECLARE v_casca record; v_n integer; v_total bigint;
BEGIN
  SELECT * INTO v_casca FROM public.listar_respostas_do_topico(t_topicos.pegar('t2')) WHERE id = t_topicos.pegar('r1');
  PERFORM t_topicos.ok(v_casca.id IS NOT NULL AND v_casca.corpo IS NULL AND v_casca.autor_id IS NULL AND v_casca.apelido IS NULL AND v_casca.status = 'removido',
    'casca da resposta removida não vaza conteúdo nem autor');
  SELECT count(*) INTO v_n FROM public.listar_respostas_do_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(v_n = 5, 'filhas continuam visíveis sob a casca (5 linhas: 1 casca + 4)');
  SELECT respostas_total INTO v_total FROM public.obter_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(v_total = 4, 'respostas_total não conta a removida');
END $t$;
-- Folha apagada some de vez; resposta oculta pela moderação sem filha visível também.
:como_b
DO $t$ BEGIN PERFORM public.apagar_resposta(t_topicos.pegar('r4')); END $t$;
:como_admin
UPDATE public.respostas SET status = 'oculto' WHERE id = (SELECT t_topicos.pegar('r3'));
:como_visitante
DO $t$
DECLARE v_ids uuid[]; v_c record;
BEGIN
  SELECT array_agg(id) INTO v_ids FROM public.listar_respostas_do_topico(t_topicos.pegar('t2'));
  PERFORM t_topicos.ok(NOT (t_topicos.pegar('r4') = ANY (v_ids)), 'folha removida não aparece');
  PERFORM t_topicos.ok(NOT (t_topicos.pegar('r3') = ANY (v_ids)), 'oculta sem filha visível não aparece');
  PERFORM t_topicos.ok(t_topicos.pegar('r2') = ANY (v_ids) AND t_topicos.pegar('r1') = ANY (v_ids), 'r2 visível e r1 casca (pai de r2) aparecem');
END $t$;
:como_admin
UPDATE public.respostas SET status = 'visivel' WHERE id = ANY (ARRAY[t_topicos.pegar('r3'), t_topicos.pegar('r4')]);

-- Apagar tópico: status removido, a linha continua; some da leitura.
:como_a
DO $t$
DECLARE v_n integer;
BEGIN
  PERFORM t_topicos.ok(public.apagar_topico(t_topicos.pegar('t1')), 'apagar_topico devolve true');
  SELECT count(*) INTO v_n FROM public.obter_topico(t_topicos.pegar('t1'));
  PERFORM t_topicos.ok(v_n = 0, 'removido não é obtido');
  PERFORM t_topicos.erro(format($$SELECT public.apagar_topico(%L)$$, t_topicos.pegar('t1')), '22023', 'topico_nao_encontrado');
  PERFORM t_topicos.erro(format($$SELECT public.responder_topico(%L, 'no removido')$$, t_topicos.pegar('t1')), '22023', 'topico_nao_encontrado');
  PERFORM t_topicos.erro(format($$SELECT public.editar_topico(%L, 'no removido')$$, t_topicos.pegar('t1')), '22023', 'topico_nao_encontrado');
END $t$;
:como_admin
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE id = t_topicos.pegar('t1')) = 'removido', 'tópico apagado fica no banco como removido (sem DELETE físico)');
END $t$;

-- =============================================================================
-- 9. Denúncia: uma por pessoa; três pessoas escondem
-- =============================================================================
:como_d
DO $t$
DECLARE v_t public.topicos; v_r public.respostas;
BEGIN
  v_t := public.criar_topico('bonde-geral', 'Tópico polêmico', 'Texto');
  PERFORM t_topicos.guardar('t3', v_t.id);
  v_r := public.responder_topico(v_t.id, 'Resposta polêmica');
  PERFORM t_topicos.guardar('r5', v_r.id);
END $t$;
:como_a
DO $t$ BEGIN
  PERFORM public.denunciar_topico(t_topicos.pegar('t3'), 'spam');
  PERFORM public.denunciar_topico(t_topicos.pegar('t3'), 'spam de novo');
  PERFORM public.denunciar_resposta(t_topicos.pegar('r5'), 'ofensa');
  PERFORM t_topicos.erro(format($$SELECT public.denunciar_topico(%L, 'x')$$, gen_random_uuid()), '22023', 'topico_nao_encontrado');
  PERFORM t_topicos.erro(format($$SELECT public.denunciar_resposta(%L, 'x')$$, gen_random_uuid()), '22023', 'resposta_nao_encontrada');
END $t$;
:como_b
DO $t$ BEGIN PERFORM public.denunciar_topico(t_topicos.pegar('t3'), ''); PERFORM public.denunciar_resposta(t_topicos.pegar('r5'), 'ofensa'); END $t$;
:como_admin
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE id = t_topicos.pegar('t3')) = 'aberto', 'duas pessoas não escondem (a repetida não conta)');
  PERFORM t_topicos.ok((SELECT count(*) FROM public.denuncias_conversa WHERE topico_id = t_topicos.pegar('t3')) = 2, 'denúncia repetida não duplica');
  PERFORM t_topicos.ok((SELECT motivo FROM public.denuncias_conversa WHERE topico_id = t_topicos.pegar('t3') AND usuario_id = 'a0000000-0000-0000-0000-000000000002') = 'Conteúdo impróprio', 'motivo vazio cai no padrão');
END $t$;
:como_c
DO $t$ BEGIN PERFORM public.denunciar_resposta(t_topicos.pegar('r5'), 'terceira'); PERFORM public.denunciar_topico(t_topicos.pegar('t3'), 'terceira'); END $t$;
:como_admin
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE id = t_topicos.pegar('t3')) = 'oculto', 'três denunciantes escondem o tópico');
  PERFORM t_topicos.ok((SELECT status FROM public.respostas WHERE id = t_topicos.pegar('r5')) = 'oculto', 'três denunciantes escondem a resposta');
END $t$;

-- =============================================================================
-- 10. Áudio: nada privado vaza; publicar exige consentimento e resultado próprio
-- =============================================================================
:como_admin
INSERT INTO public.resultados (id, usuario_id, nota, classificacao, duracao, potencia, profundidade, textura, nota_da_origem, tipo_de_origem, caminho_do_audio)
SELECT v.id, v.dono, public.aue_nota_v2(50, 50, 50, 50, public.aue_origin_score_v1('Espontâneo')),
       public.aue_classification_v1(public.aue_nota_v2(50, 50, 50, 50, public.aue_origin_score_v1('Espontâneo'))),
       50, 50, 50, 50, public.aue_origin_score_v1('Espontâneo'), 'Espontâneo', v.caminho
  FROM (VALUES
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001/privado-a.m4a'),
    ('e0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000002/privado-b.m4a')
  ) AS v(id, dono, caminho);
:como_a
DO $t$
DECLARE v_t public.topicos;
BEGIN
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 'com áudio', 'sem consentimento', 'e0000000-0000-0000-0000-000000000001', false)$$, '42501', 'audio_sem_consentimento');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 'com áudio', 'default sem consentimento', 'e0000000-0000-0000-0000-000000000001')$$, '42501', 'audio_sem_consentimento');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 'com áudio', 'resultado de outra pessoa', 'e0000000-0000-0000-0000-000000000002', true)$$, '42501', 'audio_sem_consentimento');
  PERFORM t_topicos.erro($$SELECT public.criar_topico('bonde-geral', 'com áudio', 'resultado fantasma', gen_random_uuid(), true)$$, '42501', 'audio_sem_consentimento');
  v_t := public.criar_topico('bonde-geral', 'Com áudio publicado', 'consentido', 'e0000000-0000-0000-0000-000000000001', true);
  PERFORM t_topicos.guardar('t_audio', v_t.id);
  PERFORM t_topicos.ok(v_t.consentimento_audio_publico AND v_t.resultado_id = 'e0000000-0000-0000-0000-000000000001', 'tópico com áudio consentido');
  v_t := public.criar_topico('bonde-geral', 'Consentimento sem resultado', 'x', NULL, true);
  PERFORM t_topicos.ok(NOT v_t.consentimento_audio_publico, 'consentimento sem resultado não é gravado');
END $t$;
:como_visitante
DO $t$
DECLARE v record;
BEGIN
  SELECT * INTO v FROM public.obter_topico(t_topicos.pegar('t_audio'));
  PERFORM t_topicos.ok(v.caminho_do_audio = 'a0000000-0000-0000-0000-000000000001/privado-a.m4a' AND v.nota IS NOT NULL, 'áudio consentido sai para o visitante');
END $t$;
:como_admin
-- Resultado escondido: o áudio some; consentimento revogado/ausente: nota e áudio somem.
UPDATE public.resultados SET esta_escondido = true WHERE id = 'e0000000-0000-0000-0000-000000000001';
INSERT INTO public.topicos (id, comunidade_id, autor_id, titulo, corpo, resultado_id, consentimento_audio_publico, caminho_do_audio_da_casa)
SELECT 'e1000000-0000-0000-0000-000000000001', id, 'a0000000-0000-0000-0000-000000000002', 'Privado', 'x', 'e0000000-0000-0000-0000-000000000002', false, NULL FROM public.grupos WHERE slug = 'bonde-geral';
INSERT INTO public.topicos (id, comunidade_id, autor_id, titulo, corpo, consentimento_audio_publico, caminho_do_audio_da_casa)
SELECT 'e1000000-0000-0000-0000-000000000002', id, 'a0000000-0000-0000-0000-000000000002', 'Casa de não-casa', 'x', true, 'burpzilla/e1000000-0000-0000-0000-000000000002.m4a' FROM public.grupos WHERE slug = 'bonde-geral';
INSERT INTO public.topicos (id, comunidade_id, autor_id, titulo, corpo, consentimento_audio_publico, caminho_do_audio_da_casa)
SELECT 'e1000000-0000-0000-0000-000000000003', id, 'a0000000-0000-0000-0000-000000000006', 'Da casa', 'x', true, 'burpzilla/e1000000-0000-0000-0000-000000000003.m4a' FROM public.grupos WHERE slug = 'bonde-geral';
INSERT INTO public.topicos (id, comunidade_id, autor_id, titulo, corpo, consentimento_audio_publico, caminho_do_audio_da_casa)
SELECT 'e1000000-0000-0000-0000-000000000004', id, 'a0000000-0000-0000-0000-000000000006', 'Da casa sem consentimento', 'x', false, 'burpzilla/e1000000-0000-0000-0000-000000000004.m4a' FROM public.grupos WHERE slug = 'bonde-geral';
:como_visitante
DO $t$
DECLARE v record;
BEGIN
  SELECT * INTO v FROM public.obter_topico(t_topicos.pegar('t_audio'));
  PERFORM t_topicos.ok(v.caminho_do_audio IS NULL AND v.id IS NOT NULL, 'resultado escondido: sem caminho do áudio');
  SELECT * INTO v FROM public.obter_topico('e1000000-0000-0000-0000-000000000001');
  PERFORM t_topicos.ok(v.id IS NOT NULL AND v.caminho_do_audio IS NULL AND v.nota IS NULL AND v.duracao IS NULL AND v.subtipo_de_origem IS NULL, 'sem consentimento: nem áudio nem nota');
  PERFORM t_topicos.ok(v.resultado_id IS NOT NULL OR v.resultado_id IS NULL, 'resultado_id é só um id');
  SELECT * INTO v FROM public.obter_topico('e1000000-0000-0000-0000-000000000002');
  PERFORM t_topicos.ok(v.caminho_do_audio_da_casa IS NULL, 'áudio da casa só para conta da casa');
  SELECT * INTO v FROM public.obter_topico('e1000000-0000-0000-0000-000000000003');
  PERFORM t_topicos.ok(v.caminho_do_audio_da_casa = 'burpzilla/e1000000-0000-0000-0000-000000000003.m4a', 'conta da casa com consentimento mostra o áudio');
  SELECT * INTO v FROM public.obter_topico('e1000000-0000-0000-0000-000000000004');
  PERFORM t_topicos.ok(v.caminho_do_audio_da_casa IS NULL, 'conta da casa sem consentimento não mostra o áudio');
END $t$;
:como_admin
-- Nenhuma coluna do retorno da leitura é o caminho privado por outro nome.
DO $t$ BEGIN
  PERFORM t_topicos.ok(NOT EXISTS (SELECT 1 FROM pg_proc p, unnest(p.proargnames) n WHERE p.proname IN ('listar_topicos','obter_topico','listar_respostas_do_topico') AND n ~* 'legado'), 'leitura não expõe legado_*');
END $t$;

-- =============================================================================
-- 11. Paginação por cursor estável (empates de data)
-- =============================================================================
INSERT INTO public.topicos (id, comunidade_id, autor_id, titulo, corpo, fixado, status, criado_em, ultima_atividade_em)
SELECT v.id::uuid, g.id, 'a0000000-0000-0000-0000-000000000001', 'T' || v.n, 'x', v.fixado, v.status, v.criado::timestamptz, v.ultima::timestamptz
  FROM public.grupos g,
       (VALUES
        (1, 'f0000000-0000-0000-0000-000000000001', false, 'aberto',   '2026-01-01 10:00+00', '2026-01-01 10:00+00'),
        (2, 'f0000000-0000-0000-0000-000000000002', false, 'aberto',   '2026-01-01 10:00+00', '2026-01-01 10:00+00'),
        (3, 'f0000000-0000-0000-0000-000000000003', false, 'aberto',   '2026-01-01 10:00+00', '2026-01-01 10:00+00'),
        (4, 'f0000000-0000-0000-0000-000000000004', false, 'aberto',   '2026-01-02 10:00+00', '2026-01-02 10:00+00'),
        (5, 'f0000000-0000-0000-0000-000000000005', false, 'aberto',   '2026-01-02 10:00+00', '2026-01-02 10:00+00'),
        (6, 'f0000000-0000-0000-0000-000000000006', false, 'aberto',   '2026-01-01 10:00+00', '2026-01-03 10:00+00'),
        (7, 'f0000000-0000-0000-0000-000000000007', true,  'aberto',   '2026-01-01 00:00+00', '2026-01-01 00:00+00'),
        (8, 'f0000000-0000-0000-0000-000000000008', true,  'aberto',   '2026-01-01 00:00+00', '2026-01-01 00:00+00'),
        (9, 'f0000000-0000-0000-0000-000000000009', false, 'oculto',   '2026-01-05 10:00+00', '2026-01-05 10:00+00'),
        (10,'f0000000-0000-0000-0000-00000000000a', false, 'removido', '2026-01-06 10:00+00', '2026-01-06 10:00+00'),
        (11,'f0000000-0000-0000-0000-00000000000b', false, 'fechado',  '2026-01-04 10:00+00', '2026-01-04 10:00+00')
       ) AS v(n, id, fixado, status, criado, ultima)
 WHERE g.slug = 'refri-cia';
:como_visitante
DO $t$
DECLARE
  v_todos uuid[] := '{}'; v_pag uuid[]; r record; v_cv timestamptz; v_cid uuid; v_cf boolean; v_n integer; v_paginas integer; v_tam integer;
  v_esperado_atividade uuid[] := ARRAY[
    'f0000000-0000-0000-0000-000000000008','f0000000-0000-0000-0000-000000000007',
    'f0000000-0000-0000-0000-00000000000b','f0000000-0000-0000-0000-000000000006',
    'f0000000-0000-0000-0000-000000000005','f0000000-0000-0000-0000-000000000004',
    'f0000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000001']::uuid[];
  v_esperado_recentes uuid[] := ARRAY[
    'f0000000-0000-0000-0000-00000000000b','f0000000-0000-0000-0000-000000000005','f0000000-0000-0000-0000-000000000004',
    'f0000000-0000-0000-0000-000000000006','f0000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000008','f0000000-0000-0000-0000-000000000007']::uuid[];
BEGIN
  FOR r IN SELECT * FROM public.listar_topicos('refri-cia', 100) LOOP v_todos := v_todos || r.id; END LOOP;
  PERFORM t_topicos.ok(v_todos = v_esperado_atividade, 'ordem por atividade: fixados, depois atividade, desempate por id; oculto e removido fora');

  FOREACH v_tam IN ARRAY ARRAY[1, 2, 3, 4, 8, 9, 10] LOOP
    v_pag := '{}'; v_cv := NULL; v_cid := NULL; v_cf := false; v_paginas := 0;
    LOOP
      v_n := 0;
      FOR r IN SELECT * FROM public.listar_topicos('refri-cia', v_tam, v_cv, v_cid, 'atividade', coalesce(v_cf, false)) LOOP
        v_pag := v_pag || r.id; v_cv := r.ultima_atividade_em; v_cid := r.id; v_cf := r.fixado; v_n := v_n + 1;
      END LOOP;
      EXIT WHEN v_n = 0;
      v_paginas := v_paginas + 1;
      EXIT WHEN v_paginas > 30;
    END LOOP;
    PERFORM t_topicos.ok(v_pag = v_esperado_atividade, 'paginação por atividade (limite ' || v_tam || ') sem duplicar nem pular: ' || v_pag::text);
  END LOOP;

  v_todos := '{}';
  FOR r IN SELECT * FROM public.listar_topicos('refri-cia', 100, NULL, NULL, 'recentes') LOOP v_todos := v_todos || r.id; END LOOP;
  PERFORM t_topicos.ok(v_todos = v_esperado_recentes, 'ordem recentes por criado_em com desempate por id');
  FOREACH v_tam IN ARRAY ARRAY[1, 2, 4, 9] LOOP
    v_pag := '{}'; v_cv := NULL; v_cid := NULL; v_paginas := 0;
    LOOP
      v_n := 0;
      FOR r IN SELECT * FROM public.listar_topicos('refri-cia', v_tam, v_cv, v_cid, 'recentes') LOOP
        v_pag := v_pag || r.id; v_cv := r.criado_em; v_cid := r.id; v_n := v_n + 1;
      END LOOP;
      EXIT WHEN v_n = 0;
      v_paginas := v_paginas + 1;
      EXIT WHEN v_paginas > 30;
    END LOOP;
    PERFORM t_topicos.ok(v_pag = v_esperado_recentes, 'paginação recentes (limite ' || v_tam || ') sem duplicar nem pular');
  END LOOP;

  PERFORM t_topicos.erro($$SELECT * FROM public.listar_topicos('refri-cia', 10, now(), NULL)$$, '22023', 'cursor_invalido');
  PERFORM t_topicos.erro($$SELECT * FROM public.listar_topicos('refri-cia', 10, NULL, gen_random_uuid())$$, '22023', 'cursor_invalido');
  PERFORM t_topicos.erro($$SELECT * FROM public.listar_topicos('refri-cia', 10, NULL, NULL, 'aleatoria')$$, '22023', 'ordem_invalida');
  SELECT count(*) INTO v_n FROM public.listar_topicos('refri-cia', 0);
  PERFORM t_topicos.ok(v_n = 1, 'limite 0 vira 1');
  SELECT count(*) INTO v_n FROM public.listar_topicos('refri-cia', 100000);
  PERFORM t_topicos.ok(v_n = 9, 'limite gigante é limitado');
END $t$;

-- Respostas: cursor (criado_em, id) com empates.
:como_admin
INSERT INTO public.respostas (id, topico_id, autor_id, corpo, criado_em)
SELECT ('f1000000-0000-0000-0000-00000000000' || n)::uuid, 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'r' || n,
       CASE WHEN n <= 4 THEN '2026-02-01 10:00+00'::timestamptz ELSE '2026-02-02 10:00+00'::timestamptz END
  FROM generate_series(1, 7) AS n;
:como_visitante
DO $t$
DECLARE v_todos uuid[] := '{}'; v_pag uuid[]; r record; v_cv timestamptz; v_cid uuid; v_n integer; v_tam integer; v_paginas integer;
BEGIN
  FOR r IN SELECT * FROM public.listar_respostas_do_topico('f0000000-0000-0000-0000-000000000001', 100) LOOP v_todos := v_todos || r.id; END LOOP;
  PERFORM t_topicos.ok(array_length(v_todos, 1) = 7, 'sete respostas');
  FOREACH v_tam IN ARRAY ARRAY[1, 2, 3, 7] LOOP
    v_pag := '{}'; v_cv := NULL; v_cid := NULL; v_paginas := 0;
    LOOP
      v_n := 0;
      FOR r IN SELECT * FROM public.listar_respostas_do_topico('f0000000-0000-0000-0000-000000000001', v_tam, v_cv, v_cid) LOOP
        v_pag := v_pag || r.id; v_cv := r.criado_em; v_cid := r.id; v_n := v_n + 1;
      END LOOP;
      EXIT WHEN v_n = 0;
      v_paginas := v_paginas + 1;
      EXIT WHEN v_paginas > 30;
    END LOOP;
    PERFORM t_topicos.ok(v_pag = v_todos, 'paginação de respostas (limite ' || v_tam || ') sem duplicar nem pular');
  END LOOP;
  PERFORM t_topicos.erro($$SELECT * FROM public.listar_respostas_do_topico('f0000000-0000-0000-0000-000000000001', 10, now(), NULL)$$, '22023', 'cursor_invalido');
END $t$;

-- =============================================================================
-- 12. Backfill do acervo (aplicado com os espelhos DESLIGADOS, como dado antigo)
-- =============================================================================
:como_admin
ALTER TABLE public.posts_comunidade DISABLE TRIGGER aue_espelha_post_no_topico;
ALTER TABLE public.posts_comunidade DISABLE TRIGGER aue_espelha_escondido_no_topico;
ALTER TABLE public.posts_comunidade DISABLE TRIGGER aue_espelha_post_apagado_no_topico;
ALTER TABLE public.comentarios DISABLE TRIGGER aue_espelha_comentario_na_resposta;
ALTER TABLE public.comentarios DISABLE TRIGGER aue_espelha_comentario_apagado_na_resposta;

DO $t$ BEGIN
  PERFORM t_topicos.ok(NOT EXISTS (SELECT 1 FROM public.grupos WHERE slug = 'acervo'), 'acervo ainda não existe (criação é sob demanda)');
END $t$;

INSERT INTO public.posts_comunidade (id, group_id, user_id, post_type, result_id, social_network, social_url, topic, content, created_at, esta_escondido, consentimento_audio_publico, caminho_do_audio_da_casa)
SELECT v.id::uuid, (SELECT g.id FROM public.grupos g WHERE g.slug = v.slug), v.autor::uuid, v.tipo, v.resultado::uuid, v.rede, v.url, coalesce(v.slug, 'Todos'), v.conteudo, v.criado::timestamptz, v.escondido, v.consente, v.casa
  FROM (VALUES
    ('b0000000-0000-0000-0000-000000000001', 'cerveja-gelada',      'a0000000-0000-0000-0000-000000000001', 'text_announcement', NULL, NULL, NULL, E'  \nPrimeira linha do causo\nsegunda linha', '2025-03-01 12:00+00', false, false, NULL),
    ('b0000000-0000-0000-0000-000000000002', 'bonde-geral',         'a0000000-0000-0000-0000-000000000002', 'text_announcement', NULL, NULL, NULL, 'Escondido', '2025-03-02 12:00+00', true, false, NULL),
    ('b0000000-0000-0000-0000-000000000003', NULL,                  'a0000000-0000-0000-0000-000000000003', 'text_announcement', NULL, NULL, NULL, 'Sem comunidade', '2025-03-03 12:00+00', false, false, NULL),
    ('b0000000-0000-0000-0000-000000000004', 'churrasco-raiz',      'a0000000-0000-0000-0000-000000000004', 'social_link', NULL, 'TikTok', 'https://tiktok.com/x', NULL, '2025-03-04 12:00+00', false, false, NULL),
    ('b0000000-0000-0000-0000-000000000005', 'historias-de-arroto', 'a0000000-0000-0000-0000-000000000001', 'audio_result', 'e0000000-0000-0000-0000-000000000002', NULL, NULL, NULL, '2025-03-05 12:00+00', false, true, NULL),
    ('b0000000-0000-0000-0000-000000000006', 'reuniao-da-firma',    'a0000000-0000-0000-0000-000000000002', 'text_announcement', NULL, NULL, NULL, repeat('x', 200) || E'\noutra', '2025-03-06 12:00+00', false, false, NULL),
    ('b0000000-0000-0000-0000-000000000007', 'primeiro-encontro',   'a0000000-0000-0000-0000-000000000002', 'text_announcement', NULL, NULL, NULL, NULL, '2025-03-07 12:00+00', false, false, NULL),
    ('b0000000-0000-0000-0000-000000000008', 'trovao-da-madrugada', 'a0000000-0000-0000-0000-000000000003', 'text_announcement', NULL, NULL, NULL, repeat('y', 2000), '2025-03-08 12:00+00', false, false, NULL),
    ('b0000000-0000-0000-0000-000000000009', 'eu-arroto-e-dai',     'a0000000-0000-0000-0000-000000000006', 'text_announcement', NULL, NULL, NULL, 'Fala da casa', '2025-03-09 12:00+00', false, true, 'burpzilla/b0000000-0000-0000-0000-000000000009.m4a'),
    ('b0000000-0000-0000-0000-00000000000a', 'bonde-geral',         'a0000000-0000-0000-0000-000000000001', 'text_announcement', NULL, NULL, NULL, '😀 caso de emoji', '2025-03-10 12:00+00', false, false, NULL)
  ) AS v(id, slug, autor, tipo, resultado, rede, url, conteudo, criado, escondido, consente, casa);

INSERT INTO public.comentarios (id, user_id, content, created_at, post_id, resposta_a_id, nivel)
SELECT v.id::uuid, v.autor::uuid, v.conteudo, v.criado::timestamptz, v.post::uuid, v.pai::uuid, v.nivel
  FROM (VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'raiz',        '2025-03-01 12:10+00', 'b0000000-0000-0000-0000-000000000001', NULL, 0),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'nível um',    '2025-03-01 12:20+00', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'nível dois',  '2025-03-01 12:30+00', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 2),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'teto do dois','2025-03-01 12:40+00', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 2),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'no escondido','2025-03-02 12:10+00', 'b0000000-0000-0000-0000-000000000002', NULL, 0),
    ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'pai de outro post (dado torto)', '2025-03-01 12:50+00', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 1)
  ) AS v(id, autor, conteudo, criado, post, pai, nivel);
-- Comentário só de resultado (Arena): não é conversa de comunidade, não migra.
INSERT INTO public.comentarios (id, user_id, content, result_id) VALUES
  ('c0000000-0000-0000-0000-0000000000ff', 'a0000000-0000-0000-0000-000000000002', 'comentário da arena', 'e0000000-0000-0000-0000-000000000002');

-- Antes do backfill a conferência acusa a divergência (e a migração abortaria).
DO $t$ BEGIN
  PERFORM t_topicos.erro($$SELECT public.aue_conferir_acervo()$$, 'P0001');
END $t$;

DO $t$
DECLARE v_resumo jsonb;
BEGIN
  v_resumo := public.aue_migrar_acervo_para_topicos();
  PERFORM t_topicos.ok((v_resumo->>'posts')::int = 10 AND (v_resumo->>'topicos')::int = 10, 'inventário: 10 posts, 10 tópicos: ' || v_resumo::text);
  PERFORM t_topicos.ok((v_resumo->>'comentarios')::int = 6 AND (v_resumo->>'respostas')::int = 6, 'inventário: 6 comentários de causo, 6 respostas (o da Arena fica de fora)');
  PERFORM t_topicos.ok((v_resumo->>'posts_escondidos')::int = 1, 'inventário: 1 escondido');
END $t$;

DO $t$
DECLARE t public.topicos; r public.respostas; v_acervo uuid;
BEGIN
  SELECT id INTO v_acervo FROM public.grupos WHERE slug = 'acervo';
  PERFORM t_topicos.ok(v_acervo IS NOT NULL AND (SELECT count(*) FROM public.grupos WHERE slug = 'acervo') = 1, 'acervo criado uma vez');

  SELECT * INTO t FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-000000000001';
  PERFORM t_topicos.ok(t.id = 'b0000000-0000-0000-0000-000000000001', 'ID antigo vira o ID do tópico');
  PERFORM t_topicos.ok(t.titulo = 'Primeira linha do causo', 'título = primeira linha com texto: ' || t.titulo);
  PERFORM t_topicos.ok(t.corpo LIKE E'%Primeira linha do causo\nsegunda linha', 'corpo é o texto original');
  PERFORM t_topicos.ok(t.criado_em = '2025-03-01 12:00+00' AND t.autor_id = 'a0000000-0000-0000-0000-000000000001', 'data e autor originais');
  PERFORM t_topicos.ok(t.ultima_atividade_em = '2025-03-01 12:50+00', 'última atividade = último comentário: ' || t.ultima_atividade_em);
  PERFORM t_topicos.ok(t.comunidade_id = (SELECT id FROM public.grupos WHERE slug = 'cerveja-gelada') AND t.status = 'aberto' AND NOT t.fixado AND t.editado_em IS NULL, 'comunidade de origem, aberto');

  SELECT * INTO t FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-000000000002';
  PERFORM t_topicos.ok(t.status = 'oculto', 'esta_escondido vira oculto');
  SELECT * INTO t FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-000000000003';
  PERFORM t_topicos.ok(t.comunidade_id = v_acervo AND t.titulo = 'Sem comunidade', 'post sem comunidade vai para o acervo');
  SELECT * INTO t FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-000000000004';
  PERFORM t_topicos.ok(t.titulo = 'Link no TikTok' AND t.corpo = 'https://tiktok.com/x', 'social_link: título honesto e endereço no corpo');
  SELECT * INTO t FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-000000000005';
  PERFORM t_topicos.ok(t.titulo = 'Arroto sem legenda' AND t.corpo = '' AND t.resultado_id = 'e0000000-0000-0000-0000-000000000002' AND t.consentimento_audio_publico, 'áudio sem texto: resultado e consentimento preservados');
  SELECT * INTO t FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-000000000006';
  PERFORM t_topicos.ok(char_length(t.titulo) = 81 AND right(t.titulo, 1) = '…' AND left(t.titulo, 80) = repeat('x', 80), 'título longo corta em 80 com reticências');
  SELECT * INTO t FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-000000000007';
  PERFORM t_topicos.ok(t.titulo = 'Causo sem título' AND t.corpo = '', 'sem texto algum: título neutro');
  SELECT * INTO t FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-000000000008';
  PERFORM t_topicos.ok(char_length(t.corpo) = 2000 AND char_length(t.titulo) = 81, 'texto de 2000 (teto da casa) cabe');
  SELECT * INTO t FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-000000000009';
  PERFORM t_topicos.ok(t.caminho_do_audio_da_casa = 'burpzilla/b0000000-0000-0000-0000-000000000009.m4a' AND t.consentimento_audio_publico, 'áudio da casa preservado');
  SELECT * INTO t FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-00000000000a';
  PERFORM t_topicos.ok(t.titulo = '😀 caso de emoji', 'emoji no título');

  -- respostas: pai, nível, ID, data
  SELECT * INTO r FROM public.respostas WHERE legado_comentario_id = 'c0000000-0000-0000-0000-000000000001';
  PERFORM t_topicos.ok(r.pai_id IS NULL AND r.nivel = 0 AND r.topico_id = 'b0000000-0000-0000-0000-000000000001' AND r.criado_em = '2025-03-01 12:10+00' AND r.status = 'visivel', 'raiz migrada');
  SELECT * INTO r FROM public.respostas WHERE legado_comentario_id = 'c0000000-0000-0000-0000-000000000002';
  PERFORM t_topicos.ok(r.pai_id = 'c0000000-0000-0000-0000-000000000001' AND r.nivel = 1, 'nível 1 com pai');
  SELECT * INTO r FROM public.respostas WHERE legado_comentario_id = 'c0000000-0000-0000-0000-000000000003';
  PERFORM t_topicos.ok(r.pai_id = 'c0000000-0000-0000-0000-000000000002' AND r.nivel = 2, 'nível 2 com pai');
  SELECT * INTO r FROM public.respostas WHERE legado_comentario_id = 'c0000000-0000-0000-0000-000000000004';
  PERFORM t_topicos.ok(r.pai_id = 'c0000000-0000-0000-0000-000000000003' AND r.nivel = 2, 'teto do nível 2 preservado');
  SELECT * INTO r FROM public.respostas WHERE legado_comentario_id = 'c0000000-0000-0000-0000-000000000006';
  PERFORM t_topicos.ok(r.pai_id IS NULL AND r.nivel = 0, 'pai de outro post não vira pai');
  PERFORM t_topicos.ok(NOT EXISTS (SELECT 1 FROM public.respostas WHERE legado_comentario_id = 'c0000000-0000-0000-0000-0000000000ff'), 'comentário da Arena não migra');
END $t$;

-- Leitura pública do acervo: visível o aberto, nada do oculto; áudio com consentimento.
:como_visitante
DO $t$
DECLARE v record; v_n integer;
BEGIN
  SELECT * INTO v FROM public.obter_topico('b0000000-0000-0000-0000-000000000001');
  PERFORM t_topicos.ok(v.id IS NOT NULL AND v.respostas_total = 5, 'acervo legível com 5 respostas (c1 a c4 e c6)');
  SELECT count(*) INTO v_n FROM public.obter_topico('b0000000-0000-0000-0000-000000000002');
  PERFORM t_topicos.ok(v_n = 0, 'oculto do acervo não é obtido');
  SELECT count(*) INTO v_n FROM public.listar_respostas_do_topico('b0000000-0000-0000-0000-000000000002');
  PERFORM t_topicos.ok(v_n = 0, 'respostas do oculto não vazam');
  SELECT * INTO v FROM public.obter_topico('b0000000-0000-0000-0000-000000000005');
  PERFORM t_topicos.ok(v.caminho_do_audio = 'a0000000-0000-0000-0000-000000000002/privado-b.m4a' AND v.nota IS NOT NULL, 'áudio do acervo com consentimento continua ligado ao resultado real');
  SELECT count(*) INTO v_n FROM public.listar_topicos('acervo');
  PERFORM t_topicos.ok(v_n = 1, 'o acervo lista o post órfão');
END $t$;

-- Idempotência: rodar de novo não muda nada.
:como_admin
CREATE TEMP TABLE t_foto AS
  SELECT 'topicos' AS t, md5(string_agg(x::text, '|' ORDER BY x.id)) AS h, count(*) AS n FROM public.topicos x WHERE legado_post_id IS NOT NULL
  UNION ALL
  SELECT 'respostas', md5(string_agg(x::text, '|' ORDER BY x.id)), count(*) FROM public.respostas x WHERE legado_comentario_id IS NOT NULL
  UNION ALL
  SELECT 'grupos', md5(string_agg(x::text, '|' ORDER BY x.id)), count(*) FROM public.grupos x;
DO $t$
DECLARE v_resumo jsonb; v_antes record; v_depois record;
BEGIN
  v_resumo := public.aue_migrar_acervo_para_topicos();
  v_resumo := public.aue_migrar_acervo_para_topicos();
  FOR v_antes IN SELECT * FROM t_foto LOOP
    SELECT * INTO v_depois FROM (
      SELECT 'topicos' AS t, md5(string_agg(x::text, '|' ORDER BY x.id)) AS h, count(*) AS n FROM public.topicos x WHERE legado_post_id IS NOT NULL
      UNION ALL
      SELECT 'respostas', md5(string_agg(x::text, '|' ORDER BY x.id)), count(*) FROM public.respostas x WHERE legado_comentario_id IS NOT NULL
      UNION ALL
      SELECT 'grupos', md5(string_agg(x::text, '|' ORDER BY x.id)), count(*) FROM public.grupos x) z WHERE z.t = v_antes.t;
    PERFORM t_topicos.ok(v_depois.h = v_antes.h AND v_depois.n = v_antes.n, 'rodar duas vezes mais não muda ' || v_antes.t);
  END LOOP;
END $t$;

-- Oculto e removido não ressuscitam; apagado no lado antigo não volta.
UPDATE public.topicos SET status = 'removido' WHERE id = 'b0000000-0000-0000-0000-000000000001';
UPDATE public.respostas SET status = 'removido' WHERE id = 'c0000000-0000-0000-0000-000000000001';
UPDATE public.topicos SET status = 'fechado' WHERE id = 'b0000000-0000-0000-0000-000000000006';
DO $t$ BEGIN
  PERFORM public.aue_migrar_acervo_para_topicos();
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE id = 'b0000000-0000-0000-0000-000000000001') = 'removido', 'removido não ressuscita');
  PERFORM t_topicos.ok((SELECT status FROM public.respostas WHERE id = 'c0000000-0000-0000-0000-000000000001') = 'removido', 'resposta removida não ressuscita');
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE id = 'b0000000-0000-0000-0000-000000000006') = 'fechado', 'fechado continua fechado');
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE id = 'b0000000-0000-0000-0000-000000000002') = 'oculto', 'oculto continua oculto');
END $t$;

-- Post apagado no lado antigo com o espelho desligado: a conferência acusa tópico visível de post sumido.
DELETE FROM public.posts_comunidade WHERE id = 'b0000000-0000-0000-0000-000000000008';
DO $t$ BEGIN
  PERFORM t_topicos.erro($$SELECT public.aue_conferir_acervo()$$, 'P0001');
END $t$;

-- =============================================================================
-- 13. Espelho: o frontend antigo continua funcionando e a estrutura nova acompanha
-- =============================================================================
:como_admin
ALTER TABLE public.posts_comunidade ENABLE TRIGGER aue_espelha_post_no_topico;
ALTER TABLE public.posts_comunidade ENABLE TRIGGER aue_espelha_escondido_no_topico;
ALTER TABLE public.posts_comunidade ENABLE TRIGGER aue_espelha_post_apagado_no_topico;
ALTER TABLE public.comentarios ENABLE TRIGGER aue_espelha_comentario_na_resposta;
ALTER TABLE public.comentarios ENABLE TRIGGER aue_espelha_comentario_apagado_na_resposta;
-- Recompõe o estado do passo anterior (post 8 apagado sem espelho) e confere.
UPDATE public.topicos SET status = 'removido' WHERE legado_post_id = 'b0000000-0000-0000-0000-000000000008';
DO $t$ BEGIN
  PERFORM public.aue_conferir_acervo();
  PERFORM t_topicos.ok(true, 'conferência volta a passar com o tópico do post apagado removido');
END $t$;

-- Esconder / mostrar / apagar no lado antigo reflete no novo.
UPDATE public.posts_comunidade SET esta_escondido = true WHERE id = 'b0000000-0000-0000-0000-00000000000a';
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE id = 'b0000000-0000-0000-0000-00000000000a') = 'oculto', 'esconder o post oculta o tópico');
END $t$;
UPDATE public.posts_comunidade SET esta_escondido = false WHERE id = 'b0000000-0000-0000-0000-00000000000a';
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE id = 'b0000000-0000-0000-0000-00000000000a') = 'aberto', 'mostrar o post reabre o tópico oculto');
END $t$;
UPDATE public.topicos SET status = 'removido' WHERE id = 'b0000000-0000-0000-0000-000000000009';
UPDATE public.posts_comunidade SET esta_escondido = false WHERE id = 'b0000000-0000-0000-0000-000000000009';
UPDATE public.posts_comunidade SET esta_escondido = true WHERE id = 'b0000000-0000-0000-0000-000000000009';
UPDATE public.posts_comunidade SET esta_escondido = false WHERE id = 'b0000000-0000-0000-0000-000000000009';
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE id = 'b0000000-0000-0000-0000-000000000009') = 'removido', 'mostrar o post não reabre tópico removido');
END $t$;
DELETE FROM public.comentarios WHERE id = 'c0000000-0000-0000-0000-000000000004';
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT status FROM public.respostas WHERE id = 'c0000000-0000-0000-0000-000000000004') = 'removido', 'apagar o comentário remove a resposta');
END $t$;

-- Fluxo real do frontend antigo, como conta autenticada.
:como_a
DO $t$
DECLARE v_post public.posts_comunidade; v_com public.comentarios; v_com2 public.comentarios; v_n integer; v_t record;
BEGIN
  v_post := public.publicar_causo('bonde-geral', E'Causo do front antigo\nlinha dois');
  PERFORM t_topicos.guardar('p_novo', v_post.id);
  PERFORM t_topicos.ok(v_post.id IS NOT NULL AND v_post.user_id = 'a0000000-0000-0000-0000-000000000001', 'publicar_causo continua funcionando');
  v_com := public.criar_comentario('comentário antigo', v_post.id);
  v_com2 := public.criar_comentario('resposta antiga', v_post.id, NULL, v_com.id);
  PERFORM t_topicos.guardar('c_novo', v_com.id);
  PERFORM t_topicos.ok(v_com2.nivel = 1, 'criar_comentario continua funcionando');
  SELECT count(*) INTO v_n FROM public.listar_feed_de_causos(NULL, 30, NULL, NULL, v_post.id);
  PERFORM t_topicos.ok(v_n = 1, 'listar_feed_de_causos continua funcionando');
  SELECT count(*) INTO v_n FROM public.listar_comentarios(v_post.id);
  PERFORM t_topicos.ok(v_n = 2, 'listar_comentarios continua funcionando');

  SELECT * INTO v_t FROM public.obter_topico(v_post.id);
  PERFORM t_topicos.ok(v_t.id IS NOT NULL AND v_t.titulo = 'Causo do front antigo' AND v_t.autor_id = 'a0000000-0000-0000-0000-000000000001' AND v_t.comunidade_slug = 'bonde-geral', 'post criado no front antigo aparece como tópico');
  PERFORM t_topicos.ok(v_t.respostas_total = 2, 'e os comentários como respostas');
  PERFORM t_topicos.ok((SELECT pai_id FROM public.listar_respostas_do_topico(v_post.id) WHERE id = v_com2.id) = v_com.id, 'com o pai preservado');
END $t$;
:como_admin
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT legado_post_id FROM public.topicos WHERE id = t_topicos.pegar('p_novo')) = t_topicos.pegar('p_novo'), 'legado_post_id preenchido pelo espelho');
END $t$;

-- Apagar e denunciar pelo front antigo.
:como_a
DO $t$ BEGIN PERFORM public.denunciar_causo(t_topicos.pegar('p_novo'), 'teste'); END $t$;
:como_b
DO $t$ BEGIN PERFORM public.denunciar_causo(t_topicos.pegar('p_novo'), 'teste'); END $t$;
:como_c
DO $t$ BEGIN PERFORM public.denunciar_causo(t_topicos.pegar('p_novo'), 'teste'); END $t$;
:como_admin
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT esta_escondido FROM public.posts_comunidade WHERE id = t_topicos.pegar('p_novo')), 'três denúncias escondem o post (regra antiga intacta)');
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE id = t_topicos.pegar('p_novo')) = 'oculto', 'e o tópico espelhado fica oculto');
END $t$;
:como_a
DO $t$
DECLARE v_post public.posts_comunidade;
BEGIN
  v_post := public.publicar_causo('bonde-geral', 'Vou apagar');
  PERFORM t_topicos.ok(public.apagar_meu_causo(v_post.id), 'apagar_meu_causo continua funcionando');
  PERFORM t_topicos.ok((SELECT count(*) FROM public.obter_topico(v_post.id)) = 0, 'post apagado não aparece como tópico');
END $t$;

-- O espelho nunca derruba o INSERT antigo, mesmo quando o INSERT novo falharia.
:como_admin
ALTER TABLE public.topicos ADD CONSTRAINT zz_teste_falha CHECK (false) NOT VALID;
ALTER TABLE public.respostas ADD CONSTRAINT zz_teste_falha CHECK (false) NOT VALID;
:como_a
DO $t$
DECLARE v_post public.posts_comunidade; v_com public.comentarios; v_n integer;
BEGIN
  v_post := public.publicar_causo('bonde-geral', 'Post com espelho quebrado');
  PERFORM t_topicos.guardar('p_quebrado', v_post.id);
  PERFORM t_topicos.ok(v_post.id IS NOT NULL, 'publicar_causo funciona mesmo com o espelho falhando');
  v_com := public.criar_comentario('comentário com espelho quebrado', v_post.id);
  PERFORM t_topicos.guardar('c_quebrado', v_com.id);
  PERFORM t_topicos.ok(v_com.id IS NOT NULL, 'criar_comentario funciona mesmo com o espelho falhando');
  -- A regra de esconder do lado antigo também segue funcionando.
  PERFORM public.denunciar_causo(v_post.id, 'teste');
END $t$;
:como_b
DO $t$ BEGIN PERFORM public.denunciar_causo(t_topicos.pegar('p_quebrado'), 'teste'); END $t$;
:como_c
DO $t$ BEGIN PERFORM public.denunciar_causo(t_topicos.pegar('p_quebrado'), 'teste'); END $t$;
:como_admin
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT esta_escondido FROM public.posts_comunidade WHERE id = t_topicos.pegar('p_quebrado')), 'esconder pelo lado antigo funciona com o espelho quebrado');
  PERFORM t_topicos.ok(EXISTS (SELECT 1 FROM public.posts_comunidade WHERE id = t_topicos.pegar('p_quebrado')), 'post antigo gravado');
  PERFORM t_topicos.ok(NOT EXISTS (SELECT 1 FROM public.topicos WHERE legado_post_id = t_topicos.pegar('p_quebrado')), 'sem tópico (o espelho falhou e foi engolido)');
  PERFORM t_topicos.ok(NOT EXISTS (SELECT 1 FROM public.respostas WHERE legado_comentario_id = t_topicos.pegar('c_quebrado')), 'sem resposta (idem)');
END $t$;
ALTER TABLE public.topicos DROP CONSTRAINT zz_teste_falha;
ALTER TABLE public.respostas DROP CONSTRAINT zz_teste_falha;
-- O segundo backfill é a rede de segurança: recupera o que o espelho perdeu.
DO $t$ BEGIN
  PERFORM public.aue_migrar_acervo_para_topicos();
  PERFORM t_topicos.ok(EXISTS (SELECT 1 FROM public.topicos WHERE legado_post_id = t_topicos.pegar('p_quebrado')), 'segundo backfill recupera o post perdido');
  PERFORM t_topicos.ok(EXISTS (SELECT 1 FROM public.respostas WHERE legado_comentario_id = t_topicos.pegar('c_quebrado')), 'segundo backfill recupera o comentário perdido');
  PERFORM t_topicos.ok((SELECT status FROM public.topicos WHERE legado_post_id = t_topicos.pegar('p_quebrado')) = 'oculto', 'e respeita o escondido do lado antigo');
END $t$;

-- Post órfão criado depois (group_id nulo) cai no acervo, sem derrubar nada.
INSERT INTO public.posts_comunidade (id, group_id, user_id, post_type, topic, content)
VALUES ('b0000000-0000-0000-0000-0000000000f1', NULL, 'a0000000-0000-0000-0000-000000000001', 'text_announcement', 'Todos', 'Órfão tardio');
DO $t$ BEGIN
  PERFORM t_topicos.ok((SELECT comunidade_id FROM public.topicos WHERE legado_post_id = 'b0000000-0000-0000-0000-0000000000f1') = (SELECT id FROM public.grupos WHERE slug = 'acervo'), 'órfão tardio vai para o acervo');
  PERFORM t_topicos.ok((SELECT count(*) FROM public.grupos WHERE slug = 'acervo') = 1, 'acervo continua único');
END $t$;

-- =============================================================================
-- Fim
-- =============================================================================
:como_admin
DO $t$ BEGIN
  RAISE NOTICE 'TODOS OS TESTES PASSARAM: % asserções', (SELECT n FROM t_topicos.placar);
END $t$;
ROLLBACK;

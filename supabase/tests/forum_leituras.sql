-- =============================================================================
-- Testes SQL das leituras do fórum e do reparo do espelho (migração 20261019000016)
--
-- Roda DEPOIS de topicos.sql, num banco LOCAL com TODAS as migrações aplicadas
-- (nunca no remoto). Chamado pelo mesmo runner (supabase/tests/local/rodar.sh):
--   psql -q -v ON_ERROR_STOP=1 -d <banco> < supabase/tests/forum_leituras.sql
-- Falha alto (RAISE EXCEPTION) e termina em ROLLBACK: não deixa rastro. Cria os
-- próprios atores e dados; não depende do que topicos.sql deixou.
--
-- Papéis: visitante (anon) e contas (authenticated, sub do JWT em
-- request.jwt.claim.sub). "Promovida" = e-mail, não anônima e perfil social
-- concluído. O oráculo (t_forum.promovidas) reescreve essa regra de forma
-- independente, para a conferência não usar o mesmo código que está sob teste.
-- =============================================================================
\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA t_forum;
GRANT USAGE ON SCHEMA t_forum TO PUBLIC;
CREATE TABLE t_forum.placar (n integer NOT NULL);
INSERT INTO t_forum.placar VALUES (0);
CREATE TABLE t_forum.ids (chave text PRIMARY KEY, id uuid NOT NULL);
CREATE TABLE t_forum.arr (chave text PRIMARY KEY, ids uuid[] NOT NULL);
GRANT ALL ON t_forum.placar, t_forum.ids, t_forum.arr TO PUBLIC;

CREATE FUNCTION t_forum.ok(p_condicao boolean, p_mensagem text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE t_forum.placar SET n = n + 1;
  IF p_condicao IS NOT TRUE THEN RAISE EXCEPTION 'TESTE FALHOU: %', p_mensagem; END IF;
END $$;

CREATE FUNCTION t_forum.erro(p_sql text, p_state text, p_hint text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_state text; v_hint text; v_msg text;
BEGIN
  UPDATE t_forum.placar SET n = n + 1;
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

CREATE FUNCTION t_forum.guardar(p_chave text, p_id uuid) RETURNS void LANGUAGE sql AS $$
  INSERT INTO t_forum.ids VALUES (p_chave, p_id) ON CONFLICT (chave) DO UPDATE SET id = EXCLUDED.id $$;
CREATE FUNCTION t_forum.pegar(p_chave text) RETURNS uuid LANGUAGE sql AS $$
  SELECT id FROM t_forum.ids WHERE chave = p_chave $$;

-- Oráculo independente da regra de conta promovida (não chama aue_e_conta_promovida).
CREATE VIEW t_forum.promovidas AS
  SELECT u.id FROM auth.users u JOIN public.perfis p ON p.id = u.id
   WHERE NOT coalesce(u.is_anonymous, false) AND nullif(btrim(u.email), '') IS NOT NULL
     AND p.perfil_social_concluido_em IS NOT NULL;
GRANT SELECT ON t_forum.promovidas TO PUBLIC;

-- Percorre as páginas até esvaziar, devolvendo os ids na ordem em que vieram.
CREATE FUNCTION t_forum.pag_explorar(p_ordem text, p_tam integer) RETURNS uuid[] LANGUAGE plpgsql AS $$
DECLARE v uuid[] := '{}'; r record; cv timestamptz; cid uuid; n integer; paginas integer := 0;
BEGIN
  LOOP
    n := 0;
    FOR r IN SELECT * FROM public.explorar_topicos(p_tam, cv, cid, p_ordem) LOOP
      v := v || r.id; cid := r.id; n := n + 1;
      cv := CASE p_ordem WHEN 'atividade' THEN r.ultima_atividade_em ELSE r.criado_em END;
    END LOOP;
    EXIT WHEN n = 0;
    paginas := paginas + 1;
    EXIT WHEN paginas > 60;
  END LOOP;
  RETURN v;
END $$;

CREATE FUNCTION t_forum.pag_topicos_autor(p_handle text, p_tam integer) RETURNS uuid[] LANGUAGE plpgsql AS $$
DECLARE v uuid[] := '{}'; r record; cv timestamptz; cid uuid; n integer; paginas integer := 0;
BEGIN
  LOOP
    n := 0;
    FOR r IN SELECT * FROM public.listar_topicos_do_autor(p_handle, p_tam, cv, cid) LOOP
      v := v || r.id; cid := r.id; cv := r.criado_em; n := n + 1;
    END LOOP;
    EXIT WHEN n = 0;
    paginas := paginas + 1;
    EXIT WHEN paginas > 60;
  END LOOP;
  RETURN v;
END $$;

CREATE FUNCTION t_forum.pag_respostas_autor(p_handle text, p_tam integer) RETURNS uuid[] LANGUAGE plpgsql AS $$
DECLARE v uuid[] := '{}'; r record; cv timestamptz; cid uuid; n integer; paginas integer := 0;
BEGIN
  LOOP
    n := 0;
    FOR r IN SELECT * FROM public.listar_respostas_do_autor(p_handle, p_tam, cv, cid) LOOP
      v := v || r.id; cid := r.id; cv := r.criado_em; n := n + 1;
    END LOOP;
    EXIT WHEN n = 0;
    paginas := paginas + 1;
    EXIT WHEN paginas > 60;
  END LOOP;
  RETURN v;
END $$;

-- Atores
--   1 ana    promovida, escreve bastante      3 caio  promovido, só entra em comunidade
--   2 beto   promovido                        4 dede  com e-mail, perfil social NÃO concluído
--   5 sessão anônima                          6 casa  conta da casa, promovida
INSERT INTO auth.users (id, email, is_anonymous) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'ana@forum.aue', false),
  ('b1000000-0000-0000-0000-000000000002', 'beto@forum.aue', false),
  ('b1000000-0000-0000-0000-000000000003', 'caio@forum.aue', false),
  ('b1000000-0000-0000-0000-000000000004', 'dede@forum.aue', false),
  ('b1000000-0000-0000-0000-000000000005', NULL, true),
  ('b1000000-0000-0000-0000-000000000006', 'casa@forum.aue', false);
UPDATE public.perfis SET perfil_social_concluido_em = now()
 WHERE id IN ('b1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002',
              'b1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006');
-- O trigger de proteção do perfil só deixa mexer em handle com a marca da RPC social.
DO $t$ BEGIN PERFORM set_config('aue.perfil_social', 'sim', true); END $t$;
UPDATE public.perfis SET handle = v.h FROM (VALUES
  ('b1000000-0000-0000-0000-000000000001'::uuid, 'ana_forum'),
  ('b1000000-0000-0000-0000-000000000002'::uuid, 'beto_forum'),
  ('b1000000-0000-0000-0000-000000000003'::uuid, 'vazio_forum'),
  ('b1000000-0000-0000-0000-000000000004'::uuid, 'semficha_forum'),
  ('b1000000-0000-0000-0000-000000000005'::uuid, 'anonimo_forum'),
  ('b1000000-0000-0000-0000-000000000006'::uuid, 'casa_forum')) AS v(i, h)
 WHERE perfis.id = v.i;
DO $t$ BEGIN PERFORM set_config('aue.perfil_social', '', true); END $t$;
INSERT INTO public.contas_da_casa (usuario_id, papel) VALUES ('b1000000-0000-0000-0000-000000000006', 'personagem');

\set como_admin 'RESET ROLE;'
\set como_visitante 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'','''',true); END$$; SET ROLE anon;'
\set como_a 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''b1000000-0000-0000-0000-000000000001'',true); END$$; SET ROLE authenticated;'
\set como_b 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''b1000000-0000-0000-0000-000000000002'',true); END$$; SET ROLE authenticated;'
\set como_c 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''b1000000-0000-0000-0000-000000000003'',true); END$$; SET ROLE authenticated;'
\set como_d 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''b1000000-0000-0000-0000-000000000004'',true); END$$; SET ROLE authenticated;'
\set como_sessao_anonima 'RESET ROLE; DO $$BEGIN PERFORM set_config(''request.jwt.claim.sub'',''b1000000-0000-0000-0000-000000000005'',true); END$$; SET ROLE authenticated;'

-- =============================================================================
-- 1. Grants e o que já existia continua igual
-- =============================================================================
:como_admin
DO $t$
DECLARE v_fn text;
BEGIN
  FOREACH v_fn IN ARRAY ARRAY[
    'public.listar_comunidades_do_forum()', 'public.obter_comunidade_do_forum(text)',
    'public.listar_topicos_do_autor(text,integer,timestamptz,uuid)',
    'public.listar_respostas_do_autor(text,integer,timestamptz,uuid)',
    'public.explorar_topicos(integer,timestamptz,uuid,text)'] LOOP
    PERFORM t_forum.ok(has_function_privilege('anon', v_fn, 'EXECUTE') AND has_function_privilege('authenticated', v_fn, 'EXECUTE'),
      'leitura pública para anon e authenticated: ' || v_fn);
    PERFORM t_forum.ok((SELECT p.prosecdef FROM pg_proc p WHERE p.oid = v_fn::regprocedure), 'SECURITY DEFINER: ' || v_fn);
    PERFORM t_forum.ok((SELECT p.proconfig::text LIKE '%search_path=public, pg_temp%' FROM pg_proc p WHERE p.oid = v_fn::regprocedure), 'search_path travado: ' || v_fn);
    -- Nenhuma leitura recebe o autor/usuário como parâmetro além do handle público.
    PERFORM t_forum.ok(pg_get_function_identity_arguments(v_fn::regprocedure) !~* '(autor|user|usuario)', 'sem parâmetro de usuário em ' || v_fn);
  END LOOP;

  -- Internas e reparo: ninguém de fora executa (o reparo nem o service_role).
  FOREACH v_fn IN ARRAY ARRAY[
    'public.aue_autor_publico_por_handle(text)', 'public.aue_ler_comunidades_do_forum(text)', 'public.aue_reconciliar_acervo()'] LOOP
    PERFORM t_forum.ok(NOT has_function_privilege('anon', v_fn, 'EXECUTE') AND NOT has_function_privilege('authenticated', v_fn, 'EXECUTE'),
      'interna fechada para anon e authenticated: ' || v_fn);
  END LOOP;
  PERFORM t_forum.ok(NOT has_function_privilege('service_role', 'public.aue_reconciliar_acervo()', 'EXECUTE'), 'reparo fechado para service_role');
  PERFORM t_forum.ok(NOT EXISTS (
    SELECT 1 FROM pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
     WHERE p.oid = 'public.aue_reconciliar_acervo()'::regprocedure AND a.grantee <> p.proowner), 'reparo sem grant a ninguém além do dono (inclui PUBLIC)');

  -- Existe exatamente uma assinatura de cada função nova.
  PERFORM t_forum.ok((SELECT count(*) FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
    AND p.proname IN ('listar_comunidades_do_forum', 'obter_comunidade_do_forum', 'listar_topicos_do_autor',
                      'listar_respostas_do_autor', 'explorar_topicos', 'aue_reconciliar_acervo',
                      'aue_ler_comunidades_do_forum', 'aue_autor_publico_por_handle')) = 8, 'oito funções novas, uma assinatura cada');

  -- Tabelas novas continuam fechadas (a 16 não abriu nada).
  PERFORM t_forum.ok(NOT has_table_privilege('anon', 'public.topicos', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.topicos', 'SELECT')
    AND NOT has_table_privilege('anon', 'public.respostas', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.respostas', 'SELECT'), 'topicos/respostas seguem sem grant');
END $t$;

-- As RPCs das migrações 14 e 15 e as do frontend atual seguem iguais.
DO $t$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('listar_topicos', 'p_slug text, p_limite integer, p_cursor_valor timestamp with time zone, p_cursor_id uuid, p_ordem text, p_cursor_fixado boolean'),
    ('obter_topico', 'p_topico_id uuid'),
    ('listar_respostas_do_topico', 'p_topico_id uuid, p_limite integer, p_cursor_criado_em timestamp with time zone, p_cursor_id uuid'),
    ('criar_topico', 'p_slug text, p_titulo text, p_corpo text, p_resultado_id uuid, p_consentimento_audio_publico boolean'),
    ('responder_topico', 'p_topico_id uuid, p_corpo text, p_pai_id uuid'),
    ('aue_conferir_acervo', ''),
    ('aue_migrar_acervo_para_topicos', ''),
    ('publicar_causo', 'p_slug_da_comunidade text, p_conteudo text, p_resultado_id uuid, p_consentimento_audio_publico boolean'),
    ('criar_comentario', 'p_conteudo text, p_post_id uuid, p_result_id uuid, p_resposta_a_id uuid'),
    ('apagar_meu_causo', 'p_post_id uuid'),
    ('listar_comunidades_sociais', ''),
    ('entrar_na_comunidade', 'p_slug text')
  ) AS v(nome, args) LOOP
    PERFORM t_forum.ok((SELECT count(*) FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = r.nome) = 1,
      'uma só assinatura de ' || r.nome);
    PERFORM t_forum.ok(EXISTS (SELECT 1 FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = r.nome
      AND pg_get_function_identity_arguments(p.oid) = r.args), 'assinatura de ' || r.nome || ' intacta');
  END LOOP;
  -- Colunas de topicos e respostas exatamente como a 14 criou.
  PERFORM t_forum.ok((SELECT string_agg(attname, ',' ORDER BY attnum) FROM pg_attribute WHERE attrelid = 'public.topicos'::regclass AND attnum > 0 AND NOT attisdropped)
    = 'id,comunidade_id,autor_id,titulo,corpo,status,fixado,resultado_id,consentimento_audio_publico,caminho_do_audio_da_casa,criado_em,editado_em,ultima_atividade_em,legado_post_id', 'colunas de topicos intactas');
  PERFORM t_forum.ok((SELECT string_agg(attname, ',' ORDER BY attnum) FROM pg_attribute WHERE attrelid = 'public.respostas'::regclass AND attnum > 0 AND NOT attisdropped)
    = 'id,topico_id,pai_id,nivel,autor_id,corpo,status,criado_em,editado_em,legado_comentario_id', 'colunas de respostas intactas');
  -- Os cinco espelhos seguem ligados.
  PERFORM t_forum.ok((SELECT count(*) FROM pg_trigger WHERE tgname LIKE 'aue_espelha_%' AND NOT tgisinternal AND tgenabled = 'O') = 5, 'cinco triggers-espelho ligados');
END $t$;

-- =============================================================================
-- 2. Dados: comunidades, membros, tópicos e respostas
-- =============================================================================
:como_admin
-- Grupo antigo sem slug, com tópico: não pode aparecer em lista nenhuma.
INSERT INTO public.grupos (nome, descricao) VALUES ('Grupo velho sem slug', 'legado');
-- Quem não conta como membro real: sem ficha social e sessão anônima.
INSERT INTO public.membros_grupo (group_id, user_id)
SELECT g.id, u FROM public.grupos g, unnest(ARRAY['b1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005']::uuid[]) u
 WHERE g.slug = 'refri-cia';

:como_a
DO $t$
DECLARE v_t public.topicos; v_r public.respostas;
BEGIN
  PERFORM public.entrar_na_comunidade('refri-cia');
  PERFORM public.entrar_na_comunidade('cerveja-gelada');
  PERFORM t_forum.guardar('T1', (public.criar_topico('refri-cia', 'T1 do refri', 'corpo 1')).id);
  PERFORM t_forum.guardar('T3', (public.criar_topico('refri-cia', 'T3 do refri', 'corpo 3')).id);
  PERFORM t_forum.guardar('T4', (public.criar_topico('refri-cia', 'T4 vai ser ocultado', 'corpo 4')).id);
  PERFORM t_forum.guardar('T5', (public.criar_topico('refri-cia', 'T5 vai ser apagado', 'corpo 5')).id);
  PERFORM t_forum.guardar('T6', (public.criar_topico('refri-cia', 'T6 vai fechar', 'corpo 6')).id);
  PERFORM t_forum.guardar('TC1', (public.criar_topico('cerveja-gelada', 'TC1 da cerveja', 'corpo c1')).id);
  PERFORM t_forum.guardar('TB1', (public.criar_topico('bonde-geral', 'TB1 do bonde', 'corpo b1')).id);
  -- Respostas de A em T4 e T6 enquanto ainda estão abertos.
  PERFORM t_forum.guardar('R_a_T4', (public.responder_topico(t_forum.pegar('T4'), 'resposta em tópico que será oculto')).id);
  PERFORM t_forum.guardar('R_a_T6', (public.responder_topico(t_forum.pegar('T6'), 'resposta em tópico que será fechado')).id);
  PERFORM t_forum.guardar('R_a_T1', (public.responder_topico(t_forum.pegar('T1'), 'ana em T1')).id);
END $t$;

:como_b
DO $t$
BEGIN
  PERFORM public.entrar_na_comunidade('refri-cia');
  PERFORM public.entrar_na_comunidade('cerveja-gelada');
  PERFORM t_forum.guardar('T2', (public.criar_topico('refri-cia', 'T2 do refri', 'corpo 2')).id);
  PERFORM t_forum.guardar('TC2', (public.criar_topico('cerveja-gelada', 'TC2 da cerveja', 'corpo c2')).id);
  PERFORM t_forum.guardar('R_b_T1', (public.responder_topico(t_forum.pegar('T1'), 'beto em T1')).id);
END $t$;

:como_a
DO $t$
BEGIN
  PERFORM t_forum.guardar('R_a_T1_filha', (public.responder_topico(t_forum.pegar('T1'), 'ana responde o beto', t_forum.pegar('R_b_T1'))).id);
  PERFORM t_forum.guardar('R_a_T2', (public.responder_topico(t_forum.pegar('T2'), 'ana em T2')).id);
  PERFORM t_forum.guardar('R_a_T2_oculta', (public.responder_topico(t_forum.pegar('T2'), 'ana em T2, vai ser ocultada')).id);
  PERFORM t_forum.guardar('R_a_T2_apagada', (public.responder_topico(t_forum.pegar('T2'), 'ana em T2, vai apagar')).id);
  PERFORM t_forum.guardar('R_a_TC2', (public.responder_topico(t_forum.pegar('TC2'), 'ana em TC2')).id);
  PERFORM public.apagar_topico(t_forum.pegar('T5'));
  PERFORM public.apagar_resposta(t_forum.pegar('R_a_T2_apagada'));
END $t$;

:como_c
DO $t$ BEGIN PERFORM public.entrar_na_comunidade('churrasco-raiz'); END $t$;

:como_admin
-- Estados que só o servidor/moderação produz, e conteúdo de quem não é promovida.
UPDATE public.topicos SET status = 'oculto' WHERE id = t_forum.pegar('T4');
UPDATE public.topicos SET status = 'fechado' WHERE id = t_forum.pegar('T6');
UPDATE public.respostas SET status = 'oculto' WHERE id = t_forum.pegar('R_a_T2_oculta');
INSERT INTO public.topicos (id, comunidade_id, autor_id, titulo, corpo)
SELECT 'b2000000-0000-0000-0000-000000000007', g.id, 'b1000000-0000-0000-0000-000000000004', 'T7 de quem não tem ficha', 'x' FROM public.grupos g WHERE g.slug = 'refri-cia';
INSERT INTO public.topicos (id, comunidade_id, autor_id, titulo, corpo)
SELECT 'b2000000-0000-0000-0000-000000000008', g.id, 'b1000000-0000-0000-0000-000000000001', 'T8 em grupo sem slug', 'x' FROM public.grupos g WHERE g.nome = 'Grupo velho sem slug';
DO $t$ BEGIN PERFORM t_forum.guardar('T7', 'b2000000-0000-0000-0000-000000000007'); END $t$;
DO $t$ BEGIN PERFORM t_forum.guardar('T8', 'b2000000-0000-0000-0000-000000000008'); END $t$;
INSERT INTO public.respostas (id, topico_id, autor_id, corpo) VALUES
  ('b3000000-0000-0000-0000-000000000001', t_forum.pegar('T1'), 'b1000000-0000-0000-0000-000000000004', 'dede em T1 (sem ficha)'),
  ('b3000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', 'ana em tópico de quem não tem ficha'),
  ('b3000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'ana em tópico de grupo sem slug');
DO $t$ BEGIN PERFORM t_forum.guardar('R_d_T1', 'b3000000-0000-0000-0000-000000000001'); END $t$;
DO $t$ BEGIN PERFORM t_forum.guardar('R_a_T7', 'b3000000-0000-0000-0000-000000000002'); END $t$;
DO $t$ BEGIN PERFORM t_forum.guardar('R_a_T8', 'b3000000-0000-0000-0000-000000000003'); END $t$;

-- Datas determinísticas, com empates de propósito.
UPDATE public.topicos t SET criado_em = v.c::timestamptz, ultima_atividade_em = v.u::timestamptz
  FROM (VALUES
    ('T1',  '2026-02-01 10:00+00', '2026-02-05 09:00+00'),
    ('T3',  '2026-02-01 10:00+00', '2026-02-01 10:00+00'),
    ('TC1', '2026-02-01 10:00+00', '2026-02-01 10:00+00'),
    ('T2',  '2026-02-02 10:00+00', '2026-02-05 10:00+00'),
    ('TC2', '2026-02-02 10:00+00', '2026-02-05 10:00+00'),
    ('T6',  '2026-02-03 10:00+00', '2026-02-05 10:00+00'),
    ('TB1', '2026-02-04 10:00+00', '2026-02-01 10:00+00')
  ) AS v(k, c, u)
 WHERE t.id = t_forum.pegar(v.k);
UPDATE public.respostas r SET criado_em = v.c::timestamptz
  FROM (VALUES
    ('R_a_T1', '2026-02-06 12:00+00'), ('R_a_T2', '2026-02-06 12:00+00'), ('R_a_TC2', '2026-02-06 12:00+00'),
    ('R_a_T6', '2026-02-06 12:00+00'), ('R_a_T1_filha', '2026-02-06 11:00+00'), ('R_b_T1', '2026-02-06 10:00+00')
  ) AS v(k, c)
 WHERE r.id = t_forum.pegar(v.k);

-- =============================================================================
-- 3. Comunidades: visitante lê, números são reais
-- =============================================================================
:como_visitante
DO $t$
DECLARE r record; v_lista jsonb; v_um jsonb; v_n integer;
BEGIN
  SELECT count(*) INTO v_n FROM public.listar_comunidades_do_forum();
  PERFORM t_forum.ok(v_n = 9, 'visitante lê o diretório: 9 comunidades com slug (sem acervo vazio, sem grupo sem slug): ' || v_n);
  PERFORM t_forum.ok(NOT EXISTS (SELECT 1 FROM public.listar_comunidades_do_forum() c WHERE c.slug IS NULL OR c.nome = 'Grupo velho sem slug'), 'grupo sem slug não aparece');
  PERFORM t_forum.ok(NOT EXISTS (SELECT 1 FROM public.listar_comunidades_do_forum() c WHERE lower(c.slug) = 'acervo'), 'acervo sem tópico visível não aparece');

  SELECT * INTO r FROM public.listar_comunidades_do_forum() c WHERE c.slug = 'refri-cia';
  PERFORM t_forum.ok(r.membros_total = 2, 'refri-cia: 2 membros reais (sem ficha e sessão anônima não contam): ' || r.membros_total);
  PERFORM t_forum.ok(r.topicos_total = 4, 'refri-cia: 4 tópicos visíveis (T1,T2,T3,T6; fora oculto, removido, sem ficha): ' || r.topicos_total);
  PERFORM t_forum.ok(r.ultima_atividade_em = '2026-02-05 10:00+00'::timestamptz, 'refri-cia: última atividade é a do tópico mais movimentado visível');
  PERFORM t_forum.ok(r.sou_membro = false, 'visitante: sou_membro false');
  PERFORM t_forum.ok(r.nome IS NOT NULL AND r.descricao IS NOT NULL AND r.icone IS NOT NULL AND r.id IS NOT NULL, 'refri-cia: id, nome, descrição e ícone reais');

  SELECT * INTO r FROM public.listar_comunidades_do_forum() c WHERE c.slug = 'cerveja-gelada';
  PERFORM t_forum.ok(r.membros_total = 2 AND r.topicos_total = 2, 'cerveja-gelada: 2 membros, 2 tópicos');
  SELECT * INTO r FROM public.listar_comunidades_do_forum() c WHERE c.slug = 'bonde-geral';
  PERFORM t_forum.ok(r.membros_total = 1 AND r.topicos_total = 1 AND r.ultima_atividade_em = '2026-02-01 10:00+00'::timestamptz, 'bonde-geral: entrada automática de A conta, 1 tópico');
  SELECT * INTO r FROM public.listar_comunidades_do_forum() c WHERE c.slug = 'churrasco-raiz';
  PERFORM t_forum.ok(r.membros_total = 1 AND r.topicos_total = 0 AND r.ultima_atividade_em IS NULL, 'churrasco-raiz: membro sem tópico = 0 tópicos e atividade NULL (nada inventado)');
  SELECT * INTO r FROM public.listar_comunidades_do_forum() c WHERE c.slug = 'historias-de-arroto';
  PERFORM t_forum.ok(r.membros_total = 0 AND r.topicos_total = 0 AND r.ultima_atividade_em IS NULL, 'comunidade sem ninguém: zeros e NULL, sem número inventado');

  -- obter == linha do diretório (paridade), caixa e espaço no slug.
  FOR r IN SELECT c.slug FROM public.listar_comunidades_do_forum() c LOOP
    SELECT to_jsonb(c) INTO v_lista FROM public.listar_comunidades_do_forum() c WHERE c.slug = r.slug;
    SELECT to_jsonb(o) INTO v_um FROM public.obter_comunidade_do_forum('  ' || upper(r.slug) || ' ') o;
    PERFORM t_forum.ok(v_lista = v_um, 'obter == listar para ' || r.slug);
  END LOOP;
  PERFORM t_forum.ok((SELECT count(*) FROM public.obter_comunidade_do_forum('nao-existe')) = 0, 'slug inexistente: zero linhas, sem erro');
  PERFORM t_forum.ok((SELECT count(*) FROM public.obter_comunidade_do_forum('')) = 0, 'slug vazio: zero linhas');
  PERFORM t_forum.ok((SELECT count(*) FROM public.obter_comunidade_do_forum(NULL)) = 0, 'slug nulo: zero linhas (não devolve outra comunidade)');
  PERFORM t_forum.ok((SELECT count(*) FROM public.obter_comunidade_do_forum('reuniao-da-firma')) = 1
    AND (SELECT slug FROM public.obter_comunidade_do_forum('reuniao-da-firma')) = 'reuniao-da-firma', 'a URL manda: slug devolve só ele mesmo');
END $t$;

-- topicos_total == o que listar_topicos realmente entrega (a mesma regra, duas leituras).
DO $t$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.slug, c.topicos_total FROM public.listar_comunidades_do_forum() c LOOP
    PERFORM t_forum.ok((SELECT count(*) FROM public.listar_topicos(r.slug, 100)) = r.topicos_total, 'topicos_total == listar_topicos em ' || r.slug);
  END LOOP;
END $t$;

-- Contagens contra o oráculo independente (tabelas direto, regra reescrita).
:como_admin
DO $t$
DECLARE r record;
BEGIN
  FOR r IN SELECT g.slug FROM public.grupos g WHERE g.slug IS NOT NULL LOOP
    IF lower(r.slug) = 'acervo' THEN CONTINUE; END IF;
    PERFORM t_forum.ok((SELECT c.membros_total FROM public.aue_ler_comunidades_do_forum(r.slug) c)
      = (SELECT count(*) FROM public.membros_grupo m JOIN public.grupos g2 ON g2.id = m.group_id AND g2.slug = r.slug
          WHERE m.user_id IN (SELECT id FROM t_forum.promovidas)), 'membros_total bate com o oráculo em ' || r.slug);
    PERFORM t_forum.ok((SELECT c.topicos_total FROM public.aue_ler_comunidades_do_forum(r.slug) c)
      = (SELECT count(*) FROM public.topicos t JOIN public.grupos g2 ON g2.id = t.comunidade_id AND g2.slug = r.slug
          WHERE t.status IN ('aberto', 'fechado') AND t.autor_id IN (SELECT id FROM t_forum.promovidas)), 'topicos_total bate com o oráculo em ' || r.slug);
  END LOOP;
END $t$;

-- sou_membro por papel.
:como_a
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT sou_membro FROM public.obter_comunidade_do_forum('refri-cia')), 'A é membro de refri-cia');
  PERFORM t_forum.ok((SELECT sou_membro FROM public.obter_comunidade_do_forum('cerveja-gelada')), 'A é membro de cerveja-gelada');
  PERFORM t_forum.ok((SELECT sou_membro FROM public.obter_comunidade_do_forum('bonde-geral')), 'A é membro do bonde-geral (entrou ao postar)');
  PERFORM t_forum.ok(NOT (SELECT sou_membro FROM public.obter_comunidade_do_forum('churrasco-raiz')), 'A não é membro de churrasco-raiz');
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_comunidades_do_forum() WHERE sou_membro) = 3, 'A: exatamente 3 comunidades com sou_membro');
  PERFORM t_forum.ok((SELECT membros_total FROM public.obter_comunidade_do_forum('refri-cia')) = 2, 'logado vê o mesmo membros_total do visitante');
END $t$;
:como_b
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT sou_membro FROM public.obter_comunidade_do_forum('refri-cia')), 'B é membro de refri-cia');
  PERFORM t_forum.ok(NOT (SELECT sou_membro FROM public.obter_comunidade_do_forum('bonde-geral')), 'B não é membro do bonde-geral (leitura não grava entrada)');
END $t$;
:como_c
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT sou_membro FROM public.obter_comunidade_do_forum('churrasco-raiz')), 'C é membro de churrasco-raiz');
  PERFORM t_forum.ok(NOT (SELECT sou_membro FROM public.obter_comunidade_do_forum('refri-cia')), 'C não é membro de refri-cia');
END $t$;
:como_d
DO $t$ BEGIN
  PERFORM t_forum.ok(NOT (SELECT sou_membro FROM public.obter_comunidade_do_forum('refri-cia')), 'conta sem ficha social: sou_membro false mesmo com linha em membros_grupo');
END $t$;
:como_sessao_anonima
DO $t$ BEGIN
  PERFORM t_forum.ok(NOT (SELECT sou_membro FROM public.obter_comunidade_do_forum('refri-cia')), 'sessão anônima: sou_membro false mesmo com linha em membros_grupo');
  PERFORM t_forum.ok(NOT EXISTS (SELECT 1 FROM public.listar_comunidades_do_forum() WHERE sou_membro), 'sessão anônima não é membro de nada');
END $t$;

-- Acervo: nasce com o primeiro post órfão e só aparece com tópico visível.
:como_admin
INSERT INTO public.posts_comunidade (id, group_id, user_id, post_type, topic, content, created_at)
VALUES ('b4000000-0000-0000-0000-000000000001', NULL, 'b1000000-0000-0000-0000-000000000002', 'text_announcement', 'Todos', 'Causo antigo sem comunidade', '2025-01-01 10:00+00');
:como_visitante
DO $t$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.obter_comunidade_do_forum('acervo');
  PERFORM t_forum.ok(r.slug = 'acervo' AND r.topicos_total = 1 AND r.membros_total = 0 AND r.sou_membro = false, 'acervo aparece com 1 tópico visível, 0 membros');
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_comunidades_do_forum()) = 10, 'diretório com acervo: 10');
END $t$;
:como_admin
UPDATE public.topicos SET status = 'oculto' WHERE legado_post_id = 'b4000000-0000-0000-0000-000000000001';
:como_visitante
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT count(*) FROM public.obter_comunidade_do_forum('acervo')) = 0, 'acervo com tópico oculto some do obter');
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_comunidades_do_forum()) = 9, 'acervo com tópico oculto some do diretório');
END $t$;
:como_admin
UPDATE public.topicos SET status = 'aberto' WHERE legado_post_id = 'b4000000-0000-0000-0000-000000000001';

-- =============================================================================
-- 4. Tópicos e respostas do autor (/u/:handle)
-- =============================================================================
:como_visitante
DO $t$
DECLARE r record; v_ids uuid[];
BEGIN
  -- A tem T1,T3,T6 (fechado),TC1,TB1 visíveis. Fora: T4 oculto, T5 removido, T8 em grupo sem slug.
  SELECT array_agg(x.id ORDER BY x.criado_em DESC, x.id DESC) INTO v_ids FROM public.listar_topicos_do_autor('ana_forum', 100) x;
  PERFORM t_forum.ok(cardinality(v_ids) = 5, 'ana: 5 tópicos visíveis: ' || cardinality(v_ids));
  PERFORM t_forum.ok(NOT (t_forum.pegar('T4') = ANY (v_ids)) AND NOT (t_forum.pegar('T5') = ANY (v_ids)) AND NOT (t_forum.pegar('T8') = ANY (v_ids)),
    'oculto, removido e grupo sem slug não saem');
  PERFORM t_forum.ok(NOT EXISTS (SELECT 1 FROM public.listar_topicos_do_autor('ana_forum', 100) x WHERE x.titulo IN ('T4 vai ser ocultado', 'T5 vai ser apagado')), 'nem título de oculto/removido');
  FOR r IN SELECT * FROM public.listar_topicos_do_autor('ana_forum', 100) LOOP
    PERFORM t_forum.ok(r.comunidade_slug IS NOT NULL AND r.comunidade_nome IS NOT NULL AND r.comunidade_id IS NOT NULL AND r.titulo <> '', 'item de tópico do autor traz comunidade e título: ' || r.id);
  END LOOP;
  PERFORM t_forum.ok((SELECT respostas_total FROM public.listar_topicos_do_autor('ana_forum', 100) x WHERE x.id = t_forum.pegar('T1')) = 3,
    'T1: 3 respostas reais (ana, beto, ana filha; a de quem não tem ficha não conta)');
  PERFORM t_forum.ok((SELECT respostas_total FROM public.listar_topicos_do_autor('beto_forum', 100) x WHERE x.id = t_forum.pegar('T2')) = 1,
    'T2: 1 resposta (oculta e apagada não contam)');
  PERFORM t_forum.ok((SELECT comunidade_slug FROM public.listar_topicos_do_autor('ana_forum', 100) x WHERE x.id = t_forum.pegar('TC1')) = 'cerveja-gelada', 'TC1 aponta para cerveja-gelada');
  PERFORM t_forum.ok((SELECT status FROM public.listar_topicos_do_autor('ana_forum', 100) x WHERE x.id = t_forum.pegar('T6')) = 'fechado', 'tópico fechado aparece como fechado');

  -- Normalização do handle: @, caixa e espaço.
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_topicos_do_autor('  @ANA_Forum ', 100)) = 5, '@, caixa e espaço no handle');

  -- Respostas: R_a_T1, R_a_T1_filha, R_a_T2, R_a_TC2, R_a_T6. Fora: oculta, apagada, em T4 oculto, em T7 de sem ficha, em T8 sem slug.
  SELECT array_agg(x.id) INTO v_ids FROM public.listar_respostas_do_autor('ana_forum', 100) x;
  PERFORM t_forum.ok(cardinality(v_ids) = 5, 'ana: 5 respostas visíveis: ' || cardinality(v_ids));
  PERFORM t_forum.ok(NOT (t_forum.pegar('R_a_T2_oculta') = ANY (v_ids)) AND NOT (t_forum.pegar('R_a_T2_apagada') = ANY (v_ids))
    AND NOT (t_forum.pegar('R_a_T4') = ANY (v_ids)) AND NOT (t_forum.pegar('R_a_T7') = ANY (v_ids)) AND NOT (t_forum.pegar('R_a_T8') = ANY (v_ids)),
    'resposta oculta, apagada, em tópico oculto, em tópico de autor sem ficha e em grupo sem slug não saem');
  FOR r IN SELECT * FROM public.listar_respostas_do_autor('ana_forum', 100) LOOP
    PERFORM t_forum.ok(r.topico_id IS NOT NULL AND r.topico_titulo IS NOT NULL AND r.comunidade_slug IS NOT NULL AND r.comunidade_nome IS NOT NULL AND r.corpo <> '',
      'item de resposta do autor traz tópico, título, comunidade e corpo: ' || r.id);
  END LOOP;
  SELECT * INTO r FROM public.listar_respostas_do_autor('ana_forum', 100) x WHERE x.id = t_forum.pegar('R_a_T1_filha');
  PERFORM t_forum.ok(r.topico_id = t_forum.pegar('T1') AND r.pai_id = t_forum.pegar('R_b_T1') AND r.nivel = 1 AND r.comunidade_slug = 'refri-cia' AND r.topico_titulo = 'T1 do refri',
    'resposta filha aponta para o tópico, o pai e a comunidade certos');
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_respostas_do_autor('beto_forum', 100)) = 1, 'beto: 1 resposta (R_b_T1)');

  -- Limite e cursor inválidos.
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_topicos_do_autor('ana_forum', 0)) = 1, 'limite 0 vira 1');
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_topicos_do_autor('ana_forum', NULL)) = 5, 'limite nulo usa o padrão');
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_topicos_do_autor('ana_forum', 100000)) = 5, 'limite enorme é aparado');
  PERFORM t_forum.erro($$SELECT * FROM public.listar_topicos_do_autor('ana_forum', 10, now(), NULL)$$, '22023', 'cursor_invalido');
  PERFORM t_forum.erro($$SELECT * FROM public.listar_respostas_do_autor('ana_forum', 10, NULL, gen_random_uuid())$$, '22023', 'cursor_invalido');
END $t$;

-- Handle que não existe == existe sem conteúdo == sem ficha: nenhuma diferença observável.
DO $t$
DECLARE h text; v_ref_t jsonb; v_ref_r jsonb; v_t jsonb; v_r jsonb;
BEGIN
  v_ref_t := (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]') FROM public.listar_topicos_do_autor('nao_existe_aqui', 30) x);
  v_ref_r := (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]') FROM public.listar_respostas_do_autor('nao_existe_aqui', 30) x);
  PERFORM t_forum.ok(v_ref_t = '[]' AND v_ref_r = '[]', 'handle inexistente: vazio, sem erro');
  FOREACH h IN ARRAY ARRAY['vazio_forum', 'semficha_forum', 'anonimo_forum', '@vazio_forum', 'VAZIO_FORUM', '', '   ', '@'] LOOP
    v_t := (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]') FROM public.listar_topicos_do_autor(h, 30) x);
    v_r := (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]') FROM public.listar_respostas_do_autor(h, 30) x);
    PERFORM t_forum.ok(v_t = v_ref_t AND v_r = v_ref_r, 'handle "' || h || '" é indistinguível de inexistente (vazio, sem erro)');
  END LOOP;
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_topicos_do_autor(NULL, 30)) = 0 AND (SELECT count(*) FROM public.listar_respostas_do_autor(NULL, 30)) = 0, 'handle nulo: vazio, sem erro');
  -- Com cursor válido também: nada de erro diferente.
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_topicos_do_autor('nao_existe_aqui', 30, now(), gen_random_uuid())) = 0, 'inexistente com cursor: vazio');
  -- O erro de cursor não depende de a pessoa existir.
  PERFORM t_forum.erro($$SELECT * FROM public.listar_topicos_do_autor('nao_existe_aqui', 10, now(), NULL)$$, '22023', 'cursor_invalido');
  PERFORM t_forum.erro($$SELECT * FROM public.listar_topicos_do_autor('vazio_forum', 10, now(), NULL)$$, '22023', 'cursor_invalido');
  -- Quem existe e tem ficha, mas escreveu só coisa escondida, também some por inteiro:
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_topicos_do_autor('semficha_forum', 30)) = 0, 'autor sem ficha social: tópico dele (T7) não sai por handle');
END $t$;

-- Conteúdo de autor que PERDE a promoção some (a regra é lida na hora, não congelada).
:como_admin
UPDATE public.perfis SET perfil_social_concluido_em = NULL WHERE id = 'b1000000-0000-0000-0000-000000000002';
:como_visitante
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_topicos_do_autor('beto_forum', 30)) = 0, 'beto perdeu a ficha: tópicos some do perfil');
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_respostas_do_autor('beto_forum', 30)) = 0, 'beto perdeu a ficha: respostas some do perfil');
  PERFORM t_forum.ok(NOT EXISTS (SELECT 1 FROM public.listar_respostas_do_autor('ana_forum', 100) x WHERE x.topico_id IN (t_forum.pegar('T2'), t_forum.pegar('TC2'))),
    'resposta da ana em tópico do beto (sem ficha) também some do perfil da ana');
  PERFORM t_forum.ok(NOT EXISTS (SELECT 1 FROM public.explorar_topicos(100) x WHERE x.autor_id = 'b1000000-0000-0000-0000-000000000002'), 'e do Explorar');
  PERFORM t_forum.ok((SELECT membros_total FROM public.obter_comunidade_do_forum('refri-cia')) = 1, 'e dos membros_total');
  PERFORM t_forum.ok((SELECT topicos_total FROM public.obter_comunidade_do_forum('refri-cia')) = 3, 'e dos topicos_total');
END $t$;
:como_admin
UPDATE public.perfis SET perfil_social_concluido_em = now() WHERE id = 'b1000000-0000-0000-0000-000000000002';

-- Paginação por cursor com empates: sem duplicar, sem pular. A ordem esperada vem
-- das tabelas (oráculo), não das próprias funções.
:como_admin
INSERT INTO t_forum.arr
SELECT 'topicos_ana', array_agg(t.id ORDER BY t.criado_em DESC, t.id DESC)
  FROM public.topicos t JOIN public.grupos g ON g.id = t.comunidade_id AND g.slug IS NOT NULL
 WHERE t.autor_id = 'b1000000-0000-0000-0000-000000000001' AND t.status IN ('aberto', 'fechado');
INSERT INTO t_forum.arr
SELECT 'respostas_ana', array_agg(r.id ORDER BY r.criado_em DESC, r.id DESC)
  FROM public.respostas r
  JOIN public.topicos t ON t.id = r.topico_id AND t.status IN ('aberto', 'fechado') AND t.autor_id IN (SELECT id FROM t_forum.promovidas)
  JOIN public.grupos g ON g.id = t.comunidade_id AND g.slug IS NOT NULL
 WHERE r.autor_id = 'b1000000-0000-0000-0000-000000000001' AND r.status = 'visivel';
:como_visitante
DO $t$
DECLARE v_tam integer; v_pag uuid[]; v_esp uuid[];
BEGIN
  SELECT ids INTO v_esp FROM t_forum.arr WHERE chave = 'topicos_ana';
  PERFORM t_forum.ok(cardinality(v_esp) = 5, 'oráculo: 5 tópicos da ana');
  PERFORM t_forum.ok((SELECT count(*) - count(DISTINCT x.criado_em) FROM public.listar_topicos_do_autor('ana_forum', 100) x) >= 2, 'há empate de data nos tópicos da ana (T1, T3 e TC1)');
  FOREACH v_tam IN ARRAY ARRAY[1, 2, 3, 4, 5, 6, 100] LOOP
    v_pag := t_forum.pag_topicos_autor('ana_forum', v_tam);
    PERFORM t_forum.ok(v_pag = v_esp, 'paginação dos tópicos do autor (limite ' || v_tam || ') igual ao oráculo, sem duplicar nem pular: ' || v_pag::text);
  END LOOP;

  SELECT ids INTO v_esp FROM t_forum.arr WHERE chave = 'respostas_ana';
  PERFORM t_forum.ok(cardinality(v_esp) = 5, 'oráculo: 5 respostas da ana');
  -- Quatro respostas empatam em criado_em (12:00); o desempate é o id.
  PERFORM t_forum.ok((SELECT count(DISTINCT x.criado_em) FROM public.listar_respostas_do_autor('ana_forum', 100) x) = 2, 'há empate de data de verdade (2 datas para 5 respostas)');
  FOREACH v_tam IN ARRAY ARRAY[1, 2, 3, 4, 5, 6] LOOP
    v_pag := t_forum.pag_respostas_autor('ana_forum', v_tam);
    PERFORM t_forum.ok(v_pag = v_esp, 'paginação das respostas do autor (limite ' || v_tam || ') igual ao oráculo, sem duplicar nem pular: ' || v_pag::text);
  END LOOP;
  PERFORM t_forum.ok(v_esp[5] = t_forum.pegar('R_a_T1_filha'), 'a mais antiga (11:00) é a última');
END $t$;

-- =============================================================================
-- 5. Explorar: todos os tópicos públicos, sempre com comunidade
-- =============================================================================
:como_visitante
DO $t$
DECLARE r record; v_ids uuid[]; v_n integer;
BEGIN
  SELECT array_agg(x.id) INTO v_ids FROM public.explorar_topicos(100) x;
  -- Visíveis: T1,T2,T3,T6,TC1,TC2,TB1 (+ acervo, que voltou a 'aberto').
  PERFORM t_forum.ok(cardinality(v_ids) = 8, 'explorar: 7 tópicos de comunidades + 1 do acervo = 8: ' || cardinality(v_ids));
  PERFORM t_forum.ok(NOT (t_forum.pegar('T4') = ANY (v_ids)) AND NOT (t_forum.pegar('T5') = ANY (v_ids)), 'oculto e removido não saem');
  PERFORM t_forum.ok(NOT (t_forum.pegar('T7') = ANY (v_ids)), 'tópico de autor sem ficha social não sai');
  PERFORM t_forum.ok(NOT (t_forum.pegar('T8') = ANY (v_ids)), 'tópico de grupo sem slug não sai (a UI não tem como linkar)');
  FOR r IN SELECT * FROM public.explorar_topicos(100) LOOP
    PERFORM t_forum.ok(r.comunidade_id IS NOT NULL AND r.comunidade_slug IS NOT NULL AND r.comunidade_nome IS NOT NULL AND r.titulo <> ''
      AND r.handle IS NOT NULL, 'todo item do explorar tem comunidade, título e autor: ' || r.id);
  END LOOP;
  PERFORM t_forum.ok((SELECT comunidade_slug FROM public.explorar_topicos(100) x WHERE x.id = t_forum.pegar('TC2')) = 'cerveja-gelada', 'TC2 identificado por cerveja-gelada');
  PERFORM t_forum.ok((SELECT respostas_total FROM public.explorar_topicos(100) x WHERE x.id = t_forum.pegar('T1')) = 3, 'respostas_total real no explorar');
  PERFORM t_forum.ok((SELECT status FROM public.explorar_topicos(100) x WHERE x.id = t_forum.pegar('T6')) = 'fechado', 'fechado aparece como fechado');
  -- Mesmo recorte que o oráculo: ids == união dos listar_topicos por comunidade.
  SELECT count(*) INTO v_n FROM public.listar_comunidades_do_forum() c, LATERAL public.listar_topicos(c.slug, 100) lt;
  PERFORM t_forum.ok(v_n = cardinality(v_ids), 'explorar == soma dos listar_topicos de todas as comunidades (' || v_n || ')');

  -- Validações.
  PERFORM t_forum.erro($$SELECT * FROM public.explorar_topicos(10, NULL, NULL, 'popularidade')$$, '22023', 'ordem_invalida');
  PERFORM t_forum.erro($$SELECT * FROM public.explorar_topicos(10, now(), NULL)$$, '22023', 'cursor_invalido');
  PERFORM t_forum.erro($$SELECT * FROM public.explorar_topicos(10, NULL, gen_random_uuid())$$, '22023', 'cursor_invalido');
  PERFORM t_forum.ok((SELECT count(*) FROM public.explorar_topicos(0)) = 1, 'limite 0 vira 1');
  PERFORM t_forum.ok((SELECT count(*) FROM public.explorar_topicos(NULL)) = 8, 'limite nulo usa o padrão');
  PERFORM t_forum.ok((SELECT count(*) FROM public.explorar_topicos(1000000)) = 8, 'limite enorme é aparado');
  PERFORM t_forum.ok((SELECT count(*) FROM public.explorar_topicos(10, NULL, NULL, '  ')) = 8, 'ordem vazia usa o padrão');
END $t$;

:como_admin
DO $t$
DECLARE v_esp_a uuid[]; v_esp_r uuid[];
BEGIN
  SELECT array_agg(t.id ORDER BY t.ultima_atividade_em DESC, t.id DESC) INTO v_esp_a
    FROM public.topicos t JOIN public.grupos g ON g.id = t.comunidade_id AND g.slug IS NOT NULL
   WHERE t.status IN ('aberto', 'fechado') AND t.autor_id IN (SELECT id FROM t_forum.promovidas);
  SELECT array_agg(t.id ORDER BY t.criado_em DESC, t.id DESC) INTO v_esp_r
    FROM public.topicos t JOIN public.grupos g ON g.id = t.comunidade_id AND g.slug IS NOT NULL
   WHERE t.status IN ('aberto', 'fechado') AND t.autor_id IN (SELECT id FROM t_forum.promovidas);
  PERFORM t_forum.ok(cardinality(v_esp_a) = 8 AND cardinality(v_esp_r) = 8, 'oráculo do explorar: 8');
  -- Há empate real nas duas ordens (senão o teste de cursor não prova nada).
  PERFORM t_forum.ok((SELECT count(*) FROM (SELECT t.ultima_atividade_em FROM public.topicos t WHERE t.id = ANY (v_esp_a) GROUP BY 1 HAVING count(*) > 1) x) >= 2, 'empates de ultima_atividade_em');
  PERFORM t_forum.ok((SELECT count(*) FROM (SELECT t.criado_em FROM public.topicos t WHERE t.id = ANY (v_esp_r) GROUP BY 1 HAVING count(*) > 1) x) >= 2, 'empates de criado_em');
  INSERT INTO t_forum.arr VALUES ('explorar_atividade', v_esp_a), ('explorar_recentes', v_esp_r);
END $t$;
:como_visitante
DO $t$
DECLARE v_tam integer; v_esp_a uuid[]; v_esp_r uuid[];
BEGIN
  SELECT ids INTO v_esp_a FROM t_forum.arr WHERE chave = 'explorar_atividade';
  SELECT ids INTO v_esp_r FROM t_forum.arr WHERE chave = 'explorar_recentes';
  PERFORM t_forum.ok(ARRAY(SELECT x.id FROM public.explorar_topicos(100) x) = v_esp_a, 'ordem padrão = atividade DESC, id DESC (igual ao oráculo)');
  PERFORM t_forum.ok(ARRAY(SELECT x.id FROM public.explorar_topicos(100, NULL, NULL, 'recentes') x) = v_esp_r, 'ordem recentes = criado_em DESC, id DESC (igual ao oráculo)');
  FOREACH v_tam IN ARRAY ARRAY[1, 2, 3, 4, 5, 7, 8, 9] LOOP
    PERFORM t_forum.ok(t_forum.pag_explorar('atividade', v_tam) = v_esp_a, 'paginação do explorar por atividade (limite ' || v_tam || ') sem duplicar nem pular');
    PERFORM t_forum.ok(t_forum.pag_explorar('recentes', v_tam) = v_esp_r, 'paginação do explorar por recentes (limite ' || v_tam || ') sem duplicar nem pular');
  END LOOP;
END $t$;

-- Quem está logado lê o mesmo que o visitante.
:como_a
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT count(*) FROM public.explorar_topicos(100)) = 8, 'logado lê o explorar');
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_topicos_do_autor('ana_forum', 100)) = 5, 'logado lê tópicos do autor');
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_respostas_do_autor('ana_forum', 100)) = 5, 'logado lê respostas do autor');
  PERFORM t_forum.ok((SELECT count(*) FROM public.listar_comunidades_do_forum()) = 10, 'logado lê o diretório');
END $t$;

-- Visitante não chega às tabelas nem ao reparo.
:como_visitante
DO $t$ BEGIN
  PERFORM t_forum.erro($$SELECT public.aue_reconciliar_acervo()$$, '42501');
  PERFORM t_forum.erro($$SELECT * FROM public.aue_ler_comunidades_do_forum(NULL)$$, '42501');
  PERFORM t_forum.erro($$SELECT public.aue_autor_publico_por_handle('ana_forum')$$, '42501');
  PERFORM t_forum.erro($$SELECT * FROM public.topicos$$, '42501');
END $t$;
:como_a
DO $t$ BEGIN
  PERFORM t_forum.erro($$SELECT public.aue_reconciliar_acervo()$$, '42501');
END $t$;

-- =============================================================================
-- 6. Reparo do espelho (aue_reconciliar_acervo)
-- =============================================================================
:como_admin
-- Cenário: posts e comentários nascem COM os triggers ligados (espelho íntegro).
INSERT INTO public.posts_comunidade (id, group_id, user_id, post_type, topic, content, created_at, consentimento_audio_publico, caminho_do_audio_da_casa)
SELECT v.id::uuid, g.id, v.autor::uuid, 'text_announcement', 'x', v.txt, v.criado::timestamptz, v.consente, v.casa
  FROM (VALUES
    ('b5000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'P1 esconder no lado antigo',        '2026-03-01 10:00+00', false, NULL),
    ('b5000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'P2 fechado e depois escondido',     '2026-03-01 11:00+00', false, NULL),
    ('b5000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'P3 escondido e depois mostrado',    '2026-03-01 12:00+00', false, NULL),
    ('b5000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'P4 oculto por denúncia nova',       '2026-03-01 13:00+00', false, NULL),
    ('b5000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'P5 fechado, post vivo',             '2026-03-01 14:00+00', false, NULL),
    ('b5000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'P6 removido pelo lado novo',         '2026-03-01 15:00+00', false, NULL),
    ('b5000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000006', 'P7 apagado no lado antigo, com áudio','2026-03-01 16:00+00', true,  'burpzilla/b5000000-0000-0000-0000-000000000007.m4a'),
    ('b5000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'P8 removido novo e apagado antigo',  '2026-03-01 17:00+00', false, NULL),
    ('b5000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000001', 'P9 controle, ninguém mexe',          '2026-03-01 18:00+00', false, NULL)
  ) AS v(id, autor, txt, criado, consente, casa), public.grupos g
 WHERE g.slug = 'historias-de-arroto';
INSERT INTO public.comentarios (id, user_id, content, created_at, post_id)
VALUES
  ('b6000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'C1 vai ser apagado no antigo',          '2026-03-01 18:10+00', 'b5000000-0000-0000-0000-000000000009'),
  ('b6000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'C2 vivo, resposta oculta no novo',      '2026-03-01 18:20+00', 'b5000000-0000-0000-0000-000000000009'),
  ('b6000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'C3 vivo, resposta apagada no novo',     '2026-03-01 18:30+00', 'b5000000-0000-0000-0000-000000000009'),
  ('b6000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'C4 apagado novo e depois no antigo',    '2026-03-01 18:40+00', 'b5000000-0000-0000-0000-000000000009'),
  ('b6000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 'C5 morre junto com o post P7',          '2026-03-01 16:10+00', 'b5000000-0000-0000-0000-000000000007'),
  ('b6000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 'C6 vivo e intocado',                    '2026-03-01 18:50+00', 'b5000000-0000-0000-0000-000000000009');
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT count(*) FROM public.topicos WHERE legado_post_id::text LIKE 'b5000000-%') = 9, 'cenário: 9 tópicos espelhados');
  PERFORM t_forum.ok((SELECT count(*) FROM public.respostas WHERE legado_comentario_id::text LIKE 'b6000000-%') = 6, 'cenário: 6 respostas espelhadas');
  PERFORM t_forum.ok((SELECT caminho_do_audio_da_casa FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000007') IS NOT NULL, 'P7 espelhou o áudio da casa');
END $t$;

-- Estados do lado NOVO (triggers ligados, tudo íntegro até aqui).
UPDATE public.posts_comunidade SET esta_escondido = true WHERE id = 'b5000000-0000-0000-0000-000000000003';
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000003') = 'oculto', 'cenário: P3 escondido virou tópico oculto pelo trigger');
END $t$;
UPDATE public.topicos SET status = 'fechado' WHERE id IN ('b5000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000005');
:como_a
DO $t$ BEGIN
  PERFORM public.apagar_topico('b5000000-0000-0000-0000-000000000006');
  PERFORM public.apagar_topico('b5000000-0000-0000-0000-000000000008');
  PERFORM public.denunciar_topico('b5000000-0000-0000-0000-000000000004', 'denúncia 1');
END $t$;
:como_b
DO $t$ BEGIN PERFORM public.denunciar_topico('b5000000-0000-0000-0000-000000000004', 'denúncia 2'); END $t$;
:como_c
DO $t$ BEGIN PERFORM public.denunciar_topico('b5000000-0000-0000-0000-000000000004', 'denúncia 3'); END $t$;
:como_admin
-- Respostas: C2 oculta, C3 e C4 apagadas pelo lado novo (soft: o texto fica).
UPDATE public.respostas SET status = 'oculto' WHERE id = 'b6000000-0000-0000-0000-000000000002';
UPDATE public.respostas SET status = 'removido' WHERE id IN ('b6000000-0000-0000-0000-000000000003', 'b6000000-0000-0000-0000-000000000004');
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000004') = 'oculto', 'cenário: P4 ocultado por 3 denúncias do lado novo');
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000006') = 'removido', 'cenário: P6 removido pelo autor no lado novo');
END $t$;

-- Agora o espelho "perde" as mudanças do lado antigo: triggers desligados.
ALTER TABLE public.posts_comunidade DISABLE TRIGGER aue_espelha_post_no_topico;
ALTER TABLE public.posts_comunidade DISABLE TRIGGER aue_espelha_escondido_no_topico;
ALTER TABLE public.posts_comunidade DISABLE TRIGGER aue_espelha_post_apagado_no_topico;
ALTER TABLE public.comentarios DISABLE TRIGGER aue_espelha_comentario_na_resposta;
ALTER TABLE public.comentarios DISABLE TRIGGER aue_espelha_comentario_apagado_na_resposta;

UPDATE public.posts_comunidade SET esta_escondido = true  WHERE id IN ('b5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000002');
UPDATE public.posts_comunidade SET esta_escondido = false WHERE id = 'b5000000-0000-0000-0000-000000000003';
DELETE FROM public.posts_comunidade WHERE id IN ('b5000000-0000-0000-0000-000000000007', 'b5000000-0000-0000-0000-000000000008');
DELETE FROM public.comentarios WHERE id IN ('b6000000-0000-0000-0000-000000000001', 'b6000000-0000-0000-0000-000000000004');

-- Antes do reparo o espelho está torto (e a conferência acusa).
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000001') = 'aberto', 'antes: P1 escondido no antigo ainda aparece aberto');
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000003') = 'oculto', 'antes: P3 mostrado no antigo ainda oculto');
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000007') = 'aberto'
    AND (SELECT titulo FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000007') LIKE 'P7%', 'antes: P7 apagado no antigo ainda tem título e áudio');
  PERFORM t_forum.erro('SELECT public.aue_conferir_acervo()', 'P0001');
END $t$;

DO $t$
DECLARE v jsonb; v_hash1 text; v_hash2 text; v_hash3 text;
BEGIN
  v := public.aue_reconciliar_acervo();
  PERFORM t_forum.ok((v->>'topicos_ocultados')::int = 2, 'reparo: 2 tópicos ocultados (P1, P2): ' || v::text);
  PERFORM t_forum.ok((v->>'topicos_reabertos')::int = 1, 'reparo: 1 tópico reaberto (P3; P4 fica por causa das denúncias): ' || v::text);
  PERFORM t_forum.ok((v->>'topicos_removidos')::int = 2, 'reparo: 2 tópicos removidos e limpos (P7, P8): ' || v::text);
  PERFORM t_forum.ok((v->>'respostas_removidas')::int = 3, 'reparo: 3 respostas removidas (C1, C4, C5 por cascata): ' || v::text);
  PERFORM t_forum.ok((v->>'corrigidos')::int = 8, 'reparo: total 8: ' || v::text);
  PERFORM t_forum.ok((v->>'posts_sem_topico')::int = 0 AND (v->>'comentarios_sem_resposta')::int = 0, 'reparo: nada faltando para copiar');

  -- Tópicos.
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000001') = 'oculto', 'P1 escondido no antigo -> oculto');
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000002') = 'oculto', 'P2 (fechado) escondido no antigo -> oculto');
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000003') = 'aberto', 'P3 mostrado no antigo -> aberto');
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000004') = 'oculto', 'P4 oculto por 3 denúncias novas NÃO é reaberto');
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000005') = 'fechado', 'P5 fechado pelo lado novo continua fechado');
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000006') = 'removido'
    AND (SELECT titulo FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000006') LIKE 'P6%', 'P6 removido pelo lado novo (post vivo) continua removido e não é mexido');
  PERFORM t_forum.ok((SELECT status = 'removido' AND titulo = 'Tópico removido' AND corpo = '' AND caminho_do_audio_da_casa IS NULL
    AND resultado_id IS NULL AND NOT consentimento_audio_publico FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000007'), 'P7 apagado no antigo: removido, sem título, texto nem áudio');
  PERFORM t_forum.ok((SELECT status = 'removido' AND titulo = 'Tópico removido' AND corpo = '' FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000008'),
    'P8 já removido no novo e apagado no antigo: conteúdo limpo');
  PERFORM t_forum.ok((SELECT status = 'aberto' AND titulo LIKE 'P9%' FROM public.topicos WHERE id = 'b5000000-0000-0000-0000-000000000009'), 'P9 controle intacto');

  -- Respostas.
  PERFORM t_forum.ok((SELECT status = 'removido' AND corpo = '[removido]' FROM public.respostas WHERE id = 'b6000000-0000-0000-0000-000000000001'), 'C1 apagado no antigo -> [removido]');
  PERFORM t_forum.ok((SELECT status = 'oculto' AND corpo LIKE 'C2%' FROM public.respostas WHERE id = 'b6000000-0000-0000-0000-000000000002'), 'C2 oculta pelo novo (comentário vivo) não muda');
  PERFORM t_forum.ok((SELECT status = 'removido' AND corpo LIKE 'C3%' FROM public.respostas WHERE id = 'b6000000-0000-0000-0000-000000000003'), 'C3 removida pelo novo (comentário vivo) não é mexida');
  PERFORM t_forum.ok((SELECT status = 'removido' AND corpo = '[removido]' FROM public.respostas WHERE id = 'b6000000-0000-0000-0000-000000000004'), 'C4 removida no novo e apagada no antigo: texto limpo');
  PERFORM t_forum.ok((SELECT status = 'removido' AND corpo = '[removido]' FROM public.respostas WHERE id = 'b6000000-0000-0000-0000-000000000005'), 'C5 (comentário morto por cascata do post): [removido]');
  PERFORM t_forum.ok((SELECT status = 'visivel' AND corpo LIKE 'C6%' FROM public.respostas WHERE id = 'b6000000-0000-0000-0000-000000000006'), 'C6 intacta');

  -- Idempotência: segunda chamada não muda nada (hash do estado inteiro igual).
  SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.id), '')) || (SELECT md5(coalesce(string_agg(y::text, '|' ORDER BY y.id), '')) FROM public.respostas y) INTO v_hash1 FROM public.topicos x;
  v := public.aue_reconciliar_acervo();
  PERFORM t_forum.ok((v->>'corrigidos')::int = 0 AND (v->>'topicos_ocultados')::int = 0 AND (v->>'topicos_reabertos')::int = 0
    AND (v->>'topicos_removidos')::int = 0 AND (v->>'respostas_removidas')::int = 0, 'segunda chamada: tudo zero: ' || v::text);
  SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.id), '')) || (SELECT md5(coalesce(string_agg(y::text, '|' ORDER BY y.id), '')) FROM public.respostas y) INTO v_hash2 FROM public.topicos x;
  PERFORM t_forum.ok(v_hash1 = v_hash2, 'idempotente: hash de topicos+respostas igual na 2ª vez');
  PERFORM public.aue_reconciliar_acervo();
  SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.id), '')) || (SELECT md5(coalesce(string_agg(y::text, '|' ORDER BY y.id), '')) FROM public.respostas y) INTO v_hash3 FROM public.topicos x;
  PERFORM t_forum.ok(v_hash1 = v_hash3, 'e na 3ª');

  -- A conferência volta a passar: o reparo deixou o espelho coerente.
  PERFORM public.aue_conferir_acervo();
  PERFORM t_forum.ok(true, 'aue_conferir_acervo passa depois do reparo');
END $t$;

-- O reparo não escreveu fora de topicos/respostas e os tópicos de fora do cenário não mudaram.
DO $t$ BEGIN
  PERFORM t_forum.ok((SELECT status FROM public.topicos WHERE id = t_forum.pegar('T1')) = 'aberto'
    AND (SELECT status FROM public.topicos WHERE id = t_forum.pegar('T6')) = 'fechado'
    AND (SELECT status FROM public.topicos WHERE id = t_forum.pegar('T4')) = 'oculto', 'tópicos criados só pelo lado novo (sem legado_post_id) intocados');
  PERFORM t_forum.ok((SELECT esta_escondido FROM public.posts_comunidade WHERE id = 'b5000000-0000-0000-0000-000000000001'), 'o reparo não escreve no lado antigo');
END $t$;

-- O que o reparo oculta/remove sai das leituras públicas.
:como_visitante
DO $t$ BEGIN
  PERFORM t_forum.ok(NOT EXISTS (SELECT 1 FROM public.explorar_topicos(100) x WHERE x.id::text IN
    ('b5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000004',
     'b5000000-0000-0000-0000-000000000006', 'b5000000-0000-0000-0000-000000000007', 'b5000000-0000-0000-0000-000000000008')), 'oculto e removido do reparo fora do explorar');
  PERFORM t_forum.ok(EXISTS (SELECT 1 FROM public.explorar_topicos(100) x WHERE x.id = 'b5000000-0000-0000-0000-000000000003'), 'P3 reaberto volta ao explorar');
  PERFORM t_forum.ok(EXISTS (SELECT 1 FROM public.explorar_topicos(100) x WHERE x.id = 'b5000000-0000-0000-0000-000000000005'), 'P5 fechado segue no explorar');
  PERFORM t_forum.ok(NOT EXISTS (SELECT 1 FROM public.listar_respostas_do_autor('beto_forum', 100) x WHERE x.id::text IN
    ('b6000000-0000-0000-0000-000000000001', 'b6000000-0000-0000-0000-000000000002', 'b6000000-0000-0000-0000-000000000003',
     'b6000000-0000-0000-0000-000000000004', 'b6000000-0000-0000-0000-000000000005')), 'respostas removidas/ocultas fora do perfil do autor');
  PERFORM t_forum.ok(EXISTS (SELECT 1 FROM public.listar_respostas_do_autor('beto_forum', 100) x WHERE x.id = 'b6000000-0000-0000-0000-000000000006'), 'resposta C6 segue no perfil');
END $t$;
:como_admin
ALTER TABLE public.posts_comunidade ENABLE TRIGGER aue_espelha_post_no_topico;
ALTER TABLE public.posts_comunidade ENABLE TRIGGER aue_espelha_escondido_no_topico;
ALTER TABLE public.posts_comunidade ENABLE TRIGGER aue_espelha_post_apagado_no_topico;
ALTER TABLE public.comentarios ENABLE TRIGGER aue_espelha_comentario_na_resposta;
ALTER TABLE public.comentarios ENABLE TRIGGER aue_espelha_comentario_apagado_na_resposta;

-- Reparo não copia o que falta (post sem tópico fica só no contador informativo).
ALTER TABLE public.posts_comunidade DISABLE TRIGGER aue_espelha_post_no_topico;
INSERT INTO public.posts_comunidade (id, group_id, user_id, post_type, topic, content, created_at)
SELECT 'b5000000-0000-0000-0000-0000000000aa', g.id, 'b1000000-0000-0000-0000-000000000001', 'text_announcement', 'x', 'post cujo espelho falhou', now() FROM public.grupos g WHERE g.slug = 'historias-de-arroto';
ALTER TABLE public.posts_comunidade ENABLE TRIGGER aue_espelha_post_no_topico;
DO $t$
DECLARE v jsonb;
BEGIN
  v := public.aue_reconciliar_acervo();
  PERFORM t_forum.ok((v->>'posts_sem_topico')::int = 1 AND (v->>'corrigidos')::int = 0, 'post sem tópico: só informado, não copiado: ' || v::text);
  PERFORM t_forum.ok(NOT EXISTS (SELECT 1 FROM public.topicos WHERE legado_post_id = 'b5000000-0000-0000-0000-0000000000aa'), 'reparo não cria tópico');
  PERFORM public.aue_migrar_acervo_para_topicos();
  PERFORM t_forum.ok((public.aue_reconciliar_acervo()->>'posts_sem_topico')::int = 0, 'depois do backfill, o contador zera');
END $t$;

-- =============================================================================
-- Fim
-- =============================================================================
:como_admin
DO $t$ BEGIN
  RAISE NOTICE 'TODOS OS TESTES DO FORUM PASSARAM: % asserções', (SELECT n FROM t_forum.placar);
END $t$;
ROLLBACK;

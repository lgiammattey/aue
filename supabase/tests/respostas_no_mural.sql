-- Executar SOMENTE em banco local descartável com todas as migrações aplicadas:
-- psql -v ON_ERROR_STOP=1 -d <banco-local> -f supabase/tests/respostas_no_mural.sql
-- Fixtures são sintéticas e toda a execução termina em ROLLBACK.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA teste_respostas_mural;
GRANT USAGE ON SCHEMA teste_respostas_mural TO PUBLIC;
CREATE FUNCTION teste_respostas_mural.erro(p_sql text, p_state text, p_hint text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_state text; v_hint text;
BEGIN
  BEGIN EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_hint = PG_EXCEPTION_HINT;
    IF v_state <> p_state OR (p_hint IS NOT NULL AND v_hint IS DISTINCT FROM p_hint) THEN
      RAISE EXCEPTION 'Esperava % / %, recebeu % / %', p_state, p_hint, v_state, v_hint;
    END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'A operação deveria falhar: %', p_sql;
END $$;
INSERT INTO auth.users (id, email, is_anonymous) VALUES
 ('b4000000-0000-0000-0000-000000000001', 'autor-mural@teste.aue', false),
 ('b4000000-0000-0000-0000-000000000002', 'visitante-mural@teste.aue', false),
 ('b4000000-0000-0000-0000-000000000003', NULL, true);
UPDATE public.perfis SET perfil_social_concluido_em = now()
 WHERE id IN ('b4000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000002');
INSERT INTO public.grupos (id, nome, slug, descricao, icone)
VALUES ('b4000000-0000-0000-0000-000000000010', 'Grupo teste mural', 'grupo-teste-mural', '', '');
INSERT INTO public.topicos (id, comunidade_id, autor_id, titulo, corpo, status) VALUES
 ('b4000000-0000-0000-0000-000000000011', 'b4000000-0000-0000-0000-000000000010', 'b4000000-0000-0000-0000-000000000001', 'Aberto', 'Texto', 'aberto'),
 ('b4000000-0000-0000-0000-000000000012', 'b4000000-0000-0000-0000-000000000010', 'b4000000-0000-0000-0000-000000000001', 'Fechado', 'Texto', 'fechado'),
 ('b4000000-0000-0000-0000-000000000013', 'b4000000-0000-0000-0000-000000000010', 'b4000000-0000-0000-0000-000000000001', 'Oculto', 'Texto', 'oculto');
DO $$ BEGIN
 IF has_function_privilege('anon', 'public.responder_topico_com_anexo(uuid,text,uuid,text,text,text,integer,integer,text)', 'EXECUTE') THEN
   RAISE EXCEPTION 'Visitante não pode executar RPC de resposta';
 END IF;
 IF EXISTS (SELECT 1 FROM public.membros_grupo WHERE group_id = 'b4000000-0000-0000-0000-000000000010' AND user_id = 'b4000000-0000-0000-0000-000000000002') THEN
   RAISE EXCEPTION 'Conta de teste não deveria ser membro';
 END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', 'b4000000-0000-0000-0000-000000000002', true);
SET ROLE authenticated;
DO $$ DECLARE r public.respostas; BEGIN
 r := public.responder_topico('b4000000-0000-0000-0000-000000000011', 'Resposta sem filiação');
 IF r.autor_id <> 'b4000000-0000-0000-0000-000000000002' OR r.corpo <> 'Resposta sem filiação' THEN
   RAISE EXCEPTION 'Resposta não preservou autor e texto';
 END IF;
 PERFORM teste_respostas_mural.erro($q$SELECT public.responder_topico('b4000000-0000-0000-0000-000000000012', 'resposta')$q$, 'P0001', 'topico_fechado');
 PERFORM teste_respostas_mural.erro($q$SELECT public.responder_topico('b4000000-0000-0000-0000-000000000013', 'resposta')$q$, '22023', 'topico_nao_encontrado');
 PERFORM teste_respostas_mural.erro($q$SELECT public.responder_topico('b4000000-0000-0000-0000-000000000011', repeat('x',1001))$q$, '22023', 'resposta_invalida');
 PERFORM teste_respostas_mural.erro($q$SELECT public.responder_topico('b4000000-0000-0000-0000-000000000011', 'resposta', 'b4000000-0000-0000-0000-000000000099')$q$, '22023', 'pai_invalido');
END $$;
RESET ROLE;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.membros_grupo WHERE group_id = 'b4000000-0000-0000-0000-000000000010' AND user_id = 'b4000000-0000-0000-0000-000000000002') THEN
   RAISE EXCEPTION 'Responder não deve criar participação';
 END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', 'b4000000-0000-0000-0000-000000000003', true);
SET ROLE authenticated;
SELECT teste_respostas_mural.erro($q$SELECT public.responder_topico('b4000000-0000-0000-0000-000000000011', 'anônimo')$q$, '42501');
RESET ROLE;
ROLLBACK;

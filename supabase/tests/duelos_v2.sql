-- Testa RLS/RPC em banco descartável com migration aplicada. Não prova a API
-- HTTP do Storage, concorrência real, a veracidade das medições nem produção.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002'),
 ('00000000-0000-0000-0000-000000000003');
CREATE TEMP TABLE dados_teste(chave text PRIMARY KEY, valor text);
GRANT ALL ON dados_teste TO authenticated, anon;
SET LOCAL ROLE authenticated;
SELECT set_config('storage.operation','storage.object.upload',true);
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
INSERT INTO dados_teste VALUES ('a', public.aue_v2_preparar_gravacao()::text);
DO $$ DECLARE v jsonb := (SELECT valor::jsonb FROM dados_teste WHERE chave='a'); BEGIN
  IF has_table_privilege(current_user, 'aue_privado.duelos_v2', 'SELECT') THEN RAISE EXCEPTION 'Tabela direta exposta'; END IF;
  BEGIN
    PERFORM public.aue_v2_confirmar_gravacao((v->>'id')::uuid, 1200, 'experimental-2');
    RAISE EXCEPTION 'Confirmou sem upload';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
END $$;
INSERT INTO storage.objects(bucket_id,name) SELECT 'duelos_v2', valor::jsonb->>'caminho' FROM dados_teste WHERE chave='a';
-- Mesmo antes das migrations seguintes, nem o dono acessa o objeto por GET direto.
SELECT set_config('storage.operation','storage.object.get_authenticated',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2') THEN RAISE EXCEPTION 'GET direto aberto na primeira migration'; END IF;
END $$;
SELECT set_config('storage.operation','storage.object.upload',true);
SELECT public.aue_v2_confirmar_gravacao(((SELECT valor FROM dados_teste WHERE chave='a')::jsonb->>'id')::uuid,1200,'experimental-2');
INSERT INTO dados_teste VALUES ('d', public.aue_v2_criar_duelo(((SELECT valor FROM dados_teste WHERE chave='a')::jsonb->>'id')::uuid)::text);
DO $$ DECLARE t text := (SELECT valor::jsonb->>'token' FROM dados_teste WHERE chave='d'); BEGIN
  IF length(t) <> 64 THEN RAISE EXCEPTION 'Token inválido'; END IF;
  BEGIN
    PERFORM public.aue_v2_criar_duelo(((SELECT valor FROM dados_teste WHERE chave='a')::jsonb->>'id')::uuid);
    RAISE EXCEPTION 'Gravação criou segundo duelo';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  IF public.aue_v2_responder_duelo(t, ((SELECT valor FROM dados_teste WHERE chave='a')::jsonb->>'id')::uuid)->>'estado' <> 'criador' THEN RAISE EXCEPTION 'Criador ocupou vaga'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
SELECT set_config('storage.operation','storage.object.get_authenticated',true);
DO $$ DECLARE t text := (SELECT valor::jsonb->>'token' FROM dados_teste WHERE chave='d'); BEGIN
  IF public.aue_v2_abrir_duelo(t) <> '{"estado":"aguardando_resposta","categoria":"duracao"}'::jsonb THEN RAISE EXCEPTION 'Prévia revelou dados'; END IF;
  IF public.aue_v2_revelar_duelo(t)->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Revelação prematura'; END IF;
  PERFORM set_config('storage.operation','storage.object.upload',true);
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('duelos_v2','00000000-0000-0000-0000-000000000001/forjado.wav');
    RAISE EXCEPTION 'Upload indevido foi aceito';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('storage.operation','storage.object.get_authenticated',true);
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=(SELECT valor::jsonb->>'caminho' FROM dados_teste WHERE chave='a')) THEN RAISE EXCEPTION 'Áudio prematuro'; END IF;
END $$;
SELECT set_config('storage.operation','storage.object.upload',true);
INSERT INTO dados_teste VALUES ('b', public.aue_v2_preparar_gravacao()::text);
INSERT INTO storage.objects(bucket_id,name) SELECT 'duelos_v2', valor::jsonb->>'caminho' FROM dados_teste WHERE chave='b';
SELECT public.aue_v2_confirmar_gravacao(((SELECT valor FROM dados_teste WHERE chave='b')::jsonb->>'id')::uuid,900,'experimental-2');
SELECT set_config('storage.operation','storage.object.get_authenticated',true);
DO $$ DECLARE t text := (SELECT valor::jsonb->>'token' FROM dados_teste WHERE chave='d'); b uuid := ((SELECT valor FROM dados_teste WHERE chave='b')::jsonb->>'id')::uuid; v jsonb; BEGIN
  IF public.aue_v2_responder_duelo(t,b)->>'estado' <> 'respondido' THEN RAISE EXCEPTION 'Resposta recusada'; END IF;
  IF public.aue_v2_responder_duelo(t,b)->>'estado' <> 'respondido' THEN RAISE EXCEPTION 'Retry não é idempotente'; END IF;
  v := public.aue_v2_revelar_duelo(t);
  IF v->>'estado' <> 'revelado' OR v->>'resultado_provisorio' <> 'criador' OR v->>'origem_medicao' <> 'cliente_nao_verificada' THEN RAISE EXCEPTION 'Revelação incorreta'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=(SELECT valor::jsonb->>'caminho' FROM dados_teste WHERE chave='a')) THEN RAISE EXCEPTION 'GET direto indevido após resposta'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
DO $$ DECLARE t text := (SELECT valor::jsonb->>'token' FROM dados_teste WHERE chave='d'); BEGIN
  IF public.aue_v2_revelar_duelo(t)->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Terceiro recebeu resultado'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2') THEN RAISE EXCEPTION 'Terceiro leu áudio'; END IF;
  IF public.aue_v2_responder_duelo(t,gen_random_uuid())->>'estado' <> 'ocupado' THEN RAISE EXCEPTION 'Duelo fechado aceitou terceiro'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
  IF public.aue_v2_abrir_duelo('invalido')->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Token inválido aceito'; END IF;
  IF has_function_privilege(current_user,'public.aue_v2_revelar_duelo(text)','EXECUTE') THEN RAISE EXCEPTION 'anon executa revelação'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2') THEN RAISE EXCEPTION 'anon leu áudio'; END IF;
END $$;
ROLLBACK;

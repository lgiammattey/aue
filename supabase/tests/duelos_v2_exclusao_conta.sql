-- Executar apenas em banco de teste com as migrations v2 e a trava aplicadas.
-- Não prova Storage HTTP, CDN, remoção física ou corrida entre transações.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('b679bf00-e35a-4ed3-9798-000000000001'),
 ('b679bf00-e35a-4ed3-9798-000000000002');
CREATE TEMP TABLE registros_teste (dados jsonb);
GRANT ALL ON registros_teste TO authenticated;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b679bf00-e35a-4ed3-9798-000000000001',true);
INSERT INTO registros_teste SELECT public.aue_v2_preparar_gravacao();
DO $$ BEGIN
 IF has_function_privilege('authenticated','public.aue_v2_iniciar_exclusao_conta(uuid)','EXECUTE') THEN RAISE EXCEPTION 'Cliente pode bloquear conta'; END IF;
 IF has_function_privilege('authenticated','public.aue_v2_preparar_gravacao_sem_trava()','EXECUTE') THEN RAISE EXCEPTION 'Implementação sem trava exposta'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE service_role;
DO $$ DECLARE r jsonb; BEGIN
 r := public.aue_v2_iniciar_exclusao_conta('b679bf00-e35a-4ed3-9798-000000000001');
 IF r->>'estado' <> 'bloqueada' THEN RAISE EXCEPTION 'Bloqueio falhou'; END IF;
 r := public.aue_v2_iniciar_exclusao_conta('b679bf00-e35a-4ed3-9798-000000000001');
 IF r->>'estado' <> 'bloqueada' THEN RAISE EXCEPTION 'Retry falhou'; END IF;
 IF jsonb_array_length(public.aue_v2_inventario_exclusao_conta('b679bf00-e35a-4ed3-9798-000000000001',null)) <> 1 THEN RAISE EXCEPTION 'Inventário incompleto'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b679bf00-e35a-4ed3-9798-000000000001',true);
DO $$ DECLARE p jsonb := (SELECT dados FROM registros_teste LIMIT 1); BEGIN
 BEGIN PERFORM public.aue_v2_preparar_gravacao(); RAISE EXCEPTION 'Preparo permitido'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.aue_v2_confirmar_gravacao((p->>'id')::uuid,1000,'experimental-2'); RAISE EXCEPTION 'Confirmação permitida'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.aue_v2_criar_duelo((p->>'id')::uuid,repeat('a',64)); RAISE EXCEPTION 'Criação permitida'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.aue_v2_responder_duelo(repeat('a',64),(p->>'id')::uuid); RAISE EXCEPTION 'Resposta permitida'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.aue_v2_reemitir_convite((p->>'id')::uuid,repeat('a',64),1); RAISE EXCEPTION 'Reemissão permitida'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.aue_v2_denunciar_por_duelo(gen_random_uuid(),'criador','outro'); RAISE EXCEPTION 'Denúncia permitida'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM set_config('storage.operation','storage.object.upload',true); INSERT INTO storage.objects(bucket_id,name) VALUES ('duelos_v2',p->>'caminho'); RAISE EXCEPTION 'Upload permitido'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','b679bf00-e35a-4ed3-9798-000000000002',true);
DO $$ BEGIN
 IF public.aue_v2_preparar_gravacao()->>'estado' = 'bloqueada' THEN RAISE EXCEPTION 'Outra conta afetada'; END IF;
END $$;
ROLLBACK;

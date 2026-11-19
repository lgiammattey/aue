-- Apenas em banco de teste. Objetos SQL simulam metadados, não a API Storage.
BEGIN;
INSERT INTO auth.users(id) VALUES ('a0000000-0000-4000-8000-000000000001'),('a0000000-0000-4000-8000-000000000002');
INSERT INTO aue_privado.gravacoes_v2(id,usuario_id,caminho,estado,duracao_ms,versao_regua,confirmado_em) VALUES
 ('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001/b0000000-0000-4000-8000-000000000001.wav','confirmada',1000,'experimental-2',now()),
 ('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000002/b0000000-0000-4000-8000-000000000002.wav','confirmada',900,'experimental-2',now());
INSERT INTO storage.objects(bucket_id,name) VALUES
 ('duelos_v2','a0000000-0000-4000-8000-000000000001/b0000000-0000-4000-8000-000000000001.wav'),
 ('duelos_v2','a0000000-0000-4000-8000-000000000002/b0000000-0000-4000-8000-000000000002.wav');
INSERT INTO aue_privado.duelos_v2(id,token_hash,criador_id,gravacao_criador_id,desafiante_id,gravacao_resposta_id,respondido_em) VALUES
 ('c0000000-0000-4000-8000-000000000001',extensions.digest('segredo','sha256'),'a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000002',now());
INSERT INTO aue_privado.denuncias_v2(id,duelo_id,gravacao_id,denunciante_id,motivo,estado,moderador_id,moderado_em) VALUES
 ('d0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','outro','mantida','a0000000-0000-4000-8000-000000000001',now());
INSERT INTO aue_privado.decisoes_moderacao_v2(denuncia_id,moderador_id,decisao) VALUES
 ('d0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','mantida');
SET LOCAL ROLE service_role;
DO $$ DECLARE r jsonb; BEGIN
 r := public.aue_v2_iniciar_exclusao_conta('a0000000-0000-4000-8000-000000000001');
 r := public.aue_v2_anonimizar_conta('a0000000-0000-4000-8000-000000000001');
 IF r->>'estado' <> 'remocao_pendente' THEN RAISE EXCEPTION 'Anonimizou antes da remoção'; END IF;
 r := public.aue_v2_registrar_remocao_operacional('a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001');
 IF r->>'estado' <> 'remocao_pendente' THEN RAISE EXCEPTION 'Registrou objeto presente como removido'; END IF;
END $$;
RESET ROLE;
DELETE FROM storage.objects WHERE name='a0000000-0000-4000-8000-000000000001/b0000000-0000-4000-8000-000000000001.wav';
SET LOCAL ROLE service_role;
DO $$ DECLARE r jsonb; BEGIN
 r := public.aue_v2_registrar_remocao_operacional('a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001');
 IF r->>'estado' <> 'removida' THEN RAISE EXCEPTION 'Registro de remoção falhou'; END IF;
 r := public.aue_v2_anonimizar_conta('a0000000-0000-4000-8000-000000000001');
 IF r->>'estado' <> 'anonimizada' THEN RAISE EXCEPTION 'Anonimização falhou'; END IF;
 IF public.aue_v2_anonimizar_conta('a0000000-0000-4000-8000-000000000001')->>'estado' <> 'anonimizada' THEN RAISE EXCEPTION 'Retry falhou'; END IF;
 IF public.aue_v2_concluir_exclusao_conta('a0000000-0000-4000-8000-000000000001')->>'estado' <> 'auth_pendente' THEN RAISE EXCEPTION 'Removeu trava antes de Auth'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM aue_privado.gravacoes_v2 WHERE id='b0000000-0000-4000-8000-000000000001' AND usuario_id IS NULL AND caminho IS NULL AND duracao_ms IS NULL AND usuario_excluido) THEN RAISE EXCEPTION 'Gravação não foi anonimizada'; END IF;
 IF NOT EXISTS (SELECT 1 FROM aue_privado.gravacoes_v2 WHERE id='b0000000-0000-4000-8000-000000000002' AND usuario_id='a0000000-0000-4000-8000-000000000002' AND duracao_ms=900) THEN RAISE EXCEPTION 'Gravação de terceiro alterada'; END IF;
 IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE name='a0000000-0000-4000-8000-000000000002/b0000000-0000-4000-8000-000000000002.wav') THEN RAISE EXCEPTION 'Objeto de terceiro apagado'; END IF;
 IF NOT EXISTS (SELECT 1 FROM aue_privado.duelos_v2 WHERE id='c0000000-0000-4000-8000-000000000001' AND criador_id IS NULL AND criador_excluido AND desafiante_id='a0000000-0000-4000-8000-000000000002') THEN RAISE EXCEPTION 'Duelo não preservado'; END IF;
 IF NOT EXISTS (SELECT 1 FROM aue_privado.denuncias_v2 WHERE id='d0000000-0000-4000-8000-000000000001' AND denunciante_id IS NULL AND denunciante_excluido AND moderador_id IS NULL AND moderador_excluido AND estado='mantida') THEN RAISE EXCEPTION 'Denúncia não preservada'; END IF;
 IF NOT EXISTS (SELECT 1 FROM aue_privado.decisoes_moderacao_v2 WHERE denuncia_id='d0000000-0000-4000-8000-000000000001' AND moderador_id IS NULL AND moderador_excluido) THEN RAISE EXCEPTION 'Decisão não preservada'; END IF;
END $$;
DELETE FROM auth.users WHERE id='a0000000-0000-4000-8000-000000000001';
SET LOCAL ROLE service_role;
DO $$ BEGIN IF public.aue_v2_concluir_exclusao_conta('a0000000-0000-4000-8000-000000000001')->>'estado' <> 'concluida' THEN RAISE EXCEPTION 'Trava não concluída'; END IF; END $$;
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT public.aue_v2_iniciar_exclusao_conta('a0000000-0000-4000-8000-000000000002');
RESET ROLE;
DELETE FROM storage.objects WHERE name='a0000000-0000-4000-8000-000000000002/b0000000-0000-4000-8000-000000000002.wav';
SET LOCAL ROLE service_role;
SELECT public.aue_v2_registrar_remocao_operacional('a0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000002');
SELECT public.aue_v2_anonimizar_conta('a0000000-0000-4000-8000-000000000002');
RESET ROLE;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM aue_privado.duelos_v2 WHERE id='c0000000-0000-4000-8000-000000000001' AND criador_excluido AND desafiante_excluido AND criador_id IS NULL AND desafiante_id IS NULL) THEN RAISE EXCEPTION 'Duas contas anonimizadas quebraram duelo'; END IF;
END $$;
ROLLBACK;

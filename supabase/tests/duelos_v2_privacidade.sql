-- Banco descartável e Storage simulado; NÃO demonstra HTTP nem remoção física.
BEGIN;
INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000004');
INSERT INTO public.administradores_do_aue(usuario_id) VALUES ('00000000-0000-0000-0000-000000000004');
CREATE TEMP TABLE dados_privacidade(chave text PRIMARY KEY, valor text);
GRANT ALL ON dados_privacidade TO authenticated, anon;
SET LOCAL ROLE authenticated;
SELECT set_config('storage.operation','storage.object.upload',true);
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
INSERT INTO dados_privacidade VALUES ('a', public.aue_v2_preparar_gravacao()::text);
INSERT INTO storage.objects(bucket_id,name) SELECT 'duelos_v2', valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='a';
SELECT public.aue_v2_confirmar_gravacao(((SELECT valor FROM dados_privacidade WHERE chave='a')::jsonb->>'id')::uuid,1200,'experimental-2');
INSERT INTO dados_privacidade VALUES ('d',public.aue_v2_criar_duelo(((SELECT valor FROM dados_privacidade WHERE chave='a')::jsonb->>'id')::uuid)::text);
DO $$ DECLARE t text := (SELECT valor::jsonb->>'token' FROM dados_privacidade WHERE chave='d'); BEGIN
  IF public.aue_v2_denunciar_audio(t,'criador','ofensivo')->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Denúncia antes da resposta'; END IF;
  IF aue_privado.pode_remover_audio_v2((SELECT valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='a')) THEN RAISE EXCEPTION 'Remoção sem pedido'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
DO $$ DECLARE a uuid := ((SELECT valor FROM dados_privacidade WHERE chave='a')::jsonb->>'id')::uuid; BEGIN
  BEGIN PERFORM public.aue_v2_solicitar_exclusao(a); RAISE EXCEPTION 'Terceiro solicitou exclusão'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.aue_v2_confirmar_exclusao(a); RAISE EXCEPTION 'Terceiro confirmou exclusão'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.aue_v2_listar_denuncias(); RAISE EXCEPTION 'Terceiro leu denúncias'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.aue_v2_moderar_denuncia('00000000-0000-0000-0000-000000000001','restaurada'); RAISE EXCEPTION 'Terceiro moderou'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO dados_privacidade VALUES ('b', public.aue_v2_preparar_gravacao()::text);
INSERT INTO storage.objects(bucket_id,name) SELECT 'duelos_v2', valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='b';
SELECT public.aue_v2_confirmar_gravacao(((SELECT valor FROM dados_privacidade WHERE chave='b')::jsonb->>'id')::uuid,900,'experimental-2');
SELECT set_config('storage.operation','storage.object.get_authenticated',true);
SELECT public.aue_v2_responder_duelo((SELECT valor::jsonb->>'token' FROM dados_privacidade WHERE chave='d'), ((SELECT valor FROM dados_privacidade WHERE chave='b')::jsonb->>'id')::uuid);
SELECT set_config('storage.operation','storage.object.sign',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2') THEN RAISE EXCEPTION 'URL assinada ainda pode ser gerada'; END IF;
END $$;
SELECT set_config('storage.operation','storage.object.sign_many',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2') THEN RAISE EXCEPTION 'URLs assinadas ainda podem ser geradas'; END IF;
END $$;
SELECT set_config('storage.operation','storage.object.get_authenticated',true);
DO $$ DECLARE t text := (SELECT valor::jsonb->>'token' FROM dados_privacidade WHERE chave='d'); BEGIN
  IF public.aue_v2_denunciar_audio(t,'desafiante','ofensivo')->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Pode denunciar áudio próprio'; END IF;
  IF public.aue_v2_denunciar_audio(t,'criador','ofensivo')->>'estado' <> 'registrada' THEN RAISE EXCEPTION 'Falhou denúncia válida'; END IF;
  IF public.aue_v2_denunciar_audio(t,'criador','ofensivo')->>'estado' <> 'registrada' THEN RAISE EXCEPTION 'Retry denúncia falhou'; END IF;
  IF public.aue_v2_revelar_duelo(t)->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Revelou denúncia'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=(SELECT valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='a')) THEN RAISE EXCEPTION 'Áudio denunciado legível'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
DO $$ DECLARE t text := (SELECT valor::jsonb->>'token' FROM dados_privacidade WHERE chave='d'); BEGIN
  IF public.aue_v2_denunciar_audio(t,'criador','ofensivo')->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Terceiro denunciou'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
INSERT INTO dados_privacidade VALUES ('denuncia', (public.aue_v2_listar_denuncias()->0)::text);
DO $$ DECLARE d uuid := ((SELECT valor FROM dados_privacidade WHERE chave='denuncia')::jsonb->>'id')::uuid; BEGIN
  IF d IS NULL THEN RAISE EXCEPTION 'Fila não inclui denúncia'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=(SELECT valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='a')) THEN RAISE EXCEPTION 'Moderador lê áudio diretamente'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=(SELECT valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='b')) THEN RAISE EXCEPTION 'Moderador leu áudio não reportado'; END IF;
  IF public.aue_v2_moderar_denuncia(d,'restaurada')->>'estado' <> 'restaurada' THEN RAISE EXCEPTION 'Moderação falhou'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
DO $$ DECLARE t text := (SELECT valor::jsonb->>'token' FROM dados_privacidade WHERE chave='d'); BEGIN
  IF public.aue_v2_revelar_duelo(t)->>'estado' <> 'revelado' THEN RAISE EXCEPTION 'Não restaurou'; END IF;
  IF public.aue_v2_denunciar_audio(t,'criador','ofensivo')->>'estado' <> 'ja_analisada' THEN RAISE EXCEPTION 'Retry após moderação falhou'; END IF;
  IF public.aue_v2_revelar_duelo(t)->>'estado' <> 'revelado' THEN RAISE EXCEPTION 'Retry reabriu denúncia encerrada'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
DO $$ DECLARE a uuid := ((SELECT valor FROM dados_privacidade WHERE chave='a')::jsonb->>'id')::uuid; v jsonb; BEGIN
  v := public.aue_v2_solicitar_exclusao(a);
  IF v->>'estado' <> 'remocao_pendente' OR v->>'caminho' <> (SELECT valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='a') THEN RAISE EXCEPTION 'Exclusão não solicitada'; END IF;
  IF public.aue_v2_solicitar_exclusao(a) <> v THEN RAISE EXCEPTION 'Retry exclusão mudou'; END IF;
  IF public.aue_v2_confirmar_exclusao(a)->>'estado' <> 'remocao_pendente' THEN RAISE EXCEPTION 'Declarou excluído antes da API'; END IF;
  IF jsonb_array_length(public.aue_v2_exclusoes_pendentes()) <> 1 THEN RAISE EXCEPTION 'Perdeu exclusão pendente'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=v->>'caminho') THEN RAISE EXCEPTION 'Dono ainda baixa após exclusão'; END IF;
  IF public.aue_v2_revelar_duelo((SELECT valor::jsonb->>'token' FROM dados_privacidade WHERE chave='d'))->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Resultado revelou áudio em remoção'; END IF;
END $$;
SELECT set_config('storage.operation','storage.object.delete_many',true);
DO $$ DECLARE caminho text := (SELECT valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='a'); BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=caminho) THEN RAISE EXCEPTION 'Storage.remove não conseguiria selecionar'; END IF;
  IF aue_privado.pode_remover_audio_v2((SELECT valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='b')) THEN RAISE EXCEPTION 'Storage.remove permite apagar áudio de outro'; END IF;
END $$;
SELECT set_config('storage.operation','storage.object.get_authenticated',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=(SELECT valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='a')) THEN RAISE EXCEPTION 'Objeto baixável ao trocar operação'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=(SELECT valor::jsonb->>'caminho' FROM dados_privacidade WHERE chave='a')) THEN RAISE EXCEPTION 'Moderador lê áudio solicitado para exclusão'; END IF;
END $$;
-- Apenas o banco descartável é esvaziado: não prova remoção pela API Storage.
RESET ROLE;
TRUNCATE storage.objects;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
DO $$ DECLARE a uuid := ((SELECT valor FROM dados_privacidade WHERE chave='a')::jsonb->>'id')::uuid; BEGIN
  IF public.aue_v2_confirmar_exclusao(a)->>'estado' <> 'remocao_pendente' THEN RAISE EXCEPTION 'Ausência virou confirmação indevida'; END IF;
  IF public.aue_v2_solicitar_exclusao(a)->>'estado' <> 'remocao_pendente' THEN RAISE EXCEPTION 'Retry perdeu pendência'; END IF;
END $$;
ROLLBACK;

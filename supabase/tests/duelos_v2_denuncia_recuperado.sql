-- Exercita denúncia por identidade sem token, em banco descartável.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('00000000-0000-0000-0000-000000000011'),
 ('00000000-0000-0000-0000-000000000012'),
 ('00000000-0000-0000-0000-000000000013'),
 ('00000000-0000-0000-0000-000000000004');
-- O moderador sintético exerce a mesma autorização consultada pelo produto.
INSERT INTO public.administradores_do_aue(usuario_id) VALUES ('00000000-0000-0000-0000-000000000004');
CREATE TEMP TABLE prova_denuncia(chave text PRIMARY KEY, valor text);
GRANT ALL ON prova_denuncia TO authenticated;
SET LOCAL ROLE authenticated;
SELECT set_config('storage.operation','storage.object.upload',true);
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000011',true);
INSERT INTO prova_denuncia VALUES ('a', public.aue_v2_preparar_gravacao()::text);
INSERT INTO storage.objects(bucket_id,name) SELECT 'duelos_v2', valor::jsonb->>'caminho' FROM prova_denuncia WHERE chave='a';
SELECT public.aue_v2_confirmar_gravacao((valor::jsonb->>'id')::uuid,1200,'experimental-2') FROM prova_denuncia WHERE chave='a';
INSERT INTO prova_denuncia VALUES ('duelo', public.aue_v2_criar_duelo((SELECT (valor::jsonb->>'id')::uuid FROM prova_denuncia WHERE chave='a'), repeat('a',64))::text);
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000012',true);
INSERT INTO prova_denuncia VALUES ('b', public.aue_v2_preparar_gravacao()::text);
INSERT INTO storage.objects(bucket_id,name) SELECT 'duelos_v2', valor::jsonb->>'caminho' FROM prova_denuncia WHERE chave='b';
SELECT public.aue_v2_confirmar_gravacao((valor::jsonb->>'id')::uuid,900,'experimental-2') FROM prova_denuncia WHERE chave='b';
SELECT public.aue_v2_responder_duelo(repeat('a',64),(SELECT (valor::jsonb->>'id')::uuid FROM prova_denuncia WHERE chave='b'));
DO $$ DECLARE d uuid := (SELECT (valor::jsonb->>'id')::uuid FROM prova_denuncia WHERE chave='duelo'); BEGIN
  IF public.aue_v2_denunciar_por_duelo(d,'desafiante','ofensivo')->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Permitiu denunciar próprio áudio'; END IF;
  IF public.aue_v2_denunciar_por_duelo(d,'criador','ofensivo')->>'estado' <> 'registrada' THEN RAISE EXCEPTION 'Não registrou denúncia'; END IF;
  IF public.aue_v2_denunciar_por_duelo(d,'criador','outro')->>'estado' <> 'registrada' THEN RAISE EXCEPTION 'Retry de denúncia pendente falhou'; END IF;
  IF public.aue_v2_denunciar_audio(repeat('a',64),'criador','ofensivo')->>'estado' <> 'registrada' THEN RAISE EXCEPTION 'Retry por token de denúncia pendente falhou'; END IF;
  IF public.aue_v2_recuperar_duelo(d)->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Áudio denunciado ainda revelado'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000013',true);
DO $$ DECLARE d uuid := (SELECT (valor::jsonb->>'id')::uuid FROM prova_denuncia WHERE chave='duelo'); BEGIN
  IF public.aue_v2_denunciar_por_duelo(d,'criador','ofensivo')->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Terceiro denunciou'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
INSERT INTO prova_denuncia VALUES ('denuncia', (public.aue_v2_listar_denuncias()->0)::text);
DO $$ DECLARE d uuid := (SELECT (valor::jsonb->>'id')::uuid FROM prova_denuncia WHERE chave='denuncia'); BEGIN
  IF d IS NULL OR jsonb_array_length(public.aue_v2_listar_denuncias()) <> 1 THEN RAISE EXCEPTION 'Retry duplicou ou perdeu denúncia'; END IF;
  PERFORM public.aue_v2_moderar_denuncia(d,'restaurada');
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000012',true);
DO $$ DECLARE d uuid := (SELECT (valor::jsonb->>'id')::uuid FROM prova_denuncia WHERE chave='duelo'); BEGIN
  IF public.aue_v2_denunciar_por_duelo(d,'criador','ofensivo')->>'estado' <> 'ja_analisada' THEN RAISE EXCEPTION 'Denúncia restaurada parece recém-registrada'; END IF;
  IF public.aue_v2_denunciar_audio(repeat('a',64),'criador','ofensivo')->>'estado' <> 'ja_analisada' THEN RAISE EXCEPTION 'Denúncia por token restaurada parece recém-registrada'; END IF;
  IF public.aue_v2_recuperar_duelo(d)->>'estado' <> 'revelado' THEN RAISE EXCEPTION 'Retry reabriu denúncia restaurada'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
SELECT public.aue_v2_moderar_denuncia((SELECT (valor::jsonb->>'id')::uuid FROM prova_denuncia WHERE chave='denuncia'),'mantida');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000012',true);
DO $$ DECLARE d uuid := (SELECT (valor::jsonb->>'id')::uuid FROM prova_denuncia WHERE chave='duelo'); BEGIN
  IF public.aue_v2_denunciar_por_duelo(d,'criador','ofensivo')->>'estado' <> 'ja_analisada' THEN RAISE EXCEPTION 'Denúncia mantida parece recém-registrada'; END IF;
  IF public.aue_v2_denunciar_audio(repeat('a',64),'criador','ofensivo')->>'estado' <> 'ja_analisada' THEN RAISE EXCEPTION 'Denúncia por token mantida parece recém-registrada'; END IF;
  IF public.aue_v2_recuperar_duelo(d)->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Denúncia mantida deixou áudio acessível'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  IF has_function_privilege(current_user,'public.aue_v2_denunciar_por_duelo(uuid,text,text)','EXECUTE') THEN RAISE EXCEPTION 'anon tem permissão'; END IF;
END $$;
ROLLBACK;

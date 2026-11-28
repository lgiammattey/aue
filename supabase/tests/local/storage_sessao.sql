-- RLS real sobre metadados sintéticos. Não envia arquivo ao serviço Storage.
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO auth.users(id, email, is_anonymous) VALUES
  ('62000000-0000-4000-8000-000000000001','conta@example.invalid',false),
  ('62000000-0000-4000-8000-000000000002',null,true);
UPDATE public.perfis SET perfil_social_concluido_em = now() WHERE id='62000000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','62000000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
  IF NOT aue_privado.sessao_promovida() OR has_function_privilege(current_user,'public.aue_e_conta_promovida(uuid)','EXECUTE')
  THEN RAISE EXCEPTION 'escopo da consulta de promoção divergente'; END IF;
END $$;
INSERT INTO storage.objects(bucket_id,name) VALUES
  ('avatars','62000000-0000-4000-8000-000000000001/perfil.jpg'),
  ('anexos_do_forum','62000000-0000-4000-8000-000000000001/forum/voz.wav');
DO $$ BEGIN
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('avatars','62000000-0000-4000-8000-000000000002/perfil.jpg');
    RAISE EXCEPTION 'aceitou pasta alheia';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
SELECT set_config('request.jwt.claim.sub','62000000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
  IF aue_privado.sessao_promovida() THEN RAISE EXCEPTION 'sessão anônima promovida'; END IF;
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('avatars','62000000-0000-4000-8000-000000000002/perfil.jpg');
    RAISE EXCEPTION 'perfil incompleto publicou';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
ROLLBACK;

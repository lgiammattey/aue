-- Foto de perfil: devolve a validação da URL, fecha o bucket para quem não é conta
-- promovida e permite apagar a própria foto.
--
-- 1. 20261018000010 recriou `atualizar_meu_perfil` sem a checagem de que a URL do
--    avatar aponta para a PRÓPRIA pasta do bucket `avatars` (existia em
--    20261018000005). Hoje o RPC aceita qualquer texto como foto.
-- 2. O upload ao bucket só exigia `authenticated` (inclui anônimo), enquanto o RPC
--    exige conta promovida: quem não era promovido subia o arquivo, o RPC recusava
--    e sobrava arquivo órfão. Agora o Storage recusa na porta, como em `capas_de_perfil`.
-- 3. Faltava política de DELETE: "remover foto" nunca apagava o arquivo.

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;

CREATE POLICY avatars_inserir_propria ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND public.aue_e_conta_promovida(auth.uid())
              AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY avatars_atualizar_propria ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND public.aue_e_conta_promovida(auth.uid())
         AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND public.aue_e_conta_promovida(auth.uid())
              AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY avatars_remover_propria ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.atualizar_meu_perfil(p_apelido text DEFAULT NULL,p_handle text DEFAULT NULL,p_bio text DEFAULT NULL,p_cidade text DEFAULT NULL,p_url_do_avatar text DEFAULT NULL,p_remover_avatar boolean DEFAULT false,p_instagram text DEFAULT NULL,p_tiktok text DEFAULT NULL,p_youtube text DEFAULT NULL,p_twitter text DEFAULT NULL)
RETURNS perfis LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $function$ DECLARE v_linha public.perfis; v_handle text;
BEGIN
  PERFORM public.aue_exigir_conta_promovida(); PERFORM set_config('aue.perfil_social','sim',true);
  IF p_apelido IS NOT NULL AND char_length(btrim(p_apelido)) NOT BETWEEN 2 AND 30 THEN RAISE EXCEPTION 'Apelido inválido' USING ERRCODE='22023'; END IF;
  IF p_url_do_avatar IS NOT NULL AND (
       p_url_do_avatar !~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/avatars/[0-9a-f-]{36}/avatar\.jpg(\?v=[0-9]+)?$'
       OR position('/avatars/' || auth.uid()::text || '/' IN p_url_do_avatar) = 0) THEN
    RAISE EXCEPTION 'Foto inválida' USING ERRCODE='22023';
  END IF;
  v_handle:=CASE WHEN p_handle IS NULL THEN NULL ELSE lower(regexp_replace(btrim(p_handle),'^@','')) END;
  IF v_handle IS NOT NULL AND (v_handle !~ '^[a-z0-9_]{3,20}$' OR v_handle IN ('aue','admin','suporte','moderacao','oficial','perfil','feed','arena')) THEN RAISE EXCEPTION 'Handle inválido ou reservado' USING ERRCODE='22023'; END IF;
  UPDATE public.perfis SET apelido=coalesce(btrim(p_apelido),apelido),handle=coalesce(v_handle,handle),bio=CASE WHEN p_bio IS NULL THEN bio ELSE nullif(btrim(p_bio),'') END,cidade=CASE WHEN p_cidade IS NULL THEN cidade ELSE nullif(btrim(p_cidade),'') END,url_do_avatar=CASE WHEN p_remover_avatar THEN NULL WHEN p_url_do_avatar IS NOT NULL THEN p_url_do_avatar ELSE url_do_avatar END,instagram=CASE WHEN p_instagram IS NULL THEN instagram ELSE nullif(regexp_replace(btrim(p_instagram),'^@',''),'') END,tiktok=CASE WHEN p_tiktok IS NULL THEN tiktok ELSE nullif(regexp_replace(btrim(p_tiktok),'^@',''),'') END,youtube=CASE WHEN p_youtube IS NULL THEN youtube ELSE nullif(regexp_replace(btrim(p_youtube),'^@',''),'') END,twitter=CASE WHEN p_twitter IS NULL THEN twitter ELSE nullif(regexp_replace(btrim(p_twitter),'^@',''),'') END WHERE id=auth.uid() RETURNING * INTO v_linha;
  RETURN v_linha;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Esse handle já é de outra pessoa' USING ERRCODE='23505'; END; $function$;

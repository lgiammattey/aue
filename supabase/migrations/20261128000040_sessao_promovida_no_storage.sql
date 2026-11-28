-- As policies precisam consultar o estado social somente da sessão atual.
-- O helper interno que aceita o UUID de qualquer conta continua privado.
CREATE FUNCTION aue_privado.sessao_promovida() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.aue_e_conta_promovida(auth.uid())
$$;
REVOKE ALL ON FUNCTION aue_privado.sessao_promovida() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION aue_privado.sessao_promovida() TO authenticated;

ALTER POLICY anexos_do_forum_inserir_proprio ON storage.objects WITH CHECK (
  bucket_id = 'anexos_do_forum' AND aue_privado.sessao_promovida()
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[2] = 'forum' AND array_length(storage.foldername(name), 1) = 2
);
ALTER POLICY arrotos_de_perfil_inserir_rascunho_proprio ON storage.objects WITH CHECK (
  bucket_id = 'arrotos_de_perfil' AND aue_privado.sessao_promovida()
  AND public.aue_pode_enviar_arroto_do_perfil(name)
);
ALTER POLICY avatars_inserir_propria ON storage.objects WITH CHECK (
  bucket_id = 'avatars' AND aue_privado.sessao_promovida() AND (storage.foldername(name))[1] = auth.uid()::text
);
ALTER POLICY avatars_atualizar_propria ON storage.objects USING (
  bucket_id = 'avatars' AND aue_privado.sessao_promovida() AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'avatars' AND aue_privado.sessao_promovida() AND (storage.foldername(name))[1] = auth.uid()::text
);
ALTER POLICY capas_de_perfil_inserir_propria ON storage.objects WITH CHECK (
  bucket_id = 'capas_de_perfil' AND aue_privado.sessao_promovida() AND (storage.foldername(name))[1] = auth.uid()::text
);
ALTER POLICY capas_de_perfil_atualizar_propria ON storage.objects USING (
  bucket_id = 'capas_de_perfil' AND aue_privado.sessao_promovida() AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'capas_de_perfil' AND aue_privado.sessao_promovida() AND (storage.foldername(name))[1] = auth.uid()::text
);
ALTER POLICY capas_de_perfil_remover_propria ON storage.objects USING (
  bucket_id = 'capas_de_perfil' AND aue_privado.sessao_promovida() AND (storage.foldername(name))[1] = auth.uid()::text
);

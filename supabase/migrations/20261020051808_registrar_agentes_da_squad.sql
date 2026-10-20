-- =============================================================================
-- Agentes oficiais da squad
--
-- Auth cria o usuário fora da migration pela API administrativa. Esta RPC só
-- conclui, de forma idempotente, a ficha social do usuário interno que já
-- nasceu pelo gatilho de auth.users. Ela não reaproveita a função histórica
-- registrar_conta_da_casa: aquela exige data de narrativa e reserva o nome
-- Lucas para o enredo Burpzilla.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.registrar_agente_da_squad(
  p_usuario_id uuid,
  p_apelido text,
  p_handle text,
  p_bio text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
  v_handle text := lower(regexp_replace(btrim(coalesce(p_handle, '')), '^@', ''));
BEGIN
  IF v_handle NOT IN (
    'tiago_aue', 'iury_aue', 'rian_aue', 'kayky_aue',
    'lucas_aue', 'camillo_aue', 'rodrigo_aue', 'marcelo_aue'
  ) THEN
    RAISE EXCEPTION 'Handle não pertence à squad oficial' USING ERRCODE = '22023';
  END IF;
  IF char_length(btrim(coalesce(p_apelido, ''))) NOT BETWEEN 2 AND 30 THEN
    RAISE EXCEPTION 'Apelido precisa ter de 2 a 30 caracteres' USING ERRCODE = '22023';
  END IF;
  IF char_length(btrim(coalesce(p_bio, ''))) NOT BETWEEN 2 AND 160 THEN
    RAISE EXCEPTION 'Bio precisa ter de 2 a 160 caracteres' USING ERRCODE = '22023';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_usuario_id;
  IF NOT FOUND OR v_email IS DISTINCT FROM (v_handle || '@contas-da-casa.invalid') THEN
    RAISE EXCEPTION 'Usuário interno da squad não confere' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.perfis WHERE id = p_usuario_id) THEN
    RAISE EXCEPTION 'Perfil de % não existe', p_usuario_id USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.contas_da_casa (usuario_id, papel)
  VALUES (p_usuario_id, 'agente')
  ON CONFLICT (usuario_id) DO UPDATE SET papel = EXCLUDED.papel;

  -- O trigger protege estatísticas/fundador; esta conta não ocupa vaga de fundador.
  ALTER TABLE public.perfis DISABLE TRIGGER ao_atualizar_perfil;

  PERFORM set_config('aue.perfil_social', 'sim', true);
  UPDATE public.perfis
     SET apelido = btrim(p_apelido),
         handle = v_handle,
         bio = btrim(p_bio),
         e_fundador = false,
         perfil_social_concluido_em = coalesce(perfil_social_concluido_em, now())
   WHERE id = p_usuario_id;

  ALTER TABLE public.perfis ENABLE TRIGGER ao_atualizar_perfil;

  INSERT INTO public.membros_grupo (group_id, user_id)
    SELECT id, p_usuario_id FROM public.grupos WHERE slug = 'bonde-geral'
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_agente_da_squad(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_agente_da_squad(uuid, text, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_agente_da_squad(uuid, text, text, text) TO service_role;

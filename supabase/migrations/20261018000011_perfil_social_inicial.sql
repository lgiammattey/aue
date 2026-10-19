-- =============================================================================
-- 20261018000011 — Ficha social inicial obrigatória
--
-- Uma conta promovida pode existir antes de ter uma identidade pública pronta.
-- A conta continua podendo jogar; o Bonde só abre depois do ato explícito de
-- concluir apelido + @. Perfis que já existiam antes desta migração seguem
-- prontos: não há lockout retroativo.
-- =============================================================================

ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS perfil_social_concluido_em timestamptz;

-- Esta é uma migração de comportamento, não uma cobrança retroativa: toda
-- conta promovida que já existia no instante da aplicação é considerada dona
-- de uma ficha concluída. Contas criadas daqui em diante começam pendentes.
UPDATE public.perfis p
   SET perfil_social_concluido_em = coalesce(p.perfil_social_concluido_em, now())
  FROM auth.users u
 WHERE u.id = p.id
   AND coalesce((to_jsonb(u)->>'is_anonymous')::boolean, false) = false
   AND nullif(btrim(u.email), '') IS NOT NULL
   AND p.perfil_social_concluido_em IS NULL;

-- "Promovida" passa a significar o que importa para a rede: conta identificada
-- E ficha social concluída. A identidade anônima ainda pode ser promovida e
-- preparar um rascunho, mas não se torna perfil público nesse intervalo.
CREATE OR REPLACE FUNCTION public.aue_e_conta_promovida(p_usuario_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_usuario_id IS NOT NULL AND EXISTS (
    SELECT 1
      FROM auth.users u
      JOIN public.perfis p ON p.id = u.id
     WHERE u.id = p_usuario_id
       AND coalesce((to_jsonb(u)->>'is_anonymous')::boolean, false) = false
       AND nullif(btrim(u.email), '') IS NOT NULL
       AND p.perfil_social_concluido_em IS NOT NULL
  );
$$;

-- Estado mínimo, próprio e persistido. A UI não infere conclusão por e-mail,
-- handle gerado ou localStorage; login futuro e OAuth leem esta mesma verdade.
CREATE OR REPLACE FUNCTION public.meu_estado_social()
RETURNS TABLE(conta_promovida boolean, perfil_social_concluido boolean)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM auth.users u
       WHERE u.id = auth.uid()
         AND coalesce((to_jsonb(u)->>'is_anonymous')::boolean, false) = false
         AND nullif(btrim(u.email), '') IS NOT NULL
    ),
    EXISTS (
      SELECT 1 FROM public.perfis p
       WHERE p.id = auth.uid()
         AND p.perfil_social_concluido_em IS NOT NULL
    );
$$;

-- Preparar cadastro preserva o @ escolhido enquanto a sessão ainda é anônima,
-- mas não conclui a ficha nem matricula a pessoa no Bonde Geral.
CREATE OR REPLACE FUNCTION public.preparar_promocao_social(p_apelido text, p_handle text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_handle text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessão ausente' USING ERRCODE = '28000'; END IF;
  PERFORM set_config('aue.perfil_social', 'sim', true);
  IF char_length(btrim(coalesce(p_apelido, ''))) NOT BETWEEN 2 AND 30 THEN RAISE EXCEPTION 'Apelido precisa ter de 2 a 30 caracteres' USING ERRCODE = '22023'; END IF;
  v_handle := lower(regexp_replace(btrim(coalesce(p_handle, '')), '^@', ''));
  IF v_handle = '' THEN v_handle := public.aue_gerar_handle(p_apelido, auth.uid()); END IF;
  IF v_handle !~ '^[a-z0-9_]{3,20}$' OR v_handle IN ('aue','admin','suporte','moderacao','oficial','perfil','feed','arena') THEN
    RAISE EXCEPTION 'Handle inválido ou reservado' USING ERRCODE = '22023';
  END IF;
  UPDATE public.perfis SET apelido = btrim(p_apelido), handle = v_handle WHERE id = auth.uid();
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Esse handle já é de outra pessoa' USING ERRCODE = '23505';
END;
$$;

-- Única transição pendente -> público. Recebe os mesmos campos da ficha para
-- que a tela inicial não precise de uma segunda escrita após o botão concluir.
CREATE OR REPLACE FUNCTION public.concluir_meu_perfil_social(
  p_apelido text,
  p_handle text,
  p_bio text DEFAULT NULL,
  p_cidade text DEFAULT NULL,
  p_instagram text DEFAULT NULL,
  p_tiktok text DEFAULT NULL,
  p_youtube text DEFAULT NULL,
  p_twitter text DEFAULT NULL
)
RETURNS public.perfis LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_linha public.perfis; v_handle text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users u
     WHERE u.id = auth.uid()
       AND coalesce((to_jsonb(u)->>'is_anonymous')::boolean, false) = false
       AND nullif(btrim(u.email), '') IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Conclusão do perfil exige conta promovida' USING ERRCODE = '42501';
  END IF;
  IF char_length(btrim(coalesce(p_apelido, ''))) NOT BETWEEN 2 AND 30 THEN
    RAISE EXCEPTION 'Apelido precisa ter de 2 a 30 caracteres' USING ERRCODE = '22023';
  END IF;
  v_handle := lower(regexp_replace(btrim(coalesce(p_handle, '')), '^@', ''));
  IF v_handle !~ '^[a-z0-9_]{3,20}$' OR v_handle IN ('aue','admin','suporte','moderacao','oficial','perfil','feed','arena') THEN
    RAISE EXCEPTION 'Handle inválido ou reservado' USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('aue.perfil_social', 'sim', true);
  UPDATE public.perfis
     SET apelido = btrim(p_apelido),
         handle = v_handle,
         bio = CASE WHEN p_bio IS NULL THEN bio ELSE nullif(btrim(p_bio), '') END,
         cidade = CASE WHEN p_cidade IS NULL THEN cidade ELSE nullif(btrim(p_cidade), '') END,
         instagram = CASE WHEN p_instagram IS NULL THEN instagram ELSE nullif(regexp_replace(btrim(p_instagram), '^@', ''), '') END,
         tiktok = CASE WHEN p_tiktok IS NULL THEN tiktok ELSE nullif(regexp_replace(btrim(p_tiktok), '^@', ''), '') END,
         youtube = CASE WHEN p_youtube IS NULL THEN youtube ELSE nullif(regexp_replace(btrim(p_youtube), '^@', ''), '') END,
         twitter = CASE WHEN p_twitter IS NULL THEN twitter ELSE nullif(regexp_replace(btrim(p_twitter), '^@', ''), '') END,
         perfil_social_concluido_em = coalesce(perfil_social_concluido_em, now())
   WHERE id = auth.uid()
   RETURNING * INTO v_linha;

  INSERT INTO public.membros_grupo (group_id, user_id)
    SELECT id, auth.uid() FROM public.grupos WHERE slug = 'bonde-geral'
  ON CONFLICT DO NOTHING;
  RETURN v_linha;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Esse handle já é de outra pessoa' USING ERRCODE = '23505';
END;
$$;

-- Rascunho privado usado exclusivamente na primeira ficha. Nunca consulta por
-- handle e não abre os dados de uma pessoa pendente para outro usuário.
CREATE OR REPLACE FUNCTION public.meu_perfil_social_para_edicao()
RETURNS TABLE(apelido text, handle text, bio text, cidade text, instagram text, tiktok text, youtube text, twitter text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.apelido, p.handle, p.bio, p.cidade, p.instagram, p.tiktok, p.youtube, p.twitter
    FROM public.perfis p
    JOIN auth.users u ON u.id = p.id
   WHERE p.id = auth.uid()
     AND coalesce((to_jsonb(u)->>'is_anonymous')::boolean, false) = false
     AND nullif(btrim(u.email), '') IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.meu_estado_social(), public.concluir_meu_perfil_social(text,text,text,text,text,text,text,text), public.meu_perfil_social_para_edicao() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_estado_social(), public.concluir_meu_perfil_social(text,text,text,text,text,text,text,text), public.meu_perfil_social_para_edicao() TO authenticated;

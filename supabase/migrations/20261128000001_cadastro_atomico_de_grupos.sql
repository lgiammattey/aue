-- Chamado somente pela Edge depois da validação do formulário.
CREATE FUNCTION public.cadastrar_grupo_com_limite(
  p_origem_hash text, p_slug text, p_nome text, p_descricao text,
  p_plataforma text, p_link text, p_criado_por uuid
) RETURNS TABLE(id uuid, slug text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_agora timestamptz;
  v_origem bigint;
  v_total bigint;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'o contador exige read committed';
  END IF;
  IF p_origem_hash IS NULL OR p_origem_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'origem inválida';
  END IF;
  -- Uma trava para todas as origens porque o segundo teto é global.
  -- O snapshot da consulta abaixo é obtido depois da espera.
  PERFORM pg_catalog.pg_advisory_xact_lock(724012, 1);
  v_agora := clock_timestamp();
  SELECT count(*) FILTER (WHERE e.origem_hash = p_origem_hash), count(*)
    INTO v_origem, v_total FROM public.envios_de_grupos e
    WHERE e.criado_em > v_agora - interval '1 hour';
  IF v_origem >= 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P1001', MESSAGE = 'limite da origem';
  END IF;
  IF v_total >= 100 THEN
    RAISE EXCEPTION USING ERRCODE = 'P1002', MESSAGE = 'limite total';
  END IF;
  INSERT INTO public.envios_de_grupos(origem_hash, criado_em) VALUES (p_origem_hash, v_agora);
  RETURN QUERY INSERT INTO public.grupos_externos AS g
    (slug, nome, descricao, tipo_de_plataforma, link_do_convite, criado_por)
    VALUES (p_slug, p_nome, p_descricao, p_plataforma, p_link, p_criado_por)
    RETURNING g.id, g.slug;
END;
$$;
REVOKE ALL ON FUNCTION public.cadastrar_grupo_com_limite(text,text,text,text,text,text,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cadastrar_grupo_com_limite(text,text,text,text,text,text,uuid)
  TO service_role;

CREATE INDEX IF NOT EXISTS envios_de_grupos_por_data ON public.envios_de_grupos(criado_em);

-- Dá HINT aos erros de `definir_regras_da_comunidade`, para o cliente separar
-- "não é moderador" de "sessão caiu" (mesmos HINTs dos RPCs de mídia).
CREATE OR REPLACE FUNCTION public.definir_regras_da_comunidade(p_slug text, p_regras text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id uuid; v_regras text[];
BEGIN
  SELECT g.id INTO v_id FROM public.grupos g WHERE lower(g.slug) = lower(btrim(coalesce(p_slug, '')));
  IF v_id IS NULL THEN RAISE EXCEPTION 'Comunidade não existe' USING ERRCODE = '22023', HINT = 'comunidade_inexistente'; END IF;
  IF NOT public.aue_pode_gerir_midia_da_comunidade(v_id) THEN
    RAISE EXCEPTION 'Só a moderação da comunidade pode mudar as regras' USING ERRCODE = '42501', HINT = 'nao_pode_gerir_midia';
  END IF;
  SELECT coalesce(array_agg(btrim(r)) FILTER (WHERE btrim(r) <> ''), ARRAY[]::text[])
    INTO v_regras FROM unnest(coalesce(p_regras, ARRAY[]::text[])) AS r;
  IF cardinality(v_regras) > 10 THEN RAISE EXCEPTION 'No máximo 10 regras' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(v_regras) AS r WHERE char_length(r) > 140) THEN
    RAISE EXCEPTION 'Cada regra tem até 140 caracteres' USING ERRCODE = '22023';
  END IF;
  UPDATE public.grupos SET regras = v_regras WHERE id = v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.definir_regras_da_comunidade(text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_regras_da_comunidade(text, text[]) TO authenticated;

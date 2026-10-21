-- Regras e moderadores de comunidade de verdade (issues #303 e #304).
--
-- A tela mostrava regras e moderadores fixos no código (inclusive nomes
-- inventados) e "Gestão salva" só mexia na memória. Agora:
--   - `grupos.regras` guarda as regras (até 10, 140 caracteres cada);
--   - `obter_detalhes_da_comunidade` devolve regras e moderadores reais
--     (criador e membros com papel `admin`, só contas promovidas);
--   - `definir_regras_da_comunidade` só aceita quem pode gerir a comunidade.

ALTER TABLE public.grupos ADD COLUMN IF NOT EXISTS regras text[] NOT NULL DEFAULT ARRAY[]::text[];

UPDATE public.grupos
   SET regras = ARRAY['Respeite quem está na roda.', 'Publique conteúdo próprio ou autorizado.', 'Sem humilhação, preconceito ou spam.']
 WHERE regras = ARRAY[]::text[] AND slug IN ('eu-arroto-e-dai', 'arrotos-youtube');

CREATE OR REPLACE FUNCTION public.obter_detalhes_da_comunidade(p_slug text)
RETURNS TABLE(regras text[], moderadores jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT g.regras,
         coalesce((
           SELECT jsonb_agg(jsonb_build_object('handle', p.handle, 'apelido', p.apelido) ORDER BY p.apelido)
             FROM public.perfis p
            WHERE public.aue_e_conta_promovida(p.id)
              AND nullif(btrim(p.handle), '') IS NOT NULL
              AND (p.id = g.created_by
                   OR EXISTS (SELECT 1 FROM public.membros_grupo m
                               WHERE m.group_id = g.id AND m.user_id = p.id AND m.role = 'admin'))
         ), '[]'::jsonb)
    FROM public.grupos g
   WHERE nullif(btrim(g.slug), '') IS NOT NULL AND lower(g.slug) = lower(btrim(p_slug));
$$;

CREATE OR REPLACE FUNCTION public.definir_regras_da_comunidade(p_slug text, p_regras text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id uuid; v_regras text[];
BEGIN
  SELECT g.id INTO v_id FROM public.grupos g WHERE lower(g.slug) = lower(btrim(coalesce(p_slug, '')));
  IF v_id IS NULL THEN RAISE EXCEPTION 'Comunidade não existe' USING ERRCODE = 'P0002'; END IF;
  IF NOT public.aue_pode_gerir_midia_da_comunidade(v_id) THEN
    RAISE EXCEPTION 'Só a moderação da comunidade pode mudar as regras' USING ERRCODE = '42501';
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

REVOKE ALL ON FUNCTION public.obter_detalhes_da_comunidade(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.definir_regras_da_comunidade(text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obter_detalhes_da_comunidade(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.definir_regras_da_comunidade(text, text[]) TO authenticated;

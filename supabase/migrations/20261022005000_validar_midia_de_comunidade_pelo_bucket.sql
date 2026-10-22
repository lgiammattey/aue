-- =============================================================================
-- 20261022005000 — Validação da mídia da comunidade pelo Storage
--
-- O bucket já aceita exclusivamente JPEG e impõe o teto de 3 MB. Repetir o
-- MIME pelo JSON interno de `storage.objects` fez a RPC rejeitar arquivos que
-- o Storage havia aceitado no upload multipart. A RPC preserva a verificação
-- de existência, prefixo, limite específico por tipo e moderação.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.definir_midia_da_comunidade(
  p_slug text,
  p_tipo text,
  p_caminho text
)
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  caminho_do_avatar text, revisao_do_avatar bigint, caminho_da_capa text, revisao_da_capa bigint,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean,
  posso_gerir_midia boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_grupo public.grupos;
  v_prefixo text;
  v_limite bigint;
  v_tamanho bigint;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT * INTO v_grupo FROM public.grupos g
   WHERE lower(g.slug) = lower(btrim(coalesce(p_slug, '')))
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comunidade não existe' USING ERRCODE = '22023', HINT = 'comunidade_inexistente';
  END IF;
  IF NOT public.aue_pode_gerir_midia_da_comunidade(v_grupo.id) THEN
    RAISE EXCEPTION 'Só quem criou ou modera a comunidade pode trocar a mídia'
      USING ERRCODE = '42501', HINT = 'nao_pode_gerir_midia';
  END IF;
  IF p_tipo NOT IN ('avatar', 'capa') THEN
    RAISE EXCEPTION 'Tipo de mídia inválido' USING ERRCODE = '22023', HINT = 'midia_invalida';
  END IF;

  v_prefixo := v_grupo.id::text || '/' || p_tipo || '/';
  v_limite := CASE WHEN p_tipo = 'avatar' THEN 2097152 ELSE 3145728 END;
  IF p_caminho !~ ('^' || v_prefixo || '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]jpg$') THEN
    RAISE EXCEPTION 'Caminho de mídia inválido' USING ERRCODE = '22023', HINT = 'midia_invalida';
  END IF;

  SELECT CASE WHEN (o.metadata->>'size') ~ '^[0-9]+$' THEN (o.metadata->>'size')::bigint ELSE -1 END
    INTO v_tamanho
    FROM storage.objects o
   WHERE o.bucket_id = 'midias_de_comunidades'
     AND o.name = p_caminho;
  IF v_tamanho IS NULL OR v_tamanho < 1 OR v_tamanho > v_limite THEN
    RAISE EXCEPTION 'Imagem da comunidade inválida ou acima do limite'
      USING ERRCODE = '22023', HINT = 'midia_invalida';
  END IF;

  PERFORM set_config('aue.midia_comunidade', 'sim', true);
  IF p_tipo = 'avatar' THEN
    UPDATE public.grupos
       SET caminho_do_avatar = p_caminho,
           revisao_do_avatar = revisao_do_avatar + 1
     WHERE id = v_grupo.id;
  ELSE
    UPDATE public.grupos
       SET caminho_da_capa = p_caminho,
           revisao_da_capa = revisao_da_capa + 1
     WHERE id = v_grupo.id;
  END IF;

  RETURN QUERY SELECT * FROM public.aue_ler_comunidades_do_forum(v_grupo.slug);
END;
$$;

REVOKE ALL ON FUNCTION public.definir_midia_da_comunidade(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.definir_midia_da_comunidade(text, text, text) TO authenticated;

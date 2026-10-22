-- Corrige colisão entre as colunas do RETURNS TABLE e os UPDATEs de mídia.
-- =============================================================================
-- 20261022006000 — Vincular mídia já aceita pelo Storage
--
-- A política e o bucket já garantem que só moderadores gravem JPEG até 3 MB no
-- prefixo da própria comunidade. A RPC não reabre o objeto no schema `storage`:
-- essa leitura adicional divergia do fluxo multipart, apesar do upload ter
-- sido aceito. Aqui ela mantém a autorização e só promove o caminho canônico.
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
  IF p_caminho !~ ('^' || v_prefixo || '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]jpg$') THEN
    RAISE EXCEPTION 'Caminho de mídia inválido' USING ERRCODE = '22023', HINT = 'midia_invalida';
  END IF;

  -- `midias_de_comunidades` já restringe MIME e tamanho no upload. O caminho
  -- só é aceito após essa escrita, pois a policy do bucket chama a mesma
  -- autorização de moderação acima.
  PERFORM set_config('aue.midia_comunidade', 'sim', true);
  IF p_tipo = 'avatar' THEN
    UPDATE public.grupos AS destino
       SET caminho_do_avatar = p_caminho,
           revisao_do_avatar = destino.revisao_do_avatar + 1
     WHERE destino.id = v_grupo.id;
  ELSE
    UPDATE public.grupos AS destino
       SET caminho_da_capa = p_caminho,
           revisao_da_capa = destino.revisao_da_capa + 1
     WHERE destino.id = v_grupo.id;
  END IF;

  RETURN QUERY SELECT * FROM public.aue_ler_comunidades_do_forum(v_grupo.slug);
END;
$$;

REVOKE ALL ON FUNCTION public.definir_midia_da_comunidade(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.definir_midia_da_comunidade(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.remover_midia_da_comunidade(p_slug text, p_tipo text)
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  caminho_do_avatar text, revisao_do_avatar bigint, caminho_da_capa text, revisao_da_capa bigint,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean,
  posso_gerir_midia boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_grupo public.grupos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT * INTO v_grupo FROM public.grupos g
   WHERE lower(g.slug) = lower(btrim(coalesce(p_slug, '')))
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comunidade não existe' USING ERRCODE = '22023', HINT = 'comunidade_inexistente'; END IF;
  IF NOT public.aue_pode_gerir_midia_da_comunidade(v_grupo.id) THEN
    RAISE EXCEPTION 'Só quem criou ou modera a comunidade pode trocar a mídia' USING ERRCODE = '42501', HINT = 'nao_pode_gerir_midia';
  END IF;
  IF p_tipo NOT IN ('avatar', 'capa') THEN RAISE EXCEPTION 'Tipo de mídia inválido' USING ERRCODE = '22023', HINT = 'midia_invalida'; END IF;
  PERFORM set_config('aue.midia_comunidade', 'sim', true);
  IF p_tipo = 'avatar' THEN
    UPDATE public.grupos AS destino SET caminho_do_avatar = NULL, revisao_do_avatar = destino.revisao_do_avatar + 1 WHERE destino.id = v_grupo.id;
  ELSE
    UPDATE public.grupos AS destino SET caminho_da_capa = NULL, revisao_da_capa = destino.revisao_da_capa + 1 WHERE destino.id = v_grupo.id;
  END IF;
  RETURN QUERY SELECT * FROM public.aue_ler_comunidades_do_forum(v_grupo.slug);
END;
$$;
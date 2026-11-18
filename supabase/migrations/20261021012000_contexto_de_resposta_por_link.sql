-- Link direto de resposta: devolve só a fala pedida e os ancestrais necessários
-- para montar seu ramo. Não muda `pai_id`, não altera a leitura paginada e não
-- expõe resposta ocultada/removida além da casca que já preserva a árvore.

CREATE OR REPLACE FUNCTION public.obter_contexto_da_resposta(
  p_topico_id uuid,
  p_resposta_id uuid
)
RETURNS TABLE (
  id uuid, topico_id uuid, pai_id uuid, nivel smallint,
  autor_id uuid, apelido text, handle text, url_do_avatar text,
  corpo text, status text, criado_em timestamptz, editado_em timestamptz, sou_autor boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_topico_id IS NULL OR p_resposta_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH RECURSIVE
  topico_legivel AS (
    SELECT t.id FROM public.topicos t
     WHERE t.id = p_topico_id
       AND t.status IN ('aberto', 'fechado')
       AND public.aue_e_conta_promovida(t.autor_id)
  ),
  caminho AS (
    -- Só uma resposta publicamente legível pode ser alvo de link. Pais que
    -- deixaram de ser legíveis entram abaixo apenas como casca.
    SELECT r.id, r.pai_id, ARRAY[r.id]::uuid[] AS trilha
      FROM public.respostas r
     WHERE r.id = p_resposta_id
       AND r.topico_id IN (SELECT tl.id FROM topico_legivel tl)
       AND r.status = 'visivel'
       AND public.aue_e_conta_promovida(r.autor_id)
    UNION ALL
    SELECT pai.id, pai.pai_id, caminho.trilha || pai.id
      FROM public.respostas pai
      JOIN caminho ON pai.id = caminho.pai_id
     WHERE pai.topico_id = p_topico_id
       AND NOT pai.id = ANY(caminho.trilha)
  ),
  linhas AS (
    SELECT r.*, r.status = 'visivel' AND public.aue_e_conta_promovida(r.autor_id) AS visivel
      FROM public.respostas r
      JOIN caminho c ON c.id = r.id
  )
  SELECT r.id, r.topico_id, r.pai_id, r.nivel,
         CASE WHEN r.visivel THEN r.autor_id END,
         CASE WHEN r.visivel THEN pf.apelido END,
         CASE WHEN r.visivel THEN pf.handle END,
         CASE WHEN r.visivel THEN pf.url_do_avatar END,
         CASE WHEN r.visivel THEN r.corpo END,
         CASE WHEN r.visivel THEN 'visivel' WHEN r.status = 'visivel' THEN 'oculto' ELSE r.status END,
         r.criado_em,
         CASE WHEN r.visivel THEN r.editado_em END,
         coalesce(r.visivel AND r.autor_id = auth.uid(), false)
    FROM linhas r
    LEFT JOIN public.perfis pf ON pf.id = r.autor_id
   ORDER BY r.criado_em, r.id;
END;
$$;

REVOKE ALL ON FUNCTION public.obter_contexto_da_resposta(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obter_contexto_da_resposta(uuid, uuid) TO anon, authenticated;

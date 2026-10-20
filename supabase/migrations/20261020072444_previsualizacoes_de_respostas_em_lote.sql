-- =============================================================================
-- 20261020072444 — Prévias de respostas em lote
--
-- Uma página de tópicos não pode disparar uma RPC por card. Esta leitura devolve
-- até duas respostas visíveis de cada tópico pedido, preservando a ordem da
-- conversa e incluindo o único anexo da resposta na mesma consulta.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.listar_previa_respostas_dos_topicos(
  p_topicos uuid[], p_limite_por_topico integer DEFAULT 2
)
RETURNS TABLE (
  id uuid, topico_id uuid, pai_id uuid, nivel smallint,
  autor_id uuid, apelido text, handle text, url_do_avatar text,
  corpo text, status text, criado_em timestamptz, editado_em timestamptz, sou_autor boolean,
  anexo_tipo text, anexo_caminho text, anexo_mime text,
  anexo_tamanho_bytes integer, anexo_duracao_ms integer, video_externo_url text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_limite integer := greatest(1, least(coalesce(p_limite_por_topico, 2), 2));
BEGIN
  -- Uma página tem no máximo 100 tópicos; o teto evita arrays arbitrários em
  -- endpoint público. Repetidos não contam duas vezes.
  IF cardinality(coalesce(p_topicos, ARRAY[]::uuid[])) > 100 THEN
    PERFORM public.aue_falhar_conversa('22023', 'Tópicos demais na prévia', 'topicos_invalidos');
  END IF;

  RETURN QUERY
  WITH topicos_pedidos AS (
    SELECT DISTINCT x.id
      FROM unnest(coalesce(p_topicos, ARRAY[]::uuid[])) AS x(id)
      JOIN public.topicos t ON t.id = x.id
     WHERE t.status IN ('aberto', 'fechado')
       AND public.aue_e_conta_promovida(t.autor_id)
  ), ordenadas AS (
    SELECT r.*, row_number() OVER (PARTITION BY r.topico_id ORDER BY r.criado_em, r.id) AS posicao
      FROM public.respostas r
      JOIN topicos_pedidos p ON p.id = r.topico_id
      JOIN public.perfis pf ON pf.id = r.autor_id AND public.aue_e_conta_promovida(r.autor_id)
     WHERE r.status = 'visivel'
  )
  SELECT r.id, r.topico_id, r.pai_id, r.nivel,
         r.autor_id, pf.apelido, pf.handle, pf.url_do_avatar,
         r.corpo, r.status, r.criado_em, r.editado_em,
         coalesce(r.autor_id = auth.uid(), false),
         r.anexo_tipo, r.anexo_caminho, r.anexo_mime,
         r.anexo_tamanho_bytes, r.anexo_duracao_ms, r.video_externo_url
    FROM ordenadas r
    JOIN public.perfis pf ON pf.id = r.autor_id
   WHERE r.posicao <= v_limite
   ORDER BY r.topico_id, r.criado_em, r.id;
END;
$$;

REVOKE ALL ON FUNCTION public.listar_previa_respostas_dos_topicos(uuid[], integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_previa_respostas_dos_topicos(uuid[], integer) TO anon, authenticated;

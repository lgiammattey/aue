-- Busca de verdade: pessoas (nome e @handle), comunidades e tópicos.
--
-- Até aqui a barra de busca só filtrava no navegador os posts já carregados.
-- Esta função consulta o servidor, pagina por deslocamento e respeita as
-- mesmas regras de visibilidade das leituras existentes:
--   - pessoas: só conta promovida (como `obter_perfil_publico`);
--   - comunidades: slug preenchido, `acervo` só se tiver tópico (como o diretório);
--   - tópicos: status aberto/fechado, autor promovido (como `explorar_topicos`).
-- A comparação usa `strpos` sobre texto normalizado (minúsculo, sem acento do
-- português): nenhum caractere do termo vira coringa, então `%`, `_` e `\` são
-- buscados literalmente.

CREATE OR REPLACE FUNCTION public.aue_normalizar_busca(p_texto text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog AS $$
  SELECT translate(lower(coalesce(p_texto, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn')
$$;

CREATE OR REPLACE FUNCTION public.buscar_no_aue(
  p_termo text, p_tipo text, p_limite integer DEFAULT 20, p_deslocamento integer DEFAULT 0
) RETURNS TABLE(
  tipo text, id uuid, comunidade_slug text, comunidade_nome text, titulo text,
  handle text, apelido text, url_do_avatar text, criado_em timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_termo  text := public.aue_normalizar_busca(regexp_replace(btrim(coalesce(p_termo, '')), '^@', ''));
  v_limite integer := greatest(1, least(coalesce(p_limite, 20), 51));
  v_desloc integer := greatest(0, least(coalesce(p_deslocamento, 0), 1000));
BEGIN
  IF p_tipo NOT IN ('pessoas', 'comunidades', 'topicos') THEN
    RAISE EXCEPTION 'Tipo de busca inválido' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_termo) < 2 OR char_length(v_termo) > 60 THEN RETURN; END IF;

  IF p_tipo = 'pessoas' THEN
    RETURN QUERY
    SELECT 'pessoa'::text, p.id, NULL::text, NULL::text, NULL::text,
           p.handle, p.apelido, p.url_do_avatar, p.criado_em
      FROM public.perfis p
     WHERE public.aue_e_conta_promovida(p.id)
       AND nullif(btrim(p.handle), '') IS NOT NULL
       AND (strpos(public.aue_normalizar_busca(p.handle), v_termo) > 0
            OR strpos(public.aue_normalizar_busca(p.apelido), v_termo) > 0)
     ORDER BY (public.aue_normalizar_busca(p.handle) = v_termo) DESC,
              (left(public.aue_normalizar_busca(p.handle), char_length(v_termo)) = v_termo) DESC,
              p.apelido, p.id
     LIMIT v_limite OFFSET v_desloc;

  ELSIF p_tipo = 'comunidades' THEN
    RETURN QUERY
    SELECT 'comunidade'::text, g.id, g.slug, g.nome::text, g.nome::text,
           NULL::text, NULL::text, NULL::text, g.created_at
      FROM public.grupos g
     WHERE nullif(btrim(g.slug), '') IS NOT NULL
       AND (lower(g.slug) <> 'acervo' OR EXISTS (
              SELECT 1 FROM public.topicos t
               WHERE t.comunidade_id = g.id AND t.status IN ('aberto', 'fechado')
                 AND public.aue_e_conta_promovida(t.autor_id)))
       AND (strpos(public.aue_normalizar_busca(g.nome), v_termo) > 0
            OR strpos(public.aue_normalizar_busca(g.slug), v_termo) > 0)
     ORDER BY g.nome, g.id
     LIMIT v_limite OFFSET v_desloc;

  ELSE
    RETURN QUERY
    SELECT 'topico'::text, t.id, g.slug, g.nome::text, t.titulo,
           pf.handle, pf.apelido, pf.url_do_avatar, t.criado_em
      FROM public.topicos t
      JOIN public.grupos g ON g.id = t.comunidade_id AND nullif(btrim(g.slug), '') IS NOT NULL
      JOIN public.perfis pf ON pf.id = t.autor_id AND public.aue_e_conta_promovida(t.autor_id)
     WHERE t.status IN ('aberto', 'fechado')
       AND strpos(public.aue_normalizar_busca(t.titulo), v_termo) > 0
     ORDER BY t.ultima_atividade_em DESC, t.id DESC
     LIMIT v_limite OFFSET v_desloc;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.aue_normalizar_busca(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.buscar_no_aue(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aue_normalizar_busca(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_no_aue(text, text, integer, integer) TO anon, authenticated;

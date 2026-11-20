-- Ranking somente de áudios publicados que qualquer visitante pode ouvir.
-- Não retorna o caminho privado do objeto. A leitura do anexo usa a RPC e as
-- políticas de Storage já existentes, respeitando moderação e remoção.
CREATE FUNCTION public.top_cinco_arrotadores()
RETURNS TABLE (handle text, apelido text, avatar_url text, nota numeric,
               alvo_tipo text, alvo_id uuid, fonte text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH topicos_visiveis AS (
    SELECT t.* FROM public.topicos t
     WHERE t.status IN ('aberto','fechado')
       AND public.aue_e_conta_promovida(t.autor_id)
       AND (t.origem = 'pessoal' OR (t.origem = 'comunidade' AND EXISTS (
         SELECT 1 FROM public.grupos g WHERE g.id = t.comunidade_id AND nullif(btrim(g.slug), '') IS NOT NULL
       )))
       AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos pauta WHERE pauta.pauta_id = t.id)
  ), candidatos AS (
    SELECT t.autor_id, t.id AS alvo_id, 'topico'::text AS alvo_tipo,
           t.criado_em, n.nota, 'anexo'::text AS fonte
      FROM topicos_visiveis t
      JOIN aue_privado.notas_retrospectivas n ON n.bucket = 'anexos_do_forum' AND n.caminho = t.anexo_caminho
      JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho AND o.metadata->>'eTag' = n.etag
     WHERE t.anexo_tipo = 'audio' AND n.versao IN ('retrospectiva-acustica-legado-v1', 'publicacao-acustica-servidor-v1')
    UNION ALL
    SELECT r.autor_id, r.id, 'resposta', r.criado_em, n.nota, 'anexo'::text
      FROM public.respostas r JOIN topicos_visiveis t ON t.id = r.topico_id
      JOIN aue_privado.notas_retrospectivas n ON n.bucket = 'anexos_do_forum' AND n.caminho = r.anexo_caminho
      JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho AND o.metadata->>'eTag' = n.etag
     WHERE r.status = 'visivel' AND r.anexo_tipo = 'audio' AND public.aue_e_conta_promovida(r.autor_id)
       AND n.versao IN ('retrospectiva-acustica-legado-v1', 'publicacao-acustica-servidor-v1')
    UNION ALL
    -- A nota oficial da Arena só entra se o resultado foi publicado e está audível.
    SELECT t.autor_id, t.id, 'topico', t.criado_em, r.nota::numeric, 'arena'::text
      FROM topicos_visiveis t JOIN public.resultados r ON r.id = t.resultado_id
      JOIN storage.objects o ON o.bucket_id = 'audio_records' AND o.name = r.caminho_do_audio
     WHERE t.anexo_tipo IS DISTINCT FROM 'audio' AND t.consentimento_audio_publico
       AND NOT r.esta_escondido AND r.nota IS NOT NULL AND r.caminho_do_audio IS NOT NULL
  ), elegiveis AS (
    SELECT c.*, p.handle::text AS handle, p.apelido::text AS apelido, p.url_do_avatar::text AS avatar_url,
           row_number() OVER (PARTITION BY c.autor_id ORDER BY c.nota DESC, c.criado_em, c.alvo_id) AS posicao_do_autor
      FROM candidatos c JOIN public.perfis p ON p.id = c.autor_id
     WHERE p.handle IS NOT NULL AND nullif(btrim(p.handle::text), '') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id = c.autor_id)
  )
  SELECT e.handle, e.apelido, e.avatar_url, e.nota, e.alvo_tipo, e.alvo_id, e.fonte
    FROM elegiveis e WHERE e.posicao_do_autor = 1
   ORDER BY e.nota DESC, e.criado_em, e.alvo_id LIMIT 5;
$$;
REVOKE ALL ON FUNCTION public.top_cinco_arrotadores() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.top_cinco_arrotadores() TO anon, authenticated;

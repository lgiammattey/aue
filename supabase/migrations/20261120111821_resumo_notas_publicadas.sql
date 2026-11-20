-- Estatísticas das publicações visíveis do autor, não das partidas jogadas.
-- Cada publicação independente conta uma vez, mesmo que repita um áudio.
CREATE FUNCTION public.resumo_notas_publicadas(p_perfil_id uuid)
RETURNS TABLE (melhor_nota numeric, media numeric, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH topicos_visiveis AS (
    SELECT t.* FROM public.topicos t
     WHERE t.status IN ('aberto', 'fechado')
       AND public.aue_e_conta_promovida(t.autor_id)
       AND (t.origem = 'pessoal' OR (t.origem = 'comunidade' AND EXISTS (
         SELECT 1 FROM public.grupos g WHERE g.id = t.comunidade_id AND nullif(btrim(g.slug), '') IS NOT NULL
       )))
       AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id = t.id)
  ), notas AS (
    -- O anexo é o áudio que o card reproduz, quando existir.
    SELECT n.nota
      FROM topicos_visiveis t
      JOIN aue_privado.notas_retrospectivas n ON n.bucket = 'anexos_do_forum' AND n.caminho = t.anexo_caminho
      JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho AND o.metadata->>'eTag' = n.etag
     WHERE t.autor_id = p_perfil_id AND t.anexo_tipo = 'audio'
    UNION ALL
    SELECT n.nota
      FROM topicos_visiveis t
      JOIN public.contas_da_casa cc ON cc.usuario_id = t.autor_id
      JOIN aue_privado.notas_retrospectivas n ON n.bucket = 'audio_da_casa' AND n.caminho = t.caminho_do_audio_da_casa
      JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho AND o.metadata->>'eTag' = n.etag
     WHERE t.autor_id = p_perfil_id AND t.anexo_tipo IS DISTINCT FROM 'audio'
       AND t.resultado_id IS NULL AND t.consentimento_audio_publico
    UNION ALL
    -- Resultado só conta se efetivamente publicado e audível.
    SELECT r.nota::numeric
      FROM topicos_visiveis t
      JOIN public.resultados r ON r.id = t.resultado_id
      JOIN storage.objects o ON o.bucket_id = 'audio_records' AND o.name = r.caminho_do_audio
     WHERE t.autor_id = p_perfil_id AND t.anexo_tipo IS DISTINCT FROM 'audio'
       AND t.consentimento_audio_publico AND NOT r.esta_escondido
       AND r.nota IS NOT NULL AND r.caminho_do_audio IS NOT NULL
    UNION ALL
    SELECT n.nota
      FROM public.respostas r
      JOIN topicos_visiveis t ON t.id = r.topico_id
      JOIN aue_privado.notas_retrospectivas n ON n.bucket = 'anexos_do_forum' AND n.caminho = r.anexo_caminho
      JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho AND o.metadata->>'eTag' = n.etag
     WHERE r.autor_id = p_perfil_id AND r.status = 'visivel' AND r.anexo_tipo = 'audio'
       AND public.aue_e_conta_promovida(r.autor_id)
    UNION ALL
    -- O catálogo de arrotos do perfil só é acessível a contas promovidas.
    SELECT n.nota
      FROM public.arrotos_do_perfil a
      JOIN aue_privado.notas_retrospectivas n ON n.bucket = 'arrotos_de_perfil' AND n.caminho = a.caminho_do_audio
      JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho AND o.metadata->>'eTag' = n.etag
     WHERE a.autor_id = p_perfil_id AND a.estado = 'publicado'
       AND public.aue_e_conta_promovida(auth.uid())
       AND public.aue_e_conta_promovida(a.perfil_id)
       AND public.aue_e_conta_promovida(a.autor_id)
       -- Uma gravação compartilhada no feed e no perfil na mesma ação tem
       -- vínculo explícito. Conta uma vez enquanto o post espelhado for
       -- visível e tiver uma nota válida; caso contrário conta pelo perfil.
       AND NOT EXISTS (
         SELECT 1 FROM aue_privado.espelhos_de_arroto e
         JOIN topicos_visiveis t ON t.id = e.topico_id AND t.autor_id = a.autor_id AND t.anexo_tipo = 'audio'
         JOIN aue_privado.notas_retrospectivas nt ON nt.bucket = 'anexos_do_forum' AND nt.caminho = t.anexo_caminho
         JOIN storage.objects ot ON ot.bucket_id = nt.bucket AND ot.name = nt.caminho AND ot.metadata->>'eTag' = nt.etag
         WHERE e.arroto_id = a.id
       )
  )
  SELECT max(n.nota), round(avg(n.nota), 1), count(*)
    FROM notas n
   WHERE public.aue_e_conta_promovida(p_perfil_id);
$$;

REVOKE ALL ON FUNCTION public.resumo_notas_publicadas(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resumo_notas_publicadas(uuid) TO anon, authenticated;

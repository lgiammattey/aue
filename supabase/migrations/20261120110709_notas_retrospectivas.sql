-- Notas calculadas depois da publicação. Não cria partidas, resultados ou XP.
-- O caminho e a identidade do objeto ficam privados; clientes só leem a nota
-- enquanto o conteúdo e o mesmo arquivo continuam visíveis.
CREATE SCHEMA IF NOT EXISTS aue_privado;
-- Preserva os GRANTs existentes do schema, usados também pelos duelos.

CREATE TABLE aue_privado.notas_retrospectivas (
  bucket text NOT NULL CHECK (bucket IN ('audio_da_casa', 'anexos_do_forum', 'arrotos_de_perfil')),
  caminho text NOT NULL CHECK (length(caminho) BETWEEN 1 AND 512),
  etag text NOT NULL CHECK (length(etag) BETWEEN 1 AND 256),
  nota numeric NOT NULL CHECK (nota >= 0 AND nota <= 100),
  versao text NOT NULL CHECK (length(versao) BETWEEN 1 AND 100),
  calculada_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, caminho)
);

ALTER TABLE aue_privado.notas_retrospectivas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE aue_privado.notas_retrospectivas FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA aue_privado TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON aue_privado.notas_retrospectivas TO service_role;

CREATE FUNCTION public.listar_notas_retrospectivas(
  p_topico_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_resposta_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_arroto_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
RETURNS TABLE (tipo text, id uuid, fonte text, nota numeric, versao text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH candidatos AS (
    SELECT 'topico'::text AS tipo, t.id,
           CASE WHEN t.anexo_tipo = 'audio' THEN 'anexo' ELSE 'casa' END AS fonte,
           CASE WHEN t.anexo_tipo = 'audio' THEN 'anexos_do_forum' ELSE 'audio_da_casa' END AS bucket,
           CASE WHEN t.anexo_tipo = 'audio' THEN t.anexo_caminho ELSE t.caminho_do_audio_da_casa END AS caminho
      FROM public.topicos t
     WHERE t.id = ANY(coalesce(p_topico_ids, ARRAY[]::uuid[]))
       AND t.status IN ('aberto', 'fechado')
       AND public.aue_e_conta_promovida(t.autor_id)
       AND (t.anexo_tipo = 'audio' OR
           (t.resultado_id IS NULL AND t.consentimento_audio_publico AND t.caminho_do_audio_da_casa IS NOT NULL))
    UNION ALL
    SELECT 'resposta', r.id, 'anexo', 'anexos_do_forum', r.anexo_caminho
      FROM public.respostas r JOIN public.topicos t ON t.id = r.topico_id
     WHERE r.id = ANY(coalesce(p_resposta_ids, ARRAY[]::uuid[]))
       AND r.anexo_tipo = 'audio' AND r.status = 'visivel'
       AND t.status IN ('aberto', 'fechado')
       AND public.aue_e_conta_promovida(r.autor_id)
       AND public.aue_e_conta_promovida(t.autor_id)
    UNION ALL
    SELECT 'perfil', a.id, 'perfil', 'arrotos_de_perfil', a.caminho_do_audio
      FROM public.arrotos_do_perfil a
     WHERE a.id = ANY(coalesce(p_arroto_ids, ARRAY[]::uuid[]))
       AND a.estado = 'publicado'
       AND public.aue_e_conta_promovida(auth.uid())
       AND public.aue_e_conta_promovida(a.perfil_id)
  )
  SELECT c.tipo, c.id, c.fonte, n.nota, n.versao
    FROM candidatos c
    JOIN aue_privado.notas_retrospectivas n ON n.bucket = c.bucket AND n.caminho = c.caminho
    JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho
      AND o.metadata->>'eTag' = n.etag;
$$;

REVOKE ALL ON FUNCTION public.listar_notas_retrospectivas(uuid[], uuid[], uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_notas_retrospectivas(uuid[], uuid[], uuid[]) TO anon, authenticated;

-- Os dois cards nascem de uma única publicação, mas mantêm visibilidade própria.
CREATE TABLE aue_privado.espelhos_de_arroto (
  arroto_id uuid PRIMARY KEY REFERENCES public.arrotos_do_perfil(id) ON DELETE CASCADE,
  topico_id uuid NOT NULL UNIQUE REFERENCES public.topicos(id) ON DELETE CASCADE
);
ALTER TABLE aue_privado.espelhos_de_arroto ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aue_privado.espelhos_de_arroto FROM PUBLIC, anon, authenticated;

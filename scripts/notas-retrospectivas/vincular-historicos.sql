-- Uma única execução para os três espelhos históricos observados em produção.
-- Conservador: aborta se houver qualquer divergência ou associação ambígua.
-- O horário e o ETag são evidência forte de uma única ação, não prova absoluta.
BEGIN ISOLATION LEVEL SERIALIZABLE;

CREATE TEMP TABLE pares_historicos ON COMMIT DROP AS
WITH candidatos AS (
  SELECT a.id AS arroto_id, t.id AS topico_id,
         count(*) OVER (PARTITION BY a.id) AS por_arroto,
         count(*) OVER (PARTITION BY t.id) AS por_topico
    FROM public.arrotos_do_perfil a
    JOIN public.topicos t ON t.autor_id = a.autor_id AND a.perfil_id = a.autor_id
      AND t.origem = 'pessoal' AND t.status IN ('aberto', 'fechado')
      AND t.anexo_tipo = 'audio' AND t.criado_em >= a.publicado_em
      AND t.criado_em < a.publicado_em + interval '1 second'
    JOIN storage.objects oa ON oa.bucket_id = 'arrotos_de_perfil' AND oa.name = a.caminho_do_audio
    JOIN storage.objects ot ON ot.bucket_id = 'anexos_do_forum' AND ot.name = t.anexo_caminho
      AND ot.metadata->>'eTag' = oa.metadata->>'eTag'
   WHERE a.estado = 'publicado'
)
SELECT arroto_id, topico_id, por_arroto, por_topico FROM candidatos;

DO $$
BEGIN
  IF (SELECT count(*) FROM pares_historicos) <> 3 OR EXISTS (
    SELECT 1 FROM pares_historicos WHERE por_arroto <> 1 OR por_topico <> 1
  ) THEN
    RAISE EXCEPTION 'Acervo divergente: esperado exatamente três pares únicos';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pares_historicos p
    JOIN aue_privado.espelhos_de_arroto e ON e.arroto_id = p.arroto_id OR e.topico_id = p.topico_id
    WHERE e.arroto_id <> p.arroto_id OR e.topico_id <> p.topico_id
  ) THEN
    RAISE EXCEPTION 'Vínculo existente conflita com o acervo observado';
  END IF;
END $$;

INSERT INTO aue_privado.espelhos_de_arroto (arroto_id, topico_id)
SELECT arroto_id, topico_id FROM pares_historicos
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF (SELECT count(*) FROM pares_historicos p JOIN aue_privado.espelhos_de_arroto e
      ON e.arroto_id = p.arroto_id AND e.topico_id = p.topico_id) <> 3 THEN
    RAISE EXCEPTION 'Não foi possível confirmar todos os vínculos';
  END IF;
END $$;
COMMIT;

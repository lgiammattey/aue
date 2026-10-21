-- Endurecimento do banco (issues #305 e #307).
--
-- 1. `grupos` não aceita escrita direta: comunidade só nasce por migration e a
--    mídia só muda pelos RPCs `definir_midia_da_comunidade` / `remover_midia_da_comunidade`
--    (SECURITY DEFINER). Hoje qualquer sessão, inclusive anônima, podia inserir.
-- 2. TRUNCATE, TRIGGER e REFERENCES não são usados pelo app: saem de anon/authenticated
--    em todas as tabelas (e dos defaults, para tabela nova não nascer com eles).
-- 3. As funções de nota ganham search_path fixo.
-- 4. Áudio: teto de 300 arquivos por conta no bucket `audio_records`.
-- 5. Telemetria: no máximo 120 eventos por sessão por minuto.

-- 1
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.grupos;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.grupos;
REVOKE INSERT, UPDATE, DELETE ON public.grupos FROM anon, authenticated;

-- 2
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;

-- 3
DO $$
DECLARE f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace
       AND p.proname IN ('aue_score_v1', 'aue_origin_score_v1', 'aue_classification_v1', 'aue_classification_historica_v1')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f);
  END LOOP;
END $$;

-- 4
DROP POLICY IF EXISTS "Authenticated Users can upload audio" ON storage.objects;
CREATE POLICY "Authenticated Users can upload audio" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audio_records'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (SELECT count(*) FROM storage.objects o
          WHERE o.bucket_id = 'audio_records'
            AND (storage.foldername(o.name))[1] = auth.uid()::text) < 300
  );

-- 5
CREATE INDEX IF NOT EXISTS eventos_de_telemetria_sessao_criado_idx
  ON public.eventos_de_telemetria (sessao_id, criado_em DESC);

CREATE OR REPLACE FUNCTION public.limitar_telemetria_por_sessao()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.sessao_id IS NOT NULL AND (
       SELECT count(*) FROM public.eventos_de_telemetria e
        WHERE e.sessao_id = NEW.sessao_id AND e.criado_em > now() - interval '1 minute') >= 120 THEN
    RAISE EXCEPTION 'Telemetria: limite por minuto' USING ERRCODE = '54000';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS limitar_telemetria_por_sessao ON public.eventos_de_telemetria;
CREATE TRIGGER limitar_telemetria_por_sessao BEFORE INSERT ON public.eventos_de_telemetria
  FOR EACH ROW EXECUTE FUNCTION public.limitar_telemetria_por_sessao();

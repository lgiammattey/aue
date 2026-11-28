-- Contrato atual. As suítes duelos_v2.sql e duelos_v2_privacidade.sql também
-- são executadas pelo Vitest no ponto histórico da cadeia em que foram escritas.
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO auth.users(id) VALUES ('62000000-0000-4000-8000-000000000001'),('62000000-0000-4000-8000-000000000002');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','62000000-0000-4000-8000-000000000001',true);
SELECT set_config('storage.operation','storage.object.upload',true);
SELECT g->>'id' AS id_a, g->>'caminho' AS caminho_a FROM public.aue_v2_preparar_gravacao() g \gset
INSERT INTO storage.objects(bucket_id,name) VALUES ('duelos_v2', :'caminho_a');
SELECT public.aue_v2_confirmar_gravacao(:'id_a',1200,'experimental-2');
SELECT d->>'id' AS duelo FROM public.aue_v2_criar_duelo(:'id_a', repeat('a',64)) d \gset
SELECT set_config('request.jwt.claim.sub','62000000-0000-4000-8000-000000000002',true);
SELECT g->>'id' AS id_b, g->>'caminho' AS caminho_b FROM public.aue_v2_preparar_gravacao() g \gset
INSERT INTO storage.objects(bucket_id,name) VALUES ('duelos_v2', :'caminho_b');
SELECT public.aue_v2_confirmar_gravacao(:'id_b',900,'experimental-2');
SELECT public.aue_v2_responder_duelo(repeat('a',64), :'id_b');
CREATE TEMP TABLE leituras AS
  SELECT public.aue_v2_revelar_duelo(repeat('a',64)) AS dados
  UNION ALL SELECT public.aue_v2_recuperar_duelo(:'duelo');
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM leituras WHERE dados->>'estado' IS DISTINCT FROM 'revelado'
      OR dados->>'origem_medicao' IS DISTINCT FROM 'cliente_nao_verificada'
      OR dados->'efeito_competitivo' IS DISTINCT FROM 'false'::jsonb
      OR dados ? 'resultado_provisorio'
      OR dados#>>'{criador,duracao_ms}' IS DISTINCT FROM '1200'
      OR dados#>>'{desafiante,duracao_ms}' IS DISTINCT FROM '900'
  ) THEN RAISE EXCEPTION 'medição incompleta ou com vencedor no convite ou no histórico'; END IF;
END $$;
ROLLBACK;

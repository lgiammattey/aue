-- Prova local da barreira competitiva e do caminho positivo do worker.
-- Requer a cadeia completa de migrations num PostgreSQL descartável. Toda a
-- fixture é sintética e a transação termina em ROLLBACK.
\set ON_ERROR_STOP on
BEGIN;

INSERT INTO auth.users (id, email, is_anonymous)
VALUES
  ('61000000-0000-4000-8000-000000000001', 'm02-worker@example.test', false),
  ('61000000-0000-4000-8000-000000000002', 'm02-worker-2@example.test', false);
UPDATE public.perfis
SET perfil_social_concluido_em = now(), apelido = 'Worker M02'
WHERE id IN ('61000000-0000-4000-8000-000000000001', '61000000-0000-4000-8000-000000000002');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '61000000-0000-4000-8000-000000000001', true);
CREATE TEMP TABLE retorno_da_rpc AS
SELECT integridade, xp_ganho, e_elegivel_para_xp
FROM public.enviar_resultado(50, 50, 50, 50, 'Puxei ar', NULL, NULL, NULL);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM retorno_da_rpc
    WHERE integridade = 'nao_verificado' AND xp_ganho = 0 AND NOT e_elegivel_para_xp
  ) THEN
    RAISE EXCEPTION 'laudo de cliente recebeu consequência competitiva';
  END IF;
  IF has_table_privilege('authenticated', 'public.resultados', 'INSERT') THEN
    RAISE EXCEPTION 'cliente ainda pode inserir resultado fora da RPC';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.pode_usar_como_desafiante(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.pode_usar_como_desafiado(uuid)', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'ACL necessária à policy de desafios foi removida';
  END IF;
  IF has_function_privilege('authenticated', 'public.aue_compare_results_v1(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.aue_compare_results_v1(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'comparador de desafio ficou exposto como RPC';
  END IF;
  IF has_function_privilege('authenticated', 'public.vencedor_do_round(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.vencedor_do_round(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'comparador interno de round ficou exposto';
  END IF;
END $$;

RESET ROLE;

SAVEPOINT teste_do_trigger;
-- Fixture privilegiada só para provar que a RPC autorizada ainda aciona o
-- trigger quando os dois resultados têm integridade que permite competição.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '61000000-0000-4000-8000-000000000002', true);
CREATE TEMP TABLE retorno_da_segunda_rpc AS
SELECT id FROM public.enviar_resultado(60, 60, 60, 60, 'Puxei ar', NULL, NULL, NULL);
RESET ROLE;
UPDATE public.resultados SET integridade = 'verificado_servidor'
WHERE usuario_id IN ('61000000-0000-4000-8000-000000000001', '61000000-0000-4000-8000-000000000002');
INSERT INTO public.desafios(id, resultado_desafiante_id)
SELECT 'M02ACL', id FROM public.resultados
WHERE usuario_id = '61000000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '61000000-0000-4000-8000-000000000002', true);
SELECT public.responder_desafio('M02ACL', id) FROM retorno_da_segunda_rpc;
DO $$
BEGIN
  PERFORM public.aue_compare_results_v1(
    (SELECT resultado_desafiante_id FROM public.desafios WHERE id = 'M02ACL'),
    (SELECT resultado_desafiado_id FROM public.desafios WHERE id = 'M02ACL')
  );
  RAISE EXCEPTION 'comparador direto aceitou cliente';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;
RESET ROLE;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.desafios WHERE id = 'M02ACL' AND vencedor = 'desafiado') THEN
    RAISE EXCEPTION 'RPC autorizada não acionou trigger de vencedor';
  END IF;
END $$;
ROLLBACK TO SAVEPOINT teste_do_trigger;
-- O objeto representa o upload já autorizado. Só o worker mede e conclui a
-- publicação; o resultado continua um laudo sem integridade competitiva.
WITH resultado AS (
  SELECT id, usuario_id
  FROM public.resultados
  WHERE usuario_id = '61000000-0000-4000-8000-000000000001'
  ORDER BY criado_em DESC
  LIMIT 1
), vinculo AS (
  UPDATE public.resultados r
  SET caminho_do_audio = resultado.usuario_id::text || '/' || resultado.id::text || '.webm'
  FROM resultado
  WHERE r.id = resultado.id
  RETURNING r.id, r.usuario_id, r.caminho_do_audio
)
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
SELECT 'audio_records', caminho_do_audio, usuario_id,
       jsonb_build_object('eTag', 'm02-worker-v1', 'mimetype', 'audio/webm')
FROM vinculo;

INSERT INTO public.topicos (autor_id, titulo, corpo, origem, resultado_id, consentimento_audio_publico)
SELECT usuario_id, 'Laudo público', 'áudio sintético', 'pessoal', id, true
FROM public.resultados
WHERE usuario_id = '61000000-0000-4000-8000-000000000001'
ORDER BY criado_em DESC
LIMIT 1;

-- O perfil e os placares tampouco podem promover a nota declarada.
INSERT INTO public.campeonatos (id,nome,start_date,end_date)
VALUES ('61000000-0000-4000-8000-000000000011','Campeonato de teste',now()-interval '1 day',now()+interval '1 day');
INSERT INTO public.participantes_campeonato(championship_id,user_id)
VALUES ('61000000-0000-4000-8000-000000000011','61000000-0000-4000-8000-000000000001');
INSERT INTO public.batalhas(id,codigo_de_acesso)
VALUES ('61000000-0000-4000-8000-000000000012','abcdef1234');
INSERT INTO public.rodadas_batalha(batalha_id,resultado_id,usuario_id,posicao)
SELECT '61000000-0000-4000-8000-000000000012',id,usuario_id,1
FROM public.resultados WHERE usuario_id='61000000-0000-4000-8000-000000000001';

DO $$
DECLARE
  batalha jsonb := public.obter_batalha('abcdef1234');
BEGIN
  IF (SELECT total FROM public.resumo_notas_publicadas('61000000-0000-4000-8000-000000000001')) <> 0
     OR EXISTS (SELECT 1 FROM public.obter_placar_do_campeonato('61000000-0000-4000-8000-000000000011'))
  THEN RAISE EXCEPTION 'perfil ou campeonato aceitou um resultado sem avaliação'; END IF;
  IF batalha->'lider' IS DISTINCT FROM 'null'::jsonb OR jsonb_array_length(batalha->'rodadas') IS DISTINCT FROM 1
  THEN RAISE EXCEPTION 'batalha perdeu o histórico ou declarou líder'; END IF;
END $$;

SAVEPOINT autoria_e_consentimento;
UPDATE storage.objects SET owner_id='61000000-0000-4000-8000-000000000002' WHERE bucket_id='audio_records';
SET LOCAL ROLE service_role;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.reivindicar_audios_para_nota(1)) THEN RAISE EXCEPTION 'áudio de outro autor entrou na fila'; END IF;
END $$;
ROLLBACK TO SAVEPOINT autoria_e_consentimento;
UPDATE public.topicos SET consentimento_audio_publico=false, resultado_id=null WHERE origem='pessoal';
SET LOCAL ROLE service_role;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.reivindicar_audios_para_nota(1)) THEN RAISE EXCEPTION 'áudio privado entrou na fila'; END IF;
END $$;
ROLLBACK TO SAVEPOINT autoria_e_consentimento;

SET LOCAL ROLE service_role;
DO $$
DECLARE item record;
BEGIN
  SELECT * INTO STRICT item FROM public.reivindicar_audios_para_nota(1);
  IF public.concluir_nota_do_audio(item.tipo,item.id,'outra-versao',item.token,'medido',91)
     OR public.concluir_nota_do_audio(item.tipo,item.id,item.etag,gen_random_uuid(),'medido',91)
  THEN RAISE EXCEPTION 'a fila aceitou outro objeto ou concessão'; END IF;
  IF NOT public.concluir_nota_do_audio(item.tipo,item.id,item.etag,item.token,'medido',91)
     THEN RAISE EXCEPTION 'a primeira medição falhou'; END IF;
  IF public.concluir_nota_do_audio(item.tipo,item.id,item.etag,item.token,'medido',92)
     THEN RAISE EXCEPTION 'a mesma concessão pontuou duas vezes'; END IF;
END $$;
RESET ROLE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM aue_privado.notas_retrospectivas
    WHERE bucket = 'audio_records' AND etag = 'm02-worker-v1'
      AND nota = 91 AND versao = 'publicacao-acustica-servidor-v1'
  ) THEN RAISE EXCEPTION 'worker não persistiu nota para objeto vinculado'; END IF;
  IF EXISTS (SELECT 1 FROM public.reivindicar_audios_para_nota(1)) THEN
    RAISE EXCEPTION 'worker reapresentou item já concluído';
  END IF;
  IF EXISTS (SELECT 1 FROM public.global_ranking) THEN
    RAISE EXCEPTION 'laudo não verificado entrou no ranking global';
  END IF;
END $$;

UPDATE storage.objects
SET metadata = jsonb_set(metadata, '{eTag}', '"m02-worker-v2"')
WHERE bucket_id = 'audio_records'
  AND owner = '61000000-0000-4000-8000-000000000001';
WITH item AS (SELECT * FROM public.reivindicar_audios_para_nota(1))
SELECT public.concluir_nota_do_audio(item.tipo, item.id, item.etag, item.token, 'medido', 92)
FROM item;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM aue_privado.notas_retrospectivas
    WHERE bucket = 'audio_records' AND etag = 'm02-worker-v2' AND nota = 92
  ) THEN RAISE EXCEPTION 'troca de eTag não provocou nova avaliação'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.top_cinco_arrotadores() WHERE fonte = 'arena' AND nota = 92
  ) THEN RAISE EXCEPTION 'nota pública do worker não chegou ao ranking de publicações'; END IF;
END $$;

DO $$
DECLARE
  perfil text := (SELECT handle FROM public.perfis WHERE id='61000000-0000-4000-8000-000000000001');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.resumo_notas_publicadas('61000000-0000-4000-8000-000000000001')
                 WHERE melhor_nota = 92 AND media = 92 AND total = 1)
     OR (SELECT melhor_nota FROM public.obter_perfil_publico(perfil)) IS DISTINCT FROM 92
  THEN RAISE EXCEPTION 'as leituras do perfil não usaram a nota da versão atual do áudio'; END IF;
END $$;

ROLLBACK;

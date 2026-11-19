-- Testes da segunda migration em banco descartável, com auth/Storage simulados.
-- Não demonstram concorrência de conexões, API HTTP, políticas remotas ou áudio real.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('10000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002'),
 ('10000000-0000-0000-0000-000000000003');
CREATE TEMP TABLE convites_teste(chave text PRIMARY KEY, valor jsonb);
GRANT ALL ON convites_teste TO authenticated;
SET LOCAL ROLE authenticated;
SELECT set_config('storage.operation','storage.object.upload',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
INSERT INTO convites_teste VALUES ('a', public.aue_v2_preparar_gravacao());
INSERT INTO storage.objects(bucket_id,name) SELECT 'duelos_v2', valor->>'caminho' FROM convites_teste WHERE chave='a';
SELECT public.aue_v2_confirmar_gravacao(((SELECT valor FROM convites_teste WHERE chave='a')->>'id')::uuid,1200,'experimental-2');
INSERT INTO convites_teste VALUES ('d', public.aue_v2_criar_duelo(((SELECT valor FROM convites_teste WHERE chave='a')->>'id')::uuid, repeat('a',64)));
DO $$ DECLARE g uuid := ((SELECT valor FROM convites_teste WHERE chave='a')->>'id')::uuid;
  d jsonb := (SELECT valor FROM convites_teste WHERE chave='d'); r jsonb; BEGIN
  IF d->>'estado' <> 'aguardando_resposta' OR d ? 'token' OR (d->>'versao')::int <> 1 THEN RAISE EXCEPTION 'Criação incorreta'; END IF;
  r := public.aue_v2_criar_duelo(g, repeat('a',64));
  IF r <> d THEN RAISE EXCEPTION 'Retry de criação alterou estado ou prazo'; END IF;
  IF public.aue_v2_criar_duelo(g, repeat('b',64))->>'estado' <> 'conflito' THEN RAISE EXCEPTION 'Token diferente substituiu convite'; END IF;
  IF public.aue_v2_recuperar_duelo(((SELECT valor FROM convites_teste WHERE chave='d')->>'id')::uuid)->>'estado' <> 'aguardando_resposta' THEN RAISE EXCEPTION 'Dono não recuperou estado'; END IF;
  IF jsonb_array_length(public.aue_v2_listar_meus_duelos(0)->'itens') <> 1 OR (public.aue_v2_listar_meus_duelos(0)->'itens'->0)->>'gravacao_propria_id' <> g::text OR (public.aue_v2_listar_meus_duelos(0)->'itens'->0) ? 'token' THEN RAISE EXCEPTION 'Listagem do dono incorreta'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
DO $$ DECLARE g uuid := ((SELECT valor FROM convites_teste WHERE chave='a')->>'id')::uuid; BEGIN
  IF public.aue_v2_reemitir_convite(g,repeat('b',64),1)->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Terceiro reemitiu'; END IF;
  IF public.aue_v2_revogar_convite(g,1)->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Terceiro revogou'; END IF;
  IF public.aue_v2_recuperar_duelo(((SELECT valor FROM convites_teste WHERE chave='d')->>'id')::uuid)->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Terceiro recuperou'; END IF;
  IF jsonb_array_length(public.aue_v2_listar_meus_duelos(0)->'itens') <> 0 THEN RAISE EXCEPTION 'Terceiro listou duelo'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
DO $$ DECLARE g uuid := ((SELECT valor FROM convites_teste WHERE chave='a')->>'id')::uuid;
  d jsonb := (SELECT valor FROM convites_teste WHERE chave='d'); r jsonb; BEGIN
  r := public.aue_v2_reemitir_convite(g,repeat('b',64),1);
  IF r->>'estado' <> 'aguardando_resposta' OR (r->>'versao')::int <> 2 OR r->>'prazo' <> d->>'prazo' OR r ? 'token' THEN RAISE EXCEPTION 'Reemissão incorreta'; END IF;
  IF public.aue_v2_reemitir_convite(g,repeat('b',64),1) <> r THEN RAISE EXCEPTION 'Retry de reemissão girou token'; END IF;
  IF public.aue_v2_reemitir_convite(g,repeat('c',64),1)->>'estado' <> 'conflito' THEN RAISE EXCEPTION 'Reemissão velha sobrescreveu'; END IF;
  IF public.aue_v2_abrir_duelo(repeat('a',64))->>'estado' <> 'indisponivel' OR public.aue_v2_abrir_duelo(repeat('b',64))->>'estado' <> 'aguardando_resposta' THEN RAISE EXCEPTION 'Token antigo válido ou novo inválido'; END IF;
  r := public.aue_v2_revogar_convite(g,2);
  IF r->>'estado' <> 'revogado' OR (r->>'versao')::int <> 3 OR r->>'prazo' <> d->>'prazo' THEN RAISE EXCEPTION 'Revogação incorreta'; END IF;
  IF public.aue_v2_revogar_convite(g,2) <> r THEN RAISE EXCEPTION 'Retry de revogação mudou estado'; END IF;
  IF public.aue_v2_abrir_duelo(repeat('b',64))->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Token revogado aceito'; END IF;
  r := public.aue_v2_reemitir_convite(g,repeat('c',64),3);
  IF r->>'estado' <> 'aguardando_resposta' OR (r->>'versao')::int <> 4 OR r->>'prazo' <> d->>'prazo' THEN RAISE EXCEPTION 'Reativação incorreta'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
INSERT INTO convites_teste VALUES ('b', public.aue_v2_preparar_gravacao());
INSERT INTO storage.objects(bucket_id,name) SELECT 'duelos_v2', valor->>'caminho' FROM convites_teste WHERE chave='b';
SELECT public.aue_v2_confirmar_gravacao(((SELECT valor FROM convites_teste WHERE chave='b')->>'id')::uuid,900,'experimental-2');
DO $$ DECLARE b uuid := ((SELECT valor FROM convites_teste WHERE chave='b')->>'id')::uuid; BEGIN
  IF public.aue_v2_responder_duelo(repeat('c',64),b)->>'estado' <> 'respondido' THEN RAISE EXCEPTION 'Resposta não ocupou vaga'; END IF;
  IF public.aue_v2_recuperar_duelo(((SELECT valor FROM convites_teste WHERE chave='d')->>'id')::uuid)->>'estado' <> 'revelado' THEN RAISE EXCEPTION 'Respondente não recuperou resultado'; END IF;
  IF (public.aue_v2_listar_meus_duelos(0)->'itens'->0)->>'gravacao_propria_id' <> b::text THEN RAISE EXCEPTION 'Respondente não listou própria gravação'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
DO $$ DECLARE a uuid := ((SELECT valor FROM convites_teste WHERE chave='a')->>'id')::uuid; BEGIN
  IF public.aue_v2_recuperar_duelo(((SELECT valor FROM convites_teste WHERE chave='d')->>'id')::uuid)->>'estado' <> 'revelado' THEN RAISE EXCEPTION 'Criador não recuperou resultado'; END IF;
  IF public.aue_v2_reemitir_convite(a,repeat('d',64),4)->>'estado' <> 'respondido' THEN RAISE EXCEPTION 'Reemitiu após resposta'; END IF;
  IF public.aue_v2_revogar_convite(a,4)->>'estado' <> 'respondido' THEN RAISE EXCEPTION 'Revogou após resposta'; END IF;
END $$;
-- Uma mesma gravação de resposta pode participar de dois duelos; recuperar
-- cada ID precisa revelar o confronto correto, nunca uma linha arbitrária.
INSERT INTO convites_teste VALUES ('a2', public.aue_v2_preparar_gravacao());
INSERT INTO storage.objects(bucket_id,name) SELECT 'duelos_v2', valor->>'caminho' FROM convites_teste WHERE chave='a2';
SELECT public.aue_v2_confirmar_gravacao(((SELECT valor FROM convites_teste WHERE chave='a2')->>'id')::uuid,500,'experimental-2');
INSERT INTO convites_teste VALUES ('d2', public.aue_v2_criar_duelo(((SELECT valor FROM convites_teste WHERE chave='a2')->>'id')::uuid, repeat('d',64)));
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
DO $$ DECLARE b uuid := ((SELECT valor FROM convites_teste WHERE chave='b')->>'id')::uuid;
  d1 uuid := ((SELECT valor FROM convites_teste WHERE chave='d')->>'id')::uuid;
  d2 uuid := ((SELECT valor FROM convites_teste WHERE chave='d2')->>'id')::uuid; BEGIN
  IF public.aue_v2_responder_duelo(repeat('d',64),b)->>'estado' <> 'respondido' THEN RAISE EXCEPTION 'Segunda resposta recusada'; END IF;
  IF public.aue_v2_recuperar_duelo(d1)->>'resultado_provisorio' <> 'criador' OR
     public.aue_v2_recuperar_duelo(d2)->>'resultado_provisorio' <> 'desafiante' OR
     public.aue_v2_recuperar_duelo(d2)->>'id' <> d2::text THEN RAISE EXCEPTION 'Recuperou duelo arbitrário'; END IF;
  IF jsonb_array_length(public.aue_v2_listar_meus_duelos(0)->'itens') <> 2 THEN RAISE EXCEPTION 'Listagem omitiu um duelo'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
DO $$ DECLARE a uuid := ((SELECT valor FROM convites_teste WHERE chave='a')->>'id')::uuid; BEGIN
  IF public.aue_v2_recuperar_duelo(((SELECT valor FROM convites_teste WHERE chave='d')->>'id')::uuid)->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Terceiro acessou resultado'; END IF;
  IF has_function_privilege(current_user,'public.aue_v2_responder_duelo_interno(text,uuid)','EXECUTE') OR has_function_privilege(current_user,'public.aue_v2_abrir_duelo_interno(text)','EXECUTE') THEN RAISE EXCEPTION 'Wrapper pode ser contornado'; END IF;
END $$;
-- Um convite aberto com gravação excluída não deve reaparecer como utilizável.
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
INSERT INTO convites_teste VALUES ('a3', public.aue_v2_preparar_gravacao());
INSERT INTO storage.objects(bucket_id,name) SELECT 'duelos_v2', valor->>'caminho' FROM convites_teste WHERE chave='a3';
SELECT public.aue_v2_confirmar_gravacao(((SELECT valor FROM convites_teste WHERE chave='a3')->>'id')::uuid,700,'experimental-2');
INSERT INTO convites_teste VALUES ('d3', public.aue_v2_criar_duelo(((SELECT valor FROM convites_teste WHERE chave='a3')->>'id')::uuid, repeat('e',64)));
DO $$ DECLARE a uuid := ((SELECT valor FROM convites_teste WHERE chave='a3')->>'id')::uuid;
  d uuid := ((SELECT valor FROM convites_teste WHERE chave='d3')->>'id')::uuid; item jsonb; BEGIN
  PERFORM public.aue_v2_solicitar_exclusao(a);
  SELECT value INTO item FROM jsonb_array_elements(public.aue_v2_listar_meus_duelos(0)->'itens') WHERE value->>'id' = d::text;
  IF item IS NULL OR item->>'estado' <> 'indisponivel' OR item->>'gravacao_propria_id' <> a::text THEN RAISE EXCEPTION 'Listagem exibiu convite excluído como disponível'; END IF;
  IF public.aue_v2_recuperar_duelo(d)->>'estado' <> 'indisponivel'
     OR public.aue_v2_abrir_duelo(repeat('e',64))->>'estado' <> 'indisponivel'
     OR public.aue_v2_reemitir_convite(a,repeat('f',64),1)->>'estado' <> 'indisponivel' THEN
    RAISE EXCEPTION 'Convite excluído ainda disponível'; END IF;
END $$;
-- O prazo vale apenas para resposta; resultado fechado continua acessível.
RESET ROLE;
UPDATE aue_privado.duelos_v2 SET expira_em = now() - interval '1 second';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
DO $$ DECLARE a uuid := ((SELECT valor FROM convites_teste WHERE chave='a')->>'id')::uuid; BEGIN
  IF public.aue_v2_recuperar_duelo(((SELECT valor FROM convites_teste WHERE chave='d')->>'id')::uuid)->>'estado' <> 'revelado' THEN RAISE EXCEPTION 'Resultado fechado não sobrevive ao prazo'; END IF;
  PERFORM public.aue_v2_solicitar_exclusao(a);
  IF public.aue_v2_recuperar_duelo(((SELECT valor FROM convites_teste WHERE chave='d')->>'id')::uuid)->>'estado' <> 'indisponivel' THEN RAISE EXCEPTION 'Recuperação ignorou exclusão'; END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(public.aue_v2_listar_meus_duelos(0)->'itens') item
      WHERE item->>'id' = (SELECT valor->>'id' FROM convites_teste WHERE chave='d') AND item->>'estado' = 'indisponivel') THEN
    RAISE EXCEPTION 'Histórico do criador ignorou exclusão'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(public.aue_v2_listar_meus_duelos(0)->'itens') item
      WHERE item->>'id' = (SELECT valor->>'id' FROM convites_teste WHERE chave='d') AND item->>'estado' = 'indisponivel') THEN
    RAISE EXCEPTION 'Histórico do desafiante ignorou exclusão'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  IF has_function_privilege(current_user,'public.aue_v2_criar_duelo(uuid,text)','EXECUTE') OR
     has_function_privilege(current_user,'public.aue_v2_listar_meus_duelos(integer)','EXECUTE') OR
     has_function_privilege(current_user,'public.aue_v2_recuperar_duelo(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Anon recebeu acesso indevido'; END IF;
END $$;
ROLLBACK;

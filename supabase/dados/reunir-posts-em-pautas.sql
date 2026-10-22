-- Agrupamento aprovado pelo Luiz. Originais e respostas permanecem intactos.
-- Novas pautas pertencem ao perfil do dono; nenhuma publicação antiga troca de autor.
SET LOCAL lock_timeout = '5s';

DO $missao$
DECLARE
  v_dono uuid;
  v_grupo uuid;
  v_pauta uuid;
  v_item jsonb;
  v_ids uuid[];
  v_total integer;
BEGIN
  SELECT id INTO STRICT v_dono FROM public.perfis WHERE handle = 'giamzinn_aue';
  IF NOT public.aue_e_conta_promovida(v_dono) THEN
    RAISE EXCEPTION 'Conta do dono indisponível';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements($dados$[{"chave":"mural-da-vergonha","slug":"eu-arroto-e-dai","titulo":"Mural da vergonha","corpo":"As resenhas e os áudios do Giam, do Lima e da turma, reunidos no mesmo tópico.","posts":["71cdc2a3-8d31-5979-a8af-5dfe18fb3f36","034032f3-2893-568e-9319-b3bf1ff67602","c0c10006-80c6-5c07-a91e-73fa4f0abf2c","7546b6eb-71d9-5e9e-9001-f7662f3d7bea","c347b3a4-ffe7-53ae-bd99-93ced738b891","8ec140ba-9761-585a-a00a-1c7cd479587c","bee2bc98-4bb1-5c1f-b31b-f31fba33d3a6","ffcd559e-b79f-5777-8104-ab5fe2c3b2bd","78cec71e-8a1f-5c5a-9d8b-64317259a477","79dcdc37-7ff9-53c2-9fa8-4809d946f700","8c3106a5-d6cb-5246-86b7-fea32956affd","02bd3318-1e10-5354-bcef-1dc19dbe4e76","e9cfea32-f10e-5fad-ad78-d6a9c8b8d7b6","7be0339b-69d0-53cf-ae60-9d51a30f8225","771325fe-3c38-5201-b813-bb626bffe32e","cec95214-57d9-5dbf-ac23-c21b035f130c","5dcd5bb2-0b58-520a-97d3-307d8084e20e","3fd7640d-3e94-5565-ab45-1db417532cb7","d193d2d0-ed97-52e5-9190-4de6dc68ce95","28edf340-3a31-5a4c-91f6-ec18e9f3c864","4307bc80-950a-501a-91a5-25051755a107"]},{"chave":"arroto-na-lente","slug":"eu-arroto-e-dai","titulo":"Arroto na lente da câmera","corpo":"A conversa sobre gravar arrotos na lente da câmera, com as respostas e os áudios originais.","posts":["35207323-31a9-4849-8947-1cf77dab5f56"]},{"chave":"dicas-para-treinar","slug":"eu-arroto-e-dai","titulo":"Dicas para treinar","corpo":"Perguntas e dicas da turma para treinar o arroto.","posts":["90414ee3-9ff0-57d9-8f24-a73043297277"]},{"chave":"cheguei-na-comunidade","slug":"eu-arroto-e-dai","titulo":"Cheguei na comunidade","corpo":"As apresentações de quem chegou à comunidade.","posts":["7e34cf6e-9a64-492e-b15d-1005d93b0f9b"]},{"chave":"manda-teu-arroto","slug":"eu-arroto-e-dai","titulo":"Manda teu arroto","corpo":"As gravações da turma, com seus posts e respostas.","posts":["69e7f93f-f30d-405e-a07b-8f6cdf3d8cbd"]},{"chave":"reliquias-da-internet","slug":"arrotos-youtube","titulo":"Relíquias da internet","corpo":"Os vídeos antigos de arroto que a turma trouxe para a comunidade.","posts":["4e5e040b-42f8-4599-a3db-5e067e71e31e","409d9228-7abc-4ee5-a516-5538ec9ec172","623907c3-1eca-47df-8fd7-655e401300b7","a9e8e915-6310-43a9-bfc7-70134e6e0b8d"]},{"chave":"videos-e-compilacoes","slug":"arrotos-youtube","titulo":"Vídeos e compilações","corpo":"Vídeos e compilações de arroto compartilhados pela comunidade.","posts":["5f124b14-56b4-4ed5-aaae-9292777dba94","683139ad-8968-43ae-87eb-9b9f2fe32d77","4ba662a3-e2e9-49b0-82f0-516c338b539a","09f341dc-48a9-4de8-957c-74fe13e8234b","71f1dab1-18c9-4a2a-90af-40915398ce89","29864d1f-7eb9-4ade-a81a-236a8d445143"]},{"chave":"arrotos-nos-jogos","slug":"arrotos-youtube","titulo":"Arrotos nos jogos","corpo":"Os vídeos de arroto em partidas e jogos.","posts":["2833b47e-b630-4023-990f-75ee8204ff02","33033286-fa12-4822-a435-bd85238b66f2"]},{"chave":"dicas-e-curiosidades","slug":"arrotos-youtube","titulo":"Dicas e curiosidades","corpo":"Aulas e curiosidades em vídeo trazidas pela turma.","posts":["41797318-2c0b-4ae0-a462-32ccd125d371","22da014f-8c17-4ad8-a0b7-de0fc6b7d7b2","199220fc-07b6-4b65-ad44-b41813b56500"]}]$dados$::jsonb)
  LOOP
    SELECT id INTO STRICT v_grupo FROM public.grupos WHERE slug = v_item->>'slug';
    SELECT array_agg(value::uuid) INTO v_ids FROM jsonb_array_elements_text(v_item->'posts');
    SELECT count(*) INTO v_total FROM public.topicos
     WHERE id = ANY(v_ids) AND comunidade_id = v_grupo AND origem = 'comunidade'
       AND status IN ('aberto', 'fechado');
    IF v_total <> cardinality(v_ids) THEN
      RAISE EXCEPTION 'Inventário mudou na pauta %: esperado %, encontrado %',
        v_item->>'chave', cardinality(v_ids), v_total;
    END IF;

    SELECT pauta_id INTO v_pauta FROM public.pautas_de_topicos WHERE chave = v_item->>'chave';
    IF v_pauta IS NULL THEN
      INSERT INTO public.topicos (comunidade_id, autor_id, titulo, corpo, origem)
      VALUES (v_grupo, v_dono, v_item->>'titulo', v_item->>'corpo', 'comunidade')
      RETURNING id INTO v_pauta;
      INSERT INTO public.pautas_de_topicos (pauta_id, chave) VALUES (v_pauta, v_item->>'chave');
    ELSIF NOT EXISTS (SELECT 1 FROM public.topicos WHERE id = v_pauta AND comunidade_id = v_grupo) THEN
      RAISE EXCEPTION 'Pauta existente pertence a outra comunidade';
    END IF;

    INSERT INTO public.topicos_em_pauta (topico_id, pauta_id, posicao)
    SELECT value::uuid, v_pauta, ordinality::smallint
      FROM jsonb_array_elements_text(v_item->'posts') WITH ORDINALITY
    ON CONFLICT (topico_id) DO NOTHING;

    IF EXISTS (
      SELECT 1 FROM unnest(v_ids) esperado(id)
      LEFT JOIN public.topicos_em_pauta e ON e.topico_id = esperado.id
      WHERE e.pauta_id IS DISTINCT FROM v_pauta
    ) THEN
      RAISE EXCEPTION 'Um post já pertence a outra pauta';
    END IF;
  END LOOP;
END;
$missao$;


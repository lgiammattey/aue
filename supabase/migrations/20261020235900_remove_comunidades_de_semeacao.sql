-- Remove as comunidades de semeação, a pedido do Luiz: o Auê fica com
-- "Eu arroto, e daí?" e "Arrotos no YouTube".
--
-- DESTRUTIVO. Apagar uma comunidade leva junto, em cascata, os tópicos, as
-- respostas, os posts antigos, os comentários antigos, os campeonatos e a
-- lista de membros dela. Os resultados da Arena ficam; só perdem o vínculo
-- (grupo_id vira NULL). Conferido antes de escrever: seis comunidades estão
-- vazias, `bonde-geral` tem 5 tópicos / 7 respostas / 6 comentários antigos e
-- `trovao-da-madrugada` tem 1 tópico.
--
-- Travas: a lista é fechada por slug; as comunidades que ficam nunca entram na
-- lista; se alguma das que ficam não existir, a migration aborta sem apagar nada.
-- Quem aplica é o Luiz, depois de revisar.

DO $$
DECLARE
  v_ficam text[] := ARRAY['eu-arroto-e-dai', 'arrotos-youtube'];
  v_saem  text[] := ARRAY[
    'bonde-geral', 'trovao-da-madrugada', 'cerveja-gelada', 'churrasco-raiz',
    'historias-de-arroto', 'reuniao-da-firma', 'primeiro-encontro', 'refri-cia'
  ];
  v_apagadas integer;
BEGIN
  IF (SELECT count(*) FROM public.grupos WHERE slug = ANY (v_ficam)) <> cardinality(v_ficam) THEN
    RAISE EXCEPTION 'Comunidade que deveria ficar não existe; nada foi apagado' USING ERRCODE = 'P0001';
  END IF;
  IF v_ficam && v_saem THEN
    RAISE EXCEPTION 'Lista de remoção contém comunidade que deve ficar' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.grupos WHERE slug = ANY (v_saem) AND NOT (slug = ANY (v_ficam));
  GET DIAGNOSTICS v_apagadas = ROW_COUNT;
  RAISE NOTICE 'Comunidades removidas: %', v_apagadas;
END;
$$;

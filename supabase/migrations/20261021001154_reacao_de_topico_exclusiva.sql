-- Reação em tópico se comporta como em causo: o coração é independente e
-- 🔥, 🤢 e 🏆 são uma escolha só (marcar uma tira a outra).
CREATE OR REPLACE FUNCTION public.alternar_reacao_do_topico(p_topico_id uuid, p_tipo text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_apagadas integer;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF p_tipo NOT IN ('like', 'fogo', 'nojo', 'trofeu') THEN
    RAISE EXCEPTION 'Reação inválida' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.topicos t
                  WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado')
                    AND public.aue_e_conta_promovida(t.autor_id)) THEN
    RAISE EXCEPTION 'Tópico não encontrado' USING ERRCODE = '22023', HINT = 'topico_nao_encontrado';
  END IF;
  DELETE FROM public.reacoes_de_topicos WHERE user_id = auth.uid() AND topico_id = p_topico_id AND tipo = p_tipo;
  GET DIAGNOSTICS v_apagadas = ROW_COUNT;
  IF v_apagadas > 0 THEN RETURN false; END IF;
  -- Como nos causos: o coração é independente; 🔥, 🤢 e 🏆 são uma escolha só.
  IF p_tipo IN ('fogo', 'nojo', 'trofeu') THEN
    DELETE FROM public.reacoes_de_topicos
     WHERE user_id = auth.uid() AND topico_id = p_topico_id AND tipo IN ('fogo', 'nojo', 'trofeu');
  END IF;
  INSERT INTO public.reacoes_de_topicos (user_id, topico_id, tipo) VALUES (auth.uid(), p_topico_id, p_tipo);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.alternar_reacao_do_topico(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.alternar_reacao_do_topico(uuid, text) TO authenticated;

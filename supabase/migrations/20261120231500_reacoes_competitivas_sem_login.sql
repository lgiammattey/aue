-- Reações competitivas no mural e votação liberada para sessão anônima ou conta.

ALTER TABLE public.reacoes_de_topicos
  DROP CONSTRAINT IF EXISTS reacoes_de_topicos_tipo_check;

ALTER TABLE public.reacoes_de_topicos
  ADD CONSTRAINT reacoes_de_topicos_tipo_check
  CHECK (tipo IN (
    'like',
    'dislike',
    'dedo',
    'hangloose',
    'rock',
    'cerveja',
    'refrigerante',
    'fogo',
    'nojo',
    'trofeu'
  ));

CREATE OR REPLACE FUNCTION public.alternar_reacao_do_topico(p_topico_id uuid, p_tipo text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_apagadas integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessão necessária para reagir' USING ERRCODE = '42501';
  END IF;
  IF p_tipo NOT IN (
    'like',
    'dislike',
    'dedo',
    'hangloose',
    'rock',
    'cerveja',
    'refrigerante',
    'fogo',
    'nojo',
    'trofeu'
  ) THEN
    RAISE EXCEPTION 'Reação inválida' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.topicos t
     WHERE t.id = p_topico_id
       AND t.status IN ('aberto', 'fechado')
       AND public.aue_e_conta_promovida(t.autor_id)
  ) THEN
    RAISE EXCEPTION 'Tópico não encontrado' USING ERRCODE = '22023', HINT = 'topico_nao_encontrado';
  END IF;

  DELETE FROM public.reacoes_de_topicos
   WHERE user_id = auth.uid() AND topico_id = p_topico_id AND tipo = p_tipo;
  GET DIAGNOSTICS v_apagadas = ROW_COUNT;
  IF v_apagadas > 0 THEN
    RETURN false;
  END IF;

  IF p_tipo = 'like' THEN
    DELETE FROM public.reacoes_de_topicos
     WHERE user_id = auth.uid() AND topico_id = p_topico_id AND tipo = 'dislike';
  ELSIF p_tipo = 'dislike' THEN
    DELETE FROM public.reacoes_de_topicos
     WHERE user_id = auth.uid() AND topico_id = p_topico_id AND tipo = 'like';
  END IF;

  IF p_tipo IN ('dedo', 'hangloose', 'rock', 'cerveja', 'refrigerante', 'fogo', 'nojo', 'trofeu') THEN
    DELETE FROM public.reacoes_de_topicos
     WHERE user_id = auth.uid()
       AND topico_id = p_topico_id
       AND tipo IN ('dedo', 'hangloose', 'rock', 'cerveja', 'refrigerante', 'fogo', 'nojo', 'trofeu');
  END IF;

  INSERT INTO public.reacoes_de_topicos (user_id, topico_id, tipo)
  VALUES (auth.uid(), p_topico_id, p_tipo);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.contar_reacoes_dos_topicos(p_topicos uuid[])
RETURNS TABLE(topico_id uuid, tipo text, total bigint, minha boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT r.topico_id, r.tipo, count(*), coalesce(bool_or(r.user_id = auth.uid()), false)
    FROM public.reacoes_de_topicos r
    JOIN public.topicos t ON t.id = r.topico_id
   WHERE r.topico_id = ANY (p_topicos[1:100])
     AND t.status IN ('aberto', 'fechado')
     AND public.aue_e_conta_promovida(t.autor_id)
   GROUP BY r.topico_id, r.tipo;
$$;

REVOKE ALL ON FUNCTION public.alternar_reacao_do_topico(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.alternar_reacao_do_topico(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.contar_reacoes_dos_topicos(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.contar_reacoes_dos_topicos(uuid[]) TO anon, authenticated;

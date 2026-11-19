-- O lado só é revelado depois da autorização e deriva exclusivamente da sessão.
CREATE OR REPLACE FUNCTION public.aue_v2_revelar_duelo(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_resultado jsonb; v_id uuid; v_lado text;
BEGIN
  v_resultado := public.aue_v2_revelar_duelo_sem_id(p_token);
  IF v_resultado->>'estado' <> 'revelado' THEN RETURN v_resultado; END IF;
  SELECT id, CASE WHEN criador_id = auth.uid() THEN 'criador' ELSE 'desafiante' END
    INTO v_id, v_lado FROM aue_privado.duelos_v2
   WHERE token_hash = extensions.digest(p_token, 'sha256')
     AND auth.uid() IN (criador_id, desafiante_id) AND respondido_em IS NOT NULL;
  IF v_id IS NULL THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  RETURN v_resultado || jsonb_build_object('id', v_id, 'lado_sessao', v_lado);
END;
$$;

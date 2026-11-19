-- Quem recuperou o duelo pela própria conta pode denunciar sem guardar o link.
-- Permissões, quarentena e autoria seguem o contrato existente da denúncia por token.
CREATE FUNCTION public.aue_v2_denunciar_por_duelo(p_duelo_id uuid, p_alvo text, p_motivo text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_d aue_privado.duelos_v2%ROWTYPE; v_g_id uuid; v_denuncia_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  IF p_duelo_id IS NULL OR p_alvo IS NULL OR p_alvo NOT IN ('criador', 'desafiante')
     OR p_motivo IS NULL OR p_motivo NOT IN ('ofensivo', 'outro') THEN
    RETURN jsonb_build_object('estado', 'indisponivel');
  END IF;
  SELECT * INTO v_d FROM aue_privado.duelos_v2
   WHERE id = p_duelo_id AND respondido_em IS NOT NULL AND v_uid IN (criador_id, desafiante_id) FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  IF (p_alvo = 'criador' AND v_uid <> v_d.desafiante_id)
     OR (p_alvo = 'desafiante' AND v_uid <> v_d.criador_id) THEN
    RETURN jsonb_build_object('estado', 'indisponivel');
  END IF;
  v_g_id := CASE WHEN p_alvo = 'criador' THEN v_d.gravacao_criador_id ELSE v_d.gravacao_resposta_id END;
  PERFORM 1 FROM aue_privado.gravacoes_v2 WHERE id = v_g_id AND exclusao_solicitada_em IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  INSERT INTO aue_privado.denuncias_v2(duelo_id, gravacao_id, denunciante_id, motivo)
    VALUES (v_d.id, v_g_id, v_uid, p_motivo) ON CONFLICT (duelo_id, gravacao_id, denunciante_id) DO NOTHING
    RETURNING id INTO v_denuncia_id;
  IF v_denuncia_id IS NOT NULL THEN
    UPDATE aue_privado.gravacoes_v2 SET oculta_por_denuncia_em = coalesce(oculta_por_denuncia_em, now()) WHERE id = v_g_id;
  ELSIF EXISTS (SELECT 1 FROM aue_privado.denuncias_v2
                WHERE duelo_id = v_d.id AND gravacao_id = v_g_id AND denunciante_id = v_uid
                  AND estado IN ('mantida', 'restaurada')) THEN
    RETURN jsonb_build_object('estado', 'ja_analisada');
  END IF;
  RETURN jsonb_build_object('estado', 'registrada');
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_denunciar_por_duelo(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_denunciar_por_duelo(uuid,text,text) TO authenticated;

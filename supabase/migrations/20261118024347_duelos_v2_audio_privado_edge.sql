-- NÃO APLICAR antes de testar a função, o acesso direto e a revisão de denúncias.
-- Um JWT válido pode sobreviver ao sign-out. Confere a sessão corrente no banco.
CREATE FUNCTION public.aue_v2_sessao_ativa() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL
    AND coalesce(auth.jwt()->>'session_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND EXISTS (SELECT 1 FROM auth.sessions s
      WHERE s.id::text = auth.jwt()->>'session_id' AND s.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.aue_v2_sessao_ativa() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_sessao_ativa() TO authenticated;

-- Retorna o identificador do duelo apenas após a revelação já autorizada.
ALTER FUNCTION public.aue_v2_revelar_duelo(text) RENAME TO aue_v2_revelar_duelo_sem_id;
REVOKE ALL ON FUNCTION public.aue_v2_revelar_duelo_sem_id(text) FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.aue_v2_revelar_duelo(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_resultado jsonb; v_id uuid;
BEGIN
  v_resultado := public.aue_v2_revelar_duelo_sem_id(p_token);
  IF v_resultado->>'estado' <> 'revelado' THEN RETURN v_resultado; END IF;
  SELECT id INTO v_id FROM aue_privado.duelos_v2
   WHERE token_hash = extensions.digest(p_token, 'sha256')
     AND auth.uid() IN (criador_id, desafiante_id) AND respondido_em IS NOT NULL;
  IF v_id IS NULL THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  RETURN v_resultado || jsonb_build_object('id', v_id);
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_revelar_duelo(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_revelar_duelo(text) TO authenticated;

-- Fecha GET direto; preserva apenas SELECT necessário à exclusão do próprio arquivo.
-- ATENÇÃO: GET previamente cacheado pode sobreviver até expirar/purga; a
-- moderação precisa de uma entrega server-side própria antes da aplicação.
DROP POLICY duelos_v2_ler ON storage.objects;
CREATE POLICY duelos_v2_ler ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'duelos_v2'
  AND storage.allow_any_operation(ARRAY['object.delete', 'object.delete_many'])
  AND aue_privado.pode_remover_audio_v2(name));

-- A revisão recebe a denúncia, nunca um caminho escolhido pelo cliente.
-- Só admin real, apenas denúncia pendente ou mantida e áudio não excluído.
CREATE FUNCTION public.aue_v2_audio_para_moderacao(p_denuncia_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_caminho text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.aue_v2_sessao_ativa() OR public.aue_e_administrador() IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('estado', 'indisponivel');
  END IF;
  SELECT g.caminho INTO v_caminho
    FROM aue_privado.denuncias_v2 d
    JOIN aue_privado.gravacoes_v2 g ON g.id = d.gravacao_id
    JOIN storage.objects o ON o.bucket_id = 'duelos_v2' AND o.name = g.caminho
    WHERE d.id = p_denuncia_id AND d.estado IN ('pendente', 'mantida')
      AND g.exclusao_solicitada_em IS NULL AND g.removida_em IS NULL;
  IF v_caminho IS NULL THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  RETURN jsonb_build_object('estado', 'disponivel', 'bucket', 'duelos_v2', 'caminho', v_caminho);
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_audio_para_moderacao(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_audio_para_moderacao(uuid) TO authenticated;

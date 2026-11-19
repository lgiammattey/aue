-- Candidata local. Só o serviço operacional pode registrar que recebeu
-- confirmação para o objeto esperado. Ausência no catálogo ou declaração do
-- cliente não são essa evidência. Não libera o duelo: upload em voo ainda
-- exige prova e nenhum registro antigo vira evidência automaticamente.
ALTER TABLE aue_privado.gravacoes_v2 ADD COLUMN remocao_confirmada_pelo_servico_em timestamptz;

CREATE OR REPLACE FUNCTION public.aue_v2_registrar_remocao_operacional(p_usuario_id uuid,p_gravacao_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_g aue_privado.gravacoes_v2%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id=p_usuario_id) THEN RAISE EXCEPTION 'Conta não bloqueada' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_g FROM aue_privado.gravacoes_v2 WHERE id=p_gravacao_id AND usuario_id=p_usuario_id FOR UPDATE;
  IF NOT FOUND OR v_g.exclusao_solicitada_em IS NULL THEN RAISE EXCEPTION 'Gravação indisponível' USING ERRCODE='42501'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=v_g.caminho) THEN
    RETURN jsonb_build_object('estado','remocao_pendente');
  END IF;
  -- O operador autorizado deve chamar apenas após confirmação da Storage API;
  -- a autorização de serviço é a fronteira de confiança, não o catálogo.
  UPDATE aue_privado.gravacoes_v2 SET removida_em=coalesce(removida_em,now()),
    remocao_confirmada_pelo_servico_em=now() WHERE id=v_g.id;
  RETURN jsonb_build_object('estado','removida');
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_registrar_remocao_operacional(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_registrar_remocao_operacional(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.aue_v2_confirmar_exclusao(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_g aue_privado.gravacoes_v2%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_g FROM aue_privado.gravacoes_v2
    WHERE id=p_id AND usuario_id=v_uid AND exclusao_solicitada_em IS NOT NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gravação indisponível' USING ERRCODE = '42501'; END IF;
  IF v_g.remocao_confirmada_pelo_servico_em IS NOT NULL AND v_g.removida_em IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=v_g.caminho) THEN
    RETURN jsonb_build_object('estado', 'removida_pelo_servico');
  END IF;
  RETURN jsonb_build_object('estado', 'remocao_pendente');
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_confirmar_exclusao(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_confirmar_exclusao(uuid) TO authenticated;

-- Uma marca antiga feita pelo cliente não basta para apagar a ligação com
-- o dono; sem evidência do serviço ela continua no inventário para revisão.
CREATE OR REPLACE FUNCTION public.aue_v2_inventario_exclusao_conta(p_usuario_id uuid,p_apos uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id=p_usuario_id) THEN
    RAISE EXCEPTION 'Conta não bloqueada' USING ERRCODE='42501';
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'caminho',caminho) ORDER BY id),'[]'::jsonb) INTO v_result
    FROM (SELECT id,caminho FROM aue_privado.gravacoes_v2
      WHERE usuario_id=p_usuario_id AND (removida_em IS NULL OR remocao_confirmada_pelo_servico_em IS NULL OR EXISTS
        (SELECT 1 FROM storage.objects o WHERE o.bucket_id='duelos_v2' AND o.name=gravacoes_v2.caminho))
        AND (p_apos IS NULL OR id>p_apos) ORDER BY id LIMIT 100) p;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_inventario_exclusao_conta(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_inventario_exclusao_conta(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.aue_v2_anonimizar_conta(p_usuario_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id=p_usuario_id) THEN RAISE EXCEPTION 'Conta não bloqueada' USING ERRCODE='42501'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('aue-v2-exclusao-conta:' || p_usuario_id::text,0));
  IF EXISTS (SELECT 1 FROM aue_privado.gravacoes_v2 g WHERE g.usuario_id=p_usuario_id AND
      (g.removida_em IS NULL OR g.remocao_confirmada_pelo_servico_em IS NULL OR EXISTS
        (SELECT 1 FROM storage.objects o WHERE o.bucket_id='duelos_v2' AND o.name=g.caminho))) THEN
    RETURN jsonb_build_object('estado','remocao_pendente');
  END IF;
  UPDATE aue_privado.duelos_v2 SET criador_id=NULL,criador_excluido=true WHERE criador_id=p_usuario_id;
  UPDATE aue_privado.duelos_v2 SET desafiante_id=NULL,desafiante_excluido=true WHERE desafiante_id=p_usuario_id;
  UPDATE aue_privado.denuncias_v2 SET denunciante_id=NULL,denunciante_excluido=true WHERE denunciante_id=p_usuario_id;
  UPDATE aue_privado.denuncias_v2 SET moderador_id=NULL,moderador_excluido=true WHERE moderador_id=p_usuario_id;
  UPDATE aue_privado.decisoes_moderacao_v2 SET moderador_id=NULL,moderador_excluido=true WHERE moderador_id=p_usuario_id;
  UPDATE aue_privado.gravacoes_v2 SET usuario_id=NULL,caminho=NULL,usuario_excluido=true,
    estado='pendente',duracao_ms=NULL,versao_regua=NULL,confirmado_em=NULL WHERE usuario_id=p_usuario_id;
  RETURN jsonb_build_object('estado','anonimizada');
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_anonimizar_conta(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_anonimizar_conta(uuid) TO service_role;

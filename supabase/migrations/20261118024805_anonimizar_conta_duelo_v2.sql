-- Proposta em teste: não publicar sem validar Storage, corridas e exclusão de
-- conta em todos os recursos. Mantém duelos e moderação, sem expor o usuário.
ALTER TABLE aue_privado.gravacoes_v2 ALTER COLUMN usuario_id DROP NOT NULL, ALTER COLUMN caminho DROP NOT NULL,
  ADD COLUMN usuario_excluido boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT gravacoes_v2_anonimizada_check CHECK (
    (NOT usuario_excluido AND usuario_id IS NOT NULL AND caminho IS NOT NULL)
    OR (usuario_excluido AND usuario_id IS NULL AND caminho IS NULL AND removida_em IS NOT NULL
        AND estado = 'pendente' AND duracao_ms IS NULL AND versao_regua IS NULL AND confirmado_em IS NULL)
  );
ALTER TABLE aue_privado.duelos_v2 ALTER COLUMN criador_id DROP NOT NULL,
  ADD COLUMN criador_excluido boolean NOT NULL DEFAULT false,
  ADD COLUMN desafiante_excluido boolean NOT NULL DEFAULT false,
  DROP CONSTRAINT duelos_v2_check,
  ADD CONSTRAINT duelos_v2_participantes_check CHECK (
    ((criador_id IS NULL) = criador_excluido)
    AND (criador_id IS NULL OR desafiante_id IS NULL OR criador_id <> desafiante_id)
    AND ((respondido_em IS NULL AND gravacao_resposta_id IS NULL AND desafiante_id IS NULL AND NOT desafiante_excluido)
      OR (respondido_em IS NOT NULL AND gravacao_resposta_id IS NOT NULL AND ((desafiante_id IS NULL) = desafiante_excluido)))
  );
ALTER TABLE aue_privado.denuncias_v2 ALTER COLUMN denunciante_id DROP NOT NULL,
  ADD COLUMN denunciante_excluido boolean NOT NULL DEFAULT false,
  ADD COLUMN moderador_excluido boolean NOT NULL DEFAULT false,
  DROP CONSTRAINT denuncias_v2_check,
  ADD CONSTRAINT denuncias_v2_anonimizada_check CHECK (
    ((denunciante_id IS NULL) = denunciante_excluido)
    AND ((estado = 'pendente' AND moderador_id IS NULL AND moderado_em IS NULL AND NOT moderador_excluido)
      OR (estado <> 'pendente' AND moderado_em IS NOT NULL AND ((moderador_id IS NULL) = moderador_excluido)))
  );
ALTER TABLE aue_privado.decisoes_moderacao_v2 ALTER COLUMN moderador_id DROP NOT NULL,
  ADD COLUMN moderador_excluido boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT decisoes_v2_anonimizada_check CHECK ((moderador_id IS NULL) = moderador_excluido);

-- Chamado pelo operador somente após confirmação de remoção pela API Storage.
-- Não prova remoção física se o serviço der resposta enganosa ou cache retiver
-- conteúdo. Ausência no catálogo não é, isoladamente, confirmação da API.
CREATE FUNCTION public.aue_v2_registrar_remocao_operacional(p_usuario_id uuid,p_gravacao_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_g aue_privado.gravacoes_v2%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id=p_usuario_id) THEN RAISE EXCEPTION 'Conta não bloqueada' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_g FROM aue_privado.gravacoes_v2 WHERE id=p_gravacao_id AND usuario_id=p_usuario_id FOR UPDATE;
  IF NOT FOUND OR v_g.exclusao_solicitada_em IS NULL THEN RAISE EXCEPTION 'Gravação indisponível' USING ERRCODE='42501'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='duelos_v2' AND name=v_g.caminho) THEN
    RETURN jsonb_build_object('estado','remocao_pendente');
  END IF;
  UPDATE aue_privado.gravacoes_v2 SET removida_em=coalesce(removida_em,now()) WHERE id=v_g.id;
  RETURN jsonb_build_object('estado','removida');
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_registrar_remocao_operacional(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_registrar_remocao_operacional(uuid,uuid) TO service_role;

-- Conserva os registros compartilhados e as denúncias. Repetição é idempotente
-- até o usuário ser excluído do Auth; não mexe no áudio do outro participante.
CREATE FUNCTION public.aue_v2_anonimizar_conta(p_usuario_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id=p_usuario_id) THEN RAISE EXCEPTION 'Conta não bloqueada' USING ERRCODE='42501'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('aue-v2-exclusao-conta:' || p_usuario_id::text,0));
  IF EXISTS (SELECT 1 FROM aue_privado.gravacoes_v2 g WHERE g.usuario_id=p_usuario_id AND
      (g.removida_em IS NULL OR EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id='duelos_v2' AND o.name=g.caminho))) THEN
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

-- Retirar o último identificador operacional apenas após o Auth confirmar a
-- exclusão. Se esta etapa falhar, pode ser repetida pelo operador.
CREATE FUNCTION public.aue_v2_concluir_exclusao_conta(p_usuario_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id=p_usuario_id) THEN RETURN jsonb_build_object('estado','auth_pendente'); END IF;
  DELETE FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id=p_usuario_id;
  RETURN jsonb_build_object('estado','concluida');
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_concluir_exclusao_conta(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_concluir_exclusao_conta(uuid) TO service_role;

-- A confirmação é persistida por gravação: retry ignora o que já foi
-- confirmado, sem confundir resposta vazia com remoção física comprovada.
CREATE OR REPLACE FUNCTION public.aue_v2_inventario_exclusao_conta(p_usuario_id uuid,p_apos uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id=p_usuario_id) THEN
    RAISE EXCEPTION 'Conta não bloqueada' USING ERRCODE = '42501';
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'caminho',caminho) ORDER BY id),'[]'::jsonb) INTO v_result
    FROM (SELECT id,caminho FROM aue_privado.gravacoes_v2
      WHERE usuario_id=p_usuario_id AND removida_em IS NULL AND (p_apos IS NULL OR id>p_apos) ORDER BY id LIMIT 100) p;
  RETURN v_result;
END;
$$;

-- BLOQUEIO DE LANÇAMENTO: proposta ainda não validada por corrida real de
-- Storage, limpeza operacional ou exclusão de conta. Não aplicar em produção.
CREATE TABLE aue_privado.contas_em_exclusao_v2 (
  usuario_id uuid PRIMARY KEY,
  iniciada_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aue_privado.contas_em_exclusao_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aue_privado.contas_em_exclusao_v2 FROM PUBLIC, anon, authenticated;

-- Lock separado por domínio; colisão apenas serializa contas adicionais.
-- Deve anteceder qualquer outro lock adquirido pelas operações protegidas.
CREATE FUNCTION aue_privado.travar_conta_v2(p_usuario_id uuid) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_usuario_id IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('aue-v2-exclusao-conta:' || p_usuario_id::text, 0));
  IF EXISTS (SELECT 1 FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id = p_usuario_id) THEN
    RAISE EXCEPTION 'Conta em exclusão' USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION aue_privado.travar_conta_v2(uuid) FROM PUBLIC, anon, authenticated;

-- Somente operação privilegiada inicia a exclusão; repetição é idempotente.
-- A marcação torna os arquivos indisponíveis na origem antes de sua remoção.
-- Cache CDN pode continuar servindo bytes previamente obtidos: isso permanece
-- uma falha separada e bloqueia a publicação do duelo.
CREATE FUNCTION public.aue_v2_iniciar_exclusao_conta(p_usuario_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_total integer;
BEGIN
  IF p_usuario_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_usuario_id) THEN
    RAISE EXCEPTION 'Conta indisponível' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('aue-v2-exclusao-conta:' || p_usuario_id::text, 0));
  INSERT INTO aue_privado.contas_em_exclusao_v2(usuario_id) VALUES (p_usuario_id) ON CONFLICT DO NOTHING;
  UPDATE aue_privado.gravacoes_v2 SET exclusao_solicitada_em = coalesce(exclusao_solicitada_em, now())
    WHERE usuario_id = p_usuario_id AND removida_em IS NULL;
  GET DIAGNOSTICS v_total = ROW_COUNT;
  RETURN jsonb_build_object('estado', 'bloqueada', 'gravacoes_pendentes', v_total);
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_iniciar_exclusao_conta(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_iniciar_exclusao_conta(uuid) TO service_role;

-- A regra de upload executa o mesmo lock transacional antes de verificar a
-- gravação. Verificar o comportamento real da API para uploads em andamento.
CREATE OR REPLACE FUNCTION aue_privado.pode_enviar_audio_v2(p_caminho text) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  PERFORM aue_privado.travar_conta_v2(auth.uid());
  PERFORM 1 FROM aue_privado.gravacoes_v2 g
   WHERE g.usuario_id = auth.uid() AND g.caminho = p_caminho AND g.estado = 'pendente'
     AND g.exclusao_solicitada_em IS NULL AND g.oculta_por_denuncia_em IS NULL
   FOR UPDATE;
  RETURN FOUND;
END;
$$;

-- As implementações originais deixam de ser APIs acessíveis aos clientes.
-- O wrapper adquire o lock antes de entrar em funções que já travam linhas.
ALTER FUNCTION public.aue_v2_preparar_gravacao() RENAME TO aue_v2_preparar_gravacao_sem_trava;
ALTER FUNCTION public.aue_v2_confirmar_gravacao(uuid,integer,text) RENAME TO aue_v2_confirmar_gravacao_sem_trava;
ALTER FUNCTION public.aue_v2_criar_duelo(uuid,text) RENAME TO aue_v2_criar_duelo_sem_trava;
ALTER FUNCTION public.aue_v2_responder_duelo(text,uuid) RENAME TO aue_v2_responder_duelo_sem_trava;
ALTER FUNCTION public.aue_v2_reemitir_convite(uuid,text,integer) RENAME TO aue_v2_reemitir_convite_sem_trava;
REVOKE ALL ON FUNCTION public.aue_v2_preparar_gravacao_sem_trava(), public.aue_v2_confirmar_gravacao_sem_trava(uuid,integer,text),
  public.aue_v2_criar_duelo_sem_trava(uuid,text), public.aue_v2_responder_duelo_sem_trava(text,uuid),
  public.aue_v2_reemitir_convite_sem_trava(uuid,text,integer) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.aue_v2_preparar_gravacao() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN PERFORM aue_privado.travar_conta_v2(auth.uid()); RETURN public.aue_v2_preparar_gravacao_sem_trava(); END; $$;
CREATE FUNCTION public.aue_v2_confirmar_gravacao(p_id uuid,p_duracao_ms integer,p_versao_regua text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN PERFORM aue_privado.travar_conta_v2(auth.uid()); RETURN public.aue_v2_confirmar_gravacao_sem_trava(p_id,p_duracao_ms,p_versao_regua); END; $$;
CREATE FUNCTION public.aue_v2_criar_duelo(p_gravacao_id uuid,p_token text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN PERFORM aue_privado.travar_conta_v2(auth.uid()); RETURN public.aue_v2_criar_duelo_sem_trava(p_gravacao_id,p_token); END; $$;
CREATE FUNCTION public.aue_v2_responder_duelo(p_token text,p_gravacao_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN PERFORM aue_privado.travar_conta_v2(auth.uid()); RETURN public.aue_v2_responder_duelo_sem_trava(p_token,p_gravacao_id); END; $$;
CREATE FUNCTION public.aue_v2_reemitir_convite(p_gravacao_id uuid,p_token_novo text,p_versao_esperada integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN PERFORM aue_privado.travar_conta_v2(auth.uid()); RETURN public.aue_v2_reemitir_convite_sem_trava(p_gravacao_id,p_token_novo,p_versao_esperada); END; $$;
REVOKE ALL ON FUNCTION public.aue_v2_preparar_gravacao(), public.aue_v2_confirmar_gravacao(uuid,integer,text),
  public.aue_v2_criar_duelo(uuid,text), public.aue_v2_responder_duelo(text,uuid), public.aue_v2_reemitir_convite(uuid,text,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_preparar_gravacao(), public.aue_v2_confirmar_gravacao(uuid,integer,text),
  public.aue_v2_criar_duelo(uuid,text), public.aue_v2_responder_duelo(text,uuid), public.aue_v2_reemitir_convite(uuid,text,integer)
  TO authenticated;

-- Uma pessoa também pode aparecer como denunciante ou moderadora. Bloquear
-- essas escritas evita que JWT antigo recrie referências durante a limpeza.
ALTER FUNCTION public.aue_v2_denunciar_audio(text,text,text) RENAME TO aue_v2_denunciar_audio_sem_trava;
ALTER FUNCTION public.aue_v2_denunciar_por_duelo(uuid,text,text) RENAME TO aue_v2_denunciar_por_duelo_sem_trava;
ALTER FUNCTION public.aue_v2_moderar_denuncia(uuid,text) RENAME TO aue_v2_moderar_denuncia_sem_trava;
REVOKE ALL ON FUNCTION public.aue_v2_denunciar_audio_sem_trava(text,text,text),
  public.aue_v2_denunciar_por_duelo_sem_trava(uuid,text,text), public.aue_v2_moderar_denuncia_sem_trava(uuid,text)
  FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.aue_v2_denunciar_audio(p_token text,p_alvo text,p_motivo text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN PERFORM aue_privado.travar_conta_v2(auth.uid()); RETURN public.aue_v2_denunciar_audio_sem_trava(p_token,p_alvo,p_motivo); END; $$;
CREATE FUNCTION public.aue_v2_denunciar_por_duelo(p_duelo_id uuid,p_alvo text,p_motivo text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN PERFORM aue_privado.travar_conta_v2(auth.uid()); RETURN public.aue_v2_denunciar_por_duelo_sem_trava(p_duelo_id,p_alvo,p_motivo); END; $$;
CREATE FUNCTION public.aue_v2_moderar_denuncia(p_id uuid,p_decisao text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN PERFORM aue_privado.travar_conta_v2(auth.uid()); RETURN public.aue_v2_moderar_denuncia_sem_trava(p_id,p_decisao); END; $$;
REVOKE ALL ON FUNCTION public.aue_v2_denunciar_audio(text,text,text),public.aue_v2_denunciar_por_duelo(uuid,text,text),
  public.aue_v2_moderar_denuncia(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_denunciar_audio(text,text,text),public.aue_v2_denunciar_por_duelo(uuid,text,text),
  public.aue_v2_moderar_denuncia(uuid,text) TO authenticated;

-- Inventário estável e paginado somente para o operador. O cursor é UUID e as
-- linhas não são apagadas enquanto a remoção física estiver em andamento.
CREATE FUNCTION public.aue_v2_inventario_exclusao_conta(p_usuario_id uuid,p_apos uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id=p_usuario_id) THEN
    RAISE EXCEPTION 'Conta não bloqueada' USING ERRCODE = '42501';
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'caminho',caminho) ORDER BY id),'[]'::jsonb) INTO v_result
    FROM (SELECT id,caminho FROM aue_privado.gravacoes_v2
      WHERE usuario_id=p_usuario_id AND (p_apos IS NULL OR id>p_apos) ORDER BY id LIMIT 100) p;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_inventario_exclusao_conta(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_inventario_exclusao_conta(uuid,uuid) TO service_role;

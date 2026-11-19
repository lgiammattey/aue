-- Convites v2 recuperáveis. O token é criado pelo cliente com CSPRNG; o banco
-- só retém seu hash. Não publicar sem validar APIs, proteção de abuso e staging.
ALTER TABLE aue_privado.duelos_v2
  ADD COLUMN versao_token integer NOT NULL DEFAULT 1 CHECK (versao_token > 0),
  ADD COLUMN revogado_em timestamptz;

-- A assinatura anterior gerava token no servidor e não permitia retry seguro.
DROP FUNCTION public.aue_v2_criar_duelo(uuid);
CREATE FUNCTION public.aue_v2_criar_duelo(p_gravacao_id uuid, p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid(); v_g aue_privado.gravacoes_v2%ROWTYPE;
  v_d aue_privado.duelos_v2%ROWTYPE; v_hash bytea;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Convite inválido' USING ERRCODE = '22023';
  END IF;
  -- Serializa criação para gravação ainda sem duelo. Quando já existe duelo,
  -- mantém a mesma ordem da resposta/denúncia: duelo antes da gravação.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('aue-v2-criar:' || p_gravacao_id::text, 0));
  SELECT * INTO v_d FROM aue_privado.duelos_v2 WHERE gravacao_criador_id = p_gravacao_id AND criador_id = v_uid FOR UPDATE;
  SELECT * INTO v_g FROM aue_privado.gravacoes_v2 WHERE id = p_gravacao_id AND usuario_id = v_uid FOR SHARE;
  IF NOT FOUND OR v_g.estado <> 'confirmada' OR v_g.exclusao_solicitada_em IS NOT NULL
     OR v_g.oculta_por_denuncia_em IS NOT NULL OR NOT EXISTS (
       SELECT 1 FROM storage.objects WHERE bucket_id = 'duelos_v2' AND name = v_g.caminho
     ) THEN RAISE EXCEPTION 'Gravação indisponível' USING ERRCODE = '42501'; END IF;
  v_hash := extensions.digest(p_token, 'sha256');
  IF v_d.id IS NOT NULL THEN
    IF v_d.token_hash <> v_hash THEN
      RETURN jsonb_build_object('estado', 'conflito', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em);
    END IF;
  ELSE
    INSERT INTO aue_privado.duelos_v2(token_hash, criador_id, gravacao_criador_id)
      VALUES (v_hash, v_uid, p_gravacao_id) RETURNING * INTO v_d;
  END IF;
  RETURN jsonb_build_object('estado', CASE WHEN v_d.respondido_em IS NOT NULL THEN 'respondido'
    WHEN v_d.revogado_em IS NOT NULL THEN 'revogado' WHEN v_d.expira_em <= now() THEN 'expirado'
    ELSE 'aguardando_resposta' END, 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em);
END;
$$;

-- Reemitir é decisão explícita: invalida o link anterior e não estende o prazo.
-- A comparação de versão impede que duas abas se invalidem silenciosamente.
CREATE FUNCTION public.aue_v2_reemitir_convite(p_gravacao_id uuid, p_token_novo text, p_versao_esperada integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_d aue_privado.duelos_v2%ROWTYPE; v_hash bytea;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  IF p_token_novo IS NULL OR p_token_novo !~ '^[0-9a-f]{64}$' OR p_versao_esperada IS NULL OR p_versao_esperada < 1 THEN
    RAISE EXCEPTION 'Convite inválido' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_d FROM aue_privado.duelos_v2 WHERE gravacao_criador_id = p_gravacao_id AND criador_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  IF v_d.respondido_em IS NOT NULL THEN RETURN jsonb_build_object('estado', 'respondido', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em); END IF;
  IF v_d.expira_em <= now() THEN RETURN jsonb_build_object('estado', 'expirado', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em); END IF;
  PERFORM 1 FROM aue_privado.gravacoes_v2 g JOIN storage.objects o ON o.bucket_id = 'duelos_v2' AND o.name = g.caminho
    WHERE g.id = v_d.gravacao_criador_id AND g.exclusao_solicitada_em IS NULL AND g.oculta_por_denuncia_em IS NULL FOR SHARE OF g;
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  v_hash := extensions.digest(p_token_novo, 'sha256');
  -- Resposta anterior perdida: não girar de novo.
  IF v_d.revogado_em IS NULL AND v_d.token_hash = v_hash AND v_d.versao_token = p_versao_esperada + 1 THEN
    RETURN jsonb_build_object('estado', 'aguardando_resposta', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em);
  END IF;
  IF v_d.versao_token <> p_versao_esperada OR v_d.token_hash = v_hash THEN
    RETURN jsonb_build_object('estado', 'conflito', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em);
  END IF;
  UPDATE aue_privado.duelos_v2 SET token_hash = v_hash, versao_token = versao_token + 1, revogado_em = NULL
    WHERE id = v_d.id RETURNING * INTO v_d;
  RETURN jsonb_build_object('estado', 'aguardando_resposta', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em);
END;
$$;

-- Revogação também usa a mesma linha que recebe a resposta. O valor aleatório
-- descarta o hash anterior; ninguém recebe o segredo usado para substituí-lo.
CREATE FUNCTION public.aue_v2_revogar_convite(p_gravacao_id uuid, p_versao_esperada integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_d aue_privado.duelos_v2%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  IF p_versao_esperada IS NULL OR p_versao_esperada < 1 THEN RAISE EXCEPTION 'Versão inválida' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_d FROM aue_privado.duelos_v2 WHERE gravacao_criador_id = p_gravacao_id AND criador_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  IF v_d.respondido_em IS NOT NULL THEN RETURN jsonb_build_object('estado', 'respondido', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em); END IF;
  IF v_d.revogado_em IS NOT NULL AND v_d.versao_token = p_versao_esperada + 1 THEN
    RETURN jsonb_build_object('estado', 'revogado', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em);
  END IF;
  IF v_d.expira_em <= now() THEN RETURN jsonb_build_object('estado', 'expirado', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em); END IF;
  IF v_d.versao_token <> p_versao_esperada OR v_d.revogado_em IS NOT NULL THEN
    RETURN jsonb_build_object('estado', 'conflito', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em);
  END IF;
  UPDATE aue_privado.duelos_v2 SET token_hash = extensions.digest(extensions.gen_random_bytes(32), 'sha256'),
    versao_token = versao_token + 1, revogado_em = now() WHERE id = v_d.id RETURNING * INTO v_d;
  RETURN jsonb_build_object('estado', 'revogado', 'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em);
END;
$$;

-- Mantém as verificações de privacidade, exclusão e moderação da primeira
-- migration. A camada interna não é API; o wrapper fecha convites revogados e
-- serializa resposta contra rotação usando a mesma linha.
ALTER FUNCTION public.aue_v2_abrir_duelo(text) RENAME TO aue_v2_abrir_duelo_interno;
ALTER FUNCTION public.aue_v2_responder_duelo(text,uuid) RENAME TO aue_v2_responder_duelo_interno;
REVOKE ALL ON FUNCTION public.aue_v2_abrir_duelo_interno(text), public.aue_v2_responder_duelo_interno(text,uuid) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.aue_v2_abrir_duelo(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' OR NOT EXISTS (
    SELECT 1 FROM aue_privado.duelos_v2 WHERE token_hash = extensions.digest(p_token, 'sha256') AND revogado_em IS NULL
  ) THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  RETURN public.aue_v2_abrir_duelo_interno(p_token);
END;
$$;

CREATE FUNCTION public.aue_v2_responder_duelo(p_token text, p_gravacao_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_d aue_privado.duelos_v2%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  SELECT * INTO v_d FROM aue_privado.duelos_v2 WHERE token_hash = extensions.digest(p_token, 'sha256') FOR UPDATE;
  IF NOT FOUND OR v_d.revogado_em IS NOT NULL THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  RETURN public.aue_v2_responder_duelo_interno(p_token, p_gravacao_id);
END;
$$;

-- Recupera pelo ID do duelo, sempre vinculado a auth.uid(). Uma gravação
-- pode responder mais de um duelo; esse identificador não é chave de convite.
CREATE FUNCTION public.aue_v2_recuperar_duelo(p_duelo_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_d aue_privado.duelos_v2%ROWTYPE;
  v_a aue_privado.gravacoes_v2%ROWTYPE; v_b aue_privado.gravacoes_v2%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_d FROM aue_privado.duelos_v2
   WHERE id = p_duelo_id AND (criador_id = v_uid OR desafiante_id = v_uid);
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  IF v_d.respondido_em IS NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM aue_privado.gravacoes_v2 g JOIN storage.objects o
        ON o.bucket_id = 'duelos_v2' AND o.name = g.caminho
      WHERE g.id = v_d.gravacao_criador_id AND g.exclusao_solicitada_em IS NULL
        AND g.oculta_por_denuncia_em IS NULL
    ) THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
    RETURN jsonb_build_object('estado', CASE WHEN v_d.revogado_em IS NOT NULL THEN 'revogado'
      WHEN v_d.expira_em <= now() THEN 'expirado' ELSE 'aguardando_resposta' END,
      'id', v_d.id, 'versao', v_d.versao_token, 'prazo', v_d.expira_em);
  END IF;
  SELECT * INTO v_a FROM aue_privado.gravacoes_v2 WHERE id = v_d.gravacao_criador_id;
  SELECT * INTO v_b FROM aue_privado.gravacoes_v2 WHERE id = v_d.gravacao_resposta_id;
  IF v_a.exclusao_solicitada_em IS NOT NULL OR v_b.exclusao_solicitada_em IS NOT NULL
     OR v_a.oculta_por_denuncia_em IS NOT NULL OR v_b.oculta_por_denuncia_em IS NOT NULL
     OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'duelos_v2' AND name = v_a.caminho)
     OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'duelos_v2' AND name = v_b.caminho) THEN
    RETURN jsonb_build_object('estado', 'indisponivel');
  END IF;
  RETURN jsonb_build_object('estado', 'revelado', 'id', v_d.id, 'bucket', 'duelos_v2',
    'criador', jsonb_build_object('duracao_ms', v_a.duracao_ms, 'caminho', v_a.caminho),
    'desafiante', jsonb_build_object('duracao_ms', v_b.duracao_ms, 'caminho', v_b.caminho),
    'resultado_provisorio', CASE WHEN v_a.duracao_ms > v_b.duracao_ms THEN 'criador'
      WHEN v_b.duracao_ms > v_a.duracao_ms THEN 'desafiante' ELSE 'empate' END,
    'versao_regua', v_a.versao_regua, 'origem_medicao', 'cliente_nao_verificada');
END;
$$;

REVOKE ALL ON FUNCTION public.aue_v2_criar_duelo(uuid,text), public.aue_v2_reemitir_convite(uuid,text,integer),
  public.aue_v2_revogar_convite(uuid,integer), public.aue_v2_recuperar_duelo(uuid),
  public.aue_v2_abrir_duelo(text), public.aue_v2_responder_duelo(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_abrir_duelo(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_criar_duelo(uuid,text), public.aue_v2_reemitir_convite(uuid,text,integer),
  public.aue_v2_revogar_convite(uuid,integer), public.aue_v2_recuperar_duelo(uuid),
  public.aue_v2_responder_duelo(text,uuid) TO authenticated;

-- Após reload, a identidade ainda ativa pode descobrir os IDs necessários à
-- recuperação. Paginação explícita: nem token nem resultado/áudio são listados.
CREATE FUNCTION public.aue_v2_listar_meus_duelos(p_deslocamento integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_resultado jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  IF p_deslocamento IS NULL OR p_deslocamento < 0 THEN RAISE EXCEPTION 'Página inválida' USING ERRCODE = '22023'; END IF;
  WITH pagina AS (
    SELECT d.id, d.criado_em, d.expira_em, d.versao_token, d.revogado_em, d.respondido_em,
      EXISTS (SELECT 1 FROM aue_privado.gravacoes_v2 g JOIN storage.objects o
        ON o.bucket_id = 'duelos_v2' AND o.name = g.caminho
        WHERE g.id = d.gravacao_criador_id AND g.exclusao_solicitada_em IS NULL AND g.oculta_por_denuncia_em IS NULL)
      AND (d.respondido_em IS NULL OR EXISTS (SELECT 1 FROM aue_privado.gravacoes_v2 g JOIN storage.objects o
        ON o.bucket_id = 'duelos_v2' AND o.name = g.caminho
        WHERE g.id = d.gravacao_resposta_id AND g.exclusao_solicitada_em IS NULL AND g.oculta_por_denuncia_em IS NULL)) AS disponivel,
      CASE WHEN d.criador_id = v_uid THEN d.gravacao_criador_id ELSE d.gravacao_resposta_id END AS gravacao_propria_id,
      CASE WHEN d.criador_id = v_uid THEN 'criador' ELSE 'desafiante' END AS lado
    FROM aue_privado.duelos_v2 d WHERE d.criador_id = v_uid OR d.desafiante_id = v_uid
    ORDER BY d.criado_em DESC, d.id DESC LIMIT 51 OFFSET p_deslocamento
  ), numerados AS (
    SELECT *, row_number() OVER (ORDER BY criado_em DESC, id DESC) AS pos FROM pagina
  )
  SELECT jsonb_build_object('itens', coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'gravacao_propria_id', gravacao_propria_id, 'lado', lado,
      'estado', CASE WHEN NOT disponivel THEN 'indisponivel' WHEN respondido_em IS NOT NULL THEN 'respondido' WHEN revogado_em IS NOT NULL THEN 'revogado'
        WHEN expira_em <= now() THEN 'expirado' ELSE 'aguardando_resposta' END,
      'versao', versao_token, 'prazo', expira_em) ORDER BY criado_em DESC, id DESC) FILTER (WHERE pos <= 50), '[]'::jsonb),
    'tem_mais', coalesce(bool_or(pos > 50), false)) INTO v_resultado FROM numerados;
  RETURN v_resultado;
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_listar_meus_duelos(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_listar_meus_duelos(integer) TO authenticated;

-- Duelo v2 isolado dos links e do bucket antigos. Não aplica esta migration em
-- produção sem comparar drift, testar RLS/Storage e revisar privacidade.
-- BLOQUEIA LANÇAMENTO: falta validar o fluxo de exclusão e moderação pela API
-- real do Storage, proteger abuso e comprovar os contratos em staging.
-- As métricas são declarações do cliente: não provam autenticidade do áudio.
CREATE SCHEMA IF NOT EXISTS aue_privado;
REVOKE ALL ON SCHEMA aue_privado FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA aue_privado TO authenticated;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE aue_privado.gravacoes_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id),
  caminho text NOT NULL UNIQUE,
  estado text NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente', 'confirmada')),
  duracao_ms integer CHECK (duracao_ms BETWEEN 100 AND 10500),
  versao_regua text CHECK (versao_regua = 'experimental-2'),
  criado_em timestamptz NOT NULL DEFAULT now(),
  confirmado_em timestamptz,
  exclusao_solicitada_em timestamptz,
  removida_em timestamptz,
  oculta_por_denuncia_em timestamptz,
  CHECK (removida_em IS NULL OR exclusao_solicitada_em IS NOT NULL),
  CHECK ((estado = 'pendente' AND duracao_ms IS NULL AND versao_regua IS NULL AND confirmado_em IS NULL)
      OR (estado = 'confirmada' AND duracao_ms IS NOT NULL AND versao_regua IS NOT NULL AND confirmado_em IS NOT NULL))
);
CREATE TABLE aue_privado.duelos_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
  criador_id uuid NOT NULL REFERENCES auth.users(id),
  gravacao_criador_id uuid NOT NULL UNIQUE REFERENCES aue_privado.gravacoes_v2(id),
  desafiante_id uuid REFERENCES auth.users(id),
  gravacao_resposta_id uuid REFERENCES aue_privado.gravacoes_v2(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  respondido_em timestamptz,
  CHECK ((desafiante_id IS NULL AND gravacao_resposta_id IS NULL AND respondido_em IS NULL)
      OR (desafiante_id IS NOT NULL AND desafiante_id <> criador_id AND gravacao_resposta_id IS NOT NULL AND respondido_em IS NOT NULL))
);
-- Denúncias são privadas; só o outro participante de um duelo encerrado pode
-- registrar uma queixa. O som fica em quarentena até análise autorizada.
CREATE TABLE aue_privado.denuncias_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duelo_id uuid NOT NULL REFERENCES aue_privado.duelos_v2(id),
  gravacao_id uuid NOT NULL REFERENCES aue_privado.gravacoes_v2(id),
  denunciante_id uuid NOT NULL REFERENCES auth.users(id),
  motivo text NOT NULL CHECK (motivo IN ('ofensivo', 'outro')),
  estado text NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente', 'mantida', 'restaurada')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  moderador_id uuid REFERENCES auth.users(id),
  moderado_em timestamptz,
  UNIQUE (duelo_id, gravacao_id, denunciante_id),
  CHECK ((estado = 'pendente' AND moderador_id IS NULL AND moderado_em IS NULL)
      OR (estado <> 'pendente' AND moderador_id IS NOT NULL AND moderado_em IS NOT NULL))
);
ALTER TABLE aue_privado.denuncias_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aue_privado.denuncias_v2 FROM PUBLIC, anon, authenticated;

ALTER TABLE aue_privado.gravacoes_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE aue_privado.duelos_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aue_privado.gravacoes_v2, aue_privado.duelos_v2 FROM PUBLIC, anon, authenticated;

-- Bucket deve ser criado/configurado pela Storage API antes da migration.
-- SQL apenas consulta metadados: nunca cria nem apaga objetos no Storage.
-- Ausência, colisão ou configuração divergente interrompem a aplicação.
DO $$
DECLARE v_bucket storage.buckets%ROWTYPE;
BEGIN
  SELECT * INTO v_bucket FROM storage.buckets WHERE id = 'duelos_v2';
  IF NOT FOUND OR v_bucket.name IS DISTINCT FROM 'duelos_v2'
     OR v_bucket.public IS DISTINCT FROM false
     OR v_bucket.file_size_limit IS DISTINCT FROM 5242880
     OR v_bucket.allowed_mime_types IS DISTINCT FROM ARRAY['audio/wav']::text[] THEN
    RAISE EXCEPTION 'Bucket duelos_v2 ausente ou configuração divergente: provisionar pela API Storage';
  END IF;
END;
$$;

-- O lock compartilha a transação de INSERT de metadados com a solicitação de
-- exclusão, evitando upload aceito após a gravação entrar em remoção.
CREATE FUNCTION aue_privado.pode_enviar_audio_v2(p_caminho text) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  PERFORM 1 FROM aue_privado.gravacoes_v2 g
   WHERE g.usuario_id = auth.uid() AND g.caminho = p_caminho AND g.estado = 'pendente'
     AND g.exclusao_solicitada_em IS NULL AND g.oculta_por_denuncia_em IS NULL
   FOR UPDATE;
  RETURN FOUND;
END;
$$;
CREATE FUNCTION aue_privado.pode_ler_audio_v2(p_caminho text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM aue_privado.gravacoes_v2 g
    WHERE g.caminho = p_caminho
      AND g.exclusao_solicitada_em IS NULL AND g.oculta_por_denuncia_em IS NULL
      AND (
        g.usuario_id = auth.uid() OR EXISTS (
          SELECT 1 FROM aue_privado.duelos_v2 d
          WHERE d.respondido_em IS NOT NULL
            AND auth.uid() IN (d.criador_id, d.desafiante_id)
            AND g.id IN (d.gravacao_criador_id, d.gravacao_resposta_id)
        )
      )
  );
$$;
-- Storage.remove exige SELECT e DELETE. Após a solicitação, o SELECT do dono
-- vale exclusivamente durante a operação de exclusão; nunca para baixar/listar.
-- Moderadores autorizados podem revisar apenas gravações denunciadas que
-- ainda não têm exclusão solicitada. O acesso não divulga convites nem áudios
-- de pessoas que não foram denunciadas.
CREATE FUNCTION aue_privado.pode_revisar_audio_v2(p_caminho text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND public.aue_e_administrador() AND EXISTS (
    SELECT 1 FROM aue_privado.gravacoes_v2 g
    WHERE g.caminho = p_caminho AND g.exclusao_solicitada_em IS NULL
      AND EXISTS (SELECT 1 FROM aue_privado.denuncias_v2 d
                  WHERE d.gravacao_id = g.id AND d.estado IN ('pendente', 'mantida'))
  );
$$;
CREATE FUNCTION aue_privado.pode_remover_audio_v2(p_caminho text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM aue_privado.gravacoes_v2 g
    WHERE g.caminho = p_caminho AND g.usuario_id = auth.uid()
      AND g.exclusao_solicitada_em IS NOT NULL AND g.removida_em IS NULL
  );
$$;
REVOKE ALL ON FUNCTION aue_privado.pode_enviar_audio_v2(text), aue_privado.pode_ler_audio_v2(text), aue_privado.pode_remover_audio_v2(text), aue_privado.pode_revisar_audio_v2(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION aue_privado.pode_enviar_audio_v2(text), aue_privado.pode_ler_audio_v2(text), aue_privado.pode_remover_audio_v2(text), aue_privado.pode_revisar_audio_v2(text) TO authenticated;
CREATE POLICY duelos_v2_inserir ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'duelos_v2'
  AND storage.allow_any_operation(ARRAY['object.upload'])
  AND aue_privado.pode_enviar_audio_v2(name));
CREATE POLICY duelos_v2_ler ON storage.objects FOR SELECT TO authenticated
-- A entrega de áudio só acontece pela Edge autenticada. Não abrir GET direto
-- nem por uma migration intermediária: o projeto pode receber requisições já.
USING (bucket_id = 'duelos_v2'
  AND storage.allow_any_operation(ARRAY['object.delete', 'object.delete_many'])
  AND aue_privado.pode_remover_audio_v2(name));
CREATE POLICY duelos_v2_remover ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'duelos_v2' AND aue_privado.pode_remover_audio_v2(name));

-- O caminho nasce no servidor. O cliente só recebe o caminho da própria
-- gravação pendente e não pode trocar a propriedade ou sobrescrever o objeto.
CREATE FUNCTION public.aue_v2_preparar_gravacao() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid := gen_random_uuid(); v_caminho text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  IF (SELECT count(*) FROM aue_privado.gravacoes_v2 WHERE usuario_id = v_uid AND criado_em > now() - interval '1 day') >= 100 THEN
    RAISE EXCEPTION 'Limite de gravações atingido' USING ERRCODE = '54000';
  END IF;
  v_caminho := v_uid::text || '/' || v_id::text || '.wav';
  INSERT INTO aue_privado.gravacoes_v2(id, usuario_id, caminho) VALUES (v_id, v_uid, v_caminho);
  RETURN jsonb_build_object('id', v_id, 'bucket', 'duelos_v2', 'caminho', v_caminho);
END;
$$;

-- A confirmação só significa que existe um objeto no bucket. A duração é
-- declarada pelo cliente; não é validação acústica nem antifraude.
CREATE FUNCTION public.aue_v2_confirmar_gravacao(p_id uuid, p_duracao_ms integer, p_versao_regua text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_g aue_privado.gravacoes_v2%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  IF p_duracao_ms IS NULL OR p_duracao_ms NOT BETWEEN 100 AND 10500 OR p_versao_regua IS DISTINCT FROM 'experimental-2' THEN
    RAISE EXCEPTION 'Medição inválida' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_g FROM aue_privado.gravacoes_v2 WHERE id = p_id AND usuario_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gravação indisponível' USING ERRCODE = '42501'; END IF;
  IF v_g.exclusao_solicitada_em IS NOT NULL OR v_g.oculta_por_denuncia_em IS NOT NULL THEN
    RAISE EXCEPTION 'Gravação indisponível' USING ERRCODE = '42501';
  END IF;
  IF v_g.estado = 'confirmada' THEN
    IF v_g.duracao_ms IS DISTINCT FROM p_duracao_ms OR v_g.versao_regua IS DISTINCT FROM p_versao_regua THEN
      RAISE EXCEPTION 'Gravação já confirmada' USING ERRCODE = '22023';
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'duelos_v2' AND name = v_g.caminho) THEN
      RAISE EXCEPTION 'Áudio ainda não enviado' USING ERRCODE = '22023';
    END IF;
    UPDATE aue_privado.gravacoes_v2 SET estado = 'confirmada', duracao_ms = p_duracao_ms,
      versao_regua = p_versao_regua, confirmado_em = now() WHERE id = p_id;
  END IF;
  RETURN jsonb_build_object('id', p_id, 'estado', 'confirmada');
END;
$$;

CREATE FUNCTION public.aue_v2_criar_duelo(p_gravacao_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_token text; v_duelo uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  -- Concorre com exclusão/denúncia usando o mesmo lock da gravação.
  PERFORM 1 FROM aue_privado.gravacoes_v2 g JOIN storage.objects o ON o.bucket_id = 'duelos_v2' AND o.name = g.caminho
    WHERE g.id = p_gravacao_id AND g.usuario_id = v_uid AND g.estado = 'confirmada'
      AND g.exclusao_solicitada_em IS NULL AND g.oculta_por_denuncia_em IS NULL FOR SHARE OF g;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gravação indisponível' USING ERRCODE = '42501'; END IF;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO aue_privado.duelos_v2(token_hash, criador_id, gravacao_criador_id)
    VALUES (extensions.digest(v_token, 'sha256'), v_uid, p_gravacao_id) RETURNING id INTO v_duelo;
  RETURN jsonb_build_object('token', v_token, 'prazo', now() + interval '7 days');
END;
$$;

-- Consulta prévia nunca devolve marca, áudio, identificadores ou nome do autor.
-- O token é uma credencial de convite; proteger logs, analytics e Referer.
-- Uma gravação só cria um duelo. Retry após perda do token exige fluxo de
-- revogação/reemissão ainda não implementado; não prometer recuperação.
CREATE FUNCTION public.aue_v2_abrir_duelo(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_d aue_privado.duelos_v2%ROWTYPE;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  SELECT * INTO v_d FROM aue_privado.duelos_v2 WHERE token_hash = extensions.digest(p_token, 'sha256');
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  IF NOT EXISTS (SELECT 1 FROM aue_privado.gravacoes_v2 g JOIN storage.objects o ON o.bucket_id = 'duelos_v2' AND o.name = g.caminho
                 WHERE g.id = v_d.gravacao_criador_id AND g.exclusao_solicitada_em IS NULL AND g.oculta_por_denuncia_em IS NULL) THEN
    RETURN jsonb_build_object('estado', 'indisponivel');
  END IF;
  IF v_d.respondido_em IS NOT NULL THEN RETURN jsonb_build_object('estado', 'respondido'); END IF;
  IF v_d.expira_em <= now() THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  RETURN jsonb_build_object('estado', 'aguardando_resposta', 'categoria', 'duracao');
END;
$$;

-- FOR UPDATE serializa duas respostas simultâneas; retry da mesma gravação pelo
-- mesmo participante é idempotente. O criador jamais ocupa o lado convidado.
CREATE FUNCTION public.aue_v2_responder_duelo(p_token text, p_gravacao_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_d aue_privado.duelos_v2%ROWTYPE; v_regua text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  SELECT * INTO v_d FROM aue_privado.duelos_v2 WHERE token_hash = extensions.digest(p_token, 'sha256') FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  IF v_d.criador_id = v_uid THEN RETURN jsonb_build_object('estado', 'criador'); END IF;
  IF v_d.respondido_em IS NOT NULL THEN
    IF v_d.desafiante_id = v_uid AND v_d.gravacao_resposta_id = p_gravacao_id THEN RETURN jsonb_build_object('estado', 'respondido'); END IF;
    RETURN jsonb_build_object('estado', 'ocupado');
  END IF;
  IF v_d.expira_em <= now() THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  -- Ordem: duelo, áudio do criador, áudio do respondente. Solicitar exclusão
  -- só trava a gravação; assim não toma o lock de duelo em ordem inversa.
  PERFORM 1 FROM aue_privado.gravacoes_v2 g JOIN storage.objects o ON o.bucket_id = 'duelos_v2' AND o.name = g.caminho
    WHERE g.id = v_d.gravacao_criador_id AND g.exclusao_solicitada_em IS NULL
      AND g.oculta_por_denuncia_em IS NULL FOR SHARE OF g;
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  SELECT g.versao_regua INTO v_regua FROM aue_privado.gravacoes_v2 g JOIN storage.objects o ON o.bucket_id = 'duelos_v2' AND o.name = g.caminho
  WHERE g.id = p_gravacao_id AND g.usuario_id = v_uid AND g.estado = 'confirmada'
    AND g.exclusao_solicitada_em IS NULL AND g.oculta_por_denuncia_em IS NULL FOR SHARE OF g;
  IF v_regua IS NULL THEN RAISE EXCEPTION 'Gravação indisponível' USING ERRCODE = '42501'; END IF;
  IF v_regua IS DISTINCT FROM (SELECT versao_regua FROM aue_privado.gravacoes_v2 WHERE id = v_d.gravacao_criador_id) THEN
    RAISE EXCEPTION 'Réguas diferentes' USING ERRCODE = '22023';
  END IF;
  UPDATE aue_privado.duelos_v2 SET desafiante_id = v_uid, gravacao_resposta_id = p_gravacao_id, respondido_em = now() WHERE id = v_d.id;
  RETURN jsonb_build_object('estado', 'respondido');
END;
$$;

-- O prazo limita apenas novas respostas: o resultado fechado permanece acessível
-- aos participantes enquanto suas sessões continuarem válidas.
-- Só os dois participantes autenticados recebem caminhos e marcas; conhecer
-- o convite não concede a um terceiro acesso depois da resposta.
CREATE FUNCTION public.aue_v2_revelar_duelo(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_d aue_privado.duelos_v2%ROWTYPE; v_a aue_privado.gravacoes_v2%ROWTYPE; v_b aue_privado.gravacoes_v2%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  SELECT * INTO v_d FROM aue_privado.duelos_v2 WHERE token_hash = extensions.digest(p_token, 'sha256') AND respondido_em IS NOT NULL
    AND v_uid IN (criador_id, desafiante_id);
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  SELECT * INTO v_a FROM aue_privado.gravacoes_v2 WHERE id = v_d.gravacao_criador_id;
  SELECT * INTO v_b FROM aue_privado.gravacoes_v2 WHERE id = v_d.gravacao_resposta_id;
  IF v_a.exclusao_solicitada_em IS NOT NULL OR v_b.exclusao_solicitada_em IS NOT NULL
     OR v_a.oculta_por_denuncia_em IS NOT NULL OR v_b.oculta_por_denuncia_em IS NOT NULL
     OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'duelos_v2' AND name = v_a.caminho)
     OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'duelos_v2' AND name = v_b.caminho) THEN
    RETURN jsonb_build_object('estado', 'indisponivel');
  END IF;
  RETURN jsonb_build_object('estado', 'revelado', 'bucket', 'duelos_v2',
    'criador', jsonb_build_object('duracao_ms', v_a.duracao_ms, 'caminho', v_a.caminho),
    'desafiante', jsonb_build_object('duracao_ms', v_b.duracao_ms, 'caminho', v_b.caminho),
    'resultado_provisorio', CASE WHEN v_a.duracao_ms > v_b.duracao_ms THEN 'criador' WHEN v_b.duracao_ms > v_a.duracao_ms THEN 'desafiante' ELSE 'empate' END,
    'versao_regua', v_a.versao_regua, 'origem_medicao', 'cliente_nao_verificada');
END;
$$;

-- Exclusão em duas fases: a primeira revoga leitura e autoriza apenas a
-- operação Storage.remove do dono. Jamais apagar storage.objects via SQL.
CREATE FUNCTION public.aue_v2_solicitar_exclusao(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_g aue_privado.gravacoes_v2%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_g FROM aue_privado.gravacoes_v2
    WHERE id = p_id AND usuario_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gravação indisponível' USING ERRCODE = '42501'; END IF;
  IF v_g.removida_em IS NOT NULL THEN RETURN jsonb_build_object('estado', 'removida'); END IF;
  UPDATE aue_privado.gravacoes_v2
     SET exclusao_solicitada_em = coalesce(exclusao_solicitada_em, now()) WHERE id = v_g.id;
  RETURN jsonb_build_object('estado', 'remocao_pendente', 'bucket', 'duelos_v2', 'caminho', v_g.caminho);
END;
$$;

-- Ausência no catálogo não comprova resposta da API. Até a rotina de serviço
-- registrar evidência, a solicitação permanece pendente.
CREATE FUNCTION public.aue_v2_confirmar_exclusao(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_g aue_privado.gravacoes_v2%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_g FROM aue_privado.gravacoes_v2 WHERE id = p_id AND usuario_id = v_uid FOR UPDATE;
  IF NOT FOUND OR v_g.exclusao_solicitada_em IS NULL THEN RAISE EXCEPTION 'Gravação indisponível' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object('estado', 'remocao_pendente');
END;
$$;

-- Recupera trabalho interrompido após reload, sempre limitado ao dono.
CREATE FUNCTION public.aue_v2_exclusoes_pendentes() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_itens jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'bucket', 'duelos_v2', 'caminho', g.caminho)), '[]'::jsonb)
    INTO v_itens FROM aue_privado.gravacoes_v2 g
   WHERE g.usuario_id = v_uid AND g.exclusao_solicitada_em IS NOT NULL AND g.removida_em IS NULL;
  RETURN v_itens;
END;
$$;

-- O denunciante só pode reportar o som do outro participante depois da
-- revelação. O bloqueio ocorre na mesma transação em que a queixa é registrada.
CREATE FUNCTION public.aue_v2_denunciar_audio(p_token text, p_alvo text, p_motivo text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_d aue_privado.duelos_v2%ROWTYPE; v_g_id uuid; v_denuncia_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE = '42501'; END IF;
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' OR p_alvo IS NULL OR p_alvo NOT IN ('criador', 'desafiante')
     OR p_motivo IS NULL OR p_motivo NOT IN ('ofensivo', 'outro') THEN
    RETURN jsonb_build_object('estado', 'indisponivel');
  END IF;
  SELECT * INTO v_d FROM aue_privado.duelos_v2 WHERE token_hash = extensions.digest(p_token, 'sha256')
    AND respondido_em IS NOT NULL AND v_uid IN (criador_id, desafiante_id) FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('estado', 'indisponivel'); END IF;
  IF (p_alvo = 'criador' AND v_uid <> v_d.desafiante_id) OR
     (p_alvo = 'desafiante' AND v_uid <> v_d.criador_id) THEN
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

-- Apenas equipe autorizada vê fila e caminho de áudio denunciado; excluir
-- solicitado sempre prevalece e omite o arquivo inclusive da moderação.
CREATE FUNCTION public.aue_v2_listar_denuncias(p_estado text DEFAULT 'pendente') RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_resultado jsonb;
BEGIN
  IF auth.uid() IS NULL OR public.aue_e_administrador() IS DISTINCT FROM true THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501'; END IF;
  IF p_estado IS NULL OR p_estado NOT IN ('pendente', 'mantida', 'restaurada') THEN RAISE EXCEPTION 'Estado inválido' USING ERRCODE = '22023'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'motivo', d.motivo, 'estado', d.estado,
           'criado_em', d.criado_em, 'bucket', CASE WHEN g.exclusao_solicitada_em IS NULL THEN 'duelos_v2' ELSE NULL END,
           'caminho', CASE WHEN g.exclusao_solicitada_em IS NULL THEN g.caminho ELSE NULL END)
           ORDER BY d.criado_em), '[]'::jsonb) INTO v_resultado
    FROM aue_privado.denuncias_v2 d JOIN aue_privado.gravacoes_v2 g ON g.id = d.gravacao_id WHERE d.estado = p_estado;
  RETURN v_resultado;
END;
$$;

-- A alteração só é possível para administradores reais do Auê; cada decisão
-- preserva registro separado, inclusive quando uma revisão anterior mudar.
CREATE TABLE aue_privado.decisoes_moderacao_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denuncia_id uuid NOT NULL REFERENCES aue_privado.denuncias_v2(id),
  moderador_id uuid NOT NULL REFERENCES auth.users(id),
  decisao text NOT NULL CHECK (decisao IN ('mantida', 'restaurada')),
  criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aue_privado.decisoes_moderacao_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aue_privado.decisoes_moderacao_v2 FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.aue_v2_moderar_denuncia(p_id uuid, p_decisao text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_d aue_privado.denuncias_v2%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR public.aue_e_administrador() IS DISTINCT FROM true THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501'; END IF;
  IF p_decisao IS NULL OR p_decisao NOT IN ('mantida', 'restaurada') THEN RAISE EXCEPTION 'Decisão inválida' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_d FROM aue_privado.denuncias_v2 WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Denúncia indisponível' USING ERRCODE = '42501'; END IF;
  PERFORM 1 FROM aue_privado.gravacoes_v2 WHERE id = v_d.gravacao_id FOR UPDATE;
  IF v_d.estado <> p_decisao THEN
    UPDATE aue_privado.denuncias_v2 SET estado = p_decisao, moderador_id = v_uid, moderado_em = now() WHERE id = p_id;
    INSERT INTO aue_privado.decisoes_moderacao_v2(denuncia_id, moderador_id, decisao) VALUES (p_id, v_uid, p_decisao);
  END IF;
  IF p_decisao = 'mantida' OR EXISTS (SELECT 1 FROM aue_privado.denuncias_v2 d WHERE d.gravacao_id = v_d.gravacao_id AND d.estado IN ('pendente', 'mantida')) THEN
    UPDATE aue_privado.gravacoes_v2 SET oculta_por_denuncia_em = coalesce(oculta_por_denuncia_em, now()) WHERE id = v_d.gravacao_id;
  ELSE
    UPDATE aue_privado.gravacoes_v2 SET oculta_por_denuncia_em = NULL WHERE id = v_d.gravacao_id;
  END IF;
  RETURN jsonb_build_object('estado', p_decisao);
END;
$$;

REVOKE ALL ON FUNCTION public.aue_v2_preparar_gravacao(), public.aue_v2_confirmar_gravacao(uuid,integer,text),
  public.aue_v2_criar_duelo(uuid), public.aue_v2_abrir_duelo(text), public.aue_v2_responder_duelo(text,uuid), public.aue_v2_revelar_duelo(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_abrir_duelo(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_preparar_gravacao(), public.aue_v2_confirmar_gravacao(uuid,integer,text),
  public.aue_v2_criar_duelo(uuid), public.aue_v2_responder_duelo(text,uuid), public.aue_v2_revelar_duelo(text) TO authenticated;

REVOKE ALL ON FUNCTION public.aue_v2_solicitar_exclusao(uuid), public.aue_v2_confirmar_exclusao(uuid),
  public.aue_v2_exclusoes_pendentes(), public.aue_v2_denunciar_audio(text,text,text),
  public.aue_v2_listar_denuncias(text), public.aue_v2_moderar_denuncia(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_solicitar_exclusao(uuid), public.aue_v2_confirmar_exclusao(uuid),
  public.aue_v2_exclusoes_pendentes(), public.aue_v2_denunciar_audio(text,text,text),
  public.aue_v2_listar_denuncias(text), public.aue_v2_moderar_denuncia(uuid,text) TO authenticated;

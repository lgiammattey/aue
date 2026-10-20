-- =============================================================================
-- 20261020063849 — Anexos livres na conversa de comunidades
--
-- Um tópico ou resposta pode ter, no máximo, um anexo: imagem/GIF, áudio livre
-- de até 60 s ou vídeo externo seguro (YouTube/TikTok). Vídeo e documento nunca
-- entram no Storage. O bucket continua privado: o navegador pede URL assinada.
-- =============================================================================

SET LOCAL lock_timeout = '5s';

-- -----------------------------------------------------------------------------
-- 1. Metadados: um anexo por item, sem URL pública gravada
-- -----------------------------------------------------------------------------

ALTER TABLE public.topicos
  ADD COLUMN IF NOT EXISTS anexo_tipo text,
  ADD COLUMN IF NOT EXISTS anexo_caminho text,
  ADD COLUMN IF NOT EXISTS anexo_mime text,
  ADD COLUMN IF NOT EXISTS anexo_tamanho_bytes integer,
  ADD COLUMN IF NOT EXISTS anexo_duracao_ms integer,
  ADD COLUMN IF NOT EXISTS video_externo_url text;

ALTER TABLE public.respostas
  ADD COLUMN IF NOT EXISTS anexo_tipo text,
  ADD COLUMN IF NOT EXISTS anexo_caminho text,
  ADD COLUMN IF NOT EXISTS anexo_mime text,
  ADD COLUMN IF NOT EXISTS anexo_tamanho_bytes integer,
  ADD COLUMN IF NOT EXISTS anexo_duracao_ms integer,
  ADD COLUMN IF NOT EXISTS video_externo_url text;

ALTER TABLE public.topicos
  DROP CONSTRAINT IF EXISTS topicos_anexo_valido;
ALTER TABLE public.respostas
  DROP CONSTRAINT IF EXISTS respostas_anexo_valido;

-- O formato e os limites estão aqui também, não apenas no cliente. Para mídia
-- hospedada, o caminho tem dono e UUID aleatório; não há URL pública persistida.
ALTER TABLE public.topicos ADD CONSTRAINT topicos_anexo_valido CHECK (
  (anexo_tipo IS NULL AND anexo_caminho IS NULL AND anexo_mime IS NULL
    AND anexo_tamanho_bytes IS NULL AND anexo_duracao_ms IS NULL AND video_externo_url IS NULL)
  OR (anexo_tipo = 'imagem' AND anexo_caminho ~ '^[0-9a-f-]{36}/forum/[0-9a-f-]{36}\.(jpg|png|webp|gif)$'
      AND anexo_mime IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')
      AND anexo_tamanho_bytes BETWEEN 1 AND 8388608
      AND anexo_duracao_ms IS NULL AND video_externo_url IS NULL)
  OR (anexo_tipo = 'audio' AND anexo_caminho ~ '^[0-9a-f-]{36}/forum/[0-9a-f-]{36}\.(webm|ogg|m4a|mp3)$'
      AND anexo_mime IN ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg')
      AND anexo_tamanho_bytes BETWEEN 1 AND 10485760
      AND anexo_duracao_ms BETWEEN 1 AND 60000 AND video_externo_url IS NULL)
  OR (anexo_tipo = 'video_externo' AND anexo_caminho IS NULL AND anexo_mime IS NULL
      AND anexo_tamanho_bytes IS NULL AND anexo_duracao_ms IS NULL
      AND video_externo_url IS NOT NULL)
);

ALTER TABLE public.respostas ADD CONSTRAINT respostas_anexo_valido CHECK (
  (anexo_tipo IS NULL AND anexo_caminho IS NULL AND anexo_mime IS NULL
    AND anexo_tamanho_bytes IS NULL AND anexo_duracao_ms IS NULL AND video_externo_url IS NULL)
  OR (anexo_tipo = 'imagem' AND anexo_caminho ~ '^[0-9a-f-]{36}/forum/[0-9a-f-]{36}\.(jpg|png|webp|gif)$'
      AND anexo_mime IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')
      AND anexo_tamanho_bytes BETWEEN 1 AND 8388608
      AND anexo_duracao_ms IS NULL AND video_externo_url IS NULL)
  OR (anexo_tipo = 'audio' AND anexo_caminho ~ '^[0-9a-f-]{36}/forum/[0-9a-f-]{36}\.(webm|ogg|m4a|mp3)$'
      AND anexo_mime IN ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg')
      AND anexo_tamanho_bytes BETWEEN 1 AND 10485760
      AND anexo_duracao_ms BETWEEN 1 AND 60000 AND video_externo_url IS NULL)
  OR (anexo_tipo = 'video_externo' AND anexo_caminho IS NULL AND anexo_mime IS NULL
      AND anexo_tamanho_bytes IS NULL AND anexo_duracao_ms IS NULL
      AND video_externo_url IS NOT NULL)
);

-- Resposta só de mídia é legítima. A RPC ainda recusa texto E anexo vazios.
ALTER TABLE public.respostas DROP CONSTRAINT IF EXISTS respostas_corpo_tamanho;
ALTER TABLE public.respostas ADD CONSTRAINT respostas_corpo_tamanho
  CHECK (char_length(corpo) <= 180);

-- -----------------------------------------------------------------------------
-- 2. Bucket privado e policies mínimas
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'anexos_do_forum', 'anexos_do_forum', false, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.aue_anexo_do_forum_publicado(p_caminho text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.topicos t
     WHERE t.anexo_caminho = p_caminho
       AND t.status IN ('aberto', 'fechado')
       AND public.aue_e_conta_promovida(t.autor_id)
    UNION ALL
    SELECT 1 FROM public.respostas r
      JOIN public.topicos t ON t.id = r.topico_id
     WHERE r.anexo_caminho = p_caminho
       AND r.status = 'visivel' AND t.status IN ('aberto', 'fechado')
       AND public.aue_e_conta_promovida(r.autor_id)
       AND public.aue_e_conta_promovida(t.autor_id)
  );
$$;

DROP POLICY IF EXISTS anexos_do_forum_inserir_proprio ON storage.objects;
CREATE POLICY anexos_do_forum_inserir_proprio ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'anexos_do_forum'
  AND public.aue_e_conta_promovida(auth.uid())
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[2] = 'forum'
  AND array_length(storage.foldername(name), 1) = 2
);

-- Um rascunho órfão pode ser limpo pelo dono; depois de publicado, a mídia não
-- pode sumir silenciosamente de uma conversa.
DROP POLICY IF EXISTS anexos_do_forum_apagar_rascunho_proprio ON storage.objects;
CREATE POLICY anexos_do_forum_apagar_rascunho_proprio ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'anexos_do_forum'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT public.aue_anexo_do_forum_publicado(name)
);

-- Bucket privado não equivale a segredo: o objeto só pode ser assinado/lido se
-- estiver numa conversa pública, ou se ainda for rascunho do próprio autor.
DROP POLICY IF EXISTS anexos_do_forum_ler_publicado_ou_proprio ON storage.objects;
CREATE POLICY anexos_do_forum_ler_publicado_ou_proprio ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'anexos_do_forum'
  AND (public.aue_anexo_do_forum_publicado(name)
       OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text))
);

-- Não há UPDATE: upload é imutável e o caminho UUID não é sobrescrito.

-- -----------------------------------------------------------------------------
-- 3. Normalização de vídeo externo e validação de objeto do Storage
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.aue_url_video_externo_canonica(p_url text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp AS $$
DECLARE v text := btrim(coalesce(p_url, '')); v_match text[];
BEGIN
  v_match := regexp_match(v, '^https://(?:www\\.)?youtube\\.com/watch\\?v=([A-Za-z0-9_-]{11})(?:&[^#[:space:]]*)?$', 'i');
  IF v_match IS NOT NULL THEN RETURN 'https://www.youtube.com/watch?v=' || v_match[1]; END IF;
  v_match := regexp_match(v, '^https://youtu\\.be/([A-Za-z0-9_-]{11})(?:\\?[^#[:space:]]*)?$', 'i');
  IF v_match IS NOT NULL THEN RETURN 'https://www.youtube.com/watch?v=' || v_match[1]; END IF;
  v_match := regexp_match(v, '^https://(?:www\\.)?youtube\\.com/shorts/([A-Za-z0-9_-]{11})(?:\\?[^#[:space:]]*)?$', 'i');
  IF v_match IS NOT NULL THEN RETURN 'https://www.youtube.com/watch?v=' || v_match[1]; END IF;
  v_match := regexp_match(v, '^https://(?:www\\.)?tiktok\\.com/(@[A-Za-z0-9._-]{1,24})/video/([0-9]{10,25})(?:\\?[^#[:space:]]*)?$', 'i');
  IF v_match IS NOT NULL THEN RETURN 'https://www.tiktok.com/' || v_match[1] || '/video/' || v_match[2]; END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.aue_validar_anexo_do_forum(
  p_tipo text, p_caminho text, p_mime text, p_tamanho_bytes integer,
  p_duracao_ms integer, p_url_video text
) RETURNS TABLE(tipo text, caminho text, mime text, tamanho_bytes integer, duracao_ms integer, url_video text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_tipo text := nullif(btrim(coalesce(p_tipo, '')), ''); v_caminho text := nullif(btrim(coalesce(p_caminho, '')), '');
  v_mime text := lower(nullif(btrim(coalesce(p_mime, '')), '')); v_url text;
  v_mime_do_objeto text; v_tamanho_do_objeto integer;
BEGIN
  IF v_tipo IS NULL THEN
    IF v_caminho IS NOT NULL OR v_mime IS NOT NULL OR p_tamanho_bytes IS NOT NULL OR p_duracao_ms IS NOT NULL OR nullif(btrim(coalesce(p_url_video, '')), '') IS NOT NULL THEN
      PERFORM public.aue_falhar_conversa('22023', 'Anexo incompleto', 'anexo_invalido');
    END IF;
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, NULL::integer, NULL::integer, NULL::text;
    RETURN;
  END IF;
  IF v_tipo = 'video_externo' THEN
    v_url := public.aue_url_video_externo_canonica(p_url_video);
    IF v_url IS NULL OR v_caminho IS NOT NULL OR v_mime IS NOT NULL OR p_tamanho_bytes IS NOT NULL OR p_duracao_ms IS NOT NULL THEN
      PERFORM public.aue_falhar_conversa('22023', 'Link de vídeo inválido', 'anexo_invalido');
    END IF;
    RETURN QUERY SELECT v_tipo, NULL::text, NULL::text, NULL::integer, NULL::integer, v_url;
    RETURN;
  END IF;
  IF v_tipo NOT IN ('imagem', 'audio') OR v_caminho IS NULL OR p_tamanho_bytes IS NULL THEN
    PERFORM public.aue_falhar_conversa('22023', 'Anexo inválido', 'anexo_invalido');
  END IF;
  IF (storage.foldername(v_caminho))[1] IS DISTINCT FROM auth.uid()::text
     OR (storage.foldername(v_caminho))[2] IS DISTINCT FROM 'forum'
     OR array_length(storage.foldername(v_caminho), 1) <> 2
     OR v_caminho LIKE '%..%' OR v_caminho LIKE '/%' THEN
    PERFORM public.aue_falhar_conversa('42501', 'O anexo não pertence à conta', 'anexo_invalido');
  END IF;
  SELECT lower(o.metadata->>'mimetype'), nullif(o.metadata->>'size', '')::integer
    INTO v_mime_do_objeto, v_tamanho_do_objeto
    FROM storage.objects o WHERE o.bucket_id = 'anexos_do_forum' AND o.name = v_caminho;
  IF NOT FOUND OR v_mime_do_objeto IS DISTINCT FROM v_mime OR v_tamanho_do_objeto IS DISTINCT FROM p_tamanho_bytes THEN
    PERFORM public.aue_falhar_conversa('22023', 'Arquivo do anexo não existe', 'anexo_invalido');
  END IF;
  IF EXISTS (SELECT 1 FROM public.topicos t WHERE t.anexo_caminho = v_caminho UNION ALL SELECT 1 FROM public.respostas r WHERE r.anexo_caminho = v_caminho) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Anexo já está publicado', 'anexo_invalido');
  END IF;
  IF v_tipo = 'imagem' AND v_mime IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif') AND p_tamanho_bytes BETWEEN 1 AND 8388608 AND p_duracao_ms IS NULL
     AND ((v_mime = 'image/jpeg' AND v_caminho LIKE '%.jpg') OR (v_mime = 'image/png' AND v_caminho LIKE '%.png') OR (v_mime = 'image/webp' AND v_caminho LIKE '%.webp') OR (v_mime = 'image/gif' AND v_caminho LIKE '%.gif')) THEN
    RETURN QUERY SELECT v_tipo, v_caminho, v_mime, p_tamanho_bytes, NULL::integer, NULL::text;
  ELSIF v_tipo = 'audio' AND v_mime IN ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg') AND p_tamanho_bytes BETWEEN 1 AND 10485760 AND p_duracao_ms BETWEEN 1 AND 60000
     AND ((v_mime = 'audio/webm' AND v_caminho LIKE '%.webm') OR (v_mime = 'audio/ogg' AND v_caminho LIKE '%.ogg') OR (v_mime = 'audio/mp4' AND v_caminho LIKE '%.m4a') OR (v_mime = 'audio/mpeg' AND v_caminho LIKE '%.mp3')) THEN
    RETURN QUERY SELECT v_tipo, v_caminho, v_mime, p_tamanho_bytes, p_duracao_ms, NULL::text;
  ELSE
    PERFORM public.aue_falhar_conversa('22023', 'Tipo, tamanho ou duração do anexo inválidos', 'anexo_invalido');
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Escritas novas: autor, membro, pai e mídia são todos validados no banco
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.criar_topico_com_anexo(
  p_slug text, p_titulo text, p_corpo text, p_anexo_tipo text DEFAULT NULL,
  p_anexo_caminho text DEFAULT NULL, p_anexo_mime text DEFAULT NULL,
  p_anexo_tamanho_bytes integer DEFAULT NULL, p_anexo_duracao_ms integer DEFAULT NULL,
  p_url_video text DEFAULT NULL
) RETURNS public.topicos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_corpo text := public.aue_aparar_texto(p_corpo); v_titulo text := regexp_replace(public.aue_aparar_texto(p_titulo), '\s+', ' ', 'g');
  v_grupo public.grupos; v_anexo record; v_linha public.topicos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT * INTO v_anexo FROM public.aue_validar_anexo_do_forum(p_anexo_tipo, p_anexo_caminho, p_anexo_mime, p_anexo_tamanho_bytes, p_anexo_duracao_ms, p_url_video);
  IF char_length(v_corpo) > 180 OR (char_length(v_corpo) = 0 AND v_anexo.tipo IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Texto do tópico precisa ter até 180 caracteres ou um anexo', 'corpo_invalido');
  END IF;
  IF char_length(v_titulo) = 0 THEN v_titulo := coalesce(nullif(left(v_corpo, 120), ''), 'Mídia da comunidade'); END IF;
  IF char_length(v_titulo) > 120 THEN PERFORM public.aue_falhar_conversa('22023', 'Título inválido', 'titulo_invalido'); END IF;
  SELECT * INTO v_grupo FROM public.grupos g WHERE lower(g.slug) = lower(btrim(coalesce(p_slug, '')));
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Comunidade não existe', 'comunidade_inexistente'); END IF;
  PERFORM public.aue_exigir_participacao(v_grupo.id);
  INSERT INTO public.topicos (comunidade_id, autor_id, titulo, corpo, anexo_tipo, anexo_caminho, anexo_mime, anexo_tamanho_bytes, anexo_duracao_ms, video_externo_url)
  VALUES (v_grupo.id, auth.uid(), v_titulo, v_corpo, v_anexo.tipo, v_anexo.caminho, v_anexo.mime, v_anexo.tamanho_bytes, v_anexo.duracao_ms, v_anexo.url_video)
  RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

CREATE OR REPLACE FUNCTION public.responder_topico_com_anexo(
  p_topico_id uuid, p_corpo text, p_pai_id uuid DEFAULT NULL, p_anexo_tipo text DEFAULT NULL,
  p_anexo_caminho text DEFAULT NULL, p_anexo_mime text DEFAULT NULL,
  p_anexo_tamanho_bytes integer DEFAULT NULL, p_anexo_duracao_ms integer DEFAULT NULL,
  p_url_video text DEFAULT NULL
) RETURNS public.respostas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_corpo text := public.aue_aparar_texto(p_corpo); v_topico public.topicos; v_pai public.respostas;
  v_nivel smallint := 0; v_anexo record; v_linha public.respostas;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT * INTO v_anexo FROM public.aue_validar_anexo_do_forum(p_anexo_tipo, p_anexo_caminho, p_anexo_mime, p_anexo_tamanho_bytes, p_anexo_duracao_ms, p_url_video);
  IF char_length(v_corpo) > 180 OR (char_length(v_corpo) = 0 AND v_anexo.tipo IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Resposta precisa ter até 180 caracteres ou um anexo', 'resposta_invalida');
  END IF;
  SELECT * INTO v_topico FROM public.topicos t WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado') AND public.aue_e_conta_promovida(t.autor_id) FOR NO KEY UPDATE;
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Tópico não encontrado', 'topico_nao_encontrado'); END IF;
  IF v_topico.status = 'fechado' THEN PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado para respostas', 'topico_fechado'); END IF;
  PERFORM public.aue_exigir_participacao(v_topico.comunidade_id);
  IF p_pai_id IS NOT NULL THEN
    SELECT * INTO v_pai FROM public.respostas r WHERE r.id = p_pai_id AND r.topico_id = v_topico.id AND r.status = 'visivel';
    IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Resposta respondida não existe neste tópico', 'pai_invalido'); END IF;
    v_nivel := least(v_pai.nivel + 1, 2);
  END IF;
  INSERT INTO public.respostas (topico_id, pai_id, nivel, autor_id, corpo, anexo_tipo, anexo_caminho, anexo_mime, anexo_tamanho_bytes, anexo_duracao_ms, video_externo_url)
  VALUES (v_topico.id, p_pai_id, v_nivel, auth.uid(), v_corpo, v_anexo.tipo, v_anexo.caminho, v_anexo.mime, v_anexo.tamanho_bytes, v_anexo.duracao_ms, v_anexo.url_video)
  RETURNING * INTO v_linha;
  UPDATE public.topicos SET ultima_atividade_em = greatest(ultima_atividade_em, v_linha.criado_em) WHERE id = v_topico.id;
  RETURN v_linha;
END;
$$;

-- A rota antiga continua disponível, mas obedece ao teto novo de 180 para que
-- nenhum cliente legado drible o composer atual.
CREATE OR REPLACE FUNCTION public.criar_topico(
  p_slug text, p_titulo text, p_corpo text, p_resultado_id uuid DEFAULT NULL,
  p_consentimento_audio_publico boolean DEFAULT false
) RETURNS public.topicos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_linha public.topicos;
BEGIN
  IF p_resultado_id IS NOT NULL THEN
    PERFORM public.aue_exigir_conta_promovida();
    IF NOT coalesce(p_consentimento_audio_publico, false) OR NOT public.aue_resultado_e_meu(p_resultado_id) THEN
      PERFORM public.aue_falhar_conversa('42501', 'Resultado sem consentimento ou não pertence à conta', 'audio_sem_consentimento');
    END IF;
  END IF;
  SELECT * INTO v_linha FROM public.criar_topico_com_anexo(p_slug, p_titulo, p_corpo);
  IF p_resultado_id IS NOT NULL THEN
    UPDATE public.topicos SET resultado_id = p_resultado_id, consentimento_audio_publico = true WHERE id = v_linha.id RETURNING * INTO v_linha;
  END IF;
  RETURN v_linha;
END;
$$;

CREATE OR REPLACE FUNCTION public.responder_topico(p_topico_id uuid, p_corpo text, p_pai_id uuid DEFAULT NULL)
RETURNS public.respostas LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT * FROM public.responder_topico_com_anexo(p_topico_id, p_corpo, p_pai_id);
$$;

-- Edição não pode virar atalho para driblar os 180 caracteres do composer.
CREATE OR REPLACE FUNCTION public.editar_topico(p_topico_id uuid, p_titulo text DEFAULT NULL, p_corpo text DEFAULT NULL)
RETURNS public.topicos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_titulo text := CASE WHEN p_titulo IS NULL THEN NULL ELSE regexp_replace(public.aue_aparar_texto(p_titulo), '\s+', ' ', 'g') END;
  v_corpo text := CASE WHEN p_corpo IS NULL THEN NULL ELSE public.aue_aparar_texto(p_corpo) END;
  v_topico public.topicos; v_linha public.topicos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF v_titulo IS NULL AND v_corpo IS NULL THEN PERFORM public.aue_falhar_conversa('22023', 'Nada para editar', 'nada_para_editar'); END IF;
  IF v_titulo IS NOT NULL AND char_length(v_titulo) NOT BETWEEN 1 AND 120 THEN PERFORM public.aue_falhar_conversa('22023', 'Título inválido', 'titulo_invalido'); END IF;
  IF v_corpo IS NOT NULL AND char_length(v_corpo) > 180 THEN PERFORM public.aue_falhar_conversa('22023', 'Texto do tópico precisa ter até 180 caracteres', 'corpo_invalido'); END IF;
  SELECT * INTO v_topico FROM public.topicos t WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado') FOR UPDATE;
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Tópico não encontrado', 'topico_nao_encontrado'); END IF;
  IF v_topico.autor_id <> auth.uid() THEN PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor'); END IF;
  IF v_topico.status = 'fechado' THEN PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado', 'topico_fechado'); END IF;
  UPDATE public.topicos SET titulo = coalesce(v_titulo, titulo), corpo = coalesce(v_corpo, corpo), editado_em = now() WHERE id = v_topico.id RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

CREATE OR REPLACE FUNCTION public.editar_resposta(p_resposta_id uuid, p_corpo text)
RETURNS public.respostas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_corpo text := public.aue_aparar_texto(p_corpo); v_resposta public.respostas; v_status text; v_linha public.respostas;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF char_length(v_corpo) > 180 OR (char_length(v_corpo) = 0 AND NOT EXISTS (SELECT 1 FROM public.respostas x WHERE x.id = p_resposta_id AND x.anexo_tipo IS NOT NULL)) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Resposta precisa ter até 180 caracteres ou um anexo', 'resposta_invalida');
  END IF;
  SELECT r.* INTO v_resposta FROM public.respostas r JOIN public.topicos t ON t.id = r.topico_id AND t.status IN ('aberto', 'fechado') WHERE r.id = p_resposta_id AND r.status = 'visivel' FOR UPDATE OF r;
  IF NOT FOUND THEN PERFORM public.aue_falhar_conversa('22023', 'Resposta não encontrada', 'resposta_nao_encontrada'); END IF;
  IF v_resposta.autor_id <> auth.uid() THEN PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor'); END IF;
  SELECT t.status INTO v_status FROM public.topicos t WHERE t.id = v_resposta.topico_id;
  IF v_status = 'fechado' THEN PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado', 'topico_fechado'); END IF;
  UPDATE public.respostas SET corpo = v_corpo, editado_em = now() WHERE id = v_resposta.id RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

-- Leitura mantém caminho, nunca URL. Quem renderiza pede URL assinada ao bucket.
CREATE OR REPLACE FUNCTION public.aue_ler_anexo_do_forum(p_caminho text, p_ttl_segundos integer DEFAULT 300)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_ttl_segundos NOT BETWEEN 60 AND 3600 OR NOT public.aue_anexo_do_forum_publicado(p_caminho) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Anexo não encontrado', 'anexo_invalido');
  END IF;
  RETURN p_caminho;
END;
$$;

-- A paginação histórica não muda de assinatura nesta entrega. A tela pede os
-- anexos dos IDs que acabou de receber; assim o contrato antigo continua vivo e
-- cada card recebe somente o seu único anexo.
CREATE OR REPLACE FUNCTION public.listar_anexos_do_forum(
  p_topicos uuid[] DEFAULT ARRAY[]::uuid[], p_respostas uuid[] DEFAULT ARRAY[]::uuid[]
) RETURNS TABLE (
  alvo_tipo text, alvo_id uuid, tipo text, caminho text, mime text,
  tamanho_bytes integer, duracao_ms integer, url_video text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT 'topico'::text, t.id, t.anexo_tipo, t.anexo_caminho, t.anexo_mime,
         t.anexo_tamanho_bytes, t.anexo_duracao_ms, t.video_externo_url
    FROM public.topicos t
   WHERE t.id = ANY(coalesce(p_topicos, ARRAY[]::uuid[]))
     AND t.anexo_tipo IS NOT NULL AND t.status IN ('aberto', 'fechado')
     AND public.aue_e_conta_promovida(t.autor_id)
  UNION ALL
  SELECT 'resposta'::text, r.id, r.anexo_tipo, r.anexo_caminho, r.anexo_mime,
         r.anexo_tamanho_bytes, r.anexo_duracao_ms, r.video_externo_url
    FROM public.respostas r JOIN public.topicos t ON t.id = r.topico_id
   WHERE r.id = ANY(coalesce(p_respostas, ARRAY[]::uuid[]))
     AND r.anexo_tipo IS NOT NULL AND r.status = 'visivel'
     AND t.status IN ('aberto', 'fechado')
     AND public.aue_e_conta_promovida(r.autor_id)
     AND public.aue_e_conta_promovida(t.autor_id);
$$;

REVOKE ALL ON FUNCTION
  public.aue_anexo_do_forum_publicado(text), public.aue_url_video_externo_canonica(text),
  public.aue_validar_anexo_do_forum(text, text, text, integer, integer, text),
  public.criar_topico_com_anexo(text, text, text, text, text, text, integer, integer, text),
  public.responder_topico_com_anexo(uuid, text, uuid, text, text, text, integer, integer, text),
  public.aue_ler_anexo_do_forum(text, integer),
  public.listar_anexos_do_forum(uuid[], uuid[])
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.criar_topico_com_anexo(text, text, text, text, text, text, integer, integer, text),
  public.responder_topico_com_anexo(uuid, text, uuid, text, text, text, integer, integer, text),
  public.listar_anexos_do_forum(uuid[], uuid[])
TO authenticated;

GRANT EXECUTE ON FUNCTION public.listar_anexos_do_forum(uuid[], uuid[]) TO anon;

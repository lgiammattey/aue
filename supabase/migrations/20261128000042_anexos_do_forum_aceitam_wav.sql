-- A Arena V2 codifica a emissão em WAV. Quando a pessoa autoriza publicar,
-- esse mesmo arquivo pode seguir para o anexo privado da Resenha sem transcode
-- no navegador. Os limites e a validação de autoria continuam os do fórum.

ALTER TABLE public.topicos
  DROP CONSTRAINT IF EXISTS topicos_anexo_valido;
ALTER TABLE public.respostas
  DROP CONSTRAINT IF EXISTS respostas_anexo_valido;

ALTER TABLE public.topicos ADD CONSTRAINT topicos_anexo_valido CHECK (
  (anexo_tipo IS NULL AND anexo_caminho IS NULL AND anexo_mime IS NULL
    AND anexo_tamanho_bytes IS NULL AND anexo_duracao_ms IS NULL AND video_externo_url IS NULL)
  OR (anexo_tipo = 'imagem' AND anexo_caminho ~ '^[0-9a-f-]{36}/forum/[0-9a-f-]{36}\.(jpg|png|webp|gif)$'
      AND anexo_mime IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')
      AND anexo_tamanho_bytes BETWEEN 1 AND 8388608
      AND anexo_duracao_ms IS NULL AND video_externo_url IS NULL)
  OR (anexo_tipo = 'audio' AND anexo_caminho ~ '^[0-9a-f-]{36}/forum/[0-9a-f-]{36}\.(webm|ogg|m4a|mp3|wav)$'
      AND anexo_mime IN ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav')
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
  OR (anexo_tipo = 'audio' AND anexo_caminho ~ '^[0-9a-f-]{36}/forum/[0-9a-f-]{36}\.(webm|ogg|m4a|mp3|wav)$'
      AND anexo_mime IN ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav')
      AND anexo_tamanho_bytes BETWEEN 1 AND 10485760
      AND anexo_duracao_ms BETWEEN 1 AND 60000 AND video_externo_url IS NULL)
  OR (anexo_tipo = 'video_externo' AND anexo_caminho IS NULL AND anexo_mime IS NULL
      AND anexo_tamanho_bytes IS NULL AND anexo_duracao_ms IS NULL
      AND video_externo_url IS NOT NULL)
);

UPDATE storage.buckets
   SET allowed_mime_types = ARRAY[
     'image/jpeg', 'image/png', 'image/webp', 'image/gif',
     'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'
   ]
 WHERE id = 'anexos_do_forum';

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
  ELSIF v_tipo = 'audio' AND v_mime IN ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav') AND p_tamanho_bytes BETWEEN 1 AND 10485760 AND p_duracao_ms BETWEEN 1 AND 60000
     AND ((v_mime = 'audio/webm' AND v_caminho LIKE '%.webm') OR (v_mime = 'audio/ogg' AND v_caminho LIKE '%.ogg') OR (v_mime = 'audio/mp4' AND v_caminho LIKE '%.m4a') OR (v_mime = 'audio/mpeg' AND v_caminho LIKE '%.mp3') OR (v_mime = 'audio/wav' AND v_caminho LIKE '%.wav')) THEN
    RETURN QUERY SELECT v_tipo, v_caminho, v_mime, p_tamanho_bytes, p_duracao_ms, NULL::text;
  ELSE
    PERFORM public.aue_falhar_conversa('22023', 'Tipo, tamanho ou duração do anexo inválidos', 'anexo_invalido');
  END IF;
END;
$$;

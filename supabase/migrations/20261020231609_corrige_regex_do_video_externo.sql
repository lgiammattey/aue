-- Corrige a normalização de vídeo externo (YouTube/TikTok) dos tópicos e respostas.
--
-- A versão de 20261020063849 escrevia `\\.` dentro de string comum. Com
-- standard_conforming_strings = on, o regex recebia "barra literal + qualquer
-- caractere" e nenhuma URL real casava: toda publicação por link voltava como
-- vídeo inválido. Aqui o ponto é escapado uma única vez.
--
-- Só troca o corpo da função (CREATE OR REPLACE). Não apaga nem reescreve dado.
-- Também aceita `m.youtube.com` e `m.tiktok.com`, que o cliente já aceitava.

CREATE OR REPLACE FUNCTION public.aue_url_video_externo_canonica(p_url text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp AS $$
DECLARE v text := btrim(coalesce(p_url, '')); v_match text[];
BEGIN
  v_match := regexp_match(v, '^https://(?:www\.|m\.)?youtube\.com/watch\?v=([A-Za-z0-9_-]{11})(?:&[^#[:space:]]*)?$', 'i');
  IF v_match IS NOT NULL THEN RETURN 'https://www.youtube.com/watch?v=' || v_match[1]; END IF;
  v_match := regexp_match(v, '^https://youtu\.be/([A-Za-z0-9_-]{11})(?:\?[^#[:space:]]*)?$', 'i');
  IF v_match IS NOT NULL THEN RETURN 'https://www.youtube.com/watch?v=' || v_match[1]; END IF;
  v_match := regexp_match(v, '^https://(?:www\.|m\.)?youtube\.com/shorts/([A-Za-z0-9_-]{11})(?:\?[^#[:space:]]*)?$', 'i');
  IF v_match IS NOT NULL THEN RETURN 'https://www.youtube.com/watch?v=' || v_match[1]; END IF;
  v_match := regexp_match(v, '^https://(?:www\.|m\.)?tiktok\.com/(@[A-Za-z0-9._-]{1,24})/video/([0-9]{10,25})(?:\?[^#[:space:]]*)?$', 'i');
  IF v_match IS NOT NULL THEN RETURN 'https://www.tiktok.com/' || v_match[1] || '/video/' || v_match[2]; END IF;
  RETURN NULL;
END;
$$;

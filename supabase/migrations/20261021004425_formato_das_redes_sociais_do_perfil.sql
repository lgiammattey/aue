-- Redes sociais do perfil guardam só o @, em formato válido.
--
-- O formulário aceitava qualquer texto e o perfil montava o link por concatenação:
-- quem colou "https://www.tiktok.com/@nome" no TikTok ficou com um link quebrado
-- (tiktok.com/@https://www.tiktok.com/@nome). O cliente agora aceita o link e
-- guarda o @; aqui o banco corrige o que já existe e trava o formato.

DO $$
BEGIN
  -- O trigger de proteção desfaz mudança social sem esta marca.
  PERFORM set_config('aue.perfil_social', 'sim', true);

  UPDATE public.perfis SET instagram = nullif(regexp_replace(instagram, '^https?://(www\.)?instagram\.com/@?([^/?#]+).*$', '\2', 'i'), '') WHERE instagram ~* '^https?://';
  UPDATE public.perfis SET tiktok = nullif(regexp_replace(tiktok, '^https?://(www\.|m\.)?tiktok\.com/@?([^/?#]+).*$', '\2', 'i'), '') WHERE tiktok ~* '^https?://';
  UPDATE public.perfis SET youtube = nullif(regexp_replace(youtube, '^https?://(www\.|m\.)?youtube\.com/@?([^/?#]+).*$', '\2', 'i'), '') WHERE youtube ~* '^https?://';
  UPDATE public.perfis SET twitter = nullif(regexp_replace(twitter, '^https?://(www\.)?(x|twitter)\.com/@?([^/?#]+).*$', '\3', 'i'), '') WHERE twitter ~* '^https?://';

  -- Qualquer outro valor fora do formato é apagado: um link quebrado é pior que nenhum.
  UPDATE public.perfis SET instagram = NULL WHERE instagram !~ '^[A-Za-z0-9._]{1,30}$';
  UPDATE public.perfis SET tiktok = NULL WHERE tiktok !~ '^[A-Za-z0-9._]{1,24}$';
  UPDATE public.perfis SET youtube = NULL WHERE youtube !~ '^[A-Za-z0-9._-]{1,50}$';
  UPDATE public.perfis SET twitter = NULL WHERE twitter !~ '^[A-Za-z0-9_]{1,15}$';
END $$;

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_instagram_formato CHECK (instagram IS NULL OR instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  ADD CONSTRAINT perfis_tiktok_formato CHECK (tiktok IS NULL OR tiktok ~ '^[A-Za-z0-9._]{1,24}$'),
  ADD CONSTRAINT perfis_youtube_formato CHECK (youtube IS NULL OR youtube ~ '^[A-Za-z0-9._-]{1,50}$'),
  ADD CONSTRAINT perfis_twitter_formato CHECK (twitter IS NULL OR twitter ~ '^[A-Za-z0-9_]{1,15}$');

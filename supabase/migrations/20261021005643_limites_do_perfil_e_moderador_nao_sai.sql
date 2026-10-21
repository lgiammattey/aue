-- Editar perfil e sair de comunidade.
--
-- 1. Limites de tamanho no banco. `bio` e `cidade` não tinham teto (só o RPC, que
--    não olhava), e `apelido` aceita UPDATE direto do próprio usuário (o app grava
--    assim o nome de convidado), então valia qualquer tamanho.
--      apelido <= 40 (convidado pode passar dos 30 do perfil social), bio <= 280, cidade <= 60.
-- 2. `titulo` (o selo de nível, ex.: "Iniciante do Gás") não estava na lista da trigger de
--    proteção: qualquer um o trocava pela API. Agora só seed e migration (sem JWT) mudam.
-- 3. `sair_da_comunidade` apagava a linha de membro sem olhar o papel: quem moderava saía e
--    perdia a moderação em silêncio, e a comunidade podia ficar sem ninguém. Moderador e
--    criador não saem por aqui (HINT `moderador_nao_sai`). Visitante também não executa mais.

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_apelido_tamanho CHECK (apelido IS NULL OR char_length(apelido) <= 40),
  ADD CONSTRAINT perfis_bio_tamanho CHECK (bio IS NULL OR char_length(bio) <= 280),
  ADD CONSTRAINT perfis_cidade_tamanho CHECK (cidade IS NULL OR char_length(cidade) <= 60);

CREATE OR REPLACE FUNCTION public.proteger_campos_sociais_do_perfil()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public', 'pg_temp' AS $function$
BEGIN
  IF current_setting('aue.perfil_social', true) IS DISTINCT FROM 'sim' THEN
    NEW.handle := OLD.handle; NEW.bio := OLD.bio; NEW.cidade := OLD.cidade;
    NEW.url_do_avatar := OLD.url_do_avatar; NEW.instagram := OLD.instagram;
    NEW.tiktok := OLD.tiktok; NEW.youtube := OLD.youtube; NEW.twitter := OLD.twitter;
    NEW.caminho_da_capa := OLD.caminho_da_capa;
    NEW.revisao_da_capa := OLD.revisao_da_capa;
  END IF;
  -- Título é selo da casa: quem escreve pela API (com JWT) nunca o troca. Seed e migration, sem JWT, podem.
  IF auth.uid() IS NOT NULL THEN NEW.titulo := OLD.titulo; END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sair_da_comunidade(p_slug text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $function$
DECLARE v_grupo uuid;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT g.id INTO v_grupo FROM public.grupos g WHERE lower(g.slug) = lower(btrim(p_slug));
  IF v_grupo IS NULL THEN RAISE EXCEPTION 'Comunidade não existe' USING ERRCODE = '22023', HINT = 'comunidade_inexistente'; END IF;
  -- Moderador não sai por aqui: sair apagaria a moderação em silêncio e a comunidade poderia ficar sem ninguém.
  IF EXISTS (SELECT 1 FROM public.membros_grupo m WHERE m.group_id = v_grupo AND m.user_id = auth.uid() AND m.role = 'admin')
     OR EXISTS (SELECT 1 FROM public.grupos g WHERE g.id = v_grupo AND g.created_by = auth.uid()) THEN
    RAISE EXCEPTION 'Quem modera a comunidade não sai por aqui' USING ERRCODE = '42501', HINT = 'moderador_nao_sai';
  END IF;
  DELETE FROM public.membros_grupo m WHERE m.group_id = v_grupo AND m.user_id = auth.uid();
  RETURN FOUND;
END;
$function$;
REVOKE ALL ON FUNCTION public.sair_da_comunidade(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sair_da_comunidade(text) TO authenticated;

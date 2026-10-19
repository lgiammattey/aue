-- =============================================================================
-- 20261019000015 — Comunidade → Tópico → Resposta (parte 2: acervo e espelho)
-- ADR 0010 / issue #255. Depende da 20261019000014.
--
-- O QUE FAZ
--   1. Copia cada causo (posts_comunidade) para um tópico e cada comentário de
--      causo (comentarios com post_id) para uma resposta. Idempotente.
--   2. Instala triggers-espelho em posts_comunidade e comentarios, para o que o
--      frontend ANTIGO criar, esconder ou apagar depois da cópia aparecer (ou
--      sumir) na estrutura nova. Nenhum trigger faz o INSERT antigo falhar.
--   3. Confere as contagens e ABORTA a migração inteira se não baterem.
--
-- NÃO MEXE em posts_comunidade, comentarios, reacoes, denuncias nem em RPC
-- existente. Curtidas e denúncias antigas seguem presas ao post; o mapa
-- post → tópico é topicos.legado_post_id (o mesmo mapa serve a /historia/:id).
--
-- REGRAS DA CÓPIA
--   - id do tópico = id do post; id da resposta = id do comentário (o ID antigo
--     vira o novo: link e relação pai/filha preservados). legado_*_id guarda o
--     vínculo de forma explícita e é a chave do ON CONFLICT.
--   - autor, criado_em, áudio (resultado, consentimento, áudio da casa) copiados.
--   - esta_escondido = true vira 'oculto'. Re-rodar nunca reabre: o que já existe
--     no lado novo (oculto, removido, fechado) não é tocado (DO NOTHING).
--   - título: primeira linha do texto, espaço colapsado, até 80 caracteres (com
--     reticências se cortou). Sem texto: 'Arroto sem legenda' (audio_result),
--     'Link no <rede>' (social_link) ou 'Causo sem título'. Nada inventado.
--   - corpo: o texto original (máx. 2000, o teto de publicar_da_casa). social_link
--     leva o endereço no fim do corpo, porque tópico não tem coluna de link.
--   - comunidade: a do post. Sem group_id vai para a comunidade 'acervo', criada
--     sob demanda, só quando existe post órfão, com ON CONFLICT DO NOTHING (não
--     sobrescreve grupo nenhum, ao contrário do seed da 20261018000010).
--   - comentários só de resultado (result_id, sem post_id) são da Arena e não
--     entram: não são conversa de comunidade.
--   - mudança no lado antigo depois da cópia: esconder → 'oculto'; mostrar de novo
--     → 'aberto' (só se estava 'oculto'); apagar post/comentário → 'removido'.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Funções internas (sem grant)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.aue_obter_comunidade_acervo()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid;
BEGIN
  SELECT g.id INTO v_id FROM public.grupos g WHERE lower(g.slug) = 'acervo';
  IF v_id IS NULL THEN
    INSERT INTO public.grupos (nome, slug, descricao, icone)
    VALUES ('Acervo do Auê', 'acervo', 'Causos antigos que não tinham comunidade. Ficam aqui, com o autor e a data de sempre.', '🗄️')
    ON CONFLICT DO NOTHING;
    SELECT g.id INTO v_id FROM public.grupos g WHERE lower(g.slug) = 'acervo';
  END IF;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível criar a comunidade acervo (nome ou slug já em uso)';
  END IF;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.aue_titulo_do_acervo(p_conteudo text, p_tipo text, p_rede text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp
AS $$
DECLARE v text;
BEGIN
  v := regexp_replace(coalesce(p_conteudo, ''), '^\s+', '');
  v := split_part(replace(v, E'\r', E'\n'), E'\n', 1);
  v := regexp_replace(v, '[[:cntrl:]]+', ' ', 'g');
  v := btrim(regexp_replace(v, '\s+', ' ', 'g'));
  IF char_length(v) > 80 THEN
    v := rtrim(left(v, 80)) || '…';
  END IF;
  IF v = '' THEN
    v := CASE p_tipo
      WHEN 'audio_result' THEN 'Arroto sem legenda'
      WHEN 'social_link' THEN 'Link no ' || coalesce(nullif(btrim(p_rede), ''), 'rede social')
      ELSE 'Causo sem título'
    END;
  END IF;
  RETURN v;
END;
$$;

-- Copia UM post. Uma só implementação para o backfill e o trigger (paridade).
CREATE OR REPLACE FUNCTION public.aue_espelhar_post(p_post_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  p public.posts_comunidade;
  v_texto boolean;
  v_corpo text;
  v_id uuid;
BEGIN
  SELECT * INTO p FROM public.posts_comunidade WHERE id = p_post_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  v_texto := btrim(coalesce(p.content, '')) <> '';
  v_corpo := left(CASE
    WHEN v_texto AND p.social_url IS NOT NULL THEN p.content || E'\n' || p.social_url
    WHEN v_texto THEN p.content
    WHEN p.social_url IS NOT NULL THEN p.social_url
    ELSE ''
  END, 2000);

  INSERT INTO public.topicos (
    id, comunidade_id, autor_id, titulo, corpo, status, resultado_id,
    consentimento_audio_publico, caminho_do_audio_da_casa, criado_em, ultima_atividade_em, legado_post_id
  ) VALUES (
    p.id, coalesce(p.group_id, public.aue_obter_comunidade_acervo()), p.user_id,
    public.aue_titulo_do_acervo(p.content, p.post_type, p.social_network), v_corpo,
    CASE WHEN p.esta_escondido THEN 'oculto' ELSE 'aberto' END,
    p.result_id, p.consentimento_audio_publico, p.caminho_do_audio_da_casa, p.created_at, p.created_at, p.id
  )
  ON CONFLICT (legado_post_id) DO NOTHING;

  SELECT t.id INTO v_id FROM public.topicos t WHERE t.legado_post_id = p.id;
  RETURN v_id;
END;
$$;

-- Copia UM comentário de causo. Garante o tópico e o comentário-pai antes.
CREATE OR REPLACE FUNCTION public.aue_espelhar_comentario(p_comentario_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  c public.comentarios;
  v_pai_comentario public.comentarios;
  v_topico uuid;
  v_pai uuid;
  v_id uuid;
BEGIN
  SELECT * INTO c FROM public.comentarios WHERE id = p_comentario_id;
  IF NOT FOUND OR c.post_id IS NULL THEN RETURN NULL; END IF;

  SELECT t.id INTO v_topico FROM public.topicos t WHERE t.legado_post_id = c.post_id;
  IF v_topico IS NULL THEN v_topico := public.aue_espelhar_post(c.post_id); END IF;
  IF v_topico IS NULL THEN RETURN NULL; END IF;

  IF c.resposta_a_id IS NOT NULL THEN
    SELECT * INTO v_pai_comentario FROM public.comentarios WHERE id = c.resposta_a_id;
    -- Pai de outro post (dado antigo torto) não vira pai: a resposta entra na raiz.
    IF FOUND AND v_pai_comentario.post_id IS NOT DISTINCT FROM c.post_id THEN
      SELECT r.id INTO v_pai FROM public.respostas r WHERE r.legado_comentario_id = v_pai_comentario.id;
      IF v_pai IS NULL THEN v_pai := public.aue_espelhar_comentario(v_pai_comentario.id); END IF;
    END IF;
  END IF;

  INSERT INTO public.respostas (id, topico_id, pai_id, nivel, autor_id, corpo, status, criado_em, legado_comentario_id)
  VALUES (
    c.id, v_topico, v_pai,
    CASE WHEN v_pai IS NULL THEN 0 ELSE least(greatest(c.nivel, 1), 2)::smallint END,
    c.user_id, c.content, 'visivel', c.created_at, c.id
  )
  ON CONFLICT (legado_comentario_id) DO NOTHING;

  UPDATE public.topicos SET ultima_atividade_em = greatest(ultima_atividade_em, c.created_at) WHERE id = v_topico;
  SELECT r.id INTO v_id FROM public.respostas r WHERE r.legado_comentario_id = c.id;
  RETURN v_id;
END;
$$;

-- Confere o acervo. RAISE EXCEPTION em qualquer divergência; devolve o inventário.
CREATE OR REPLACE FUNCTION public.aue_conferir_acervo()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_posts bigint; v_topicos bigint; v_comentarios bigint; v_respostas bigint;
  v_ocultos_posts bigint; v_ocultos_topicos bigint; v_ruim bigint; v_acervo uuid;
BEGIN
  SELECT count(*) INTO v_posts FROM public.posts_comunidade;
  SELECT count(*) INTO v_topicos FROM public.posts_comunidade p JOIN public.topicos t ON t.legado_post_id = p.id;
  IF v_posts <> v_topicos THEN
    RAISE EXCEPTION 'Acervo diverge: % posts, % tópicos correspondentes', v_posts, v_topicos;
  END IF;

  SELECT count(*) INTO v_comentarios FROM public.comentarios WHERE post_id IS NOT NULL;
  SELECT count(*) INTO v_respostas FROM public.comentarios c JOIN public.respostas r ON r.legado_comentario_id = c.id WHERE c.post_id IS NOT NULL;
  IF v_comentarios <> v_respostas THEN
    RAISE EXCEPTION 'Acervo diverge: % comentários de causo, % respostas correspondentes', v_comentarios, v_respostas;
  END IF;

  -- Comunidade, autor, data e nenhuma resposta fora do tópico do seu post.
  SELECT id INTO v_acervo FROM public.grupos WHERE lower(slug) = 'acervo';
  SELECT count(*) INTO v_ruim FROM public.posts_comunidade p JOIN public.topicos t ON t.legado_post_id = p.id
   WHERE t.autor_id <> p.user_id OR t.criado_em <> p.created_at
      OR t.comunidade_id IS DISTINCT FROM coalesce(p.group_id, v_acervo);
  IF v_ruim > 0 THEN RAISE EXCEPTION 'Acervo diverge: % tópicos com comunidade, autor ou data diferentes do post', v_ruim; END IF;

  SELECT count(*) INTO v_ruim FROM public.comentarios c
    JOIN public.respostas r ON r.legado_comentario_id = c.id
    JOIN public.topicos t ON t.id = r.topico_id
   WHERE c.post_id IS NOT NULL
     AND (t.legado_post_id IS DISTINCT FROM c.post_id OR r.autor_id <> c.user_id OR r.criado_em <> c.created_at);
  IF v_ruim > 0 THEN RAISE EXCEPTION 'Acervo diverge: % respostas com tópico, autor ou data diferentes do comentário', v_ruim; END IF;

  -- Pai preservado quando o pai é do mesmo post.
  SELECT count(*) INTO v_ruim FROM public.comentarios c
    JOIN public.comentarios pc ON pc.id = c.resposta_a_id AND pc.post_id IS NOT DISTINCT FROM c.post_id
    JOIN public.respostas r ON r.legado_comentario_id = c.id
   WHERE c.post_id IS NOT NULL
     AND r.pai_id IS DISTINCT FROM (SELECT x.id FROM public.respostas x WHERE x.legado_comentario_id = pc.id);
  IF v_ruim > 0 THEN RAISE EXCEPTION 'Acervo diverge: % respostas com pai diferente do comentário', v_ruim; END IF;

  -- Escondido no lado antigo nunca pode estar visível no novo.
  SELECT count(*) FILTER (WHERE p.esta_escondido) INTO v_ocultos_posts FROM public.posts_comunidade p;
  SELECT count(*) INTO v_ocultos_topicos FROM public.posts_comunidade p JOIN public.topicos t ON t.legado_post_id = p.id
   WHERE p.esta_escondido AND t.status IN ('aberto', 'fechado');
  IF v_ocultos_topicos > 0 THEN RAISE EXCEPTION 'Acervo diverge: % posts escondidos aparecem como tópico visível', v_ocultos_topicos; END IF;

  -- Tópico cujo post sumiu precisa estar 'removido' (nada ressuscita).
  SELECT count(*) INTO v_ruim FROM public.topicos t
   WHERE t.legado_post_id IS NOT NULL AND t.status <> 'removido'
     AND NOT EXISTS (SELECT 1 FROM public.posts_comunidade p WHERE p.id = t.legado_post_id);
  IF v_ruim > 0 THEN RAISE EXCEPTION 'Acervo diverge: % tópicos de post apagado ainda visíveis', v_ruim; END IF;

  RETURN jsonb_build_object('posts', v_posts, 'topicos', v_topicos, 'comentarios', v_comentarios,
                            'respostas', v_respostas, 'posts_escondidos', v_ocultos_posts);
END;
$$;

CREATE OR REPLACE FUNCTION public.aue_migrar_acervo_para_topicos()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.posts_comunidade ORDER BY created_at, id LOOP
    PERFORM public.aue_espelhar_post(r.id);
  END LOOP;
  FOR r IN SELECT id FROM public.comentarios WHERE post_id IS NOT NULL ORDER BY created_at, id LOOP
    PERFORM public.aue_espelhar_comentario(r.id);
  END LOOP;
  RETURN public.aue_conferir_acervo();
END;
$$;


-- -----------------------------------------------------------------------------
-- 2. Triggers-espelho. Cada um engole qualquer erro: o INSERT/UPDATE/DELETE do
--    frontend antigo nunca falha por causa da estrutura nova. O custo é um
--    WARNING no log e o segundo backfill (aue_migrar_acervo_para_topicos) como rede.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.aue_trigger_espelhar_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  BEGIN
    PERFORM public.aue_espelhar_post(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aue: espelho do post % falhou (%): %', NEW.id, SQLSTATE, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.aue_trigger_espelhar_comentario()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  BEGIN
    IF NEW.post_id IS NOT NULL THEN PERFORM public.aue_espelhar_comentario(NEW.id); END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aue: espelho do comentário % falhou (%): %', NEW.id, SQLSTATE, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.aue_trigger_espelhar_escondido()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  BEGIN
    IF NEW.esta_escondido THEN
      UPDATE public.topicos SET status = 'oculto' WHERE legado_post_id = NEW.id AND status IN ('aberto', 'fechado');
    ELSE
      UPDATE public.topicos SET status = 'aberto' WHERE legado_post_id = NEW.id AND status = 'oculto';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aue: espelho do estado do post % falhou (%): %', NEW.id, SQLSTATE, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.aue_trigger_espelhar_post_apagado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  BEGIN
    UPDATE public.topicos SET status = 'removido' WHERE legado_post_id = OLD.id AND status <> 'removido';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aue: espelho da remoção do post % falhou (%): %', OLD.id, SQLSTATE, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.aue_trigger_espelhar_comentario_apagado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  BEGIN
    UPDATE public.respostas SET status = 'removido' WHERE legado_comentario_id = OLD.id AND status <> 'removido';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aue: espelho da remoção do comentário % falhou (%): %', OLD.id, SQLSTATE, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION
  public.aue_obter_comunidade_acervo(),
  public.aue_titulo_do_acervo(text, text, text),
  public.aue_espelhar_post(uuid),
  public.aue_espelhar_comentario(uuid),
  public.aue_conferir_acervo(),
  public.aue_migrar_acervo_para_topicos(),
  public.aue_trigger_espelhar_post(),
  public.aue_trigger_espelhar_comentario(),
  public.aue_trigger_espelhar_escondido(),
  public.aue_trigger_espelhar_post_apagado(),
  public.aue_trigger_espelhar_comentario_apagado()
FROM PUBLIC, anon, authenticated;

-- Os triggers entram ANTES da cópia: o lock da tabela segura escritores até o
-- fim da migração, então nada novo cai entre a cópia e o trigger.
DROP TRIGGER IF EXISTS aue_espelha_post_no_topico ON public.posts_comunidade;
CREATE TRIGGER aue_espelha_post_no_topico AFTER INSERT ON public.posts_comunidade
  FOR EACH ROW EXECUTE FUNCTION public.aue_trigger_espelhar_post();

DROP TRIGGER IF EXISTS aue_espelha_escondido_no_topico ON public.posts_comunidade;
CREATE TRIGGER aue_espelha_escondido_no_topico AFTER UPDATE OF esta_escondido ON public.posts_comunidade
  FOR EACH ROW WHEN (OLD.esta_escondido IS DISTINCT FROM NEW.esta_escondido)
  EXECUTE FUNCTION public.aue_trigger_espelhar_escondido();

DROP TRIGGER IF EXISTS aue_espelha_post_apagado_no_topico ON public.posts_comunidade;
CREATE TRIGGER aue_espelha_post_apagado_no_topico AFTER DELETE ON public.posts_comunidade
  FOR EACH ROW EXECUTE FUNCTION public.aue_trigger_espelhar_post_apagado();

DROP TRIGGER IF EXISTS aue_espelha_comentario_na_resposta ON public.comentarios;
CREATE TRIGGER aue_espelha_comentario_na_resposta AFTER INSERT ON public.comentarios
  FOR EACH ROW EXECUTE FUNCTION public.aue_trigger_espelhar_comentario();

DROP TRIGGER IF EXISTS aue_espelha_comentario_apagado_na_resposta ON public.comentarios;
CREATE TRIGGER aue_espelha_comentario_apagado_na_resposta AFTER DELETE ON public.comentarios
  FOR EACH ROW EXECUTE FUNCTION public.aue_trigger_espelhar_comentario_apagado();


-- -----------------------------------------------------------------------------
-- 3. Cópia + conferência. Se divergir, a migração inteira volta atrás.
-- -----------------------------------------------------------------------------

DO $$
DECLARE v_resumo jsonb;
BEGIN
  v_resumo := public.aue_migrar_acervo_para_topicos();
  RAISE NOTICE 'Acervo conferido: %', v_resumo;
END;
$$;

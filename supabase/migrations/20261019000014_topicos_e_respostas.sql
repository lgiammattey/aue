-- =============================================================================
-- 20261019000014 — Comunidade → Tópico → Resposta (parte 1: estrutura e RPCs)
-- ADR 0010 / issue #254. Plano de migração do ADR: duas PRs, só aditivo.
--
-- O QUE FAZ
--   1. Cria `topicos`, `respostas` e `denuncias_conversa` (RLS ligada, sem
--      policy, sem grant: acesso só por RPC, como o resto da rede social).
--   2. Cria as RPCs NOVAS de leitura e escrita da conversa.
--
-- O QUE NÃO FAZ (de propósito)
--   - Não altera, remove nem renomeia nenhum objeto existente. O frontend atual
--     continua usando publicar_causo, criar_comentario, listar_feed_de_causos e
--     listar_comentarios, e eles seguem com a mesma assinatura e o mesmo retorno.
--   - Não copia conteúdo antigo (isso é a 20261019000015).
--   - Não tem moderação (fechar, ocultar, fixar por moderador = issue #260),
--     notificação, silenciar nem bloquear.
--
-- DECISÕES QUE DIVERGEM DO TEXTO DO ADR (detalhe no relatório da missão)
--   - `topicos.corpo` aceita 0..2000 na TABELA e 1..1000 nas RPCs. publicar_da_casa
--     já gravou posts de até 2000 e posts sem texto existem; a tabela precisa
--     acolher o acervo. Texto novo continua limitado a 1000 pelo servidor.
--   - `respostas` é tabela própria (o ADR dizia "reaproveita comentarios"). Uma
--     coluna topico_id em `comentarios` obrigaria mudar tabela viva e RPC viva.
--   - `respostas.status` é ('visivel','oculto','removido'); só tópico tem 'fechado'.
--
-- Mensagens de erro: ERRCODE + mensagem curta estável + HINT com código de
-- máquina (a UI traduz pelo HINT). 22023 = entrada inválida/inexistente,
-- 42501 = sem permissão, P0001 = tópico fechado (PostgREST responde 400; 55000 viraria 500).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Tabelas
-- -----------------------------------------------------------------------------

-- Se não conseguir a trava em 5 s, aborta: melhor falhar o deploy que enfileirar o app inteiro.
SET LOCAL lock_timeout = '5s';

CREATE TABLE IF NOT EXISTS public.topicos (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id               uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  autor_id                    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo                      text NOT NULL,
  corpo                       text NOT NULL DEFAULT '',
  status                      text NOT NULL DEFAULT 'aberto',
  fixado                      boolean NOT NULL DEFAULT false,
  resultado_id                uuid REFERENCES public.resultados(id) ON DELETE SET NULL,
  consentimento_audio_publico boolean NOT NULL DEFAULT false,
  caminho_do_audio_da_casa    text,
  criado_em                   timestamptz NOT NULL DEFAULT now(),
  editado_em                  timestamptz,
  ultima_atividade_em         timestamptz NOT NULL DEFAULT now(),
  legado_post_id              uuid,
  CONSTRAINT topicos_titulo_tamanho CHECK (char_length(titulo) BETWEEN 1 AND 120),
  CONSTRAINT topicos_corpo_tamanho CHECK (char_length(corpo) <= 2000),
  CONSTRAINT topicos_status_valido CHECK (status IN ('aberto', 'fechado', 'oculto', 'removido')),
  CONSTRAINT topicos_caminho_do_audio_da_casa_formato CHECK (
    caminho_do_audio_da_casa IS NULL
    OR (char_length(caminho_do_audio_da_casa) <= 120
        AND caminho_do_audio_da_casa ~ '^burpzilla/[0-9a-f-]{36}\.m4a$')
  ),
  CONSTRAINT topicos_legado_post_id_unico UNIQUE (legado_post_id)
);

CREATE TABLE IF NOT EXISTS public.respostas (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topico_id             uuid NOT NULL REFERENCES public.topicos(id) ON DELETE CASCADE,
  pai_id                uuid,
  nivel                 smallint NOT NULL DEFAULT 0,
  autor_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  corpo                 text NOT NULL,
  status                text NOT NULL DEFAULT 'visivel',
  criado_em             timestamptz NOT NULL DEFAULT now(),
  editado_em            timestamptz,
  legado_comentario_id  uuid,
  CONSTRAINT respostas_corpo_tamanho CHECK (char_length(corpo) BETWEEN 1 AND 500),
  CONSTRAINT respostas_status_valido CHECK (status IN ('visivel', 'oculto', 'removido')),
  CONSTRAINT respostas_nivel_valido CHECK (nivel BETWEEN 0 AND 2),
  CONSTRAINT respostas_nivel_coerente_com_pai CHECK ((pai_id IS NULL) = (nivel = 0)),
  CONSTRAINT respostas_pai_nao_e_ela_mesma CHECK (pai_id IS DISTINCT FROM id),
  CONSTRAINT respostas_legado_comentario_id_unico UNIQUE (legado_comentario_id),
  -- Alvo da FK composta: garante que o pai é do MESMO tópico.
  CONSTRAINT respostas_topico_e_id_unico UNIQUE (topico_id, id),
  CONSTRAINT respostas_pai_do_mesmo_topico FOREIGN KEY (topico_id, pai_id)
    REFERENCES public.respostas (topico_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.denuncias_conversa (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topico_id   uuid REFERENCES public.topicos(id) ON DELETE CASCADE,
  resposta_id uuid REFERENCES public.respostas(id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo      text NOT NULL,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT denuncias_conversa_alvo_unico CHECK (num_nonnulls(topico_id, resposta_id) = 1),
  CONSTRAINT denuncias_conversa_motivo_tamanho CHECK (char_length(btrim(motivo)) BETWEEN 3 AND 500)
);

-- Tópicos de uma comunidade por atividade (fixados primeiro) e por data, com
-- desempate por id para o cursor ser estável. Parciais: só o que a leitura pública vê.
CREATE INDEX IF NOT EXISTS topicos_por_comunidade_atividade
  ON public.topicos (comunidade_id, fixado DESC, ultima_atividade_em DESC, id DESC)
  WHERE status IN ('aberto', 'fechado');
CREATE INDEX IF NOT EXISTS topicos_por_comunidade_recentes
  ON public.topicos (comunidade_id, criado_em DESC, id DESC)
  WHERE status IN ('aberto', 'fechado');
CREATE INDEX IF NOT EXISTS topicos_por_autor
  ON public.topicos (autor_id, criado_em DESC, id DESC);
CREATE INDEX IF NOT EXISTS respostas_por_topico
  ON public.respostas (topico_id, criado_em, id);
CREATE INDEX IF NOT EXISTS respostas_por_pai
  ON public.respostas (topico_id, pai_id) WHERE pai_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS respostas_por_autor
  ON public.respostas (autor_id, criado_em DESC);
CREATE UNIQUE INDEX IF NOT EXISTS denuncias_conversa_uma_por_pessoa_por_topico
  ON public.denuncias_conversa (topico_id, usuario_id) WHERE topico_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS denuncias_conversa_uma_por_pessoa_por_resposta
  ON public.denuncias_conversa (resposta_id, usuario_id) WHERE resposta_id IS NOT NULL;

-- Acesso só por RPC. RLS ligada sem policy + REVOKE: nem anon nem authenticated
-- leem ou escrevem direto, qualquer que seja o default privileges do projeto.
ALTER TABLE public.topicos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncias_conversa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.topicos, public.respostas, public.denuncias_conversa FROM PUBLIC, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 2. Helpers internos (sem grant: só as RPCs chamam)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.aue_falhar_conversa(p_sqlstate text, p_mensagem text, p_codigo text)
RETURNS void LANGUAGE plpgsql VOLATILE SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION '%', p_mensagem USING ERRCODE = p_sqlstate, HINT = p_codigo;
END;
$$;

-- Tira espaço e quebra de linha das pontas (btrim sozinho só tira espaço).
CREATE OR REPLACE FUNCTION public.aue_aparar_texto(p_texto text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp
AS $$ SELECT regexp_replace(coalesce(p_texto, ''), '^\s+|\s+$', '', 'g') $$;

-- Participação na comunidade. Bonde Geral é a única entrada automática, igual à
-- publicar_causo: conta que acabou de confirmar e-mail pode chegar antes da
-- primeira leitura das comunidades.
CREATE OR REPLACE FUNCTION public.aue_exigir_participacao(p_comunidade_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.grupos g WHERE g.id = p_comunidade_id AND g.slug = 'bonde-geral') THEN
    INSERT INTO public.membros_grupo (group_id, user_id) VALUES (p_comunidade_id, auth.uid()) ON CONFLICT DO NOTHING;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.membros_grupo m WHERE m.group_id = p_comunidade_id AND m.user_id = auth.uid()) THEN
    PERFORM public.aue_falhar_conversa('42501', 'Entre na comunidade antes de participar', 'nao_e_membro');
  END IF;
END;
$$;

-- Leitura do tópico, uma só consulta para listar e obter (paridade garantida).
-- Visível = aberto ou fechado, de autor com conta promovida (mesma regra do feed).
-- Áudio: só com consentimento e resultado não escondido; nada de caminho privado.
CREATE OR REPLACE FUNCTION public.aue_ler_topicos(
  p_slug text, p_topico_id uuid, p_limite integer, p_ordem text,
  p_cursor_valor timestamptz, p_cursor_id uuid, p_cursor_fixado boolean
)
RETURNS TABLE (
  id uuid, comunidade_id uuid, comunidade_slug text, comunidade_nome text,
  autor_id uuid, apelido text, handle text, url_do_avatar text,
  titulo text, corpo text, status text, fixado boolean,
  criado_em timestamptz, editado_em timestamptz, ultima_atividade_em timestamptz,
  respostas_total bigint,
  resultado_id uuid, nota numeric, duracao numeric, subtipo_de_origem text,
  caminho_do_audio text, caminho_do_audio_da_casa text, sou_autor boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ordem text := coalesce(nullif(btrim(p_ordem), ''), 'atividade');
  v_limite integer := greatest(1, least(coalesce(p_limite, 30), 100));
  v_cursor boolean := p_cursor_valor IS NOT NULL OR p_cursor_id IS NOT NULL;
  v_filtro text := '';
  v_ordenacao text;
BEGIN
  IF v_ordem NOT IN ('atividade', 'recentes') THEN
    PERFORM public.aue_falhar_conversa('22023', 'Ordem inválida', 'ordem_invalida');
  END IF;
  IF v_cursor AND (p_cursor_valor IS NULL OR p_cursor_id IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Cursor inválido', 'cursor_invalido');
  END IF;

  IF v_ordem = 'atividade' THEN
    v_ordenacao := 't.fixado DESC, t.ultima_atividade_em DESC, t.id DESC';
    IF v_cursor THEN v_filtro := 'AND (t.fixado, t.ultima_atividade_em, t.id) < ($5, $6, $7)'; END IF;
  ELSE
    v_ordenacao := 't.criado_em DESC, t.id DESC';
    IF v_cursor THEN v_filtro := 'AND (t.criado_em, t.id) < ($6, $7)'; END IF;
  END IF;

  RETURN QUERY EXECUTE format($q$
    SELECT t.id, g.id, g.slug, g.nome::text,
           t.autor_id, pf.apelido, pf.handle, pf.url_do_avatar,
           t.titulo, t.corpo, t.status, t.fixado,
           t.criado_em, t.editado_em, t.ultima_atividade_em,
           (SELECT count(*) FROM public.respostas x
             WHERE x.topico_id = t.id AND x.status = 'visivel' AND public.aue_e_conta_promovida(x.autor_id)),
           t.resultado_id,
           CASE WHEN t.consentimento_audio_publico THEN r.nota::numeric END,
           CASE WHEN t.consentimento_audio_publico THEN r.duracao::numeric END,
           CASE WHEN t.consentimento_audio_publico THEN r.subtipo_de_origem END,
           CASE WHEN t.consentimento_audio_publico AND NOT r.esta_escondido THEN r.caminho_do_audio END,
           CASE WHEN t.consentimento_audio_publico
                 AND EXISTS (SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id = t.autor_id)
                THEN t.caminho_do_audio_da_casa END,
           coalesce(t.autor_id = auth.uid(), false)
      FROM public.topicos t
      JOIN public.grupos g ON g.id = t.comunidade_id
      JOIN public.perfis pf ON pf.id = t.autor_id AND public.aue_e_conta_promovida(t.autor_id)
      LEFT JOIN public.resultados r ON r.id = t.resultado_id
     WHERE t.status IN ('aberto', 'fechado')
       AND ($1 IS NULL OR lower(g.slug) = lower(btrim($1)))
       AND ($2 IS NULL OR t.id = $2)
       %s
     ORDER BY %s
     LIMIT $3
  $q$, v_filtro, v_ordenacao)
  USING p_slug, p_topico_id, v_limite, v_ordem, coalesce(p_cursor_fixado, false), p_cursor_valor, p_cursor_id;
END;
$$;


-- -----------------------------------------------------------------------------
-- 3. Leituras públicas (anon + authenticated)
-- -----------------------------------------------------------------------------

-- Ordem 'atividade': fixados, depois última atividade. Cursor = (fixado,
-- ultima_atividade_em, id) da ÚLTIMA linha da página anterior.
-- Ordem 'recentes': por criado_em; o cursor usa p_cursor_valor com o criado_em
-- da última linha. Sem p_cursor_fixado, o cursor assume linha não fixada.
CREATE OR REPLACE FUNCTION public.listar_topicos(
  p_slug text,
  p_limite integer DEFAULT 30,
  p_cursor_valor timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_ordem text DEFAULT 'atividade',
  p_cursor_fixado boolean DEFAULT false
)
RETURNS TABLE (
  id uuid, comunidade_id uuid, comunidade_slug text, comunidade_nome text,
  autor_id uuid, apelido text, handle text, url_do_avatar text,
  titulo text, corpo text, status text, fixado boolean,
  criado_em timestamptz, editado_em timestamptz, ultima_atividade_em timestamptz,
  respostas_total bigint,
  resultado_id uuid, nota numeric, duracao numeric, subtipo_de_origem text,
  caminho_do_audio text, caminho_do_audio_da_casa text, sou_autor boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF nullif(btrim(coalesce(p_slug, '')), '') IS NULL THEN
    PERFORM public.aue_falhar_conversa('22023', 'Comunidade não existe', 'comunidade_inexistente');
  END IF;
  RETURN QUERY SELECT * FROM public.aue_ler_topicos(p_slug, NULL, p_limite, p_ordem, p_cursor_valor, p_cursor_id, p_cursor_fixado);
END;
$$;

-- Tópico ausente, oculto ou removido não devolve linha (a UI mostra "não encontrado").
CREATE OR REPLACE FUNCTION public.obter_topico(p_topico_id uuid)
RETURNS TABLE (
  id uuid, comunidade_id uuid, comunidade_slug text, comunidade_nome text,
  autor_id uuid, apelido text, handle text, url_do_avatar text,
  titulo text, corpo text, status text, fixado boolean,
  criado_em timestamptz, editado_em timestamptz, ultima_atividade_em timestamptz,
  respostas_total bigint,
  resultado_id uuid, nota numeric, duracao numeric, subtipo_de_origem text,
  caminho_do_audio text, caminho_do_audio_da_casa text, sou_autor boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_topico_id IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT * FROM public.aue_ler_topicos(NULL, p_topico_id, 1, 'atividade', NULL, NULL, false);
END;
$$;

-- Ordem cronológica (criado_em, id); cursor = (criado_em, id) da última linha.
-- Resposta apagada/oculta que ainda tem filha visível volta como "casca" (corpo e
-- autor nulos) para a árvore não quebrar; conteúdo removido nunca sai.
CREATE OR REPLACE FUNCTION public.listar_respostas_do_topico(
  p_topico_id uuid,
  p_limite integer DEFAULT 50,
  p_cursor_criado_em timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, topico_id uuid, pai_id uuid, nivel smallint,
  autor_id uuid, apelido text, handle text, url_do_avatar text,
  corpo text, status text, criado_em timestamptz, editado_em timestamptz, sou_autor boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF (p_cursor_criado_em IS NULL) <> (p_cursor_id IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Cursor inválido', 'cursor_invalido');
  END IF;
  RETURN QUERY
  WITH RECURSIVE
  topico_legivel AS (
    SELECT t.id FROM public.topicos t
     WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado') AND public.aue_e_conta_promovida(t.autor_id)
  ),
  visiveis AS (
    SELECT r.id, r.pai_id FROM public.respostas r
     WHERE r.topico_id IN (SELECT tl.id FROM topico_legivel tl)
       AND r.status = 'visivel' AND public.aue_e_conta_promovida(r.autor_id)
    UNION
    SELECT a.id, a.pai_id FROM public.respostas a JOIN visiveis v ON a.id = v.pai_id
     WHERE a.topico_id = p_topico_id
  )
  SELECT r.id, r.topico_id, r.pai_id, r.nivel,
         CASE WHEN ok.visivel THEN r.autor_id END,
         CASE WHEN ok.visivel THEN pf.apelido END,
         CASE WHEN ok.visivel THEN pf.handle END,
         CASE WHEN ok.visivel THEN pf.url_do_avatar END,
         CASE WHEN ok.visivel THEN r.corpo END,
         CASE WHEN ok.visivel THEN 'visivel' WHEN r.status = 'visivel' THEN 'oculto' ELSE r.status END,
         r.criado_em,
         CASE WHEN ok.visivel THEN r.editado_em END,
         coalesce(ok.visivel AND r.autor_id = auth.uid(), false)
    FROM public.respostas r
    JOIN visiveis v ON v.id = r.id
    LEFT JOIN public.perfis pf ON pf.id = r.autor_id
    CROSS JOIN LATERAL (SELECT r.status = 'visivel' AND public.aue_e_conta_promovida(r.autor_id) AS visivel) ok
   WHERE p_cursor_id IS NULL OR (r.criado_em, r.id) > (p_cursor_criado_em, p_cursor_id)
   ORDER BY r.criado_em, r.id
   LIMIT greatest(1, least(coalesce(p_limite, 50), 200));
END;
$$;


-- -----------------------------------------------------------------------------
-- 4. Escritas (só authenticated; autor é sempre auth.uid())
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.criar_topico(
  p_slug text, p_titulo text, p_corpo text,
  p_resultado_id uuid DEFAULT NULL,
  p_consentimento_audio_publico boolean DEFAULT false
)
RETURNS public.topicos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_titulo text := regexp_replace(public.aue_aparar_texto(p_titulo), '\s+', ' ', 'g');
  v_corpo text := public.aue_aparar_texto(p_corpo);
  v_grupo public.grupos;
  v_linha public.topicos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF char_length(v_titulo) NOT BETWEEN 1 AND 120 THEN
    PERFORM public.aue_falhar_conversa('22023', 'Título precisa ter de 1 a 120 caracteres', 'titulo_invalido');
  END IF;
  IF char_length(v_corpo) NOT BETWEEN 1 AND 1000 THEN
    PERFORM public.aue_falhar_conversa('22023', 'Texto do tópico precisa ter de 1 a 1000 caracteres', 'corpo_invalido');
  END IF;
  SELECT * INTO v_grupo FROM public.grupos g WHERE lower(g.slug) = lower(btrim(coalesce(p_slug, '')));
  IF NOT FOUND THEN
    PERFORM public.aue_falhar_conversa('22023', 'Comunidade não existe', 'comunidade_inexistente');
  END IF;
  PERFORM public.aue_exigir_participacao(v_grupo.id);
  -- Gravar para jogar não autoriza publicar: áudio só com consentimento explícito
  -- e resultado da própria conta (mesma regra de publicar_causo).
  IF p_resultado_id IS NOT NULL
     AND (NOT coalesce(p_consentimento_audio_publico, false) OR NOT public.aue_resultado_e_meu(p_resultado_id)) THEN
    PERFORM public.aue_falhar_conversa('42501', 'Resultado sem consentimento ou não pertence à conta', 'audio_sem_consentimento');
  END IF;

  INSERT INTO public.topicos (comunidade_id, autor_id, titulo, corpo, resultado_id, consentimento_audio_publico)
  VALUES (v_grupo.id, auth.uid(), v_titulo, v_corpo, p_resultado_id,
          (p_resultado_id IS NOT NULL AND coalesce(p_consentimento_audio_publico, false)))
  RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

CREATE OR REPLACE FUNCTION public.responder_topico(p_topico_id uuid, p_corpo text, p_pai_id uuid DEFAULT NULL)
RETURNS public.respostas
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_corpo text := public.aue_aparar_texto(p_corpo);
  v_topico public.topicos;
  v_pai public.respostas;
  v_nivel smallint := 0;
  v_linha public.respostas;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF char_length(v_corpo) NOT BETWEEN 1 AND 500 THEN
    PERFORM public.aue_falhar_conversa('22023', 'Resposta precisa ter de 1 a 500 caracteres', 'resposta_invalida');
  END IF;
  -- Trava a linha do tópico: fechar/ocultar concorrente não deixa resposta passar.
  SELECT * INTO v_topico FROM public.topicos t
   WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado') AND public.aue_e_conta_promovida(t.autor_id)
     FOR NO KEY UPDATE;
  IF NOT FOUND THEN
    PERFORM public.aue_falhar_conversa('22023', 'Tópico não encontrado', 'topico_nao_encontrado');
  END IF;
  IF v_topico.status = 'fechado' THEN
    PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado para respostas', 'topico_fechado');
  END IF;
  PERFORM public.aue_exigir_participacao(v_topico.comunidade_id);

  IF p_pai_id IS NOT NULL THEN
    SELECT * INTO v_pai FROM public.respostas r
     WHERE r.id = p_pai_id AND r.topico_id = v_topico.id AND r.status = 'visivel';
    IF NOT FOUND THEN
      PERFORM public.aue_falhar_conversa('22023', 'Resposta respondida não existe neste tópico', 'pai_invalido');
    END IF;
    -- Três níveis no máximo (0, 1, 2), como em comentarios.
    v_nivel := least(v_pai.nivel + 1, 2);
  END IF;

  INSERT INTO public.respostas (topico_id, pai_id, nivel, autor_id, corpo)
  VALUES (v_topico.id, p_pai_id, v_nivel, auth.uid(), v_corpo)
  RETURNING * INTO v_linha;
  UPDATE public.topicos SET ultima_atividade_em = greatest(ultima_atividade_em, v_linha.criado_em) WHERE id = v_topico.id;
  RETURN v_linha;
END;
$$;

-- p_titulo / p_corpo nulos = manter o atual. Só o autor, só tópico aberto.
CREATE OR REPLACE FUNCTION public.editar_topico(p_topico_id uuid, p_titulo text DEFAULT NULL, p_corpo text DEFAULT NULL)
RETURNS public.topicos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_titulo text := CASE WHEN p_titulo IS NULL THEN NULL ELSE regexp_replace(public.aue_aparar_texto(p_titulo), '\s+', ' ', 'g') END;
  v_corpo text := CASE WHEN p_corpo IS NULL THEN NULL ELSE public.aue_aparar_texto(p_corpo) END;
  v_topico public.topicos;
  v_linha public.topicos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF v_titulo IS NULL AND v_corpo IS NULL THEN
    PERFORM public.aue_falhar_conversa('22023', 'Nada para editar', 'nada_para_editar');
  END IF;
  IF v_titulo IS NOT NULL AND char_length(v_titulo) NOT BETWEEN 1 AND 120 THEN
    PERFORM public.aue_falhar_conversa('22023', 'Título precisa ter de 1 a 120 caracteres', 'titulo_invalido');
  END IF;
  IF v_corpo IS NOT NULL AND char_length(v_corpo) NOT BETWEEN 1 AND 1000 THEN
    PERFORM public.aue_falhar_conversa('22023', 'Texto do tópico precisa ter de 1 a 1000 caracteres', 'corpo_invalido');
  END IF;
  SELECT * INTO v_topico FROM public.topicos t WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado') FOR UPDATE;
  IF NOT FOUND THEN
    PERFORM public.aue_falhar_conversa('22023', 'Tópico não encontrado', 'topico_nao_encontrado');
  END IF;
  IF v_topico.autor_id <> auth.uid() THEN
    PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor');
  END IF;
  IF v_topico.status = 'fechado' THEN
    PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado', 'topico_fechado');
  END IF;
  UPDATE public.topicos
     SET titulo = coalesce(v_titulo, titulo), corpo = coalesce(v_corpo, corpo), editado_em = now()
   WHERE id = v_topico.id
  RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

CREATE OR REPLACE FUNCTION public.editar_resposta(p_resposta_id uuid, p_corpo text)
RETURNS public.respostas
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_corpo text := public.aue_aparar_texto(p_corpo);
  v_resposta public.respostas;
  v_status text;
  v_linha public.respostas;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF char_length(v_corpo) NOT BETWEEN 1 AND 500 THEN
    PERFORM public.aue_falhar_conversa('22023', 'Resposta precisa ter de 1 a 500 caracteres', 'resposta_invalida');
  END IF;
  SELECT r.* INTO v_resposta FROM public.respostas r
    JOIN public.topicos t ON t.id = r.topico_id AND t.status IN ('aberto', 'fechado')
   WHERE r.id = p_resposta_id AND r.status = 'visivel'
     FOR UPDATE OF r;
  IF NOT FOUND THEN
    PERFORM public.aue_falhar_conversa('22023', 'Resposta não encontrada', 'resposta_nao_encontrada');
  END IF;
  IF v_resposta.autor_id <> auth.uid() THEN
    PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor');
  END IF;
  SELECT t.status INTO v_status FROM public.topicos t WHERE t.id = v_resposta.topico_id;
  IF v_status = 'fechado' THEN
    PERFORM public.aue_falhar_conversa('P0001', 'Tópico fechado', 'topico_fechado');
  END IF;
  UPDATE public.respostas SET corpo = v_corpo, editado_em = now() WHERE id = v_resposta.id RETURNING * INTO v_linha;
  RETURN v_linha;
END;
$$;

-- Apagar = status 'removido'. Nunca DELETE físico (denúncia, auditoria, árvore).
CREATE OR REPLACE FUNCTION public.apagar_topico(p_topico_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_topico public.topicos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT * INTO v_topico FROM public.topicos t WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado') FOR UPDATE;
  IF NOT FOUND THEN
    PERFORM public.aue_falhar_conversa('22023', 'Tópico não encontrado', 'topico_nao_encontrado');
  END IF;
  IF v_topico.autor_id <> auth.uid() THEN
    PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor');
  END IF;
  UPDATE public.topicos SET status = 'removido' WHERE id = v_topico.id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.apagar_resposta(p_resposta_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_resposta public.respostas;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT r.* INTO v_resposta FROM public.respostas r
    JOIN public.topicos t ON t.id = r.topico_id AND t.status IN ('aberto', 'fechado')
   WHERE r.id = p_resposta_id AND r.status = 'visivel'
     FOR UPDATE OF r;
  IF NOT FOUND THEN
    PERFORM public.aue_falhar_conversa('22023', 'Resposta não encontrada', 'resposta_nao_encontrada');
  END IF;
  IF v_resposta.autor_id <> auth.uid() THEN
    PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor');
  END IF;
  UPDATE public.respostas SET status = 'removido' WHERE id = v_resposta.id;
  RETURN true;
END;
$$;

-- Mesma regra de proteção do causo (esconder_post_por_denuncias): 3 denunciantes
-- distintos escondem. Reabrir é decisão de moderação (issue #260).
CREATE OR REPLACE FUNCTION public.denunciar_topico(p_topico_id uuid, p_motivo text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF NOT EXISTS (SELECT 1 FROM public.topicos t WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado')) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Tópico não encontrado', 'topico_nao_encontrado');
  END IF;
  INSERT INTO public.denuncias_conversa (topico_id, usuario_id, motivo)
  VALUES (p_topico_id, auth.uid(), left(CASE WHEN char_length(public.aue_aparar_texto(p_motivo)) < 3 THEN 'Conteúdo impróprio' ELSE public.aue_aparar_texto(p_motivo) END, 500))
  ON CONFLICT (topico_id, usuario_id) WHERE topico_id IS NOT NULL DO NOTHING;
  IF (SELECT count(DISTINCT d.usuario_id) FROM public.denuncias_conversa d WHERE d.topico_id = p_topico_id) >= 3 THEN
    UPDATE public.topicos SET status = 'oculto' WHERE id = p_topico_id AND status IN ('aberto', 'fechado');
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.denunciar_resposta(p_resposta_id uuid, p_motivo text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF NOT EXISTS (
    SELECT 1 FROM public.respostas r JOIN public.topicos t ON t.id = r.topico_id AND t.status IN ('aberto', 'fechado')
     WHERE r.id = p_resposta_id AND r.status = 'visivel'
  ) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Resposta não encontrada', 'resposta_nao_encontrada');
  END IF;
  INSERT INTO public.denuncias_conversa (resposta_id, usuario_id, motivo)
  VALUES (p_resposta_id, auth.uid(), left(CASE WHEN char_length(public.aue_aparar_texto(p_motivo)) < 3 THEN 'Conteúdo impróprio' ELSE public.aue_aparar_texto(p_motivo) END, 500))
  ON CONFLICT (resposta_id, usuario_id) WHERE resposta_id IS NOT NULL DO NOTHING;
  IF (SELECT count(DISTINCT d.usuario_id) FROM public.denuncias_conversa d WHERE d.resposta_id = p_resposta_id) >= 3 THEN
    UPDATE public.respostas SET status = 'oculto' WHERE id = p_resposta_id AND status = 'visivel';
  END IF;
  RETURN true;
END;
$$;


-- -----------------------------------------------------------------------------
-- 5. Grants
-- -----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION
  public.aue_falhar_conversa(text, text, text),
  public.aue_aparar_texto(text),
  public.aue_exigir_participacao(uuid),
  public.aue_ler_topicos(text, uuid, integer, text, timestamptz, uuid, boolean),
  public.listar_topicos(text, integer, timestamptz, uuid, text, boolean),
  public.obter_topico(uuid),
  public.listar_respostas_do_topico(uuid, integer, timestamptz, uuid),
  public.criar_topico(text, text, text, uuid, boolean),
  public.responder_topico(uuid, text, uuid),
  public.editar_topico(uuid, text, text),
  public.editar_resposta(uuid, text),
  public.apagar_topico(uuid),
  public.apagar_resposta(uuid),
  public.denunciar_topico(uuid, text),
  public.denunciar_resposta(uuid, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.listar_topicos(text, integer, timestamptz, uuid, text, boolean),
  public.obter_topico(uuid),
  public.listar_respostas_do_topico(uuid, integer, timestamptz, uuid)
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.criar_topico(text, text, text, uuid, boolean),
  public.responder_topico(uuid, text, uuid),
  public.editar_topico(uuid, text, text),
  public.editar_resposta(uuid, text),
  public.apagar_topico(uuid),
  public.apagar_resposta(uuid),
  public.denunciar_topico(uuid, text),
  public.denunciar_resposta(uuid, text)
TO authenticated;

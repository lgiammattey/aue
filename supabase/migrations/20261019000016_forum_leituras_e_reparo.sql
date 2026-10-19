-- =============================================================================
-- 20261019000016 — Fórum: leituras que a UI exige e reparo do espelho (PR 1b)
-- ADR 0010 ("O que a implementação da migração decidiu"), issues #256, #258,
-- #259 e #227. Depende da 20261019000014 e da 20261019000015.
--
-- O QUE FAZ (só objetos NOVOS, nomes novos)
--   1. Leituras públicas (anon + authenticated):
--        listar_comunidades_do_forum()        diretório com números reais
--        obter_comunidade_do_forum(slug)      capa de /c/:slug
--        listar_topicos_do_autor(handle, ...) aba "Tópicos" de /u/:handle
--        listar_respostas_do_autor(handle,...)aba "Respostas" de /u/:handle
--        explorar_topicos(...)                /explorar, sempre com comunidade
--   2. aue_reconciliar_acervo(): REPARA o que o espelho (20261019000015) perdeu.
--      Interna, sem grant a ninguém. Roda uma vez no fim desta migração.
--   3. Dois índices parciais em `topicos` para o Explorar (ordem global).
--
-- O QUE NÃO FAZ
--   - Não altera, remove nem renomeia objeto existente (nem as 14 e 15).
--     aue_conferir_acervo continua como está.
--   - Não copia post nem comentário que falta (isso é aue_migrar_acervo_para_topicos).
--
-- REGRAS DE VISIBILIDADE (iguais às de listar_topicos / listar_respostas_do_topico)
--   - Tópico visível = status aberto ou fechado E autor com conta promovida
--     (aue_e_conta_promovida). Resposta visível = status 'visivel' E autor promovido
--     E tópico visível. Oculto e removido nunca saem.
--   - Só aparece comunidade com slug (é o que a UI usa no link /c/:slug). Tópico de
--     grupo antigo sem slug não entra em lista nenhuma desta migração.
--   - Nenhum caminho de áudio sai daqui: estas leituras listam texto e endereço de
--     navegação (comunidade + tópico). O player continua em obter_topico.
--
-- NÃO ENUMERA PERFIL: handle inexistente, conta sem promoção e conta promovida
-- sem conteúdo devolvem a MESMA coisa (zero linhas, sem erro).
--
-- COMO O OPERADOR USA aue_reconciliar_acervo()
--   No SQL Editor do Supabase (papel postgres), quando suspeitar que um esconder,
--   mostrar ou apagar do feed antigo não chegou ao tópico (WARNING "aue: espelho ...
--   falhou" no log, ou aue_conferir_acervo acusando):
--        SELECT public.aue_reconciliar_acervo();
--   Devolve jsonb com quantos registros corrigiu, por tipo, e dois contadores
--   informativos (posts_sem_topico, comentarios_sem_resposta). Se algum desses dois
--   for maior que zero, rode antes SELECT public.aue_migrar_acervo_para_topicos();.
--   É idempotente: a segunda chamada devolve tudo zero. Nunca reabre tópico
--   fechado, removido ou ocultado por denúncia do lado novo (3 denunciantes).
-- =============================================================================


-- Se não conseguir a trava em 5 s, aborta: melhor falhar o deploy que enfileirar o app inteiro.
SET LOCAL lock_timeout = '5s';

-- -----------------------------------------------------------------------------
-- 1. Índices do Explorar (ordem global, só o que a leitura pública vê)
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS topicos_explorar_atividade
  ON public.topicos (ultima_atividade_em DESC, id DESC)
  WHERE status IN ('aberto', 'fechado');
CREATE INDEX IF NOT EXISTS topicos_explorar_recentes
  ON public.topicos (criado_em DESC, id DESC)
  WHERE status IN ('aberto', 'fechado');


-- -----------------------------------------------------------------------------
-- 2. Helpers internos (sem grant)
-- -----------------------------------------------------------------------------

-- Id do autor a partir do handle, só se a conta é promovida. Sem promoção ou sem
-- perfil: NULL, igual para os dois casos (não deixa distinguir).
CREATE OR REPLACE FUNCTION public.aue_autor_publico_por_handle(p_handle text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT pf.id FROM public.perfis pf
   WHERE lower(pf.handle) = lower(regexp_replace(btrim(coalesce(p_handle, '')), '^@', ''))
     AND public.aue_e_conta_promovida(pf.id)
   LIMIT 1
$$;

-- Comunidades com números reais, uma só consulta para listar e obter (paridade).
--   membros_total   membros_grupo de conta promovida (mesma regra das leituras)
--   topicos_total   tópicos visíveis (aberto/fechado, autor promovido)
--   ultima_atividade_em  maior atividade entre os tópicos visíveis (NULL se não há)
--   sou_membro      false para visitante e para conta sem promoção. Entrar no Bonde
--                   Geral é automático só na ESCRITA (aue_exigir_participacao) e em
--                   listar_minhas_comunidades; esta leitura é STABLE e não grava.
-- O 'acervo' só aparece se tiver tópico visível.
CREATE OR REPLACE FUNCTION public.aue_ler_comunidades_do_forum(p_slug text)
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT g.id, g.slug, g.nome::text, g.descricao, g.icone,
         (SELECT count(*) FROM public.membros_grupo m
           WHERE m.group_id = g.id AND public.aue_e_conta_promovida(m.user_id)),
         tp.total, tp.ultima,
         coalesce(
           auth.uid() IS NOT NULL
           AND public.aue_e_conta_promovida(auth.uid())
           AND EXISTS (SELECT 1 FROM public.membros_grupo m WHERE m.group_id = g.id AND m.user_id = auth.uid()),
           false)
    FROM public.grupos g
    CROSS JOIN LATERAL (
      SELECT count(*) AS total, max(t.ultima_atividade_em) AS ultima
        FROM public.topicos t
       WHERE t.comunidade_id = g.id
         AND t.status IN ('aberto', 'fechado')
         AND public.aue_e_conta_promovida(t.autor_id)
    ) tp
   WHERE g.slug IS NOT NULL
     AND (p_slug IS NULL OR lower(g.slug) = lower(btrim(p_slug)))
     AND (lower(g.slug) <> 'acervo' OR tp.total > 0)
   ORDER BY g.nome, g.id
$$;


-- -----------------------------------------------------------------------------
-- 3. Leituras públicas (anon + authenticated)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.listar_comunidades_do_forum()
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.aue_ler_comunidades_do_forum(NULL);
END;
$$;

-- Slug inexistente (ou sem tópico, no caso do acervo) não devolve linha: a UI
-- mostra "comunidade não encontrada" e nunca o mural de outra.
CREATE OR REPLACE FUNCTION public.obter_comunidade_do_forum(p_slug text)
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF nullif(btrim(coalesce(p_slug, '')), '') IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT * FROM public.aue_ler_comunidades_do_forum(p_slug);
END;
$$;

-- Tópicos iniciados por uma pessoa, do mais novo para o mais antigo.
-- Cursor = (criado_em, id) da ÚLTIMA linha da página anterior (string do servidor,
-- com microssegundo; o adaptador não passa por Date).
CREATE OR REPLACE FUNCTION public.listar_topicos_do_autor(
  p_handle text,
  p_limite integer DEFAULT 30,
  p_cursor_criado_em timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, comunidade_id uuid, comunidade_slug text, comunidade_nome text,
  titulo text, corpo text, status text, fixado boolean,
  criado_em timestamptz, editado_em timestamptz, ultima_atividade_em timestamptz,
  respostas_total bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_autor uuid;
BEGIN
  -- Antes de olhar o handle: o erro de cursor não pode revelar se a pessoa existe.
  IF (p_cursor_criado_em IS NULL) <> (p_cursor_id IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Cursor inválido', 'cursor_invalido');
  END IF;
  v_autor := public.aue_autor_publico_por_handle(p_handle);
  IF v_autor IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT t.id, g.id, g.slug, g.nome::text,
         t.titulo, t.corpo, t.status, t.fixado,
         t.criado_em, t.editado_em, t.ultima_atividade_em,
         (SELECT count(*) FROM public.respostas x
           WHERE x.topico_id = t.id AND x.status = 'visivel' AND public.aue_e_conta_promovida(x.autor_id))
    FROM public.topicos t
    JOIN public.grupos g ON g.id = t.comunidade_id AND g.slug IS NOT NULL
   WHERE t.autor_id = v_autor
     AND t.status IN ('aberto', 'fechado')
     AND (p_cursor_id IS NULL OR (t.criado_em, t.id) < (p_cursor_criado_em, p_cursor_id))
   ORDER BY t.criado_em DESC, t.id DESC
   LIMIT greatest(1, least(coalesce(p_limite, 30), 100));
END;
$$;

-- Respostas escritas por uma pessoa, cada uma com o tópico e a comunidade onde
-- vive (para linkar /c/:slug/t/:id). Só resposta visível, em tópico que a leitura
-- pública abre (tópico oculto/removido ou de autor sem promoção esconde a resposta).
CREATE OR REPLACE FUNCTION public.listar_respostas_do_autor(
  p_handle text,
  p_limite integer DEFAULT 30,
  p_cursor_criado_em timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, topico_id uuid, topico_titulo text,
  comunidade_id uuid, comunidade_slug text, comunidade_nome text,
  pai_id uuid, nivel smallint, corpo text, criado_em timestamptz, editado_em timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_autor uuid;
BEGIN
  IF (p_cursor_criado_em IS NULL) <> (p_cursor_id IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Cursor inválido', 'cursor_invalido');
  END IF;
  v_autor := public.aue_autor_publico_por_handle(p_handle);
  IF v_autor IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT r.id, t.id, t.titulo,
         g.id, g.slug, g.nome::text,
         r.pai_id, r.nivel, r.corpo, r.criado_em, r.editado_em
    FROM public.respostas r
    JOIN public.topicos t ON t.id = r.topico_id AND t.status IN ('aberto', 'fechado')
                         AND public.aue_e_conta_promovida(t.autor_id)
    JOIN public.grupos g ON g.id = t.comunidade_id AND g.slug IS NOT NULL
   WHERE r.autor_id = v_autor
     AND r.status = 'visivel'
     AND (p_cursor_id IS NULL OR (r.criado_em, r.id) < (p_cursor_criado_em, p_cursor_id))
   ORDER BY r.criado_em DESC, r.id DESC
   LIMIT greatest(1, least(coalesce(p_limite, 30), 100));
END;
$$;

-- Tópicos de TODAS as comunidades, cada um com a sua (a UI nunca mostra tópico sem
-- comunidade: o JOIN com grupos exige slug). Sem fixados: fixar vale dentro da
-- comunidade, não no Explorar.
--   p_ordem 'atividade' (padrão): ultima_atividade_em DESC, id DESC
--   p_ordem 'recentes'          : criado_em DESC, id DESC
-- Cursor = (p_cursor_valor, p_cursor_id) da última linha, onde o valor é a coluna
-- da ordem escolhida (ultima_atividade_em ou criado_em).
CREATE OR REPLACE FUNCTION public.explorar_topicos(
  p_limite integer DEFAULT 30,
  p_cursor_valor timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_ordem text DEFAULT 'atividade'
)
RETURNS TABLE (
  id uuid, comunidade_id uuid, comunidade_slug text, comunidade_nome text,
  autor_id uuid, apelido text, handle text, url_do_avatar text,
  titulo text, status text, fixado boolean,
  criado_em timestamptz, ultima_atividade_em timestamptz,
  respostas_total bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ordem text := coalesce(nullif(btrim(p_ordem), ''), 'atividade');
  v_limite integer := greatest(1, least(coalesce(p_limite, 30), 100));
  v_coluna text;
  v_filtro text := '';
BEGIN
  IF v_ordem NOT IN ('atividade', 'recentes') THEN
    PERFORM public.aue_falhar_conversa('22023', 'Ordem inválida', 'ordem_invalida');
  END IF;
  IF (p_cursor_valor IS NULL) <> (p_cursor_id IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Cursor inválido', 'cursor_invalido');
  END IF;
  v_coluna := CASE v_ordem WHEN 'atividade' THEN 't.ultima_atividade_em' ELSE 't.criado_em' END;
  IF p_cursor_id IS NOT NULL THEN
    v_filtro := format('AND (%s, t.id) < ($1, $2)', v_coluna);
  END IF;

  RETURN QUERY EXECUTE format($q$
    SELECT t.id, g.id, g.slug, g.nome::text,
           t.autor_id, pf.apelido, pf.handle, pf.url_do_avatar,
           t.titulo, t.status, t.fixado,
           t.criado_em, t.ultima_atividade_em,
           (SELECT count(*) FROM public.respostas x
             WHERE x.topico_id = t.id AND x.status = 'visivel' AND public.aue_e_conta_promovida(x.autor_id))
      FROM public.topicos t
      JOIN public.grupos g ON g.id = t.comunidade_id AND g.slug IS NOT NULL
      JOIN public.perfis pf ON pf.id = t.autor_id AND public.aue_e_conta_promovida(t.autor_id)
     WHERE t.status IN ('aberto', 'fechado')
       %s
     ORDER BY %s DESC, t.id DESC
     LIMIT $3
  $q$, v_filtro, v_coluna)
  USING p_cursor_valor, p_cursor_id, v_limite;
END;
$$;


-- -----------------------------------------------------------------------------
-- 4. Reparo do espelho (interna, sem grant)
-- -----------------------------------------------------------------------------

-- Faz o que os triggers de esconder/mostrar/apagar do feed antigo teriam feito e
-- não fizeram (o espelho engole erro de propósito e só deixa WARNING). Idempotente.
--
--   a) post apagado        -> tópico removido e SEM o conteúdo (titulo, corpo, áudio),
--                             igual a aue_trigger_espelhar_post_apagado. Também limpa
--                             tópico que já estava 'removido' mas ficou com conteúdo.
--   b) post escondido      -> tópico aberto/fechado vira oculto.
--   c) post visível de novo-> tópico oculto vira aberto, MENOS se 3 ou mais pessoas
--                             distintas o denunciaram no lado novo (denunciar_topico):
--                             esse oculto é da denúncia, não do espelho.
--   d) comentário apagado  -> resposta removida com corpo '[removido]'.
--
-- Nunca toca tópico fechado/removido pelo lado novo cujo post segue vivo, nem
-- resposta apagada/oculta pelo lado novo cujo comentário segue vivo. Não mexe em
-- ultima_atividade_em, nem copia o que falta.
-- Limite conhecido: se uma pessoa que denunciou for excluída (denuncias_conversa
-- cai em cascata) e o total baixar de 3, um oculto por denúncia é indistinguível
-- de um oculto perdido e pode ser reaberto. Moderação de verdade é a issue #260.
CREATE OR REPLACE FUNCTION public.aue_reconciliar_acervo()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_removidos bigint; v_ocultados bigint; v_reabertos bigint; v_respostas bigint;
  v_sem_topico bigint; v_sem_resposta bigint;
BEGIN
  -- a) apagar
  WITH x AS (
    UPDATE public.topicos t
       SET status = 'removido', titulo = 'Tópico removido', corpo = '',
           caminho_do_audio_da_casa = NULL, resultado_id = NULL, consentimento_audio_publico = false
     WHERE t.legado_post_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.posts_comunidade p WHERE p.id = t.legado_post_id)
       AND (t.status <> 'removido' OR t.titulo <> 'Tópico removido' OR t.corpo <> ''
            OR t.caminho_do_audio_da_casa IS NOT NULL OR t.resultado_id IS NOT NULL
            OR t.consentimento_audio_publico)
    RETURNING 1
  ) SELECT count(*) INTO v_removidos FROM x;

  -- b) esconder
  WITH x AS (
    UPDATE public.topicos t SET status = 'oculto'
     WHERE t.legado_post_id IS NOT NULL AND t.status IN ('aberto', 'fechado')
       AND EXISTS (SELECT 1 FROM public.posts_comunidade p WHERE p.id = t.legado_post_id AND p.esta_escondido)
    RETURNING 1
  ) SELECT count(*) INTO v_ocultados FROM x;

  -- c) mostrar de novo (a denúncia do lado novo continua valendo)
  WITH x AS (
    UPDATE public.topicos t SET status = 'aberto'
     WHERE t.legado_post_id IS NOT NULL AND t.status = 'oculto'
       AND EXISTS (SELECT 1 FROM public.posts_comunidade p WHERE p.id = t.legado_post_id AND NOT p.esta_escondido)
       AND (SELECT count(DISTINCT d.usuario_id) FROM public.denuncias_conversa d WHERE d.topico_id = t.id) < 3
    RETURNING 1
  ) SELECT count(*) INTO v_reabertos FROM x;

  -- d) comentário apagado
  WITH x AS (
    UPDATE public.respostas r SET status = 'removido', corpo = '[removido]'
     WHERE r.legado_comentario_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.comentarios c WHERE c.id = r.legado_comentario_id)
       AND (r.status <> 'removido' OR r.corpo <> '[removido]')
    RETURNING 1
  ) SELECT count(*) INTO v_respostas FROM x;

  -- Só informativo: o que este reparo NÃO resolve (falta cópia).
  SELECT count(*) INTO v_sem_topico FROM public.posts_comunidade p
   WHERE NOT EXISTS (SELECT 1 FROM public.topicos t WHERE t.legado_post_id = p.id);
  SELECT count(*) INTO v_sem_resposta FROM public.comentarios c
   WHERE c.post_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.respostas r WHERE r.legado_comentario_id = c.id);

  RETURN jsonb_build_object(
    'topicos_removidos', v_removidos, 'topicos_ocultados', v_ocultados,
    'topicos_reabertos', v_reabertos, 'respostas_removidas', v_respostas,
    'corrigidos', v_removidos + v_ocultados + v_reabertos + v_respostas,
    'posts_sem_topico', v_sem_topico, 'comentarios_sem_resposta', v_sem_resposta);
END;
$$;


-- -----------------------------------------------------------------------------
-- 5. Grants
-- -----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION
  public.aue_autor_publico_por_handle(text),
  public.aue_ler_comunidades_do_forum(text),
  public.listar_comunidades_do_forum(),
  public.obter_comunidade_do_forum(text),
  public.listar_topicos_do_autor(text, integer, timestamptz, uuid),
  public.listar_respostas_do_autor(text, integer, timestamptz, uuid),
  public.explorar_topicos(integer, timestamptz, uuid, text),
  public.aue_reconciliar_acervo()
FROM PUBLIC, anon, authenticated;

-- Reparo: nem o service_role. Só o operador (papel postgres) executa.
REVOKE ALL ON FUNCTION public.aue_reconciliar_acervo() FROM service_role;

GRANT EXECUTE ON FUNCTION
  public.listar_comunidades_do_forum(),
  public.obter_comunidade_do_forum(text),
  public.listar_topicos_do_autor(text, integer, timestamptz, uuid),
  public.listar_respostas_do_autor(text, integer, timestamptz, uuid),
  public.explorar_topicos(integer, timestamptz, uuid, text)
TO anon, authenticated;


-- -----------------------------------------------------------------------------
-- 6. Reparo, uma vez. Idempotente: rodar de novo (ou reaplicar esta migração) não
--    muda nada. Falha alto de propósito: reparo que quebra não pode ficar calado.
-- -----------------------------------------------------------------------------

DO $$
DECLARE v_resumo jsonb;
BEGIN
  v_resumo := public.aue_reconciliar_acervo();
  RAISE NOTICE 'Acervo reconciliado: %', v_resumo;
END;
$$;

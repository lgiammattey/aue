-- =============================================================================
-- 20261022185000 — Pautas temáticas de comunidade
--
-- Agrupa tópicos existentes para leitura sem reescrever nenhuma identidade:
-- post/tópico, respostas, reações, salvos, anexos, resultado e áudio continuam
-- nos seus IDs originais. A pauta é só um invólucro de navegação.
-- =============================================================================

SET LOCAL lock_timeout = '5s';

-- A pauta é um tópico sintético identificado fora de `topicos`: não há flag
-- reutilizada nem se mistura a origem da publicação. `chave` permite que o seed
-- administrativo seja idempotente sem usar título como identidade.
CREATE TABLE IF NOT EXISTS public.pautas_de_topicos (
  pauta_id uuid PRIMARY KEY REFERENCES public.topicos(id) ON DELETE CASCADE,
  chave text NOT NULL UNIQUE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pautas_de_topicos_chave_valida CHECK (
    char_length(btrim(chave)) BETWEEN 1 AND 80
    AND chave = lower(btrim(chave))
    AND chave ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

-- Um tópico original só pode morar em uma pauta. A posição é explícita para
-- que a organização não dependa da data original nem de ordem física da tabela.
CREATE TABLE IF NOT EXISTS public.topicos_em_pauta (
  topico_id uuid PRIMARY KEY REFERENCES public.topicos(id) ON DELETE CASCADE,
  pauta_id uuid NOT NULL REFERENCES public.pautas_de_topicos(pauta_id) ON DELETE CASCADE,
  posicao smallint NOT NULL,
  CONSTRAINT topicos_em_pauta_nao_agrupa_a_si_mesmo CHECK (topico_id <> pauta_id),
  CONSTRAINT topicos_em_pauta_posicao_valida CHECK (posicao BETWEEN 1 AND 200),
  CONSTRAINT topicos_em_pauta_posicao_unica UNIQUE (pauta_id, posicao)
);

CREATE INDEX IF NOT EXISTS topicos_em_pauta_por_pauta
  ON public.topicos_em_pauta (pauta_id, posicao);

ALTER TABLE public.pautas_de_topicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topicos_em_pauta ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pautas_de_topicos, public.topicos_em_pauta FROM PUBLIC, anon, authenticated;

-- O vínculo é editorial, mas não pode atravessar comunidades nem transformar
-- uma pauta em entrada de outra. A tabela é fechada ao cliente; ainda assim a
-- invariável fica no banco para qualquer seed/admin futuro.
CREATE OR REPLACE FUNCTION public.aue_validar_topico_em_pauta()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
DECLARE v_comunidade_da_entrada uuid; v_comunidade_da_pauta uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id = NEW.topico_id) THEN
    RAISE EXCEPTION 'Uma pauta não pode ser entrada de outra pauta';
  END IF;
  SELECT t.comunidade_id INTO v_comunidade_da_entrada FROM public.topicos t WHERE t.id = NEW.topico_id;
  SELECT t.comunidade_id INTO v_comunidade_da_pauta FROM public.topicos t WHERE t.id = NEW.pauta_id;
  IF v_comunidade_da_entrada IS NULL OR v_comunidade_da_pauta IS NULL
     OR v_comunidade_da_entrada IS DISTINCT FROM v_comunidade_da_pauta THEN
    RAISE EXCEPTION 'Tópico e pauta precisam pertencer à mesma comunidade';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validar_topico_em_pauta ON public.topicos_em_pauta;
CREATE TRIGGER validar_topico_em_pauta
  BEFORE INSERT OR UPDATE OF topico_id, pauta_id ON public.topicos_em_pauta
  FOR EACH ROW EXECUTE FUNCTION public.aue_validar_topico_em_pauta();
REVOKE ALL ON FUNCTION public.aue_validar_topico_em_pauta() FROM PUBLIC, anon, authenticated;

-- `aue_ler_topicos` segue sendo a única projeção de um tópico. Na listagem de
-- comunidade, entradas agrupadas cedem lugar à pauta; por ID explícito
-- (`obter_topico`, feed/perfil e links antigos) elas continuam legíveis.
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
       -- Só a página de uma comunidade troca as entradas pela pauta. Qualquer
       -- leitura por ID preserva a publicação original para link/feed/perfil.
       AND ($2 IS NOT NULL OR NOT EXISTS (
         SELECT 1 FROM public.topicos_em_pauta ep WHERE ep.topico_id = t.id
       ))
       %s
     ORDER BY %s
     LIMIT $3
  $q$, v_filtro, v_ordenacao)
  USING p_slug, p_topico_id, v_limite, v_ordem, coalesce(p_cursor_fixado, false), p_cursor_valor, p_cursor_id;
END;
$$;

-- Explorar e perfil são projeções independentes da lista da comunidade. Eles
-- não escondem os 40 posts originais; retiram somente os nove invólucros.
CREATE OR REPLACE FUNCTION public.explorar_topicos(
  p_limite integer DEFAULT 30,
  p_cursor_valor timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_ordem text DEFAULT 'atividade'
)
RETURNS TABLE (
  id uuid, comunidade_id uuid, comunidade_slug text, comunidade_nome text,
  autor_id uuid, apelido text, handle text, url_do_avatar text,
  titulo text, status text, fixado boolean, criado_em timestamptz,
  ultima_atividade_em timestamptz, respostas_total bigint
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
      JOIN public.grupos g ON g.id = t.comunidade_id AND nullif(btrim(g.slug), '') IS NOT NULL
      JOIN public.perfis pf ON pf.id = t.autor_id AND public.aue_e_conta_promovida(t.autor_id)
     WHERE t.status IN ('aberto', 'fechado')
       AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id = t.id)
       %s
     ORDER BY %s DESC, t.id DESC
     LIMIT $3
  $q$, v_filtro, v_coluna)
  USING p_cursor_valor, p_cursor_id, v_limite;
END;
$$;

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
    JOIN public.grupos g ON g.id = t.comunidade_id AND nullif(btrim(g.slug), '') IS NOT NULL
   WHERE t.autor_id = v_autor
     AND t.status IN ('aberto', 'fechado')
     AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id = t.id)
     AND (p_cursor_id IS NULL OR (t.criado_em, t.id) < (p_cursor_criado_em, p_cursor_id))
   ORDER BY t.criado_em DESC, t.id DESC
   LIMIT greatest(1, least(coalesce(p_limite, 30), 100));
END;
$$;

-- Resolve tanto a URL canônica da pauta quanto um link antigo de uma entrada.
-- A projeção vem de `aue_ler_topicos`, portanto autor, resposta, resultado e
-- caminhos de áudio obedecem exatamente às mesmas regras públicas do fórum.
CREATE OR REPLACE FUNCTION public.obter_pauta_por_topico(p_topico_id uuid)
RETURNS TABLE (
  pauta jsonb,
  entrada jsonb,
  entrada_em_foco_id uuid,
  posicao smallint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  WITH resolvida AS (
    SELECT ep.pauta_id, p_topico_id AS entrada_em_foco_id
      FROM public.topicos_em_pauta ep
     WHERE ep.topico_id = p_topico_id
    UNION ALL
    SELECT p.pauta_id, NULL::uuid AS entrada_em_foco_id
      FROM public.pautas_de_topicos p
     WHERE p.pauta_id = p_topico_id
     LIMIT 1
  ), cabecalho AS (
    SELECT r.pauta_id, r.entrada_em_foco_id, to_jsonb(t) AS pauta
      FROM resolvida r
      CROSS JOIN LATERAL public.aue_ler_topicos(NULL, r.pauta_id, 1, 'atividade', NULL, NULL, false) t
  )
  SELECT c.pauta, to_jsonb(t), c.entrada_em_foco_id, ep.posicao
    FROM cabecalho c
    JOIN public.topicos_em_pauta ep ON ep.pauta_id = c.pauta_id
    CROSS JOIN LATERAL public.aue_ler_topicos(NULL, ep.topico_id, 1, 'atividade', NULL, NULL, false) t
   ORDER BY ep.posicao;
$$;

REVOKE ALL ON FUNCTION public.obter_pauta_por_topico(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obter_pauta_por_topico(uuid) TO anon, authenticated;

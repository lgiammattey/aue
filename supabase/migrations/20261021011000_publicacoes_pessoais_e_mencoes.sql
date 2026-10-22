-- =============================================================================
-- Publicações pessoais e marcações
--
-- O post pessoal usa a mesma conversa (tópico, resposta, anexo e reação) das
-- comunidades. A diferença é explícita: ele não recebe comunidade_id e nunca
-- entra em uma roda por acidente.
-- =============================================================================

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.topicos
  ALTER COLUMN comunidade_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'comunidade';

ALTER TABLE public.topicos DROP CONSTRAINT IF EXISTS topicos_origem_coerente;
ALTER TABLE public.topicos ADD CONSTRAINT topicos_origem_coerente CHECK (
  (origem = 'comunidade' AND comunidade_id IS NOT NULL)
  OR (origem = 'pessoal' AND comunidade_id IS NULL AND fixado = false)
);

CREATE INDEX IF NOT EXISTS topicos_pessoais_por_data
  ON public.topicos (criado_em DESC, id DESC)
  WHERE origem = 'pessoal' AND status IN ('aberto', 'fechado');

CREATE INDEX IF NOT EXISTS topicos_pessoais_por_autor
  ON public.topicos (autor_id, criado_em DESC, id DESC)
  WHERE origem = 'pessoal' AND status IN ('aberto', 'fechado');

CREATE TABLE IF NOT EXISTS public.mencoes_de_publicacoes (
  topico_id uuid NOT NULL REFERENCES public.topicos(id) ON DELETE CASCADE,
  perfil_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (topico_id, perfil_id)
);

CREATE TABLE IF NOT EXISTS public.notificacoes_de_mencao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  topico_id uuid NOT NULL REFERENCES public.topicos(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  lida_em timestamptz,
  CONSTRAINT notificacao_de_mencao_unica UNIQUE (destinatario_id, topico_id)
);

CREATE INDEX IF NOT EXISTS notificacoes_de_mencao_por_destinatario
  ON public.notificacoes_de_mencao (destinatario_id, lida_em, criado_em DESC);

ALTER TABLE public.mencoes_de_publicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_de_mencao ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mencoes_de_publicacoes, public.notificacoes_de_mencao FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.aue_publicacoes_pessoais_por(
  p_autor_id uuid DEFAULT NULL,
  p_marcado_id uuid DEFAULT NULL,
  p_limite integer DEFAULT 30,
  p_cursor_criado_em timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, autor_id uuid, apelido text, handle text, url_do_avatar text,
  titulo text, corpo text, criado_em timestamptz, respostas_total bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF (p_cursor_criado_em IS NULL) <> (p_cursor_id IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Cursor inválido', 'cursor_invalido');
  END IF;
  IF p_autor_id IS NOT NULL AND p_marcado_id IS NOT NULL THEN
    PERFORM public.aue_falhar_conversa('22023', 'Filtro inválido', 'filtro_invalido');
  END IF;

  RETURN QUERY
  SELECT t.id, t.autor_id, pf.apelido, pf.handle, pf.url_do_avatar,
         t.titulo, t.corpo, t.criado_em,
         (SELECT count(*) FROM public.respostas r
           WHERE r.topico_id = t.id AND r.status = 'visivel' AND public.aue_e_conta_promovida(r.autor_id))
    FROM public.topicos t
    JOIN public.perfis pf ON pf.id = t.autor_id AND public.aue_e_conta_promovida(t.autor_id)
   WHERE t.origem = 'pessoal'
     AND t.status IN ('aberto', 'fechado')
     AND (p_autor_id IS NULL OR t.autor_id = p_autor_id)
     AND (p_marcado_id IS NULL OR EXISTS (
       SELECT 1 FROM public.mencoes_de_publicacoes m
        WHERE m.topico_id = t.id AND m.perfil_id = p_marcado_id
     ))
     AND (p_cursor_id IS NULL OR (t.criado_em, t.id) < (p_cursor_criado_em, p_cursor_id))
   ORDER BY t.criado_em DESC, t.id DESC
   LIMIT greatest(1, least(coalesce(p_limite, 30), 100));
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_publicacoes_pessoais(
  p_limite integer DEFAULT 30,
  p_cursor_criado_em timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, autor_id uuid, apelido text, handle text, url_do_avatar text,
  titulo text, corpo text, criado_em timestamptz, respostas_total bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT * FROM public.aue_publicacoes_pessoais_por(NULL, NULL, p_limite, p_cursor_criado_em, p_cursor_id); $$;

CREATE OR REPLACE FUNCTION public.listar_publicacoes_pessoais_do_autor(
  p_handle text,
  p_limite integer DEFAULT 30,
  p_cursor_criado_em timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, autor_id uuid, apelido text, handle text, url_do_avatar text,
  titulo text, corpo text, criado_em timestamptz, respostas_total bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_autor uuid;
BEGIN
  v_autor := public.aue_autor_publico_por_handle(p_handle);
  IF v_autor IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT * FROM public.aue_publicacoes_pessoais_por(v_autor, NULL, p_limite, p_cursor_criado_em, p_cursor_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_publicacoes_marcadas(
  p_handle text,
  p_limite integer DEFAULT 30,
  p_cursor_criado_em timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, autor_id uuid, apelido text, handle text, url_do_avatar text,
  titulo text, corpo text, criado_em timestamptz, respostas_total bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_marcado uuid;
BEGIN
  v_marcado := public.aue_autor_publico_por_handle(p_handle);
  IF v_marcado IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT * FROM public.aue_publicacoes_pessoais_por(NULL, v_marcado, p_limite, p_cursor_criado_em, p_cursor_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.criar_publicacao_pessoal_com_anexo(
  p_titulo text, p_corpo text, p_anexo_tipo text DEFAULT NULL,
  p_anexo_caminho text DEFAULT NULL, p_anexo_mime text DEFAULT NULL,
  p_anexo_tamanho_bytes integer DEFAULT NULL, p_anexo_duracao_ms integer DEFAULT NULL,
  p_url_video text DEFAULT NULL
) RETURNS public.topicos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_corpo text := public.aue_aparar_texto(p_corpo);
  v_titulo text := regexp_replace(public.aue_aparar_texto(p_titulo), '\s+', ' ', 'g');
  v_anexo record;
  v_linha public.topicos;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  SELECT * INTO v_anexo FROM public.aue_validar_anexo_do_forum(
    p_anexo_tipo, p_anexo_caminho, p_anexo_mime, p_anexo_tamanho_bytes, p_anexo_duracao_ms, p_url_video
  );
  IF char_length(v_corpo) > 180 OR (char_length(v_corpo) = 0 AND v_anexo.tipo IS NULL) THEN
    PERFORM public.aue_falhar_conversa('22023', 'Texto da publicação precisa ter até 180 caracteres ou um anexo', 'corpo_invalido');
  END IF;
  IF char_length(v_titulo) = 0 THEN v_titulo := coalesce(nullif(left(v_corpo, 120), ''), 'Mídia no perfil'); END IF;
  IF char_length(v_titulo) > 120 THEN PERFORM public.aue_falhar_conversa('22023', 'Título inválido', 'titulo_invalido'); END IF;

  INSERT INTO public.topicos (
    comunidade_id, origem, autor_id, titulo, corpo,
    anexo_tipo, anexo_caminho, anexo_mime, anexo_tamanho_bytes, anexo_duracao_ms, video_externo_url
  ) VALUES (
    NULL, 'pessoal', auth.uid(), v_titulo, v_corpo,
    v_anexo.tipo, v_anexo.caminho, v_anexo.mime, v_anexo.tamanho_bytes, v_anexo.duracao_ms, v_anexo.url_video
  ) RETURNING * INTO v_linha;

  WITH handles AS (
    SELECT DISTINCT (correspondencia)[2] AS handle
      FROM regexp_matches(lower(v_corpo), '(^|[^a-z0-9_])@([a-z0-9_]{3,20})', 'g') AS correspondencia
  ), destinatarios AS (
    SELECT pf.id FROM public.perfis pf JOIN handles h ON h.handle = lower(pf.handle)
     WHERE pf.id <> auth.uid() AND public.aue_e_conta_promovida(pf.id)
  ), gravadas AS (
    INSERT INTO public.mencoes_de_publicacoes (topico_id, perfil_id)
    SELECT v_linha.id, d.id FROM destinatarios d
    ON CONFLICT DO NOTHING
    RETURNING perfil_id
  )
  INSERT INTO public.notificacoes_de_mencao (destinatario_id, autor_id, topico_id)
  SELECT perfil_id, auth.uid(), v_linha.id FROM gravadas
  ON CONFLICT (destinatario_id, topico_id) DO NOTHING;

  RETURN v_linha;
END;
$$;

-- Comentário em publicação pessoal não exige entrada em comunidade.
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
  IF v_topico.origem = 'comunidade' THEN PERFORM public.aue_exigir_participacao(v_topico.comunidade_id); END IF;
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

CREATE OR REPLACE FUNCTION public.listar_minhas_notificacoes_de_mencao()
RETURNS TABLE (
  id uuid, topico_id uuid, criado_em timestamptz, lida_em timestamptz,
  autor_id uuid, apelido text, handle text, url_do_avatar text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT n.id, n.topico_id, n.criado_em, n.lida_em, p.id, p.apelido, p.handle, p.url_do_avatar
    FROM public.notificacoes_de_mencao n
    JOIN public.perfis p ON p.id = n.autor_id AND public.aue_e_conta_promovida(p.id)
   WHERE n.destinatario_id = auth.uid()
   ORDER BY n.criado_em DESC
   LIMIT 30;
$$;

CREATE OR REPLACE FUNCTION public.marcar_notificacoes_de_mencao_como_lidas(p_ids uuid[])
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.notificacoes_de_mencao
     SET lida_em = coalesce(lida_em, now())
   WHERE destinatario_id = auth.uid() AND id = ANY(coalesce(p_ids, ARRAY[]::uuid[]));
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION
  public.aue_publicacoes_pessoais_por(uuid, uuid, integer, timestamptz, uuid),
  public.listar_publicacoes_pessoais(integer, timestamptz, uuid),
  public.listar_publicacoes_pessoais_do_autor(text, integer, timestamptz, uuid),
  public.listar_publicacoes_marcadas(text, integer, timestamptz, uuid),
  public.criar_publicacao_pessoal_com_anexo(text, text, text, text, text, integer, integer, text),
  public.listar_minhas_notificacoes_de_mencao(),
  public.marcar_notificacoes_de_mencao_como_lidas(uuid[])
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.listar_publicacoes_pessoais(integer, timestamptz, uuid),
  public.listar_publicacoes_pessoais_do_autor(text, integer, timestamptz, uuid),
  public.listar_publicacoes_marcadas(text, integer, timestamptz, uuid)
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.criar_publicacao_pessoal_com_anexo(text, text, text, text, text, integer, integer, text),
  public.responder_topico_com_anexo(uuid, text, uuid, text, text, text, integer, integer, text),
  public.listar_minhas_notificacoes_de_mencao(),
  public.marcar_notificacoes_de_mencao_como_lidas(uuid[])
TO authenticated;

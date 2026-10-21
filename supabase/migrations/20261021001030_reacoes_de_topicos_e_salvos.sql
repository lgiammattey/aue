-- Curtir/reagir em tópicos e salvar posts de verdade (issue #306 e botões mortos).
--
-- No card de tópico, Curtir, 🔥, 🤢 e 🏆 não faziam nada, e Salvar ficava
-- desabilitado. Aqui nascem as duas tabelas (fechadas: só RPC) e os RPCs.
-- Só conta promovida grava; contagem de reações é pública, "minha" só da própria conta.

CREATE TABLE IF NOT EXISTS public.reacoes_de_topicos (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topico_id uuid NOT NULL REFERENCES public.topicos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('like', 'fogo', 'nojo', 'trofeu')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topico_id, tipo)
);
CREATE INDEX IF NOT EXISTS reacoes_de_topicos_topico_idx ON public.reacoes_de_topicos (topico_id);

CREATE TABLE IF NOT EXISTS public.itens_salvos (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('topico', 'causo')),
  item_id uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tipo, item_id)
);
CREATE INDEX IF NOT EXISTS itens_salvos_usuario_idx ON public.itens_salvos (user_id, criado_em DESC);

ALTER TABLE public.reacoes_de_topicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_salvos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reacoes_de_topicos, public.itens_salvos FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.alternar_reacao_do_topico(p_topico_id uuid, p_tipo text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_apagadas integer;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF p_tipo NOT IN ('like', 'fogo', 'nojo', 'trofeu') THEN
    RAISE EXCEPTION 'Reação inválida' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.topicos t
                  WHERE t.id = p_topico_id AND t.status IN ('aberto', 'fechado')
                    AND public.aue_e_conta_promovida(t.autor_id)) THEN
    RAISE EXCEPTION 'Tópico não encontrado' USING ERRCODE = '22023', HINT = 'topico_nao_encontrado';
  END IF;
  DELETE FROM public.reacoes_de_topicos WHERE user_id = auth.uid() AND topico_id = p_topico_id AND tipo = p_tipo;
  GET DIAGNOSTICS v_apagadas = ROW_COUNT;
  IF v_apagadas > 0 THEN RETURN false; END IF;
  INSERT INTO public.reacoes_de_topicos (user_id, topico_id, tipo) VALUES (auth.uid(), p_topico_id, p_tipo);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.contar_reacoes_dos_topicos(p_topicos uuid[])
RETURNS TABLE(topico_id uuid, tipo text, total bigint, minha boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT r.topico_id, r.tipo, count(*), coalesce(bool_or(r.user_id = auth.uid()), false)
    FROM public.reacoes_de_topicos r
   WHERE r.topico_id = ANY (p_topicos[1:100])
     AND public.aue_e_conta_promovida(r.user_id)
   GROUP BY r.topico_id, r.tipo;
$$;

CREATE OR REPLACE FUNCTION public.alternar_salvo(p_tipo text, p_item_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_apagadas integer;
BEGIN
  PERFORM public.aue_exigir_conta_promovida();
  IF p_tipo NOT IN ('topico', 'causo') THEN
    RAISE EXCEPTION 'Tipo inválido' USING ERRCODE = '22023';
  END IF;
  DELETE FROM public.itens_salvos WHERE user_id = auth.uid() AND tipo = p_tipo AND item_id = p_item_id;
  GET DIAGNOSTICS v_apagadas = ROW_COUNT;
  IF v_apagadas > 0 THEN RETURN false; END IF;
  IF p_tipo = 'topico' AND NOT EXISTS (
       SELECT 1 FROM public.topicos t WHERE t.id = p_item_id AND t.status IN ('aberto', 'fechado')
          AND public.aue_e_conta_promovida(t.autor_id)) THEN
    RAISE EXCEPTION 'Tópico não encontrado' USING ERRCODE = '22023', HINT = 'topico_nao_encontrado';
  END IF;
  IF p_tipo = 'causo' AND NOT EXISTS (
       SELECT 1 FROM public.posts_comunidade p WHERE p.id = p_item_id AND NOT p.esta_escondido) THEN
    RAISE EXCEPTION 'Post não encontrado' USING ERRCODE = '22023', HINT = 'topico_nao_encontrado';
  END IF;
  INSERT INTO public.itens_salvos (user_id, tipo, item_id) VALUES (auth.uid(), p_tipo, p_item_id);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_ids_salvos()
RETURNS TABLE(tipo text, item_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s.tipo, s.item_id FROM public.itens_salvos s
   WHERE s.user_id = auth.uid() AND public.aue_e_conta_promovida(auth.uid())
   ORDER BY s.criado_em DESC LIMIT 1000;
$$;

CREATE OR REPLACE FUNCTION public.listar_meus_salvos(p_limite integer DEFAULT 20, p_deslocamento integer DEFAULT 0)
RETURNS TABLE(tipo text, id uuid, titulo text, comunidade_slug text, comunidade_nome text,
              autor_handle text, autor_apelido text, criado_em timestamptz, salvo_em timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT x.* FROM (
    SELECT s.tipo, t.id, t.titulo, g.slug, g.nome::text, pf.handle, pf.apelido, t.criado_em, s.criado_em AS salvo_em
      FROM public.itens_salvos s
      JOIN public.topicos t ON s.tipo = 'topico' AND t.id = s.item_id AND t.status IN ('aberto', 'fechado')
      JOIN public.grupos g ON g.id = t.comunidade_id AND nullif(btrim(g.slug), '') IS NOT NULL
      JOIN public.perfis pf ON pf.id = t.autor_id AND public.aue_e_conta_promovida(t.autor_id)
     WHERE s.user_id = auth.uid()
    UNION ALL
    SELECT s.tipo, p.id, left(p.content, 140), g.slug, g.nome::text, pf.handle, pf.apelido, p.created_at, s.criado_em
      FROM public.itens_salvos s
      JOIN public.posts_comunidade p ON s.tipo = 'causo' AND p.id = s.item_id AND NOT p.esta_escondido
      JOIN public.grupos g ON g.id = p.group_id AND nullif(btrim(g.slug), '') IS NOT NULL
      JOIN public.perfis pf ON pf.id = p.user_id AND public.aue_e_conta_promovida(p.user_id)
     WHERE s.user_id = auth.uid()
  ) x
  WHERE public.aue_e_conta_promovida(auth.uid())
  ORDER BY x.salvo_em DESC, x.id
  LIMIT greatest(1, least(coalesce(p_limite, 20), 51)) OFFSET greatest(0, least(coalesce(p_deslocamento, 0), 1000));
$$;

REVOKE ALL ON FUNCTION public.alternar_reacao_do_topico(uuid, text), public.alternar_salvo(text, uuid),
  public.listar_ids_salvos(), public.listar_meus_salvos(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.contar_reacoes_dos_topicos(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.alternar_reacao_do_topico(uuid, text), public.alternar_salvo(text, uuid),
  public.listar_ids_salvos(), public.listar_meus_salvos(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.contar_reacoes_dos_topicos(uuid[]) TO anon, authenticated;

-- Desfaz a 20261019000015. Rodar ANTES do down da 000014.
-- Só remove objetos novos (triggers e funções do espelho). Não toca em
-- posts_comunidade, comentarios nem em dado algum: os tópicos e respostas já
-- copiados ficam onde estão, porque podem ter respostas novas penduradas neles
-- (apagá-los perderia conteúdo criado depois). Quem quiser zerar tudo roda
-- também o down da 000014, que derruba as tabelas.

DROP TRIGGER IF EXISTS aue_espelha_post_no_topico ON public.posts_comunidade;
DROP TRIGGER IF EXISTS aue_espelha_escondido_no_topico ON public.posts_comunidade;
DROP TRIGGER IF EXISTS aue_espelha_post_apagado_no_topico ON public.posts_comunidade;
DROP TRIGGER IF EXISTS aue_espelha_comentario_na_resposta ON public.comentarios;
DROP TRIGGER IF EXISTS aue_espelha_comentario_apagado_na_resposta ON public.comentarios;

DROP FUNCTION IF EXISTS public.aue_trigger_espelhar_post();
DROP FUNCTION IF EXISTS public.aue_trigger_espelhar_comentario();
DROP FUNCTION IF EXISTS public.aue_trigger_espelhar_escondido();
DROP FUNCTION IF EXISTS public.aue_trigger_espelhar_post_apagado();
DROP FUNCTION IF EXISTS public.aue_trigger_espelhar_comentario_apagado();
DROP FUNCTION IF EXISTS public.aue_migrar_acervo_para_topicos();
DROP FUNCTION IF EXISTS public.aue_conferir_acervo();
DROP FUNCTION IF EXISTS public.aue_espelhar_comentario(uuid);
DROP FUNCTION IF EXISTS public.aue_espelhar_post(uuid);
DROP FUNCTION IF EXISTS public.aue_titulo_do_acervo(text, text, text);

-- A comunidade 'acervo' só sai se ninguém conversa nela (sem tópico dentro).
DO $$
BEGIN
  -- Nunca apaga o grupo se tem post dentro: ON DELETE CASCADE levaria os posts junto.
  IF to_regclass('public.topicos') IS NULL THEN
    DELETE FROM public.grupos g
     WHERE lower(g.slug) = 'acervo'
       AND NOT EXISTS (SELECT 1 FROM public.posts_comunidade p WHERE p.group_id = g.id);
  ELSE
    DELETE FROM public.grupos g
     WHERE lower(g.slug) = 'acervo'
       AND NOT EXISTS (SELECT 1 FROM public.topicos t WHERE t.comunidade_id = g.id)
       AND NOT EXISTS (SELECT 1 FROM public.posts_comunidade p WHERE p.group_id = g.id);
  END IF;
END;
$$;
DROP FUNCTION IF EXISTS public.aue_obter_comunidade_acervo();

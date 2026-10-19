-- Desfaz a 20261019000016. Rodar ANTES dos downs da 000015 e da 000014.
-- Remove os objetos novos desta migração (funções de leitura, o reparo e dois
-- índices) e restaura o corpo ORIGINAL de aue_trigger_espelhar_escondido (da 15). Não toca em tópico, resposta, comunidade nem em dado algum: o que o
-- reparo já corrigiu (tópico oculto/removido, resposta '[removido]') fica como
-- está, porque reabrir ou restaurar conteúdo apagado seria pior que o rollback.

DROP FUNCTION IF EXISTS public.explorar_topicos(integer, timestamptz, uuid, text);
DROP FUNCTION IF EXISTS public.listar_respostas_do_autor(text, integer, timestamptz, uuid);
DROP FUNCTION IF EXISTS public.listar_topicos_do_autor(text, integer, timestamptz, uuid);
DROP FUNCTION IF EXISTS public.obter_comunidade_do_forum(text);
DROP FUNCTION IF EXISTS public.listar_comunidades_do_forum();
DROP FUNCTION IF EXISTS public.aue_ler_comunidades_do_forum(text);
DROP FUNCTION IF EXISTS public.aue_autor_publico_por_handle(text);
DROP FUNCTION IF EXISTS public.aue_reconciliar_acervo();

DROP INDEX IF EXISTS public.topicos_explorar_atividade;
DROP INDEX IF EXISTS public.topicos_explorar_recentes;

-- Corpo original da 20261019000015 (copiado literalmente).
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

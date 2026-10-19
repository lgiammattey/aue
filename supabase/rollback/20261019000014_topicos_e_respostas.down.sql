-- Desfaz a 20261019000014. Rodar DEPOIS do down da 000015.
-- ATENÇÃO: derruba as tabelas novas e TUDO que foi escrito nelas (tópicos,
-- respostas, denúncias da conversa). Só objetos novos; nada antigo é tocado.

DROP FUNCTION IF EXISTS public.denunciar_resposta(uuid, text);
DROP FUNCTION IF EXISTS public.denunciar_topico(uuid, text);
DROP FUNCTION IF EXISTS public.apagar_resposta(uuid);
DROP FUNCTION IF EXISTS public.apagar_topico(uuid);
DROP FUNCTION IF EXISTS public.editar_resposta(uuid, text);
DROP FUNCTION IF EXISTS public.editar_topico(uuid, text, text);
DROP FUNCTION IF EXISTS public.responder_topico(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.criar_topico(text, text, text, uuid, boolean);
DROP FUNCTION IF EXISTS public.listar_respostas_do_topico(uuid, integer, timestamptz, uuid);
DROP FUNCTION IF EXISTS public.obter_topico(uuid);
DROP FUNCTION IF EXISTS public.listar_topicos(text, integer, timestamptz, uuid, text, boolean);
DROP FUNCTION IF EXISTS public.aue_ler_topicos(text, uuid, integer, text, timestamptz, uuid, boolean);
DROP FUNCTION IF EXISTS public.aue_exigir_participacao(uuid);
DROP FUNCTION IF EXISTS public.aue_aparar_texto(text);
DROP FUNCTION IF EXISTS public.aue_falhar_conversa(text, text, text);

DROP TABLE IF EXISTS public.denuncias_conversa;
DROP TABLE IF EXISTS public.respostas;
DROP TABLE IF EXISTS public.topicos;

-- A comunidade 'acervo' (criada pela 000015) fica vazia sem os tópicos. Sai se
-- ninguém postou nela pelo caminho antigo.
DELETE FROM public.grupos g
 WHERE lower(g.slug) = 'acervo'
   AND NOT EXISTS (SELECT 1 FROM public.posts_comunidade p WHERE p.group_id = g.id);

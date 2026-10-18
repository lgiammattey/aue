-- =============================================================================
-- Rollback da 20261018000007 (contas da casa)
--
-- ORDEM: desfazer a 20261018000008 antes (ela lê contas_da_casa e a coluna
-- caminho_do_audio_da_casa).
--
-- PERDE DADO: apaga a tabela contas_da_casa e a coluna do áudio da casa. Os
-- posts e comentários da casa, se já foram carregados, continuam no banco como
-- posts de usuário comum (perdem a marca). Para tirá-los, use primeiro
-- `npm run elenco:backfill -- --desfazer`, que apaga só os ids da carga.
-- NÃO desfaz: objetos já enviados ao bucket audio_da_casa (o bucket só é
-- removido se estiver vazio).
-- SEGURANÇA: ao voltar, nada reabre; as funções eram só do service_role.
-- =============================================================================

DROP FUNCTION IF EXISTS public.comentar_da_casa(uuid, uuid, uuid, text, timestamptz);
DROP FUNCTION IF EXISTS public.publicar_da_casa(uuid, uuid, text, text, timestamptz, text);
DROP FUNCTION IF EXISTS public.registrar_conta_da_casa(uuid, text, text, text, text, timestamptz);
DROP FUNCTION IF EXISTS public.aue_dentro_da_janela_da_casa(timestamptz);

ALTER TABLE public.posts_comunidade DROP CONSTRAINT IF EXISTS posts_caminho_do_audio_da_casa_formato;
ALTER TABLE public.posts_comunidade DROP COLUMN IF EXISTS caminho_do_audio_da_casa;

DROP TABLE IF EXISTS public.contas_da_casa;

-- Só remove o bucket se não houver arquivo dentro.
DELETE FROM storage.buckets
 WHERE id = 'audio_da_casa'
   AND NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'audio_da_casa');

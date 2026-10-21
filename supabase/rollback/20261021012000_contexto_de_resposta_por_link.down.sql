-- Rollback manual de emergência. Leia supabase/rollback/README.md antes.
-- Só remove a leitura aditiva; não toca em respostas, pai_id nem RPCs existentes.
DROP FUNCTION IF EXISTS public.obter_contexto_da_resposta(uuid, uuid);

-- =============================================================================
-- 20261022004000 — Permissão do helper de RLS das mídias de comunidades
--
-- As policies de `storage.objects` do bucket `midias_de_comunidades` invocam
-- `aue_pode_gerir_midia_da_comunidade` para validar o moderador e o prefixo do
-- objeto. A migração que criou a função revogou EXECUTE de todos, mas não o
-- devolveu a `authenticated`: o upload chegava ao recorte e era negado pelo
-- Storage antes da RPC vincular avatar ou capa.
--
-- O grant não abre o bucket: a função só responde para a comunidade recebida;
-- cada policy continua exigindo bucket, UUID, tipo de mídia e moderação real.
-- =============================================================================

REVOKE ALL ON FUNCTION public.aue_pode_gerir_midia_da_comunidade(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aue_pode_gerir_midia_da_comunidade(uuid) TO authenticated;

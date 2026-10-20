-- =============================================================================
-- 20261020193000 — Permissão do helper de RLS dos anexos do fórum
--
-- A policy de SELECT/DELETE de `storage.objects` para anexos invoca
-- `aue_anexo_do_forum_publicado`. Postgres confere EXECUTE na função ao montar
-- as policies da tabela, inclusive quando a operação é para outro bucket.
-- A revogação feita ao fim da migração dos anexos deixou essa dependência sem
-- permissão e passou a bloquear uploads de avatar/capa com "permission denied".
--
-- Não abre Storage: as policies continuam limitando bucket, dono e caminho. A
-- função só devolve se um caminho já é anexo publicado; isso é precisamente a
-- informação que a policy precisa para liberar a leitura pública desse anexo.
-- =============================================================================

REVOKE ALL ON FUNCTION public.aue_anexo_do_forum_publicado(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aue_anexo_do_forum_publicado(text) TO anon, authenticated;

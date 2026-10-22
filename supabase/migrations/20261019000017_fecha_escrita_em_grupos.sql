-- =============================================================================
-- 20261019000017 — Fecha a escrita direta em public.grupos
--
-- O PROBLEMA (provado no banco vivo, só leitura, em 19/10/2026)
--   `grupos` tem RLS ligada, mas anon e authenticated receberam ALL dos default
--   privileges do Supabase (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES,
--   TRIGGER). A 20261018000010 revogou isso em membros_grupo, posts_comunidade
--   e outras, e esqueceu `grupos`. As policies da 20260807000006 completam:
--     INSERT  "Authenticated users can create groups"  WITH CHECK (auth.uid() = created_by)
--     UPDATE  "Group creators can update their groups" USING (auth.uid() = created_by)
--   `authenticated` inclui a sessão anônima do login anônimo. Resultado: qualquer
--   visitante com a chave pública faz POST /rest/v1/grupos e a comunidade dele
--   aparece no diretório do fórum (listar_comunidades_do_forum e
--   listar_comunidades_sociais leem grupos com slug). Na tabela viva só há as 9
--   comunidades originais, todas sem criador: ninguém explorou ainda.
--
-- O QUE FAZ
--   1. REVOKE de INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES e TRIGGER em
--      public.grupos para anon e authenticated. SELECT fica.
--   2. Remove as duas policies de escrita (INSERT e UPDATE). Sem privilégio elas
--      já não alcançam ninguém; removidas, um GRANT futuro por engano não reabre
--      o buraco (RLS nega por falta de policy). A policy de SELECT fica.
--
-- POR QUE É SEGURO
--   - Nada em src/, scripts/ ou supabase/functions/ escreve ou lê `grupos` por
--     PostgREST (os acessos são a `grupos_externos`, outra tabela).
--   - As 17 funções públicas que citam `grupos` são SECURITY DEFINER do dono
--     postgres, o mesmo dono da tabela: não dependem de grant de anon/authenticated.
--     Nenhuma função SECURITY INVOKER cita a tabela. Não há trigger na tabela,
--     nem view que dependa dela, e nenhuma policy de outra tabela a referencia.
--   - Chaves estrangeiras (membros_grupo, topicos, resultados...) são checadas
--     pelo sistema com o dono da tabela, sem exigir grant do cliente.
--   - Log da API do projeto vivo (janela retida, ~24 h, 610 chamadas REST):
--     zero chamadas a /rest/v1/grupos; só /rest/v1/grupos_externos.
--
-- O QUE NÃO FAZ
--   Não altera linha, função, coluna nem índice. Não mexe em campeonatos nem em
--   participantes_campeonato (mesma classe de buraco, features desligadas: fica
--   para outro cartão). Rollback: supabase/rollback/20261019000017_fecha_escrita_em_grupos.down.sql
-- =============================================================================

SET LOCAL lock_timeout = '5s';

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.grupos FROM anon, authenticated;

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.grupos;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.grupos;

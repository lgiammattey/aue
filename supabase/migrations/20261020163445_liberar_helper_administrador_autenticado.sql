-- A migration anterior fechou o helper por completo. Sob uma requisição do
-- cliente, a RPC administrativa chama esse helper ainda como authenticated;
-- sem EXECUTE, PostgreSQL recusa a chamada antes da checagem de pertencimento.
--
-- O helper só devolve se a PRÓPRIA auth.uid() consta na allowlist. Não retorna
-- a lista de administradores nem concede leitura de dado algum.
GRANT EXECUTE ON FUNCTION public.aue_e_administrador() TO authenticated;

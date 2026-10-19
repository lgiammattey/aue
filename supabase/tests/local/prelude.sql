-- Simula o default privileges do Supabase (objetos novos no schema public nascem com grant a anon/authenticated).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- `grupos` nasce na 20260807000006, ANTES dos default privileges acima, então no banco local ela não teria
-- nenhum grant. No Supabase vivo anon e authenticated têm ALL nela (provado em 19/10/2026). Sem este grant
-- o teste da 20261019000017 passaria vazio. A 20261019000017 revoga a escrita e deixa SELECT.
GRANT ALL ON public.grupos TO anon, authenticated, service_role;

-- Desfaz a 20261019000017: devolve os privilégios e as duas policies de escrita
-- de public.grupos, exatamente como estavam (20260807000006 + default privileges
-- do Supabase). ATENÇÃO: isto REABRE o buraco (qualquer sessão, inclusive
-- anônima, cria e edita comunidade). Só rode se o fechamento quebrou algo real.
SET LOCAL lock_timeout = '5s';

GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.grupos TO anon, authenticated;

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.grupos;
CREATE POLICY "Authenticated users can create groups" ON public.grupos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Group creators can update their groups" ON public.grupos;
CREATE POLICY "Group creators can update their groups" ON public.grupos
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- A troca de assinatura em 20261020180000 recriou o helper. As entradas
-- públicas continuam passando por listar/obter_comunidade, ambas SECURITY DEFINER.
REVOKE ALL ON FUNCTION public.aue_ler_comunidades_do_forum(text)
  FROM PUBLIC, anon, authenticated, service_role;

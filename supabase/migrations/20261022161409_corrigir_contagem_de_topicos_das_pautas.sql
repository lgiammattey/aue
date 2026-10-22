-- O mural de uma comunidade mostra as pautas e os tópicos ainda sem pauta.
-- As entradas agrupadas continuam acessíveis por link, perfil e feed, mas não
-- contam como um tópico adicional no total exibido pela comunidade.
CREATE OR REPLACE FUNCTION public.aue_ler_comunidades_do_forum(p_slug text)
RETURNS TABLE (
  id uuid, slug text, nome text, descricao text, icone text,
  caminho_do_avatar text, revisao_do_avatar bigint, caminho_da_capa text, revisao_da_capa bigint,
  membros_total bigint, topicos_total bigint, ultima_atividade_em timestamptz, sou_membro boolean,
  posso_gerir_midia boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT g.id, g.slug, g.nome::text, g.descricao, g.icone,
         g.caminho_do_avatar, g.revisao_do_avatar, g.caminho_da_capa, g.revisao_da_capa,
         (SELECT count(*) FROM public.membros_grupo m
           WHERE m.group_id = g.id AND public.aue_e_conta_promovida(m.user_id)),
         tp.total, tp.ultima,
         coalesce(
           auth.uid() IS NOT NULL
           AND public.aue_e_conta_promovida(auth.uid())
           AND EXISTS (SELECT 1 FROM public.membros_grupo m WHERE m.group_id = g.id AND m.user_id = auth.uid()),
           false),
         public.aue_pode_gerir_midia_da_comunidade(g.id)
    FROM public.grupos g
    CROSS JOIN LATERAL (
      SELECT count(*) FILTER (
               WHERE NOT EXISTS (
                 SELECT 1
                   FROM public.topicos_em_pauta ep
                  WHERE ep.topico_id = t.id
               )
             ) AS total,
             max(t.ultima_atividade_em) AS ultima
        FROM public.topicos t
       WHERE t.comunidade_id = g.id
         AND t.status IN ('aberto', 'fechado')
         AND public.aue_e_conta_promovida(t.autor_id)
    ) tp
   WHERE nullif(btrim(g.slug), '') IS NOT NULL
     AND (p_slug IS NULL OR lower(g.slug) = lower(btrim(p_slug)))
     AND (lower(g.slug) <> 'acervo' OR tp.total > 0)
   ORDER BY g.nome, g.id
$$;

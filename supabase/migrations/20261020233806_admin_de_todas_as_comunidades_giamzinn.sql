-- Concede o papel `admin` em todas as comunidades à conta @giamzinn_aue, a pedido do Luiz.
--
-- Hoje o papel `admin` de comunidade habilita gerir foto e capa
-- (`aue_pode_gerir_midia_da_comunidade`). Moderar tópicos e respostas ainda não
-- existe no banco (issue #260). Idempotente: se a conta não existir, não faz nada;
-- se já for membro, só promove.
INSERT INTO public.membros_grupo (group_id, user_id, role)
SELECT g.id, p.id, 'admin'
  FROM public.grupos g
 CROSS JOIN public.perfis p
 WHERE p.handle = 'giamzinn_aue'
ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'admin';

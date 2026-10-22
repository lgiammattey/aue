-- =============================================================================
-- 20261022001000 — Grupos de WhatsApp viram uma comunidade do Auê
--
-- Os três convites oficiais já viviam em `grupos_externos`. Eles passam a ter
-- uma casa única dentro do fórum, em vez de aparecerem espalhados no diretório
-- externo. O conteúdo continua sendo só link de convite: o Auê não conhece
-- membros nem replica conversa do WhatsApp.
--
-- Idempotente: não duplica a comunidade, o tópico nem a administração se o
-- arquivo for reexecutado. A conta autora é a existente @giamzinn_aue; em banco
-- local sem essa conta a comunidade ainda nasce, mas o tópico aguarda a conta.
-- =============================================================================

SET LOCAL lock_timeout = '5s';

-- 1. Nova comunidade, servida pelas leituras normais de `grupos`/`topicos`.
INSERT INTO public.grupos (nome, descricao, slug, icone, created_by)
VALUES (
  'Grupos WhatsApp',
  'Os convites oficiais dos grupos de WhatsApp da galera.',
  'grupos-whatsapp',
  '💬',
  (SELECT id FROM public.perfis WHERE handle = 'giamzinn_aue')
)
ON CONFLICT DO NOTHING;

UPDATE public.grupos
   SET regras = ARRAY[
     'Leia a descrição antes de entrar no grupo.',
     'Respeite as regras de cada grupo no WhatsApp.',
     'Sem spam, golpe ou convite que não seja oficial.'
   ]
 WHERE lower(slug) = 'grupos-whatsapp'
   AND regras = ARRAY[]::text[];

-- 2. A mesma conta que gere as demais comunidades pode manter a apresentação.
INSERT INTO public.membros_grupo (group_id, user_id, role)
SELECT g.id, p.id, 'admin'
  FROM public.grupos g
 CROSS JOIN public.perfis p
 WHERE lower(g.slug) = 'grupos-whatsapp'
   AND p.handle = 'giamzinn_aue'
ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'admin';

-- 3. Um tópico fixado concentra os convites reais já aprovados no diretório.
-- O corpo vem dos registros existentes, não de URLs copiadas nesta migration.
INSERT INTO public.topicos (comunidade_id, origem, autor_id, titulo, corpo, fixado)
SELECT
  g.id,
  'comunidade',
  p.id,
  'Links dos grupos oficiais de WhatsApp',
  E'Os convites oficiais estão aqui. Leia a descrição de cada grupo antes de entrar.\n\n'
  || (
    SELECT string_agg(
      ge.nome || E'\n' || ge.link_do_convite,
      E'\n\n' ORDER BY ge.nome
    )
      FROM public.grupos_externos ge
     WHERE ge.tipo_de_plataforma = 'whatsapp'
       AND ge.e_oficial
       AND ge.slug IN (
         'arroto-e-peido-dos-profissionais',
         'grupo-do-peido-e-arroto',
         'gym-arrotos'
       )
  ),
  true
  FROM public.grupos g
 CROSS JOIN public.perfis p
 WHERE lower(g.slug) = 'grupos-whatsapp'
   AND p.handle = 'giamzinn_aue'
   AND (
     SELECT count(*)
       FROM public.grupos_externos ge
      WHERE ge.tipo_de_plataforma = 'whatsapp'
        AND ge.e_oficial
        AND ge.slug IN (
          'arroto-e-peido-dos-profissionais',
          'grupo-do-peido-e-arroto',
          'gym-arrotos'
        )
   ) = 3
   AND NOT EXISTS (
     SELECT 1
       FROM public.topicos t
      WHERE t.comunidade_id = g.id
        AND t.titulo = 'Links dos grupos oficiais de WhatsApp'
   );

-- 4. Evita duas vitrines para o mesmo convite. Mantém os dados para auditoria.
UPDATE public.grupos_externos
   SET esta_escondido = true
 WHERE tipo_de_plataforma = 'whatsapp'
   AND slug IN (
     'arroto-e-peido-dos-profissionais',
     'grupo-do-peido-e-arroto',
     'gym-arrotos'
   );

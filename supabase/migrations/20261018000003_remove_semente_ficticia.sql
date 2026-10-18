-- =============================================================================
-- 20261018000003 — Remove a semente fictícia do causo do shopping
--
-- A 20261018000001 criou 7 contas em auth.users (senha vazia, e-mail @aue.app já
-- confirmado) e um causo com comentários escritos em nome da squad. Isso
-- contradiz "dado fictício não aparece como real" e a remoção do conteúdo
-- autoral (commit 0c26186), e deixa contas confirmadas num domínio que o
-- projeto pode não controlar.
--
-- Idempotente: se a 000001 nunca foi aplicada, não apaga nada. Só toca nos ids
-- fixos da semente. Os comentários caem por cascata do post.
-- =============================================================================

DELETE FROM public.posts_comunidade
 WHERE id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

DELETE FROM public.comentarios
 WHERE user_id IN (
   '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333333',
   '44444444-4444-4444-4444-444444444444',
   '55555555-5555-5555-5555-555555555555',
   '66666666-6666-6666-6666-666666666666',
   '77777777-7777-7777-7777-777777777777'
 );

DELETE FROM auth.users
 WHERE id IN (
   '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333333',
   '44444444-4444-4444-4444-444444444444',
   '55555555-5555-5555-5555-555555555555',
   '66666666-6666-6666-6666-666666666666',
   '77777777-7777-7777-7777-777777777777'
 )
   AND encrypted_password = ''
   AND email LIKE '%@aue.app';

-- =============================================================================
-- Rollback da 20261018000001 (Semente Histórica do Bonde)
-- =============================================================================

DELETE FROM public.comentarios WHERE post_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
DELETE FROM public.posts_comunidade WHERE id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

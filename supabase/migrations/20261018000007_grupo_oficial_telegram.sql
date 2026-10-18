-- =============================================================================
-- 20261018000007 — O grupo oficial "Eu Arroto, e Daí?" entra no diretório
--
-- O Luiz confirmou em 18/10/2026 que o grupo do Telegram é oficial. O link já
-- estava escrito direto no código (AbaComunidades); agora ele também está no
-- diretório, junto com os três de WhatsApp, e passa a ter página própria para o
-- Google.
--
-- O nome vem da página pública do convite. A página não traz descrição, então o
-- texto é o que o app já usava para essa comunidade, sem número e sem recurso
-- inventado.
--
-- Idempotente: DO NOTHING não sobrescreve edição feita depois.
-- =============================================================================

INSERT INTO public.grupos_externos
  (slug, nome, descricao, tipo_de_plataforma, link_do_convite, e_oficial)
VALUES
  (
    'eu-arroto-e-dai',
    'Eu Arroto, e Daí?',
    'A histórica comunidade mãe dos arrotadores, desde 2004 no Orkut e agora no Telegram. Orgulho do estrago e zero pudor social.',
    'telegram',
    'https://t.me/+KQjRJFCibjliYzRh',
    true
  )
ON CONFLICT DO NOTHING;

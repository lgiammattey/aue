-- =============================================================================
-- 20261018000006 — Diretório de grupos externos (WhatsApp, Telegram, TikTok)
--
-- Decisão do Luiz em 18/10/2026; páginas públicas no ADR 0004.
--
-- O QUE É
--   Uma lista de grupos que moram FORA do Auê. O Auê guarda nome, descrição,
--   plataforma, link do convite e uma imagem opcional. Não guarda membros e não
--   conta ninguém: nenhum número aqui é inventado.
--
-- O QUE NÃO É
--   Não é `public.grupos` (tabela inglesa de feature desligada, vazia, sem uso) e
--   não é a lista de comunidades temáticas do app (Bonde Geral etc.), que mora no
--   código. Misturar os três faria a tela de temas virar bagunça.
--
-- QUEM ESCREVE
--   Ninguém pelo cliente. Nem `anon` nem `authenticated` têm INSERT/UPDATE/DELETE
--   na tabela. O cadastro (inclusive o de visitante sem conta) passa por uma
--   Edge Function que limita envios por origem e grava com a chave de serviço.
--   Sem anti-robô (decisão do Luiz em 18/10/2026): o limite de envios e o CHECK de
--   domínio do link são o que sobra contra spam. Sem a função, qualquer visitante
--   poderia gravar direto na tabela pública.
--
-- QUEM LÊ
--   Todo mundo, menos o que está escondido por denúncia.
--
-- DENÚNCIA
--   Só quem está logado denuncia, uma vez por grupo. Três PESSOAS distintas
--   escondem o grupo, a mesma regra dos causos. Grupo oficial nunca é escondido
--   por denúncia automática: três contas novas não podem derrubar o que o Luiz
--   cadastrou.
--
-- IDEMPOTENTE: pode ser reaplicada. O seed não sobrescreve edição feita depois.
-- =============================================================================

-- 1. Tabela ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.grupos_externos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL,
  nome            text NOT NULL,
  descricao       text,
  tipo_de_plataforma text NOT NULL,
  link_do_convite text NOT NULL,
  -- Caminho do arquivo no bucket `imagens_de_grupos`. Nunca uma URL: a URL do
  -- WhatsApp expira, e guardar URL de terceiro seria guardar link quebrado.
  caminho_da_imagem text,
  e_oficial       boolean NOT NULL DEFAULT false,
  esta_escondido  boolean NOT NULL DEFAULT false,
  criado_por      uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_em       timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT grupos_externos_slug_formato
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 60),
  CONSTRAINT grupos_externos_nome_tamanho
    CHECK (char_length(btrim(nome)) BETWEEN 3 AND 60),
  CONSTRAINT grupos_externos_descricao_tamanho
    CHECK (descricao IS NULL OR char_length(descricao) <= 2000),
  CONSTRAINT grupos_externos_plataforma_valida
    CHECK (tipo_de_plataforma IN ('whatsapp', 'telegram', 'tiktok')),
  -- O domínio é conferido AQUI e não só na tela: é a regra que impede link de
  -- golpe numa página pública e indexável. Cada plataforma tem o seu formato.
  CONSTRAINT grupos_externos_link_da_plataforma CHECK (
    (tipo_de_plataforma = 'whatsapp'
       AND link_do_convite ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9]{10,40}$')
    OR (tipo_de_plataforma = 'telegram'
       AND link_do_convite ~ '^https://t\.me/(\+[A-Za-z0-9_-]{5,64}|joinchat/[A-Za-z0-9_-]{5,64}|[A-Za-z][A-Za-z0-9_]{4,31})$')
    OR (tipo_de_plataforma = 'tiktok'
       AND link_do_convite ~ '^https://(www\.)?tiktok\.com/@[A-Za-z0-9._]{2,24}/?$')
  ),
  CONSTRAINT grupos_externos_imagem_formato CHECK (
    caminho_da_imagem IS NULL
    OR caminho_da_imagem ~ '^[a-z0-9]+(-[a-z0-9]+)*/[0-9a-f-]{36}\.(jpg|png|webp)$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS grupos_externos_slug_unico
  ON public.grupos_externos (slug);
CREATE UNIQUE INDEX IF NOT EXISTS grupos_externos_link_unico
  ON public.grupos_externos (lower(link_do_convite));
CREATE INDEX IF NOT EXISTS grupos_externos_visiveis
  ON public.grupos_externos (criado_em DESC) WHERE NOT esta_escondido;

-- 2. RLS: leitura pública do que não está escondido; escrita só pelo servidor --

ALTER TABLE public.grupos_externos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.grupos_externos FROM anon, authenticated;
GRANT SELECT ON public.grupos_externos TO anon, authenticated;

DROP POLICY IF EXISTS "grupos_externos_leitura_publica" ON public.grupos_externos;
CREATE POLICY "grupos_externos_leitura_publica"
  ON public.grupos_externos FOR SELECT
  TO anon, authenticated
  USING (NOT esta_escondido);

-- 3. Denúncias ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.denuncias_de_grupos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id   uuid NOT NULL REFERENCES public.grupos_externos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  motivo     text NOT NULL DEFAULT 'Conteúdo impróprio'
             CHECK (char_length(btrim(motivo)) BETWEEN 3 AND 300),
  criado_em  timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Uma pessoa, uma denúncia por grupo. Sem isso, uma conta só esconde o grupo.
CREATE UNIQUE INDEX IF NOT EXISTS denuncias_de_grupos_uma_por_pessoa
  ON public.denuncias_de_grupos (grupo_id, usuario_id);

ALTER TABLE public.denuncias_de_grupos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.denuncias_de_grupos FROM anon, authenticated;
GRANT INSERT ON public.denuncias_de_grupos TO authenticated;

DROP POLICY IF EXISTS "denuncias_de_grupos_inserir_a_propria" ON public.denuncias_de_grupos;
CREATE POLICY "denuncias_de_grupos_inserir_a_propria"
  ON public.denuncias_de_grupos FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- Nenhuma policy de SELECT: quem denunciou não lê a lista de denúncias.

CREATE OR REPLACE FUNCTION public.esconder_grupo_denunciado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_denunciantes integer;
BEGIN
  -- Conta PESSOAS distintas, não linhas.
  SELECT count(DISTINCT usuario_id) INTO v_denunciantes
    FROM public.denuncias_de_grupos
   WHERE grupo_id = NEW.grupo_id;

  IF v_denunciantes >= 3 THEN
    UPDATE public.grupos_externos
       SET esta_escondido = true
     WHERE id = NEW.grupo_id
       AND NOT e_oficial;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.esconder_grupo_denunciado() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ao_denunciar_grupo ON public.denuncias_de_grupos;
CREATE TRIGGER ao_denunciar_grupo
  AFTER INSERT ON public.denuncias_de_grupos
  FOR EACH ROW EXECUTE FUNCTION public.esconder_grupo_denunciado();

-- 3b. Limite de envios -------------------------------------------------------
--
-- A Edge Function registra aqui cada cadastro que deu certo, com a origem já
-- embaralhada (hash com sal): o banco não guarda IP legível. Ela conta as linhas
-- da última hora antes de aceitar outro. RLS ligada e nenhuma policy: só a chave
-- de serviço lê e escreve.

CREATE TABLE IF NOT EXISTS public.envios_de_grupos (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  origem_hash text NOT NULL,
  criado_em   timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS envios_de_grupos_recentes
  ON public.envios_de_grupos (origem_hash, criado_em DESC);

ALTER TABLE public.envios_de_grupos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.envios_de_grupos FROM anon, authenticated;

-- 4. Bucket das imagens ------------------------------------------------------
--
-- Leitura pública (a imagem aparece na página que o Google lê). Escrita: sem
-- policy para anon/authenticated, só a Edge Function grava, com a chave de
-- serviço. Tipo e tamanho travados no próprio bucket, não só na função.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imagens_de_grupos',
  'imagens_de_grupos',
  true,
  1048576, -- 1 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "imagens_de_grupos_leitura_publica" ON storage.objects;
CREATE POLICY "imagens_de_grupos_leitura_publica"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'imagens_de_grupos');

-- 5. As três comunidades oficiais ---------------------------------------------
--
-- Texto aprovado pelo Luiz em 18/10/2026, escrito a partir dos textos originais
-- de cada grupo. Sem número de membros, sem recurso do Auê inventado.
-- DO NOTHING: se alguém ajustar o texto depois, o seed não desfaz.

INSERT INTO public.grupos_externos
  (slug, nome, descricao, tipo_de_plataforma, link_do_convite, e_oficial)
VALUES
  (
    'arroto-e-peido-dos-profissionais',
    'Arroto e Peido Dos Profissionais',
    'Aqui só entra arroto e peido de quem sabe o que tá fazendo. O grupo avalia intensidade, tempo de duração, odor e se o som valeu a pena. Arroto xoxo, peido melado, breadinha na cueca e arrotar com a mão no bolso estão fora. Quem solta um ESPIPEIDOTO ganha o selo e vira profissional.',
    'whatsapp',
    'https://chat.whatsapp.com/JaC2ggM5mG12pioXJnOgHc',
    true
  ),
  (
    'grupo-do-peido-e-arroto',
    'Grupo do peido e arroto',
    'Grupo de zoeira com peido e arroto, no respeito. Chamar gente no privado dá banimento na hora. Também não vale mostrar bunda, vídeo pelado ou de cueca, conteúdo pornográfico, foto de merda, link externo, propaganda nem flood. Quem não segue a regra é expulso.',
    'whatsapp',
    'https://chat.whatsapp.com/GFpJXiIlWyFEXHTOjEW6eI',
    true
  ),
  (
    'gym-arrotos',
    'GYM Arrotos',
    'Grupo pra quem tem talento em arrotar. Chegou com o dom, entra.',
    'whatsapp',
    'https://chat.whatsapp.com/KrRzws9Xhlo4RmOq8TmVue',
    true
  )
ON CONFLICT DO NOTHING;

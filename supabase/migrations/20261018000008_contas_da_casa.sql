-- =============================================================================
-- 20261018000008 — Contas da casa: estrutura para o elenco Burpzilla
--
-- Decisão do Luiz em 18/10/2026 (ESCOPO_ATUAL §2.17; Cartão de Missão em
-- docs/historias/burpzilla/cartao-de-missao-seed.md): o Bonde recebe posts dos
-- personagens Giam e Lima e comentários de contas da casa, em carga retroativa
-- de 28/08 a 15/10/2026 (horário de Brasília).
--
-- ESTA MIGRAÇÃO SÓ TRAZ ESTRUTURA. Ela NÃO cria usuário, NÃO insere post e NÃO
-- insere comentário. Quem cria os usuários é o script
-- `scripts/elenco-burpzilla/aplicar.ts` (pela API de admin do Auth), e só depois
-- de a prova da autorização dos áudios estar no repositório. Se esta migração
-- for aplicada sozinha, nada aparece no feed.
--
-- O QUE FAZ
--   1. contas_da_casa: a marca "conta da casa", fora do alcance do usuário.
--   2. posts_comunidade.caminho_do_audio_da_casa: áudio que não passou pelo jogo
--      (sem resultado, sem nota).
--   3. Bucket público `audio_da_casa`: só conteúdo da casa (ADR 0007, proposto).
--   4. Funções só do service_role: registrar_conta_da_casa, publicar_da_casa,
--      comentar_da_casa.
--
-- O QUE NÃO MUDA
--   A RLS de posts_comunidade, comentarios, perfis e reacoes fica como está.
--   Atenção: o INSERT de posts e comentários já não restringe `created_at` para
--   o usuário comum (achado do Marcelo, 18/10/2026, anterior a esta migração).
--   Isso pede issue própria; esta migração não o cria nem o corrige.
--
-- AUDIÊNCIA E RANKING (revisão de 18/10/2026)
--   Nenhuma função de ranking, telemetria ou audiência lê posts_comunidade ou
--   comentarios hoje: o ranking sai de `resultados`, e as contas da casa não têm
--   resultado. Se uma agregação nova de audiência passar a ler posts, comentários,
--   reações ou perfis, ela precisa excluir contas da casa com
--   `NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = ...)`.
--
-- NÃO VALIDADO: sem Postgres neste ambiente. Revisão por leitura e por teste de
-- texto (src/db/contas-da-casa.migracoes.test.ts). Aplicar à mão, depois da
-- decisão formal do ADR 0007.
-- Depende da 20261018000004 (handle em perfis, comentários em níveis).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. contas_da_casa
--
-- Sem policy e sem grant para anon/authenticated: o cliente não lê nem escreve.
-- Quem precisa saber (o perfil público) pergunta por função SECURITY DEFINER.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.contas_da_casa (
  usuario_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  papel text NOT NULL CHECK (papel IN ('personagem', 'agente')),
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_da_casa ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.contas_da_casa FROM PUBLIC;
REVOKE ALL ON TABLE public.contas_da_casa FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contas_da_casa TO service_role;

COMMENT ON TABLE public.contas_da_casa IS
  'Contas que o Aue opera (personagens e agentes). Marca rastreavel, fora do alcance do cliente.';


-- -----------------------------------------------------------------------------
-- 2. posts_comunidade: áudio da casa
--
-- Caminho dentro do bucket `audio_da_casa`. Só o feed o devolve, e só quando o
-- autor está em contas_da_casa (ver 20261018000009). Um usuário comum que
-- gravasse esta coluna não teria o áudio exibido.
-- -----------------------------------------------------------------------------

ALTER TABLE public.posts_comunidade
  ADD COLUMN IF NOT EXISTS caminho_do_audio_da_casa text;

ALTER TABLE public.posts_comunidade
  DROP CONSTRAINT IF EXISTS posts_caminho_do_audio_da_casa_formato,
  ADD CONSTRAINT posts_caminho_do_audio_da_casa_formato
  CHECK (
    caminho_do_audio_da_casa IS NULL
    OR (char_length(caminho_do_audio_da_casa) <= 120
        AND caminho_do_audio_da_casa ~ '^burpzilla/[0-9a-f-]{36}\.m4a$')
  );


-- -----------------------------------------------------------------------------
-- 3. Bucket público audio_da_casa
--
-- Separado do bucket de áudio dos jogadores de propósito (ADR 0007): é público
-- e cacheável, e só tem conteúdo da casa. 1 MB, só MP4/AAC. Nenhuma policy em
-- storage.objects: o service_role ignora RLS e escreve; ninguém mais escreve, e
-- sem policy de SELECT não há listagem pela API (o link direto do objeto
-- público continua funcionando).
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio_da_casa', 'audio_da_casa', true, 1048576, ARRAY['audio/mp4'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- -----------------------------------------------------------------------------
-- 4. Funções do service_role
--
-- Todas SECURITY DEFINER com search_path fixo. Revogadas de PUBLIC e também de
-- anon/authenticated (o REVOKE de PUBLIC sozinho não basta no Supabase; ver
-- 20260812000001). Só service_role executa.
-- -----------------------------------------------------------------------------

-- A janela do conteúdo da casa: do primeiro deploy de produção até 15/10.
-- Está num lugar só. Datas explícitas em -03 (Brasília não tem horário de verão).
CREATE FUNCTION public.aue_dentro_da_janela_da_casa(p_quando timestamptz)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT p_quando >= '2026-08-28 00:00:00-03'::timestamptz
     AND p_quando <= '2026-10-15 23:59:59-03'::timestamptz;
$$;

REVOKE ALL ON FUNCTION public.aue_dentro_da_janela_da_casa(timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aue_dentro_da_janela_da_casa(timestamptz) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_dentro_da_janela_da_casa(timestamptz) TO service_role;


-- Marca um usuário que o script já criou em auth.users como conta da casa e
-- acerta o perfil. Idempotente: rodar de novo regrava os mesmos valores.
--
-- Guarda: o e-mail precisa ser do domínio interno (.invalid, que ninguém recebe).
-- Assim a função não consegue reescrever o perfil de uma pessoa de verdade, nem
-- por engano de quem chama.
--
-- `proteger_estatisticas_do_perfil` (trigger ao_atualizar_perfil) desfaz
-- criado_em e e_fundador em todo UPDATE. A função NÃO é redefinida: o trigger é
-- desligado e religado no mesmo corpo. DDL é transacional no Postgres, então se
-- qualquer passo falhar o ENABLE não é pulado: o DISABLE também volta.
-- O ALTER TABLE segura um lock curto em perfis (só durante esta chamada).
--
-- Vaga de fundador: o gatilho de criação do perfil pode conceder a vaga antes
-- desta função rodar. Aqui ela volta para `false`, e a vaga volta a existir
-- (`aue_vaga_de_fundador_disponivel` conta só quem é fundador de fato).
CREATE FUNCTION public.registrar_conta_da_casa(
  p_usuario_id uuid,
  p_papel text,
  p_apelido text,
  p_handle text,
  p_bio text,
  p_criado_em timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
BEGIN
  IF p_papel IS NULL OR p_papel NOT IN ('personagem', 'agente') THEN
    RAISE EXCEPTION 'Papel inválido: %', p_papel USING ERRCODE = '22023';
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = p_usuario_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário % não existe em auth.users', p_usuario_id USING ERRCODE = '22023';
  END IF;
  IF v_email IS NULL OR v_email NOT LIKE '%@contas-da-casa.invalid' THEN
    RAISE EXCEPTION 'Só usuário com e-mail do domínio interno vira conta da casa' USING ERRCODE = '22023';
  END IF;

  IF p_handle IS NULL OR p_handle !~ '^[a-z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'Handle fora do formato' USING ERRCODE = '22023';
  END IF;
  IF p_apelido IS NULL OR char_length(btrim(p_apelido)) NOT BETWEEN 2 AND 30 THEN
    RAISE EXCEPTION 'Apelido precisa ter de 2 a 30 caracteres' USING ERRCODE = '22023';
  END IF;
  IF p_bio IS NULL OR char_length(p_bio) > 160 THEN
    RAISE EXCEPTION 'Bio ausente ou acima de 160 caracteres' USING ERRCODE = '22023';
  END IF;
  -- "lucas" é nome de agente da squad e do rival dos contos: nenhuma conta da casa o usa.
  IF position('lucas' IN lower(p_handle || ' ' || p_apelido || ' ' || v_email)) > 0 THEN
    RAISE EXCEPTION 'Conta da casa não usa esse nome' USING ERRCODE = '22023';
  END IF;
  IF p_criado_em IS NULL OR NOT public.aue_dentro_da_janela_da_casa(p_criado_em) THEN
    RAISE EXCEPTION 'criado_em fora da janela da casa' USING ERRCODE = '22023';
  END IF;

  -- O perfil nasce do gatilho de auth.users. Sem ele, algo está fora do lugar.
  IF NOT EXISTS (SELECT 1 FROM public.perfis WHERE id = p_usuario_id) THEN
    RAISE EXCEPTION 'Perfil de % não existe', p_usuario_id USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.contas_da_casa (usuario_id, papel)
  VALUES (p_usuario_id, p_papel)
  ON CONFLICT (usuario_id) DO UPDATE SET papel = EXCLUDED.papel;

  ALTER TABLE public.perfis DISABLE TRIGGER ao_atualizar_perfil;

  UPDATE public.perfis
     SET apelido = btrim(p_apelido),
         handle = p_handle,
         bio = p_bio,
         e_fundador = false,
         criado_em = p_criado_em
   WHERE id = p_usuario_id;

  ALTER TABLE public.perfis ENABLE TRIGGER ao_atualizar_perfil;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_conta_da_casa(uuid, text, text, text, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_conta_da_casa(uuid, text, text, text, text, timestamptz) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_conta_da_casa(uuid, text, text, text, text, timestamptz) TO service_role;


-- Publica um post da casa com data retroativa. O id vem de fora (determinístico)
-- para a carga poder rodar duas vezes sem duplicar: devolve true se inseriu e
-- false se o id já existia. Não atualiza o que já está lá.
--
-- Sem resultado (result_id NULL): o post não tem nota, e o feed não inventa uma.
CREATE FUNCTION public.publicar_da_casa(
  p_id uuid,
  p_usuario_id uuid,
  p_topico text,
  p_conteudo text,
  p_criado_em timestamptz,
  p_caminho_do_audio text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inseridos integer;
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'O id do post é obrigatório' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contas_da_casa WHERE usuario_id = p_usuario_id) THEN
    RAISE EXCEPTION 'Só conta da casa publica por aqui' USING ERRCODE = '42501';
  END IF;
  IF p_criado_em IS NULL OR NOT public.aue_dentro_da_janela_da_casa(p_criado_em) THEN
    RAISE EXCEPTION 'created_at fora da janela da casa' USING ERRCODE = '22023';
  END IF;
  IF p_topico IS NULL OR char_length(btrim(p_topico)) = 0 THEN
    RAISE EXCEPTION 'Tópico vazio' USING ERRCODE = '22023';
  END IF;
  IF p_conteudo IS NULL OR char_length(btrim(p_conteudo)) = 0 OR char_length(p_conteudo) > 2000 THEN
    RAISE EXCEPTION 'Texto vazio ou acima de 2000 caracteres' USING ERRCODE = '22023';
  END IF;
  -- O áudio de um post só pode ser o arquivo com o id dele.
  IF p_caminho_do_audio IS NOT NULL
     AND p_caminho_do_audio <> ('burpzilla/' || p_id::text || '.m4a') THEN
    RAISE EXCEPTION 'Caminho do áudio não é o do post' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.posts_comunidade (
    id, user_id, post_type, result_id, topic, content, created_at,
    consentimento_audio_publico, caminho_do_audio_da_casa
  ) VALUES (
    p_id, p_usuario_id, 'text_announcement', NULL, btrim(p_topico), p_conteudo, p_criado_em,
    true, p_caminho_do_audio
  )
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS v_inseridos = ROW_COUNT;
  RETURN v_inseridos = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.publicar_da_casa(uuid, uuid, text, text, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publicar_da_casa(uuid, uuid, text, text, timestamptz, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publicar_da_casa(uuid, uuid, text, text, timestamptz, text) TO service_role;


-- Comenta num post com data retroativa. Mesmas regras: id de fora, idempotente,
-- só conta da casa, só dentro da janela. O comentário não pode sair antes do post.
CREATE FUNCTION public.comentar_da_casa(
  p_id uuid,
  p_post_id uuid,
  p_usuario_id uuid,
  p_conteudo text,
  p_criado_em timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_post_criado_em timestamptz;
  v_inseridos integer;
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'O id do comentário é obrigatório' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contas_da_casa WHERE usuario_id = p_usuario_id) THEN
    RAISE EXCEPTION 'Só conta da casa comenta por aqui' USING ERRCODE = '42501';
  END IF;
  IF p_criado_em IS NULL OR NOT public.aue_dentro_da_janela_da_casa(p_criado_em) THEN
    RAISE EXCEPTION 'created_at fora da janela da casa' USING ERRCODE = '22023';
  END IF;
  IF p_conteudo IS NULL OR char_length(btrim(p_conteudo)) = 0 OR char_length(p_conteudo) > 500 THEN
    RAISE EXCEPTION 'Comentário vazio ou acima de 500 caracteres' USING ERRCODE = '22023';
  END IF;

  SELECT p.created_at INTO v_post_criado_em FROM public.posts_comunidade p WHERE p.id = p_post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post % não existe', p_post_id USING ERRCODE = '22023';
  END IF;
  IF p_criado_em <= v_post_criado_em THEN
    RAISE EXCEPTION 'O comentário não pode sair antes do post' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.comentarios (id, post_id, result_id, user_id, content, created_at, resposta_a_id, nivel)
  VALUES (p_id, p_post_id, NULL, p_usuario_id, p_conteudo, p_criado_em, NULL, 0)
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS v_inseridos = ROW_COUNT;
  RETURN v_inseridos = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.comentar_da_casa(uuid, uuid, uuid, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.comentar_da_casa(uuid, uuid, uuid, text, timestamptz) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.comentar_da_casa(uuid, uuid, uuid, text, timestamptz) TO service_role;

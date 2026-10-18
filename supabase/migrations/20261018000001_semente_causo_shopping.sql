-- =============================================================================
-- 20261018000001 — Semente Histórica do Bonde (08 de Agosto de 2026)
-- Causo canônico no Shopping e respostas da squad
-- =============================================================================

DO $$
DECLARE
  v_post_id uuid := 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
  v_tiago_id uuid := '11111111-1111-1111-1111-111111111111';
  v_kayky_id uuid := '22222222-2222-2222-2222-222222222222';
  v_luiz_id uuid := '33333333-3333-3333-3333-333333333333';
  v_marcelo_id uuid := '44444444-4444-4444-4444-444444444444';
  v_rian_id uuid := '55555555-5555-5555-5555-555555555555';
  v_lucas_id uuid := '66666666-6666-6666-6666-666666666666';
  v_iury_id uuid := '77777777-7777-7777-7777-777777777777';
BEGIN
  -- 1. Garante os usuários em auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES
    ('00000000-0000-0000-0000-000000000000', v_tiago_id, 'authenticated', 'authenticated', 'tiago@aue.app', '', now(), '{"provider":"email","providers":["email"]}', '{"apelido":"Tiago"}', '2026-08-08 16:40:00+00', '2026-08-08 16:40:00+00'),
    ('00000000-0000-0000-0000-000000000000', v_kayky_id, 'authenticated', 'authenticated', 'kayky@aue.app', '', now(), '{"provider":"email","providers":["email"]}', '{"apelido":"Kayky"}', '2026-08-08 16:40:00+00', '2026-08-08 16:40:00+00'),
    ('00000000-0000-0000-0000-000000000000', v_luiz_id, 'authenticated', 'authenticated', 'luiz@aue.app', '', now(), '{"provider":"email","providers":["email"]}', '{"apelido":"Luiz"}', '2026-08-08 16:40:00+00', '2026-08-08 16:40:00+00'),
    ('00000000-0000-0000-0000-000000000000', v_marcelo_id, 'authenticated', 'authenticated', 'marcelo@aue.app', '', now(), '{"provider":"email","providers":["email"]}', '{"apelido":"Marcelo"}', '2026-08-08 16:40:00+00', '2026-08-08 16:40:00+00'),
    ('00000000-0000-0000-0000-000000000000', v_rian_id, 'authenticated', 'authenticated', 'rian@aue.app', '', now(), '{"provider":"email","providers":["email"]}', '{"apelido":"Rian"}', '2026-08-08 16:40:00+00', '2026-08-08 16:40:00+00'),
    ('00000000-0000-0000-0000-000000000000', v_lucas_id, 'authenticated', 'authenticated', 'lucas@aue.app', '', now(), '{"provider":"email","providers":["email"]}', '{"apelido":"Lucas"}', '2026-08-08 16:40:00+00', '2026-08-08 16:40:00+00'),
    ('00000000-0000-0000-0000-000000000000', v_iury_id, 'authenticated', 'authenticated', 'iury@aue.app', '', now(), '{"provider":"email","providers":["email"]}', '{"apelido":"Iury"}', '2026-08-08 16:40:00+00', '2026-08-08 16:40:00+00')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Garante os perfis atualizados com os apelidos da squad
  INSERT INTO public.perfis (id, apelido, criado_em) VALUES
    (v_tiago_id, 'Tiago', '2026-08-08 16:40:00+00'),
    (v_kayky_id, 'Kayky', '2026-08-08 16:40:00+00'),
    (v_luiz_id, 'Luiz', '2026-08-08 16:40:00+00'),
    (v_marcelo_id, 'Marcelo', '2026-08-08 16:40:00+00'),
    (v_rian_id, 'Rian', '2026-08-08 16:40:00+00'),
    (v_lucas_id, 'Lucas', '2026-08-08 16:40:00+00'),
    (v_iury_id, 'Iury', '2026-08-08 16:40:00+00')
  ON CONFLICT (id) DO UPDATE SET apelido = EXCLUDED.apelido;

  -- 3. Insere o Post Principal do Tiago (na comunidade existente "Histórias de Arroto")
  INSERT INTO public.posts_comunidade (
    id,
    user_id,
    post_type,
    topic,
    content,
    created_at
  ) VALUES (
    v_post_id,
    v_tiago_id,
    'text_announcement',
    'Histórias de Arroto',
    E'Mano, eu to no chão de tanto rir até agora kkkkkkkkkk\n\nFui no shopping com o @kayky pra ele comprar uma chuteira e o @luiz colou junto só pra comer no Mc. Chegando lá, o Luiz me toma simplesmente TRÊS refis de Coca-Cola. O Kayky enchendo o saco falando que ia estragar a dieta e o Luiz: "essa coca tá sem gás hoje, fraca demais".\n\nBeleza. Fomos no banheiro mijar antes de ir embora.\n\nO banheiro meio cheio, gente lavando a mão, cabine ocupada. Nisso entra um pai com um moleque de uns 12 anos. Os dois param no mictório do lado e do nada o coroa solta um BUUURP alto, daqueles que bate no azulejo e ecoa no shopping inteiro.\nO filho olha pra ele todo bobo: "Nossa pai, esse deu até eco!"\n\nO coroa ainda manda um segundo arroto pra se gabar.\n\nEu olhei pro Luiz pelo reflexo do azulejo com aquela cara de: vai deixar esse aleatório se criar na sua frente?\n\nIrmão... o Luiz estufou o peito de um jeito que parecia que ia levantar voo. E descarregou os 3 refis num combo triplo: um agudo rasgando, uma pausa dramática, um grave que parecia um motor de Scania e fechou com um estalo seco. O banheiro INTEIRO congelou.\n\nDo nada, um maluco berra lá de dentro da cabine trancada:\n"SUSPENDE O VETERINÁRIO!!!"\n\nO coroa ainda tentou dar uma revanche, engasgou no refluxo e passou a maior vergonha da vida dele na frente do próprio filho. O moleque olhou pro Luiz como se tivesse visto um super-herói.\n\nLuiz é um monstro, não tem como kkkkkkkkkkkkkkkkkkk',
    '2026-08-08 16:42:00+00'
  ) ON CONFLICT (id) DO NOTHING;

  -- 4. Insere os Comentários Retroativos da Squad
  INSERT INTO public.comentarios (post_id, user_id, content, created_at)
  VALUES
    (
      v_post_id,
      v_kayky_id,
      'vai tomar no cu vcs dois namoral kkkkkkkkkkkkkk eu só queria comprar uma porra de uma chuteira e saí de lá surdo de um ouvido. o cara soltou um dinossauro do meu lado. mas ó @luiz me ensina essa merda no domingo pq meu irmão vive arrotando alto no quarto dele e eu preciso humilhar ele na frente da família',
      '2026-08-08 16:46:00+00'
    ),
    (
      v_post_id,
      v_luiz_id,
      'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk ele que veio caçar assunto po! soltou o arroto e ficou olhando de lado achando que era o brabo do shopping. aí teve que tomar aula grátis',
      '2026-08-08 16:50:00+00'
    ),
    (
      v_post_id,
      v_marcelo_id,
      'ERA EU NA CABINE SEUS RETARDADOS KKKKKKKKKKKKKKKKKKKKKKKK EU TAVA CAGANDO EM PAZ E A PORTA DA CABINE VIBROU DE VERDADE achei que o teto da praça de alimentação tava desabando, tomei um susto do caralho',
      '2026-08-08 17:03:00+00'
    ),
    (
      v_post_id,
      v_rian_id,
      'O PIOR FOI A CARA DO FILHO DO CARA KKKKKKKKKKKKKKKKKKKK o moleque perdeu todo o respeito pelo pai em 3 segundos, a decepção no olhar da criança não tem preço',
      '2026-08-08 17:15:00+00'
    ),
    (
      v_post_id,
      v_lucas_id,
      'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk o cara achou que refil de shopping ia passar batido. 3 copos de coca sem gás é dinamite pura no estômago, o pai foi mexer com quem tava quieto',
      '2026-08-08 17:28:00+00'
    ),
    (
      v_post_id,
      v_iury_id,
      'Já to montando o grupo no zap pro teu irmão @kayky. Marca o dia desse churrasco aí que eu quero ver se ele aguenta o Luiz no X1 kkkkkk',
      '2026-08-08 18:10:00+00'
    )
  ON CONFLICT DO NOTHING;

END $$;

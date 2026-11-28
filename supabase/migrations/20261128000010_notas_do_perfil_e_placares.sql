-- O perfil usa a mesma publicação e versão de áudio elegíveis para o worker.
CREATE OR REPLACE FUNCTION public.resumo_notas_publicadas(p_perfil_id uuid)
RETURNS TABLE (melhor_nota numeric, media numeric, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH notas_do_servidor AS (
    SELECT n.* FROM aue_privado.notas_retrospectivas n
    WHERE n.versao IN ('retrospectiva-acustica-legado-v1', 'publicacao-acustica-servidor-v1')
  ), topicos_visiveis AS (
    SELECT t.* FROM public.topicos t
     WHERE t.status IN ('aberto', 'fechado')
       AND public.aue_e_conta_promovida(t.autor_id)
       AND (t.origem = 'pessoal' OR (t.origem = 'comunidade' AND EXISTS (
         SELECT 1 FROM public.grupos g WHERE g.id = t.comunidade_id AND nullif(btrim(g.slug), '') IS NOT NULL
       )))
       AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id = t.id)
  ), notas AS (
    -- O anexo é o áudio que o card reproduz, quando existir.
    SELECT n.nota
      FROM topicos_visiveis t
      JOIN notas_do_servidor n ON n.bucket = 'anexos_do_forum' AND n.caminho = t.anexo_caminho
      JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho AND o.metadata->>'eTag' = n.etag
     WHERE t.autor_id = p_perfil_id AND t.anexo_tipo = 'audio'
    UNION ALL
    SELECT n.nota
      FROM topicos_visiveis t
      JOIN public.contas_da_casa cc ON cc.usuario_id = t.autor_id
      JOIN notas_do_servidor n ON n.bucket = 'audio_da_casa' AND n.caminho = t.caminho_do_audio_da_casa
      JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho AND o.metadata->>'eTag' = n.etag
     WHERE t.autor_id = p_perfil_id AND t.anexo_tipo IS DISTINCT FROM 'audio'
       AND t.resultado_id IS NULL AND t.consentimento_audio_publico
    UNION ALL
    -- A fila resolve autoria, consentimento e caminho do áudio da Arena.
    SELECT n.nota
      FROM topicos_visiveis t
      JOIN aue_privado.audios_publicados_para_nota a
        ON a.tipo = 'topico' AND a.id = t.id AND a.bucket = 'audio_records'
      JOIN notas_do_servidor n ON n.bucket = a.bucket AND n.caminho = a.caminho
      JOIN storage.objects o ON o.bucket_id = a.bucket AND o.name = a.caminho
                             AND o.metadata->>'eTag' = n.etag
     WHERE t.autor_id = p_perfil_id AND n.versao = 'publicacao-acustica-servidor-v1'
    UNION ALL
    SELECT n.nota
      FROM public.respostas r
      JOIN topicos_visiveis t ON t.id = r.topico_id
      JOIN notas_do_servidor n ON n.bucket = 'anexos_do_forum' AND n.caminho = r.anexo_caminho
      JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho AND o.metadata->>'eTag' = n.etag
     WHERE r.autor_id = p_perfil_id AND r.status = 'visivel' AND r.anexo_tipo = 'audio'
       AND public.aue_e_conta_promovida(r.autor_id)
    UNION ALL
    -- O catálogo de arrotos do perfil só é acessível a contas promovidas.
    SELECT n.nota
      FROM public.arrotos_do_perfil a
      JOIN notas_do_servidor n ON n.bucket = 'arrotos_de_perfil' AND n.caminho = a.caminho_do_audio
      JOIN storage.objects o ON o.bucket_id = n.bucket AND o.name = n.caminho AND o.metadata->>'eTag' = n.etag
     WHERE a.autor_id = p_perfil_id AND a.estado = 'publicado'
       AND public.aue_e_conta_promovida(auth.uid())
       AND public.aue_e_conta_promovida(a.perfil_id)
       AND public.aue_e_conta_promovida(a.autor_id)
       -- Uma gravação compartilhada no feed e no perfil na mesma ação tem
       -- vínculo explícito. Conta uma vez enquanto o post espelhado for
       -- visível e tiver uma nota válida; caso contrário conta pelo perfil.
       AND NOT EXISTS (
         SELECT 1 FROM aue_privado.espelhos_de_arroto e
         JOIN topicos_visiveis t ON t.id = e.topico_id AND t.autor_id = a.autor_id AND t.anexo_tipo = 'audio'
         JOIN notas_do_servidor nt ON nt.bucket = 'anexos_do_forum' AND nt.caminho = t.anexo_caminho
         JOIN storage.objects ot ON ot.bucket_id = nt.bucket AND ot.name = nt.caminho AND ot.metadata->>'eTag' = nt.etag
         WHERE e.arroto_id = a.id
       )
  )
  SELECT max(n.nota), round(avg(n.nota), 1), count(*)
    FROM notas n
   WHERE public.aue_e_conta_promovida(p_perfil_id);
$$;

CREATE OR REPLACE FUNCTION public.obter_perfil_publico(p_handle text)
 RETURNS TABLE(id uuid, handle text, apelido text, url_do_avatar text, caminho_da_capa text, revisao_da_capa bigint, bio text, cidade text, titulo text, e_fundador boolean, criado_em timestamp with time zone, instagram text, tiktok text, youtube text, twitter text, total_causos bigint, melhor_nota numeric, total_seguidores bigint, total_seguindo bigint, eu_sigo boolean, sou_eu boolean, conta_da_casa boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    p.id, p.handle, p.apelido, p.url_do_avatar, p.caminho_da_capa, p.revisao_da_capa,
    p.bio, p.cidade, p.titulo, p.e_fundador, p.criado_em,
    p.instagram, p.tiktok, p.youtube, p.twitter,
    (SELECT count(*) FROM public.posts_comunidade c WHERE c.user_id = p.id AND NOT c.esta_escondido),
    (SELECT n.melhor_nota FROM public.resumo_notas_publicadas(p.id) n),
    (SELECT count(*) FROM public.seguidores s WHERE s.following_id = p.id),
    (SELECT count(*) FROM public.seguidores s WHERE s.follower_id = p.id),
    EXISTS(SELECT 1 FROM public.seguidores s WHERE s.following_id = p.id AND s.follower_id = auth.uid()),
    p.id = auth.uid(),
    EXISTS(SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id = p.id)
  FROM public.perfis p
  WHERE public.aue_e_conta_promovida(p.id)
    AND lower(p.handle) = lower(regexp_replace(btrim(p_handle), '^@', ''));
$function$;

CREATE OR REPLACE FUNCTION public.obter_placar_do_campeonato(p_campeonato_id uuid)
 RETURNS TABLE(usuario_id uuid, apelido text, url_do_avatar text, melhor_nota numeric, resultado_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  WITH ranqueados AS (
    SELECT
      r.usuario_id,
      p.apelido,
      p.url_do_avatar,
      r.nota,
      r.id AS resultado_id,
      ROW_NUMBER() OVER (PARTITION BY r.usuario_id ORDER BY r.nota DESC) AS rn
    FROM public.resultados r
    JOIN public.perfis p ON p.id = r.usuario_id
    JOIN public.campeonatos c ON c.id = p_campeonato_id
    JOIN public.participantes_campeonato pc
      ON pc.championship_id = c.id AND pc.user_id = r.usuario_id
    WHERE r.integridade = 'verificado_servidor'
      AND NOT r.esta_escondido
      AND r.criado_em >= c.start_date
      AND r.criado_em <= c.end_date
  )
  SELECT
    rr.usuario_id,
    rr.apelido,
    rr.url_do_avatar,
    rr.nota AS melhor_nota,
    rr.resultado_id
  FROM ranqueados rr
  WHERE rr.rn = 1
  ORDER BY rr.nota DESC;
END;
$function$;

-- Mantém as rodadas históricas visíveis. O líder e o placar exigem resultado confirmado.
CREATE OR REPLACE FUNCTION public.obter_batalha(p_codigo_de_acesso text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_b public.batalhas;
  v_rodadas jsonb;
  v_participantes jsonb;
  v_lider jsonb;
  v_empatados integer;
  v_placar jsonb;
BEGIN
  SELECT * INTO v_b
    FROM public.batalhas b
   WHERE b.codigo_de_acesso = p_codigo_de_acesso
     AND b.expira_em > timezone('utc', now());

  IF v_b.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'rodada_id',         rb.id,
               'posicao',           rb.posicao,
               'numero_da_rodada',  rb.numero_da_rodada,
               'participante_id',   rb.participante_id,
               'resultado_id',      r.id,
               'nota',              r.nota,
               'classificacao',     r.classificacao,
               'tipo_de_origem',    r.tipo_de_origem,
               'subtipo_de_origem', r.subtipo_de_origem,
               'e_artificial',      r.e_artificial,
               'esta_escondido',    r.esta_escondido,
               'caminho_do_audio',  CASE WHEN r.esta_escondido THEN NULL ELSE r.caminho_do_audio END,
               'apelido',           COALESCE(pb.apelido, p.apelido, r.nome_do_jogador, 'Anônimo'),
               'usuario_id',        rb.usuario_id,
               'criado_em',         rb.criado_em
             )
             ORDER BY rb.posicao
           ),
           '[]'::jsonb
         )
    INTO v_rodadas
    FROM public.rodadas_batalha rb
    JOIN public.resultados r ON r.id = rb.resultado_id
    LEFT JOIN public.perfis p ON p.id = rb.usuario_id
    LEFT JOIN public.participantes_batalha pb ON pb.id = rb.participante_id
   WHERE rb.batalha_id = v_b.id;

  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object('id', pb.id, 'apelido', pb.apelido, 'ordem_do_turno', pb.ordem_do_turno)
             ORDER BY pb.ordem_do_turno NULLS LAST, pb.entrou_em, pb.id
           ),
           '[]'::jsonb
         )
    INTO v_participantes
    FROM public.participantes_batalha pb
   WHERE pb.batalha_id = v_b.id;

  SELECT jsonb_build_object(
           'apelido',      COALESCE(pb.apelido, p.apelido, r.nome_do_jogador, 'Anônimo'),
           'nota',         r.nota,
           'resultado_id', r.id
         )
    INTO v_lider
    FROM public.rodadas_batalha rb
    JOIN public.resultados r ON r.id = rb.resultado_id
    LEFT JOIN public.perfis p ON p.id = rb.usuario_id
    LEFT JOIN public.participantes_batalha pb ON pb.id = rb.participante_id
   WHERE rb.batalha_id = v_b.id
     AND NOT r.esta_escondido
     AND r.integridade = 'verificado_servidor'
   ORDER BY r.nota DESC, r.profundidade DESC, r.potencia DESC, r.duracao DESC
   LIMIT 1;
  IF v_lider IS NOT NULL THEN
    SELECT count(*) INTO v_empatados
      FROM public.rodadas_batalha rb
      JOIN public.resultados r ON r.id = rb.resultado_id
     WHERE rb.batalha_id = v_b.id
       AND NOT r.esta_escondido
       AND r.integridade = 'verificado_servidor'
       AND r.nota = (v_lider->>'nota')::numeric;

    IF v_empatados > 1 THEN
      v_lider := NULL;
    END IF;
  END IF;
  IF v_b.tipo_de_batalha = 'remota' THEN
    WITH
    donos AS (
      SELECT d.usuario_id FROM public.donos_da_briga(v_b.id) d
    ),
    linhas AS (
      SELECT rb.numero_da_rodada AS numero,
             rb.usuario_id,
             rb.resultado_id,
             rb.posicao,
             COALESCE(p.apelido, r.nome_do_jogador, 'Anônimo') AS apelido
        FROM public.rodadas_batalha rb
        JOIN donos d ON d.usuario_id = rb.usuario_id
        JOIN public.resultados r ON r.id = rb.resultado_id AND r.integridade = 'verificado_servidor'
        LEFT JOIN public.perfis p ON p.id = rb.usuario_id
       WHERE rb.batalha_id = v_b.id
    ),
    rounds AS (
      SELECT numero,
             count(*) AS quantos,
             (array_agg(resultado_id ORDER BY posicao))[1] AS res_a,
             (array_agg(resultado_id ORDER BY posicao))[2] AS res_b
        FROM linhas
       GROUP BY numero
    ),
    fechados AS (
      SELECT numero,
             public.vencedor_do_round(res_a, res_b) AS vencedor
        FROM rounds
       WHERE quantos >= 2
    ),
    vitorias AS (
      SELECT l.usuario_id, count(*) AS quantas
        FROM fechados f
        JOIN linhas l ON l.resultado_id = f.vencedor
       GROUP BY l.usuario_id
    ),
    lados AS (
      SELECT l.usuario_id,
             min(l.posicao) AS entrou,
             (array_agg(l.apelido ORDER BY l.posicao))[1] AS apelido
        FROM linhas l
       GROUP BY l.usuario_id
    ),
    aberto AS (
      SELECT r.numero, l.usuario_id, l.resultado_id
        FROM rounds r
        JOIN linhas l ON l.numero = r.numero
       WHERE r.quantos = 1
       ORDER BY r.numero DESC
       LIMIT 1
    ),
    ultimo AS (
      SELECT max(numero) AS numero FROM rounds
    )
    SELECT jsonb_build_object(
             'rounds', (SELECT COALESCE(count(*), 0) FROM rounds),
             'lados', COALESCE(
               (SELECT jsonb_agg(
                         jsonb_build_object(
                           'usuario_id', s.usuario_id,
                           'apelido',    s.apelido,
                           'vitorias',   COALESCE(v.quantas, 0)
                         ) ORDER BY s.entrou
                       )
                  FROM lados s
                  LEFT JOIN vitorias v ON v.usuario_id = s.usuario_id),
               '[]'::jsonb
             ),
             'ultimo_round', (SELECT numero FROM ultimo),
             'vencedor_do_ultimo_round',
               (SELECT f.vencedor FROM fechados f WHERE f.numero = (SELECT numero FROM ultimo)),
             'round_aberto',
               (SELECT jsonb_build_object(
                         'numero',       a.numero,
                         'usuario_id',   a.usuario_id,
                         'resultado_id', a.resultado_id
                       )
                  FROM aberto a)
           )
      INTO v_placar;
  END IF;

  RETURN jsonb_build_object(
    'codigo_de_acesso', v_b.codigo_de_acesso,
    'tipo_de_batalha',  v_b.tipo_de_batalha,
    'tipo_de_local',    v_b.tipo_de_local,
    'total_de_rodadas', v_b.total_de_rodadas,
    'criado_em',        v_b.criado_em,
    'expira_em',        v_b.expira_em,
    'finalizada_em',    v_b.finalizada_em,
    'rodadas',          v_rodadas,
    'participantes',    v_participantes,
    'lider',            v_lider,
    'placar',           v_placar
  );
END;
$function$;

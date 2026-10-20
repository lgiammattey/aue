-- =============================================================================
-- Cadastro mensurável daqui para frente
--
-- `auth.users.created_at` é a criação da identidade anônima, não a promoção
-- dela para e-mail. Não se infere nem se preenche uma data passada: o painel
-- passa a contar promoções observadas por este mecanismo a partir desta
-- migration e declara esse começo ao consumidor.
-- =============================================================================

CREATE TABLE public.acompanhamentos_administrativos (
  chave text PRIMARY KEY,
  iniciado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.acompanhamentos_administrativos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.acompanhamentos_administrativos FROM PUBLIC, anon, authenticated;

INSERT INTO public.acompanhamentos_administrativos (chave)
VALUES ('cadastros_por_promocao')
ON CONFLICT (chave) DO NOTHING;

CREATE TABLE public.contas_promovidas (
  usuario_id uuid PRIMARY KEY REFERENCES public.perfis(id) ON DELETE CASCADE,
  conta_promovida_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_promovidas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.contas_promovidas FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.registrar_promocao_de_conta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce((to_jsonb(NEW) ->> 'is_anonymous')::boolean, false) = false
     AND nullif(btrim(NEW.email), '') IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.email IS DISTINCT FROM NEW.email) THEN
    -- O trigger histórico `on_auth_user_created` vem antes deste `zz_` em
    -- INSERT. A guarda transforma mudança futura nessa ordem em falha visível,
    -- em vez de perder silenciosamente o timestamp de cadastro.
    IF NOT EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = NEW.id) THEN
      RAISE EXCEPTION 'Perfil ausente ao registrar promoção da conta' USING ERRCODE = '55000';
    END IF;

    INSERT INTO public.contas_promovidas (usuario_id)
    VALUES (NEW.id)
    ON CONFLICT (usuario_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_promocao_de_conta() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER zz_registrar_promocao_de_conta
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.registrar_promocao_de_conta();

CREATE OR REPLACE FUNCTION public.painel_administrativo_resumo(
  p_inicio date DEFAULT NULL,
  p_fim date DEFAULT NULL,
  p_limite_pessoas integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_inicio date := coalesce(p_inicio, v_hoje - 29);
  v_fim date := coalesce(p_fim, v_hoje);
  v_inicio_em timestamptz;
  v_fim_exclusivo timestamptz;
  v_limite integer := greatest(1, least(coalesce(p_limite_pessoas, 100), 100));
  v_eventos jsonb;
  v_pessoas jsonb;
  v_dias jsonb;
  v_total_contas_de_email integer;
  v_cadastros integer;
  v_perfis_concluidos integer;
  v_perfis_pendentes integer;
  v_acompanhamento_iniciado_em timestamptz;
BEGIN
  IF NOT public.aue_e_administrador() THEN
    RAISE EXCEPTION 'Acesso administrativo negado' USING ERRCODE = '42501';
  END IF;

  IF v_inicio > v_fim OR v_fim > v_hoje OR (v_fim - v_inicio) > 89 THEN
    RAISE EXCEPTION 'Período inválido para o painel' USING ERRCODE = '22023';
  END IF;

  v_inicio_em := v_inicio::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_fim_exclusivo := (v_fim + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo';

  SELECT iniciado_em INTO v_acompanhamento_iniciado_em
    FROM public.acompanhamentos_administrativos
   WHERE chave = 'cadastros_por_promocao';

  -- Total atual é a verdade completa: conta com e-mail, sem visitante anônimo
  -- e sem personagem/agente operado pelo Auê.
  SELECT count(*)::integer INTO v_total_contas_de_email
    FROM auth.users u
   WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false
     AND nullif(btrim(u.email), '') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id);

  -- Período só é contado pela marca criada nesta migration. Não inclui promoções
  -- antigas, pois sua data real não existe no banco.
  SELECT count(*)::integer INTO v_cadastros
    FROM public.contas_promovidas cp
    JOIN auth.users u ON u.id = cp.usuario_id
   WHERE cp.conta_promovida_em >= v_inicio_em
     AND cp.conta_promovida_em < v_fim_exclusivo
     AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = cp.usuario_id);

  SELECT count(*)::integer INTO v_perfis_concluidos
    FROM public.perfis p JOIN auth.users u ON u.id = p.id
   WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false
     AND nullif(btrim(u.email), '') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id)
     AND p.perfil_social_concluido_em >= v_inicio_em
     AND p.perfil_social_concluido_em < v_fim_exclusivo;

  SELECT count(*)::integer INTO v_perfis_pendentes
    FROM public.perfis p JOIN auth.users u ON u.id = p.id
   WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false
     AND nullif(btrim(u.email), '') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id)
     AND p.perfil_social_concluido_em IS NULL;

  SELECT coalesce(jsonb_object_agg(e.evento, e.total), '{}'::jsonb) INTO v_eventos
    FROM (SELECT evento, count(*)::integer AS total FROM public.eventos_de_telemetria
           WHERE criado_em >= v_inicio_em AND criado_em < v_fim_exclusivo GROUP BY evento) e;

  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.data), '[]'::jsonb) INTO v_dias
    FROM (
      SELECT (v_inicio + serie.dias)::date AS data,
             count(*) FILTER (WHERE evento = 'abriu_arena')::integer AS abriu_arena,
             count(*) FILTER (WHERE evento = 'iniciou_arroto')::integer AS iniciou_arroto,
             count(*) FILTER (WHERE evento = 'recebeu_nota')::integer AS recebeu_nota,
             count(*) FILTER (WHERE evento = 'compartilhou')::integer AS compartilhou,
             count(*) FILTER (WHERE evento = 'criou_x1')::integer AS criou_x1,
             count(*) FILTER (WHERE evento = 'respondeu_x1')::integer AS respondeu_x1,
             count(*) FILTER (WHERE evento = 'pediu_revanche')::integer AS pediu_revanche
        FROM generate_series(0, v_fim - v_inicio) AS serie(dias)
        LEFT JOIN public.eventos_de_telemetria t
          ON t.criado_em >= ((v_inicio + serie.dias)::timestamp AT TIME ZONE 'America/Sao_Paulo')
         AND t.criado_em < ((v_inicio + serie.dias + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
       GROUP BY serie.dias
    ) d;

  SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.criado_em DESC), '[]'::jsonb) INTO v_pessoas
    FROM (
      SELECT p.apelido, p.handle, p.criado_em, p.perfil_social_concluido_em,
             CASE WHEN p.perfil_social_concluido_em IS NULL THEN 'ficha_pendente' ELSE 'perfil_pronto' END AS estado
        FROM public.perfis p JOIN auth.users u ON u.id = p.id
       WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false
         AND nullif(btrim(u.email), '') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id)
       ORDER BY p.criado_em DESC LIMIT v_limite
    ) p;

  RETURN jsonb_build_object(
    'periodo', jsonb_build_object('inicio', v_inicio, 'fim', v_fim),
    'resumo', jsonb_build_object(
      'total_contas_de_email_atual', v_total_contas_de_email,
      'cadastros_acompanhados_no_periodo', v_cadastros,
      'acompanhamento_de_cadastros_iniciado_em', v_acompanhamento_iniciado_em,
      'perfis_concluidos_no_periodo', v_perfis_concluidos,
      'perfis_pendentes_atuais', v_perfis_pendentes,
      'eventos', v_eventos
    ),
    'eventos_por_dia', v_dias,
    'pessoas', v_pessoas
  );
END;
$$;

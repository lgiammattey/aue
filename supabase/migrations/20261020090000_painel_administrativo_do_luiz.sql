-- =============================================================================
-- Painel administrativo do Luiz
--
-- O navegador nunca recebe e-mail, UUID, sessão ou acesso direto à telemetria.
-- A única saída é a RPC abaixo, que só devolve agregados e a lista mínima de
-- contas promovidas por e-mail. A autorização nasce no banco: não há allowlist
-- em VITE_* nem comparação de e-mail no cliente.
-- =============================================================================

CREATE TABLE public.administradores_do_aue (
  usuario_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  concedido_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.administradores_do_aue IS
  'Contas autorizadas a consultar o resumo agregado do painel administrativo. Não expor por SELECT ao cliente.';

ALTER TABLE public.administradores_do_aue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.administradores_do_aue FROM PUBLIC, anon, authenticated;

-- Bootstrap único no servidor. Se a conta ainda não existir, a tabela fica
-- vazia até uma migração operacional explícita: nunca se confia no e-mail que
-- chegou do navegador para conceder acesso.
INSERT INTO public.administradores_do_aue (usuario_id)
SELECT u.id
  FROM auth.users u
 WHERE lower(btrim(u.email)) = 'luizgiammattey@icloud.com'
ON CONFLICT (usuario_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.aue_e_administrador()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (
       SELECT 1
         FROM public.administradores_do_aue a
        WHERE a.usuario_id = auth.uid()
     );
$$;

REVOKE ALL ON FUNCTION public.aue_e_administrador() FROM PUBLIC, anon, authenticated;

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
  v_cadastros integer;
  v_perfis_concluidos integer;
  v_perfis_pendentes integer;
BEGIN
  IF NOT public.aue_e_administrador() THEN
    RAISE EXCEPTION 'Acesso administrativo negado' USING ERRCODE = '42501';
  END IF;

  IF v_inicio > v_fim OR v_fim > v_hoje OR (v_fim - v_inicio) > 89 THEN
    RAISE EXCEPTION 'Período inválido para o painel' USING ERRCODE = '22023';
  END IF;

  -- O dia do painel é o dia vivido no Brasil, não o corte UTC do banco.
  v_inicio_em := v_inicio::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_fim_exclusivo := (v_fim + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo';

  -- Cadastro é conta de e-mail criada no Auth, nunca sessão anônima.
  SELECT count(*)::integer
    INTO v_cadastros
    FROM auth.users u
   WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false
     AND nullif(btrim(u.email), '') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id)
     AND u.created_at >= v_inicio_em
     AND u.created_at < v_fim_exclusivo;

  SELECT count(*)::integer
    INTO v_perfis_concluidos
    FROM public.perfis p
    JOIN auth.users u ON u.id = p.id
   WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false
     AND nullif(btrim(u.email), '') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id)
     AND p.perfil_social_concluido_em >= v_inicio_em
     AND p.perfil_social_concluido_em < v_fim_exclusivo;

  SELECT count(*)::integer
    INTO v_perfis_pendentes
    FROM public.perfis p
    JOIN auth.users u ON u.id = p.id
   WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false
     AND nullif(btrim(u.email), '') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id)
     AND p.perfil_social_concluido_em IS NULL;

  SELECT coalesce(jsonb_object_agg(e.evento, e.total), '{}'::jsonb)
    INTO v_eventos
    FROM (
      SELECT evento, count(*)::integer AS total
        FROM public.eventos_de_telemetria
       WHERE criado_em >= v_inicio_em
         AND criado_em < v_fim_exclusivo
       GROUP BY evento
    ) e;

  -- Eventos não carregam uid por decisão de privacidade. Portanto, a série é
  -- atividade agregada do produto: não existe como retirar uma linha de conta
  -- da casa sem transformar telemetria anônima em dado identificável.
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.data), '[]'::jsonb)
    INTO v_dias
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

  SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.criado_em DESC), '[]'::jsonb)
    INTO v_pessoas
    FROM (
      SELECT p.apelido,
             p.handle,
             p.criado_em,
             p.perfil_social_concluido_em,
             CASE
               WHEN p.perfil_social_concluido_em IS NULL THEN 'ficha_pendente'
               ELSE 'perfil_pronto'
             END AS estado
        FROM public.perfis p
        JOIN auth.users u ON u.id = p.id
       WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false
         AND nullif(btrim(u.email), '') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id)
       ORDER BY p.criado_em DESC
       LIMIT v_limite
    ) p;

  RETURN jsonb_build_object(
    'periodo', jsonb_build_object('inicio', v_inicio, 'fim', v_fim),
    'resumo', jsonb_build_object(
      'cadastros_no_periodo', v_cadastros,
      'perfis_concluidos_no_periodo', v_perfis_concluidos,
      'perfis_pendentes_atuais', v_perfis_pendentes,
      'eventos', v_eventos
    ),
    'eventos_por_dia', v_dias,
    'pessoas', v_pessoas
  );
END;
$$;

REVOKE ALL ON FUNCTION public.painel_administrativo_resumo(date, date, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.painel_administrativo_resumo(date, date, integer) TO authenticated;

COMMENT ON FUNCTION public.painel_administrativo_resumo(date, date, integer) IS
  'Resumo administrativo agregado. Exige administradores_do_aue; não retorna e-mail, UUID, sessão, áudio ou eventos individuais.';

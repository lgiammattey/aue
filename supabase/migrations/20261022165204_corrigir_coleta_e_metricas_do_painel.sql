-- Coleta anônima: o gatilho consulta a própria tabela e portanto precisa
-- executar como dono, sem conceder leitura a clientes.
CREATE OR REPLACE FUNCTION public.limitar_telemetria_por_sessao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.sessao_id IS NOT NULL AND (
    SELECT count(*) FROM public.eventos_de_telemetria e
     WHERE e.sessao_id = NEW.sessao_id
       AND e.criado_em > now() - interval '1 minute'
  ) >= 120 THEN
    RAISE EXCEPTION 'Telemetria: limite por minuto' USING ERRCODE = '54000';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.limitar_telemetria_por_sessao() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.eventos_de_telemetria FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.eventos_de_telemetria TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.painel_administrativo_resumo(
  p_inicio date DEFAULT NULL, p_fim date DEFAULT NULL, p_limite_pessoas integer DEFAULT 100
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_inicio date := coalesce(p_inicio, v_hoje - 29);
  v_fim date := coalesce(p_fim, v_hoje);
  v_inicio_em timestamptz; v_fim_exclusivo timestamptz;
  v_limite integer := greatest(1, least(coalesce(p_limite_pessoas, 100), 100));
  v_eventos jsonb; v_pessoas jsonb; v_dias jsonb; v_acessos_por_pagina jsonb;
  v_total_contas_de_email integer; v_contas_anonimas integer; v_contas_ativas integer;
  v_cadastros integer; v_perfis_concluidos integer; v_perfis_pendentes integer;
  v_topicos integer; v_respostas integer; v_comunidades_ativas integer; v_acessos integer;
  v_acompanhamento_cadastros_em timestamptz; v_acompanhamento_acessos_em timestamptz;
BEGIN
  IF NOT public.aue_e_administrador() THEN RAISE EXCEPTION 'Acesso administrativo negado' USING ERRCODE = '42501'; END IF;
  IF v_inicio > v_fim OR v_fim > v_hoje OR (v_fim - v_inicio) > 89 THEN RAISE EXCEPTION 'Período inválido para o painel' USING ERRCODE = '22023'; END IF;
  v_inicio_em := v_inicio::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_fim_exclusivo := (v_fim + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo';
  SELECT iniciado_em INTO v_acompanhamento_cadastros_em FROM public.acompanhamentos_administrativos WHERE chave = 'cadastros_por_promocao';
  SELECT iniciado_em INTO v_acompanhamento_acessos_em FROM public.acompanhamentos_administrativos WHERE chave = 'acessos_de_paginas';
  SELECT count(*)::integer INTO v_total_contas_de_email FROM auth.users u WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false AND nullif(btrim(u.email), '') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id);
  SELECT count(*)::integer INTO v_contas_anonimas FROM auth.users u WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = true;
  SELECT count(*)::integer INTO v_contas_ativas FROM auth.users u WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false AND nullif(btrim(u.email), '') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id) AND (
    (u.last_sign_in_at >= v_inicio_em AND u.last_sign_in_at < v_fim_exclusivo) OR
    EXISTS (SELECT 1 FROM public.topicos t WHERE t.autor_id = u.id AND t.status IN ('aberto','fechado') AND t.criado_em >= v_inicio_em AND t.criado_em < v_fim_exclusivo AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id = t.id)) OR
    EXISTS (SELECT 1 FROM public.respostas r JOIN public.topicos t ON t.id = r.topico_id WHERE r.autor_id = u.id AND r.status = 'visivel' AND t.status IN ('aberto','fechado') AND r.criado_em >= v_inicio_em AND r.criado_em < v_fim_exclusivo)
  );
  SELECT count(*)::integer INTO v_cadastros FROM public.contas_promovidas cp JOIN auth.users u ON u.id = cp.usuario_id WHERE cp.conta_promovida_em >= v_inicio_em AND cp.conta_promovida_em < v_fim_exclusivo AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = cp.usuario_id);
  SELECT count(*)::integer INTO v_perfis_concluidos FROM public.perfis p JOIN auth.users u ON u.id = p.id WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false AND nullif(btrim(u.email), '') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id) AND p.perfil_social_concluido_em >= v_inicio_em AND p.perfil_social_concluido_em < v_fim_exclusivo;
  SELECT count(*)::integer INTO v_perfis_pendentes FROM public.perfis p JOIN auth.users u ON u.id = p.id WHERE coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false AND nullif(btrim(u.email), '') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = u.id) AND p.perfil_social_concluido_em IS NULL;
  SELECT count(*)::integer INTO v_topicos FROM public.topicos t WHERE t.status IN ('aberto','fechado') AND t.criado_em >= v_inicio_em AND t.criado_em < v_fim_exclusivo AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = t.autor_id) AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id = t.id);
  SELECT count(*)::integer INTO v_respostas FROM public.respostas r JOIN public.topicos t ON t.id = r.topico_id WHERE r.status = 'visivel' AND t.status IN ('aberto','fechado') AND r.criado_em >= v_inicio_em AND r.criado_em < v_fim_exclusivo AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = r.autor_id);
  SELECT count(DISTINCT atividade.comunidade_id)::integer INTO v_comunidades_ativas FROM (
    SELECT t.comunidade_id FROM public.topicos t WHERE t.status IN ('aberto','fechado') AND t.criado_em >= v_inicio_em AND t.criado_em < v_fim_exclusivo AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = t.autor_id) AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id = t.id)
    UNION
    SELECT t.comunidade_id FROM public.respostas r JOIN public.topicos t ON t.id = r.topico_id WHERE r.status = 'visivel' AND t.status IN ('aberto','fechado') AND r.criado_em >= v_inicio_em AND r.criado_em < v_fim_exclusivo AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id = r.autor_id)
  ) atividade;
  SELECT count(*)::integer INTO v_acessos FROM public.eventos_de_telemetria WHERE evento = 'visitou_pagina' AND criado_em >= v_inicio_em AND criado_em < v_fim_exclusivo;
  SELECT coalesce(jsonb_object_agg(e.evento,e.total),'{}'::jsonb) INTO v_eventos FROM (SELECT evento,count(*)::integer AS total FROM public.eventos_de_telemetria WHERE criado_em >= v_inicio_em AND criado_em < v_fim_exclusivo GROUP BY evento) e;
  SELECT coalesce(jsonb_agg(jsonb_build_object('pagina',p.pagina,'acessos',p.total) ORDER BY p.total DESC,p.pagina),'[]'::jsonb) INTO v_acessos_por_pagina FROM (SELECT pagina,count(*)::integer AS total FROM public.eventos_de_telemetria WHERE evento='visitou_pagina' AND criado_em >= v_inicio_em AND criado_em < v_fim_exclusivo GROUP BY pagina) p;
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.data),'[]'::jsonb) INTO v_dias FROM (
    SELECT (v_inicio+s.dias)::date AS data, count(*) FILTER (WHERE evento='visitou_pagina')::integer AS acessos_de_paginas, count(*) FILTER (WHERE evento='abriu_arena')::integer AS abriu_arena, count(*) FILTER (WHERE evento='iniciou_arroto')::integer AS iniciou_arroto, count(*) FILTER (WHERE evento='recebeu_nota')::integer AS recebeu_nota, count(*) FILTER (WHERE evento='compartilhou')::integer AS compartilhou, count(*) FILTER (WHERE evento='criou_x1')::integer AS criou_x1, count(*) FILTER (WHERE evento='respondeu_x1')::integer AS respondeu_x1, count(*) FILTER (WHERE evento='pediu_revanche')::integer AS pediu_revanche,
      (SELECT count(*)::integer FROM public.topicos t WHERE t.status IN ('aberto','fechado') AND t.criado_em >= ((v_inicio+s.dias)::timestamp AT TIME ZONE 'America/Sao_Paulo') AND t.criado_em < ((v_inicio+s.dias+1)::timestamp AT TIME ZONE 'America/Sao_Paulo') AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id=t.autor_id) AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id=t.id)) AS topicos_publicados,
      (SELECT count(*)::integer FROM public.respostas r JOIN public.topicos t ON t.id=r.topico_id WHERE r.status='visivel' AND t.status IN ('aberto','fechado') AND r.criado_em >= ((v_inicio+s.dias)::timestamp AT TIME ZONE 'America/Sao_Paulo') AND r.criado_em < ((v_inicio+s.dias+1)::timestamp AT TIME ZONE 'America/Sao_Paulo') AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id=r.autor_id)) AS respostas_publicadas
    FROM generate_series(0,v_fim-v_inicio) AS s(dias) LEFT JOIN public.eventos_de_telemetria t ON t.criado_em >= ((v_inicio+s.dias)::timestamp AT TIME ZONE 'America/Sao_Paulo') AND t.criado_em < ((v_inicio+s.dias+1)::timestamp AT TIME ZONE 'America/Sao_Paulo') GROUP BY s.dias
  ) d;
  SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.criado_em DESC),'[]'::jsonb) INTO v_pessoas FROM (SELECT p.apelido,p.handle,p.criado_em,p.perfil_social_concluido_em,CASE WHEN p.perfil_social_concluido_em IS NULL THEN 'ficha_pendente' ELSE 'perfil_pronto' END AS estado FROM public.perfis p JOIN auth.users u ON u.id=p.id WHERE coalesce((to_jsonb(u)->>'is_anonymous')::boolean,false)=false AND nullif(btrim(u.email),'') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.contas_da_casa c WHERE c.usuario_id=p.id) ORDER BY p.criado_em DESC LIMIT v_limite) p;
  RETURN jsonb_build_object('periodo',jsonb_build_object('inicio',v_inicio,'fim',v_fim),'resumo',jsonb_build_object('total_contas_de_email_atual',v_total_contas_de_email,'contas_anonimas_atuais',v_contas_anonimas,'contas_ativas_no_periodo',v_contas_ativas,'cadastros_acompanhados_no_periodo',v_cadastros,'acompanhamento_de_cadastros_iniciado_em',v_acompanhamento_cadastros_em,'perfis_concluidos_no_periodo',v_perfis_concluidos,'perfis_pendentes_atuais',v_perfis_pendentes,'topicos_publicados_no_periodo',v_topicos,'respostas_publicadas_no_periodo',v_respostas,'comunidades_ativas_no_periodo',v_comunidades_ativas,'acessos_de_paginas_no_periodo',v_acessos,'acompanhamento_de_acessos_iniciado_em',v_acompanhamento_acessos_em,'eventos',v_eventos),'acessos_por_pagina',v_acessos_por_pagina,'eventos_por_dia',v_dias,'pessoas',v_pessoas);
END;
$$;
REVOKE ALL ON FUNCTION public.painel_administrativo_resumo(date,date,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.painel_administrativo_resumo(date,date,integer) TO authenticated;

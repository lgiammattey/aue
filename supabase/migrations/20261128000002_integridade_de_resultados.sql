-- Resultados da Arena continuam sendo laudos experimentais até que um avaliador
-- de servidor confirme o áudio vinculado. A fórmula no banco não autentica as
-- quatro métricas recebidas do navegador.
--
-- A migração preserva linhas históricas. Elas ficam identificadas como legado,
-- mas não abrem novas consequências competitivas.
ALTER TABLE public.resultados
  ADD COLUMN integridade text NOT NULL DEFAULT 'legado';

ALTER TABLE public.resultados
  ALTER COLUMN integridade SET DEFAULT 'nao_verificado',
  ADD CONSTRAINT resultados_integridade_valida
    CHECK (integridade IN ('legado', 'nao_verificado', 'verificado_servidor'));

COMMENT ON COLUMN public.resultados.integridade IS
  'legado preserva histórico. nao_verificado é laudo criado com métricas declaradas pelo navegador. verificado_servidor exige vínculo de áudio, autoria e avaliação confirmada fora do cliente.';

-- As duas portas de posse também são portas de consequência. Resultado próprio
-- sem confirmação ainda pode ser visto como laudo, mas não cria nem responde X1.
CREATE OR REPLACE FUNCTION public.pode_usar_como_desafiante(p_resultado_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.resultados r
     WHERE r.id = p_resultado_id
       AND r.integridade = 'verificado_servidor'
       -- Resultado competitivo sempre pertence a uma sessão autenticada,
       -- inclusive quando a conta é anônima. Visitante continua podendo
       -- receber o laudo, mas não ganha posse inferida por janela de tempo.
       AND auth.uid() IS NOT NULL
       AND r.usuario_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.pode_usar_como_desafiado(p_resultado_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.resultados r
     WHERE r.id = p_resultado_id
       AND r.integridade = 'verificado_servidor'
       AND auth.uid() IS NOT NULL
       AND r.usuario_id = auth.uid()
  );
$$;

-- Estes predicados são chamados pelas policies de INSERT/UPDATE de desafios.
-- O grant é necessário nesse caminho autorizado, mas não fica aberto a PUBLIC.
REVOKE EXECUTE ON FUNCTION public.pode_usar_como_desafiante(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pode_usar_como_desafiado(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pode_usar_como_desafiante(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pode_usar_como_desafiado(uuid) TO anon, authenticated;

-- XP e conquistas são consequências competitivas. O gatilho ainda roda para
-- preservar o contrato de escrita, mas zera a concessão antes de qualquer
-- atualização de perfil e não concede selo por um laudo não verificado.
CREATE OR REPLACE FUNCTION public.calcular_xp_do_resultado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_recentes integer;
  v_xp integer := 0;
BEGIN
  IF NEW.integridade IS DISTINCT FROM 'verificado_servidor' THEN
    NEW.e_elegivel_para_xp := false;
    NEW.xp_ganho := 0;
    RETURN NEW;
  END IF;

  IF NEW.usuario_id IS NOT NULL THEN
    SELECT count(*) INTO v_recentes
      FROM public.resultados
     WHERE usuario_id = NEW.usuario_id
       AND integridade = 'verificado_servidor'
       AND criado_em >= NOW() - INTERVAL '24 hours';

    IF v_recentes < 5 THEN
      NEW.e_elegivel_para_xp := true;
      v_xp := 5;
      IF NEW.nota >= 95 THEN v_xp := v_xp + 40;
      ELSIF NEW.nota >= 90 THEN v_xp := v_xp + 30;
      ELSIF NEW.nota >= 70 THEN v_xp := v_xp + 20;
      ELSIF NEW.nota >= 40 THEN v_xp := v_xp + 10;
      END IF;
      NEW.xp_ganho := v_xp;
    ELSE
      NEW.e_elegivel_para_xp := false;
      NEW.xp_ganho := 0;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.conceder_conquistas_do_resultado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.integridade = 'verificado_servidor' AND NEW.usuario_id IS NOT NULL THEN
    INSERT INTO public.conquistas_usuario (user_id, conquista_id)
    VALUES (NEW.usuario_id, 'primeiro_aue') ON CONFLICT DO NOTHING;
    IF NEW.nota >= 70 THEN
      INSERT INTO public.conquistas_usuario (user_id, conquista_id)
      VALUES (NEW.usuario_id, 'passou_70') ON CONFLICT DO NOTHING;
    END IF;
    IF NEW.nota >= 90 THEN
      INSERT INTO public.conquistas_usuario (user_id, conquista_id)
      VALUES (NEW.usuario_id, 'passou_90') ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Proteção em profundidade para desafios que já tenham sido gravados antes da
-- policy. Comparadores internos nunca escolhem vencedor se uma ponta não foi
-- confirmada pelo servidor.
CREATE OR REPLACE FUNCTION public.aue_compare_results_v1(p_resultado_desafiante_id uuid, p_resultado_desafiado_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE a public.resultados; b public.resultados;
BEGIN
  SELECT * INTO a FROM public.resultados WHERE id = p_resultado_desafiante_id;
  SELECT * INTO b FROM public.resultados WHERE id = p_resultado_desafiado_id;
  IF a.id IS NULL OR b.id IS NULL
     OR a.integridade IS DISTINCT FROM 'verificado_servidor'
     OR b.integridade IS DISTINCT FROM 'verificado_servidor' THEN RETURN NULL; END IF;
  IF a.nota > b.nota THEN RETURN 'desafiante'; END IF;
  IF b.nota > a.nota THEN RETURN 'desafiado'; END IF;
  IF a.profundidade > b.profundidade THEN RETURN 'desafiante'; END IF;
  IF b.profundidade > a.profundidade THEN RETURN 'desafiado'; END IF;
  IF a.potencia > b.potencia THEN RETURN 'desafiante'; END IF;
  IF b.potencia > a.potencia THEN RETURN 'desafiado'; END IF;
  IF a.duracao > b.duracao THEN RETURN 'desafiante'; END IF;
  IF b.duracao > a.duracao THEN RETURN 'desafiado'; END IF;
  RETURN 'empate';
END;
$$;

-- O trigger roda durante as RPCs SECURITY DEFINER que escrevem o desafio.
-- Portanto o comparador não é uma RPC de leitura: não há grant ao cliente.
-- `vencedor_do_round` também segue fechado por não participar desse caminho.
REVOKE EXECUTE ON FUNCTION public.aue_compare_results_v1(uuid, uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.vencedor_do_round(p_resultado_a uuid, p_resultado_b uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT CASE
           WHEN a.integridade <> 'verificado_servidor' OR b.integridade <> 'verificado_servidor' THEN NULL
           WHEN a.nota > b.nota THEN a.id
           WHEN b.nota > a.nota THEN b.id
           ELSE NULL
         END
    FROM public.resultados a, public.resultados b
   WHERE a.id = p_resultado_a AND b.id = p_resultado_b;
$$;

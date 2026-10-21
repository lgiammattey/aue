-- Teto de frequência por conta nas escritas sociais (issue #316).
--
-- Tamanho, participação e conta promovida já eram validados, mas nada limitava
-- quantas vezes por minuto uma conta podia escrever. O limite mora em triggers
-- BEFORE INSERT, então vale para qualquer caminho (RPC ou espelho de trigger) sem
-- reescrever as funções.
--
-- Só conta quando há JWT e o autor da linha é quem está logado. Seed, migration e
-- SQL de manutenção não têm JWT e passam direto.
--
--   tópicos            10 por hora       respostas        60 por hora
--   comentários        60 por hora       reações (causo)  120 por minuto
--   reações (tópico)  120 por minuto     seguir           60 por hora
--   denúncias          20 por hora (causo/resultado e tópico/resposta)
--
-- Passou do teto: erro 54000 com HINT `limite_de_frequencia`, que o cliente traduz.

CREATE INDEX IF NOT EXISTS comentarios_por_usuario_idx ON public.comentarios (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reacoes_por_usuario_idx ON public.reacoes (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.aue_limitar_escrita()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_coluna_usuario text := TG_ARGV[0];
  v_coluna_tempo text := TG_ARGV[1];
  v_limite integer := TG_ARGV[2]::integer;
  v_janela integer := TG_ARGV[3]::integer;
  v_uid uuid := auth.uid();
  v_autor uuid := (to_jsonb(NEW) ->> v_coluna_usuario)::uuid;
  v_total bigint;
BEGIN
  -- Só vale para requisição de uma conta logada escrevendo em nome dela. Seed, migration
  -- e SQL de manutenção não têm JWT e passam direto.
  IF v_uid IS NULL OR v_autor IS DISTINCT FROM v_uid THEN RETURN NEW; END IF;

  EXECUTE format(
    'SELECT count(*) FROM %I.%I WHERE %I = $1 AND %I > now() - make_interval(secs => $2)',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, v_coluna_usuario, v_coluna_tempo)
    INTO v_total USING v_uid, v_janela;

  IF v_total >= v_limite THEN
    RAISE EXCEPTION 'Muita coisa de uma vez. Tenta daqui a pouco.'
      USING ERRCODE = '54000', HINT = 'limite_de_frequencia';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS limitar_escrita ON public.topicos;
CREATE TRIGGER limitar_escrita BEFORE INSERT ON public.topicos
  FOR EACH ROW EXECUTE FUNCTION public.aue_limitar_escrita('autor_id', 'criado_em', '10', '3600');
DROP TRIGGER IF EXISTS limitar_escrita ON public.respostas;
CREATE TRIGGER limitar_escrita BEFORE INSERT ON public.respostas
  FOR EACH ROW EXECUTE FUNCTION public.aue_limitar_escrita('autor_id', 'criado_em', '60', '3600');
DROP TRIGGER IF EXISTS limitar_escrita ON public.comentarios;
CREATE TRIGGER limitar_escrita BEFORE INSERT ON public.comentarios
  FOR EACH ROW EXECUTE FUNCTION public.aue_limitar_escrita('user_id', 'created_at', '60', '3600');
DROP TRIGGER IF EXISTS limitar_escrita ON public.reacoes;
CREATE TRIGGER limitar_escrita BEFORE INSERT ON public.reacoes
  FOR EACH ROW EXECUTE FUNCTION public.aue_limitar_escrita('user_id', 'created_at', '120', '60');
DROP TRIGGER IF EXISTS limitar_escrita ON public.reacoes_de_topicos;
CREATE TRIGGER limitar_escrita BEFORE INSERT ON public.reacoes_de_topicos
  FOR EACH ROW EXECUTE FUNCTION public.aue_limitar_escrita('user_id', 'criado_em', '120', '60');
DROP TRIGGER IF EXISTS limitar_escrita ON public.seguidores;
CREATE TRIGGER limitar_escrita BEFORE INSERT ON public.seguidores
  FOR EACH ROW EXECUTE FUNCTION public.aue_limitar_escrita('follower_id', 'created_at', '60', '3600');
DROP TRIGGER IF EXISTS limitar_escrita ON public.denuncias;
CREATE TRIGGER limitar_escrita BEFORE INSERT ON public.denuncias
  FOR EACH ROW EXECUTE FUNCTION public.aue_limitar_escrita('user_id', 'created_at', '20', '3600');
DROP TRIGGER IF EXISTS limitar_escrita ON public.denuncias_conversa;
CREATE TRIGGER limitar_escrita BEFORE INSERT ON public.denuncias_conversa
  FOR EACH ROW EXECUTE FUNCTION public.aue_limitar_escrita('usuario_id', 'criado_em', '20', '3600');

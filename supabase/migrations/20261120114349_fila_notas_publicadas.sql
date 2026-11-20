-- Fila privada descoberta a partir do acervo ainda visível. O worker nunca
-- recebe privilégios de usuário: somente o serviço pode reivindicar/concluir.
CREATE TABLE aue_privado.fila_notas_publicadas (
  tipo text NOT NULL CHECK (tipo IN ('topico','resposta','perfil')),
  id uuid NOT NULL,
  etag text NOT NULL,
  bucket text NOT NULL,
  caminho text NOT NULL,
  estado text NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente','processando','erro','rejeitado','concluido')),
  token uuid,
  prazo timestamptz,
  tentativas integer NOT NULL DEFAULT 0,
  proxima timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tipo,id)
);
ALTER TABLE aue_privado.fila_notas_publicadas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aue_privado.fila_notas_publicadas FROM PUBLIC, anon, authenticated;

CREATE VIEW aue_privado.audios_publicados_para_nota AS
SELECT 'topico'::text tipo,t.id,
 CASE WHEN t.anexo_tipo='audio' THEN 'anexos_do_forum' ELSE 'audio_da_casa' END::text bucket,
 CASE WHEN t.anexo_tipo='audio' THEN t.anexo_caminho ELSE t.caminho_do_audio_da_casa END caminho
 FROM public.topicos t
 WHERE t.status IN ('aberto','fechado') AND public.aue_e_conta_promovida(t.autor_id)
 AND (t.anexo_tipo='audio' OR (t.resultado_id IS NULL AND t.consentimento_audio_publico AND t.caminho_do_audio_da_casa IS NOT NULL))
UNION ALL
SELECT 'resposta',r.id,'anexos_do_forum',r.anexo_caminho
 FROM public.respostas r JOIN public.topicos t ON t.id=r.topico_id
 WHERE r.status='visivel' AND r.anexo_tipo='audio' AND t.status IN ('aberto','fechado')
 AND public.aue_e_conta_promovida(r.autor_id) AND public.aue_e_conta_promovida(t.autor_id)
UNION ALL
SELECT 'perfil',a.id,'arrotos_de_perfil',a.caminho_do_audio
 FROM public.arrotos_do_perfil a
 WHERE a.estado='publicado' AND public.aue_e_conta_promovida(a.autor_id)
 AND public.aue_e_conta_promovida(a.perfil_id);
REVOKE ALL ON aue_privado.audios_publicados_para_nota FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.reivindicar_audios_para_nota(p_limite integer DEFAULT 10)
RETURNS TABLE(tipo text,id uuid,bucket text,caminho text,etag text,mime text,token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF p_limite IS NULL OR p_limite < 1 OR p_limite > 20 THEN RAISE EXCEPTION 'limite inválido'; END IF;
  -- Retira pendências de conteúdo que foi removido/ocultado ou cujo objeto sumiu.
  DELETE FROM aue_privado.fila_notas_publicadas f WHERE NOT EXISTS (
    SELECT 1 FROM aue_privado.audios_publicados_para_nota a
    JOIN storage.objects o ON o.bucket_id=a.bucket AND o.name=a.caminho
    WHERE a.tipo=f.tipo AND a.id=f.id AND o.metadata->>'eTag' IS NOT NULL
  );
  INSERT INTO aue_privado.fila_notas_publicadas(tipo,id,etag,bucket,caminho,estado)
  SELECT a.tipo,a.id,o.metadata->>'eTag',a.bucket,a.caminho,
    CASE WHEN n.etag=o.metadata->>'eTag' THEN 'concluido' ELSE 'pendente' END
  FROM aue_privado.audios_publicados_para_nota a
  JOIN storage.objects o ON o.bucket_id=a.bucket AND o.name=a.caminho
  LEFT JOIN aue_privado.notas_retrospectivas n ON n.bucket=a.bucket AND n.caminho=a.caminho
  WHERE o.metadata->>'eTag' IS NOT NULL
  ON CONFLICT ON CONSTRAINT fila_notas_publicadas_pkey DO UPDATE SET etag=EXCLUDED.etag,bucket=EXCLUDED.bucket,caminho=EXCLUDED.caminho,estado=EXCLUDED.estado,
    token=NULL,prazo=NULL,tentativas=0,proxima=now()
  WHERE (aue_privado.fila_notas_publicadas.bucket,aue_privado.fila_notas_publicadas.caminho,aue_privado.fila_notas_publicadas.etag) IS DISTINCT FROM (EXCLUDED.bucket,EXCLUDED.caminho,EXCLUDED.etag);
  RETURN QUERY WITH escolhidos AS (
    SELECT f.tipo,f.id FROM aue_privado.fila_notas_publicadas f
    WHERE ((f.estado IN ('pendente','erro') AND f.proxima<=now()) OR (f.estado='processando' AND f.prazo<now()))
    ORDER BY f.proxima,f.tipo,f.id FOR UPDATE SKIP LOCKED LIMIT p_limite
  ), marcados AS (
    UPDATE aue_privado.fila_notas_publicadas f SET estado='processando',token=gen_random_uuid(),
      prazo=now()+interval '5 minutes',tentativas=f.tentativas+1
    FROM escolhidos e WHERE f.tipo=e.tipo AND f.id=e.id RETURNING f.*
  ) SELECT m.tipo,m.id,a.bucket,a.caminho,m.etag,o.metadata->>'mimetype',m.token
  FROM marcados m JOIN aue_privado.audios_publicados_para_nota a ON a.tipo=m.tipo AND a.id=m.id AND a.bucket=m.bucket AND a.caminho=m.caminho
  JOIN storage.objects o ON o.bucket_id=a.bucket AND o.name=a.caminho AND o.metadata->>'eTag'=m.etag;
END $$;

-- Só concede acesso ao objeto enquanto há uma concessão ativa e válida.
CREATE FUNCTION public.obter_audio_da_fila(p_tipo text,p_id uuid,p_token uuid)
RETURNS TABLE(bucket text,caminho text,etag text,mime text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT a.bucket,a.caminho,f.etag,o.metadata->>'mimetype'
 FROM aue_privado.fila_notas_publicadas f
 JOIN aue_privado.audios_publicados_para_nota a ON a.tipo=f.tipo AND a.id=f.id AND a.bucket=f.bucket AND a.caminho=f.caminho
 JOIN storage.objects o ON o.bucket_id=a.bucket AND o.name=a.caminho AND o.metadata->>'eTag'=f.etag
 WHERE f.tipo=p_tipo AND f.id=p_id AND f.token=p_token AND f.estado='processando' AND f.prazo>now();
$$;

CREATE FUNCTION public.concluir_nota_do_audio(p_tipo text,p_id uuid,p_etag text,p_token uuid,p_estado text,p_nota numeric DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_f aue_privado.fila_notas_publicadas%ROWTYPE; v_a record;
BEGIN
 IF p_estado NOT IN ('medido','rejeitado','erro') OR p_estado IS NULL OR
    (p_estado='medido' AND (p_nota IS NULL OR p_nota<0 OR p_nota>100 OR p_nota<>round(p_nota))) OR
    (p_estado<>'medido' AND p_nota IS NOT NULL) THEN RETURN false; END IF;
 SELECT * INTO v_f FROM aue_privado.fila_notas_publicadas f WHERE f.tipo=p_tipo AND f.id=p_id FOR UPDATE;
 IF NOT FOUND OR v_f.estado<>'processando' OR v_f.token IS DISTINCT FROM p_token OR v_f.etag IS DISTINCT FROM p_etag OR v_f.prazo<=now() THEN RETURN false; END IF;
 -- Impede que ocultação/remoção ou troca do objeto passem entre a conferência
 -- de elegibilidade e a gravação; nenhuma transação externa precisa confiar na fila.
 IF p_tipo='topico' THEN
   PERFORM 1 FROM public.topicos t WHERE t.id=p_id FOR UPDATE;
 ELSIF p_tipo='resposta' THEN
   PERFORM 1 FROM public.respostas r JOIN public.topicos t ON t.id=r.topico_id
    WHERE r.id=p_id FOR UPDATE OF t,r;
 ELSIF p_tipo='perfil' THEN
   PERFORM 1 FROM public.arrotos_do_perfil a WHERE a.id=p_id FOR UPDATE;
 ELSE RETURN false;
 END IF;
 IF NOT FOUND THEN DELETE FROM aue_privado.fila_notas_publicadas WHERE tipo=p_tipo AND id=p_id; RETURN false; END IF;
 PERFORM 1 FROM storage.objects o WHERE o.bucket_id=v_f.bucket AND o.name=v_f.caminho FOR UPDATE;
 IF NOT FOUND THEN DELETE FROM aue_privado.fila_notas_publicadas WHERE tipo=p_tipo AND id=p_id; RETURN false; END IF;
 SELECT a.bucket,a.caminho INTO v_a FROM aue_privado.audios_publicados_para_nota a
 JOIN storage.objects o ON o.bucket_id=a.bucket AND o.name=a.caminho AND o.metadata->>'eTag'=v_f.etag
 WHERE a.tipo=p_tipo AND a.id=p_id AND a.bucket=v_f.bucket AND a.caminho=v_f.caminho;
 IF NOT FOUND THEN DELETE FROM aue_privado.fila_notas_publicadas WHERE tipo=p_tipo AND id=p_id; RETURN false; END IF;
 IF p_estado='medido' THEN
   INSERT INTO aue_privado.notas_retrospectivas(bucket,caminho,etag,nota,versao)
   VALUES (v_a.bucket,v_a.caminho,v_f.etag,p_nota,'publicacao-acustica-servidor-v1')
   ON CONFLICT (bucket,caminho) DO UPDATE SET etag=EXCLUDED.etag,nota=EXCLUDED.nota,versao=EXCLUDED.versao,calculada_em=now()
   WHERE aue_privado.notas_retrospectivas.etag IS DISTINCT FROM EXCLUDED.etag;
 END IF;
 UPDATE aue_privado.fila_notas_publicadas SET estado=CASE p_estado WHEN 'medido' THEN 'concluido' ELSE p_estado END,
   token=NULL,prazo=NULL,proxima=now()+make_interval(secs=>least(3600,30*(2 ^ least(v_f.tentativas,7)))::integer)
 WHERE tipo=p_tipo AND id=p_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reivindicar_audios_para_nota(integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.obter_audio_da_fila(text,uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.concluir_nota_do_audio(text,uuid,text,uuid,text,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reivindicar_audios_para_nota(integer),public.obter_audio_da_fila(text,uuid,uuid),public.concluir_nota_do_audio(text,uuid,text,uuid,text,numeric) TO service_role;

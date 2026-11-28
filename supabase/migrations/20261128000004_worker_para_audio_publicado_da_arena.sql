-- A fila reutiliza o worker já privado para a única superfície competitiva
-- pública que pode ser verificada: um resultado da Arena publicado com
-- consentimento. Áudio privado e laudo individual ficam fora da fila.
ALTER TABLE aue_privado.notas_retrospectivas
  DROP CONSTRAINT notas_retrospectivas_bucket_check,
  ADD CONSTRAINT notas_retrospectivas_bucket_check
    CHECK (bucket IN ('audio_da_casa', 'anexos_do_forum', 'arrotos_de_perfil', 'audio_records'));

CREATE OR REPLACE VIEW aue_privado.audios_publicados_para_nota AS
SELECT 'topico'::text tipo, t.id,
 CASE WHEN t.anexo_tipo='audio' THEN 'anexos_do_forum' ELSE 'audio_da_casa' END::text bucket,
 CASE WHEN t.anexo_tipo='audio' THEN t.anexo_caminho ELSE t.caminho_do_audio_da_casa END caminho
 FROM public.topicos t
 WHERE t.status IN ('aberto','fechado') AND public.aue_e_conta_promovida(t.autor_id)
 AND (t.anexo_tipo='audio' OR (t.resultado_id IS NULL AND t.consentimento_audio_publico AND t.caminho_do_audio_da_casa IS NOT NULL))
UNION ALL
SELECT 'topico', t.id, 'audio_records', r.caminho_do_audio
 FROM public.topicos t
 JOIN public.resultados r ON r.id=t.resultado_id
 JOIN storage.objects o ON o.bucket_id='audio_records' AND o.name=r.caminho_do_audio
 WHERE t.status IN ('aberto','fechado') AND public.aue_e_conta_promovida(t.autor_id)
   AND t.anexo_tipo IS DISTINCT FROM 'audio'
   AND t.consentimento_audio_publico AND NOT r.esta_escondido
   AND r.usuario_id=t.autor_id AND r.caminho_do_audio IS NOT NULL
   AND coalesce(to_jsonb(o)->>'owner_id', to_jsonb(o)->>'owner') = r.usuario_id::text
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

-- Mantém o contrato legado da view, mas usa somente a nota calculada no worker
-- para resultado de Arena. A nota do laudo não é promovida por publicação.
CREATE OR REPLACE FUNCTION public.top_cinco_arrotadores()
RETURNS TABLE (handle text, apelido text, avatar_url text, nota numeric,
               alvo_tipo text, alvo_id uuid, fonte text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH topicos_visiveis AS (
    SELECT t.* FROM public.topicos t WHERE t.status IN ('aberto','fechado')
      AND public.aue_e_conta_promovida(t.autor_id)
      AND (t.origem='pessoal' OR (t.origem='comunidade' AND EXISTS (SELECT 1 FROM public.grupos g WHERE g.id=t.comunidade_id AND nullif(btrim(g.slug),'') IS NOT NULL)))
      AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id=t.id)
  ), candidatos AS (
    SELECT t.autor_id,t.id alvo_id,'topico'::text alvo_tipo,t.criado_em,n.nota,'anexo'::text fonte FROM topicos_visiveis t
      JOIN aue_privado.notas_retrospectivas n ON n.bucket='anexos_do_forum' AND n.caminho=t.anexo_caminho
      JOIN storage.objects o ON o.bucket_id=n.bucket AND o.name=n.caminho AND o.metadata->>'eTag'=n.etag
      WHERE t.anexo_tipo='audio' AND n.versao IN ('retrospectiva-acustica-legado-v1','publicacao-acustica-servidor-v1')
    UNION ALL
    SELECT r.autor_id,r.id,'resposta',r.criado_em,n.nota,'anexo' FROM public.respostas r JOIN topicos_visiveis t ON t.id=r.topico_id
      JOIN aue_privado.notas_retrospectivas n ON n.bucket='anexos_do_forum' AND n.caminho=r.anexo_caminho
      JOIN storage.objects o ON o.bucket_id=n.bucket AND o.name=n.caminho AND o.metadata->>'eTag'=n.etag
      WHERE r.status='visivel' AND r.anexo_tipo='audio' AND public.aue_e_conta_promovida(r.autor_id) AND n.versao IN ('retrospectiva-acustica-legado-v1','publicacao-acustica-servidor-v1')
    UNION ALL
    SELECT t.autor_id,t.id,'topico',t.criado_em,n.nota,'casa' FROM topicos_visiveis t
      JOIN public.contas_da_casa cc ON cc.usuario_id=t.autor_id JOIN public.grupos g ON g.id=t.comunidade_id AND nullif(btrim(g.slug),'') IS NOT NULL
      JOIN aue_privado.notas_retrospectivas n ON n.bucket='audio_da_casa' AND n.caminho=t.caminho_do_audio_da_casa
      JOIN storage.objects o ON o.bucket_id=n.bucket AND o.name=n.caminho AND o.metadata->>'eTag'=n.etag JOIN storage.buckets b ON b.id=n.bucket AND b.public
      WHERE t.anexo_tipo IS DISTINCT FROM 'audio' AND t.resultado_id IS NULL AND t.consentimento_audio_publico AND n.versao IN ('retrospectiva-acustica-legado-v1','publicacao-acustica-servidor-v1')
    UNION ALL
    SELECT t.autor_id,t.id,'topico',t.criado_em,n.nota,'arena' FROM topicos_visiveis t JOIN public.resultados r ON r.id=t.resultado_id
      JOIN aue_privado.notas_retrospectivas n ON n.bucket='audio_records' AND n.caminho=r.caminho_do_audio
      JOIN storage.objects o ON o.bucket_id=n.bucket AND o.name=n.caminho AND o.metadata->>'eTag'=n.etag
      WHERE t.anexo_tipo IS DISTINCT FROM 'audio'
        AND t.consentimento_audio_publico AND NOT r.esta_escondido AND r.usuario_id=t.autor_id
        AND coalesce(to_jsonb(o)->>'owner_id', to_jsonb(o)->>'owner') = r.usuario_id::text
        AND n.versao='publicacao-acustica-servidor-v1'
  ), elegiveis AS (
    SELECT c.*,p.handle::text handle,p.apelido::text apelido,p.url_do_avatar::text avatar_url,row_number() OVER (PARTITION BY c.autor_id ORDER BY c.nota DESC,c.criado_em,c.alvo_id) posicao_do_autor FROM candidatos c JOIN public.perfis p ON p.id=c.autor_id WHERE p.handle IS NOT NULL AND nullif(btrim(p.handle::text),'') IS NOT NULL
  ) SELECT e.handle,e.apelido,e.avatar_url,e.nota,e.alvo_tipo,e.alvo_id,e.fonte FROM elegiveis e WHERE e.posicao_do_autor=1 ORDER BY e.nota DESC,e.criado_em,e.alvo_id LIMIT 5;
$$;

-- A view permanece desativada para clientes, mas seu conteúdo não pode voltar
-- a ranquear laudos declarados caso algum grant histórico seja restaurado.
CREATE OR REPLACE VIEW public.global_ranking WITH (security_invoker = on) AS
SELECT * FROM (
  SELECT DISTINCT ON (r.usuario_id) r.usuario_id::text AS identifier,r.usuario_id AS user_id,
    COALESCE(nullif(btrim(r.nome_do_jogador),''),p.apelido) player_name,r.nota score,r.id result_id,r.criado_em created_at
  FROM public.resultados r LEFT JOIN public.perfis p ON p.id=r.usuario_id
  WHERE r.usuario_id IS NOT NULL AND r.e_artificial=false AND r.esta_escondido=false AND r.integridade='verificado_servidor'
  ORDER BY r.usuario_id,r.nota DESC,r.criado_em ASC
) best_scores ORDER BY score DESC,created_at ASC LIMIT 50;

-- Duelo V2 preserva durações para comparação neutra, sem classificação de
-- vencedor, e afirma no payload que não produz consequência competitiva.
CREATE OR REPLACE FUNCTION public.aue_v2_revelar_duelo(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_resultado jsonb; v_id uuid; v_lado text;
BEGIN
  v_resultado := public.aue_v2_revelar_duelo_sem_id(p_token);
  IF v_resultado->>'estado' <> 'revelado' THEN RETURN v_resultado; END IF;
  SELECT id,CASE WHEN criador_id=auth.uid() THEN 'criador' ELSE 'desafiante' END INTO v_id,v_lado FROM aue_privado.duelos_v2
    WHERE token_hash=extensions.digest(p_token,'sha256') AND auth.uid() IN (criador_id,desafiante_id) AND respondido_em IS NOT NULL;
  IF v_id IS NULL THEN RETURN jsonb_build_object('estado','indisponivel'); END IF;
  RETURN (v_resultado - 'resultado_provisorio') || jsonb_build_object('id',v_id,'lado_sessao',v_lado,'efeito_competitivo',false);
END;
$$;

-- A recuperação é o outro leitor do mesmo DTO. Mantém os campos de convite e
-- as durações, mas não entrega uma classificação de vencedor calculada no
-- cliente. A implementação antiga vira detalhe interno para não duplicar seus
-- locks e regras de acesso.
ALTER FUNCTION public.aue_v2_recuperar_duelo(uuid) RENAME TO aue_v2_recuperar_duelo_sem_resultado;
REVOKE ALL ON FUNCTION public.aue_v2_recuperar_duelo_sem_resultado(uuid) FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.aue_v2_recuperar_duelo(p_duelo_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_resultado jsonb;
BEGIN
  v_resultado := public.aue_v2_recuperar_duelo_sem_resultado(p_duelo_id);
  IF v_resultado->>'estado' <> 'revelado' THEN RETURN v_resultado; END IF;
  RETURN (v_resultado - 'resultado_provisorio') || jsonb_build_object('efeito_competitivo',false);
END;
$$;
REVOKE ALL ON FUNCTION public.aue_v2_recuperar_duelo(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aue_v2_recuperar_duelo(uuid) TO authenticated;

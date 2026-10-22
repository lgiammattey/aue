-- Projeção em lote para feed e perfil. Não altera as assinaturas das RPCs
-- existentes, nem arquivos, Storage, RLS ou consentimento.
CREATE OR REPLACE FUNCTION public.audio_de_topicos(p_ids uuid[])
RETURNS TABLE(
  topico_id uuid,
  resultado_id uuid,
  nota numeric,
  duracao numeric,
  subtipo_de_origem text,
  caminho_do_audio text,
  caminho_do_audio_da_casa text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_ids uuid[] := ARRAY(
    SELECT DISTINCT id
      FROM unnest(coalesce(p_ids, ARRAY[]::uuid[])) AS id
     WHERE id IS NOT NULL
     LIMIT 100
  );
BEGIN
  RETURN QUERY
  SELECT t.id,
         t.resultado_id,
         CASE WHEN t.consentimento_audio_publico THEN r.nota::numeric END,
         CASE WHEN t.consentimento_audio_publico THEN r.duracao::numeric END,
         CASE WHEN t.consentimento_audio_publico THEN r.subtipo_de_origem END,
         CASE WHEN t.consentimento_audio_publico AND NOT r.esta_escondido THEN r.caminho_do_audio END,
         CASE WHEN t.consentimento_audio_publico
                   AND EXISTS (SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id = t.autor_id)
              THEN t.caminho_do_audio_da_casa END
    FROM public.topicos t
    JOIN public.grupos g ON g.id = t.comunidade_id AND nullif(btrim(g.slug), '') IS NOT NULL
    JOIN public.perfis pf ON pf.id = t.autor_id AND public.aue_e_conta_promovida(t.autor_id)
    LEFT JOIN public.resultados r ON r.id = t.resultado_id
   WHERE t.id = ANY(v_ids)
     AND t.status IN ('aberto', 'fechado')
     AND NOT EXISTS (SELECT 1 FROM public.pautas_de_topicos p WHERE p.pauta_id = t.id);
END;
$$;

REVOKE ALL ON FUNCTION public.audio_de_topicos(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audio_de_topicos(uuid[]) TO anon, authenticated;

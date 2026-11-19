-- CANDIDATA LOCAL: bloqueia a exclusão quando há vínculos de conteúdo ou
-- objetos. Casos retidos exigem análise operacional; não remove arquivos.
-- Ainda requer validação no schema completo e na Storage API antes do deploy.
CREATE FUNCTION aue_privado.proteger_exclusao_auth() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE f record; v_tem boolean; v_id_attnum smallint;
BEGIN
  -- Usa o mesmo domínio que a criação do duelo e o upload protegido.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('aue-v2-exclusao-conta:' || OLD.id::text, 0));
  -- Impede que uma FK nova passe a apontar para o perfil durante a auditoria.
  PERFORM 1 FROM public.perfis WHERE id=OLD.id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.perfis p WHERE p.id=OLD.id
      AND (nullif(btrim(p.url_do_avatar),'') IS NOT NULL OR nullif(btrim(p.caminho_da_capa),'') IS NOT NULL)) THEN
    RAISE EXCEPTION 'Exclusão requer revisão de arquivos do perfil' USING ERRCODE='23503';
  END IF;
  IF EXISTS (SELECT 1 FROM storage.objects o
      WHERE o.owner_id=OLD.id::text OR split_part(o.name,'/',1)=OLD.id::text) THEN
    RAISE EXCEPTION 'Exclusão requer revisão de arquivos' USING ERRCODE='23503';
  END IF;

  -- Conservador: qualquer FK pública/privada direta à conta ou ao perfil
  -- bloqueia, inclusive campeonato, batalha, denúncia e registro do duelo.
  -- A linha do próprio perfil é a única exceção conhecida e pode ser apagada.
  FOR f IN
    SELECT c.oid,c.conrelid,c.confrelid,c.conkey,c.confkey,n.nspname,t.relname,t.relkind
    FROM pg_catalog.pg_constraint c
    JOIN pg_catalog.pg_class t ON t.oid=c.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid=t.relnamespace
    WHERE c.contype='f' AND c.confrelid IN ('auth.users'::regclass,'public.perfis'::regclass)
      AND n.nspname IN ('public','aue_privado')
      AND NOT (c.conrelid='public.perfis'::regclass AND c.confrelid='auth.users'::regclass
        AND c.conkey=ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute
                           WHERE attrelid='public.perfis'::regclass AND attname='id')]::smallint[])
  LOOP
    SELECT a.attnum INTO v_id_attnum FROM pg_catalog.pg_attribute a
      WHERE a.attrelid=f.confrelid AND a.attname='id' AND NOT a.attisdropped;
    IF cardinality(f.conkey)<>1 OR cardinality(f.confkey)<>1 OR f.confkey[1]<>v_id_attnum
       OR f.relkind NOT IN ('r','p') THEN
      RAISE EXCEPTION 'Exclusão requer revisão de vínculo não suportado' USING ERRCODE='23503';
    END IF;
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I.%I WHERE %I = $1)', f.nspname, f.relname,
      (SELECT a.attname FROM pg_catalog.pg_attribute a WHERE a.attrelid=f.conrelid AND a.attnum=f.conkey[1]))
      INTO v_tem USING OLD.id;
    IF v_tem THEN RAISE EXCEPTION 'Exclusão requer revisão de conteúdo ou vínculo' USING ERRCODE='23503'; END IF;
  END LOOP;
  -- Sem FK para Auth: a marca sobrevive ao DELETE e bloqueia JWT antigo.
  INSERT INTO aue_privado.contas_em_exclusao_v2(usuario_id) VALUES (OLD.id) ON CONFLICT DO NOTHING;
  RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION aue_privado.proteger_exclusao_auth() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER aue_proteger_exclusao_auth BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION aue_privado.proteger_exclusao_auth();

-- Somente o bucket legado cuja policy existente aceitava JWT e prefixo sem
-- validar a conta. Não muda as policies de outros buckets.
CREATE FUNCTION aue_privado.pode_enviar_audio_legado() RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  PERFORM aue_privado.travar_conta_v2(auth.uid());
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE id=auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION aue_privado.pode_enviar_audio_legado() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION aue_privado.pode_enviar_audio_legado() TO authenticated;
DROP POLICY "Authenticated Users can upload audio" ON storage.objects;
CREATE POLICY "Authenticated Users can upload audio" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='audio_records' AND (storage.foldername(name))[1]=auth.uid()::text
  AND (SELECT count(*) FROM storage.objects o WHERE o.bucket_id='audio_records'
       AND (storage.foldername(o.name))[1]=auth.uid()::text) < 300
  AND aue_privado.pode_enviar_audio_legado());

-- Não soltar a marca só porque Auth sumiu: JWTs já emitidos ainda podem valer.
-- A remoção futura da marca depende de procedimento e duração efetiva do JWT.
CREATE OR REPLACE FUNCTION public.aue_v2_concluir_exclusao_conta(p_usuario_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_usuario_id IS NULL THEN RAISE EXCEPTION 'Conta necessária' USING ERRCODE='22023'; END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE id=p_usuario_id) THEN RETURN jsonb_build_object('estado','auth_pendente'); END IF;
  IF NOT EXISTS (SELECT 1 FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id=p_usuario_id) THEN
    RETURN jsonb_build_object('estado','sem_registro');
  END IF;
  IF EXISTS (SELECT 1 FROM storage.objects o
      WHERE o.owner_id=p_usuario_id::text OR split_part(o.name,'/',1)=p_usuario_id::text)
    OR EXISTS (SELECT 1 FROM aue_privado.gravacoes_v2 g WHERE g.usuario_id=p_usuario_id)
    OR EXISTS (SELECT 1 FROM aue_privado.duelos_v2 d WHERE p_usuario_id IN (d.criador_id,d.desafiante_id)) THEN
    RETURN jsonb_build_object('estado','pendencias');
  END IF;
  RETURN jsonb_build_object('estado','concluida');
END;
$$;

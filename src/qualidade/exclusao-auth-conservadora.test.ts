import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';

// PGlite simula Auth e Storage; não prova rede, políticas reais ou corridas.
it('preserva vínculos e bloqueia JWT antigo após exclusão de conta vazia', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE SCHEMA aue_privado;
      CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
        SELECT string_to_array($1,'/') $$;
      CREATE TABLE aue_privado.contas_em_exclusao_v2(usuario_id uuid PRIMARY KEY);
      CREATE TABLE aue_privado.gravacoes_v2(usuario_id uuid REFERENCES auth.users(id));
      CREATE TABLE aue_privado.duelos_v2(criador_id uuid REFERENCES auth.users(id),desafiante_id uuid REFERENCES auth.users(id));
      CREATE FUNCTION aue_privado.travar_conta_v2(uid uuid) RETURNS void LANGUAGE plpgsql AS $$
      BEGIN
        PERFORM pg_advisory_xact_lock(hashtextextended('aue-v2-exclusao-conta:' || uid::text,0));
        IF EXISTS (SELECT 1 FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id=uid) THEN
          RAISE EXCEPTION 'Conta em exclusão';
        END IF;
      END $$;
      CREATE TABLE public.perfis(id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        url_do_avatar text,caminho_da_capa text);
      CREATE TABLE public.topicos(id uuid PRIMARY KEY,autor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);
      CREATE TABLE public.respostas(id uuid PRIMARY KEY,topico_id uuid REFERENCES public.topicos(id) ON DELETE CASCADE,
        autor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);
      CREATE TABLE public.campeonatos(id uuid PRIMARY KEY);
      CREATE TABLE public.participantes_campeonato(championship_id uuid REFERENCES public.campeonatos(id),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);
      CREATE TABLE storage.objects(bucket_id text, name text, owner_id text);
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA auth,storage,aue_privado TO authenticated;
      GRANT SELECT,INSERT ON storage.objects TO authenticated;
      CREATE POLICY teste_leitura ON storage.objects FOR SELECT TO authenticated USING (true);
      CREATE POLICY "Authenticated Users can upload audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
      CREATE FUNCTION public.aue_v2_concluir_exclusao_conta(uuid) RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
      INSERT INTO auth.users(id) VALUES
        ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),
        ('00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000004');
      INSERT INTO public.perfis(id) SELECT id FROM auth.users;
      INSERT INTO public.topicos VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001');
      INSERT INTO public.respostas VALUES ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
      INSERT INTO public.campeonatos VALUES ('30000000-0000-0000-0000-000000000003');
      INSERT INTO public.participantes_campeonato VALUES ('30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003');
    `);
    await db.exec(await readFile('supabase/migrations/20261119000816_proteger_exclusao_auth_conservadora.sql','utf8'));
    await expect(db.exec("DELETE FROM auth.users WHERE id='00000000-0000-0000-0000-000000000001'")).rejects.toThrow('revisão');
    await expect(db.exec("DELETE FROM auth.users WHERE id='00000000-0000-0000-0000-000000000003'")).rejects.toThrow('revisão');
    expect((await db.query('SELECT count(*)::int AS n FROM public.respostas')).rows[0]).toEqual({n:1});
    expect((await db.query('SELECT count(*)::int AS n FROM public.participantes_campeonato')).rows[0]).toEqual({n:1});
    await db.exec("DELETE FROM auth.users WHERE id='00000000-0000-0000-0000-000000000004'");
    expect((await db.query("SELECT count(*)::int AS n FROM auth.users WHERE id='00000000-0000-0000-0000-000000000004'")).rows[0]).toEqual({n:0});
    await db.exec("SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false); SET ROLE authenticated");
    await expect(db.exec("INSERT INTO storage.objects(bucket_id,name) VALUES ('audio_records','00000000-0000-0000-0000-000000000004/audio.wav')")).rejects.toThrow('Conta em exclusão');
    await db.exec("SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)");
    await db.exec("INSERT INTO storage.objects(bucket_id,name) VALUES ('audio_records','00000000-0000-0000-0000-000000000002/audio.wav')");
    await db.exec('RESET ROLE');
    expect((await db.query("SELECT public.aue_v2_concluir_exclusao_conta('00000000-0000-0000-0000-000000000004') AS r")).rows[0]).toEqual({r:{estado:'concluida'}});
    expect((await db.query("SELECT count(*)::int AS n FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id='00000000-0000-0000-0000-000000000004'")).rows[0]).toEqual({n:1});
  } finally { await db.close(); }
}, 30_000);

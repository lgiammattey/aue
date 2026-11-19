import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { it } from 'vitest';

// Banco descartável: Auth e Storage são simulados; não prova HTTP nem corrida real.
it('bloqueia gravações e novas referências ao iniciar exclusão de conta', async () => {
  const banco = new PGlite({ extensions: { pgcrypto } });
  try {
    await banco.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth; CREATE SCHEMA extensions; CREATE SCHEMA storage;
      CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      CREATE FUNCTION public.aue_e_administrador() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;
      CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean LANGUAGE sql STABLE AS $$
        SELECT coalesce(replace(current_setting('storage.operation', true), 'storage.', '') = ANY(expected_operations), false)
      $$;
      CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text,name text,UNIQUE(bucket_id,name));
      INSERT INTO storage.buckets VALUES ('duelos_v2','duelos_v2',false,5242880,ARRAY['audio/wav']);
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA auth,storage TO anon,authenticated,service_role;
      GRANT SELECT,INSERT,DELETE ON storage.objects TO authenticated;
    `);
    for (const arquivo of [
      'supabase/migrations/20261118001942_duelo_v2_privado.sql',
      'supabase/migrations/20261118003111_duelos_v2_convites_recuperaveis.sql',
      'supabase/migrations/20261118004900_denuncia_por_duelo_v2.sql',
      'supabase/migrations/20261118023856_trava_exclusao_conta_duelo_v2.sql',
      'supabase/tests/duelos_v2_exclusao_conta.sql',
      'supabase/migrations/20261118024805_anonimizar_conta_duelo_v2.sql',
      'supabase/tests/duelos_v2_anonimizar_conta.sql',
    ]) await banco.exec(await readFile(arquivo, 'utf8'));
  } finally {
    await banco.close();
  }
}, 30_000);

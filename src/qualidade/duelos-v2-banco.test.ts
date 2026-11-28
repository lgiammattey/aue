import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { describe, expect, it } from 'vitest';

/**
 * Postgres descartável. Auth e Storage são dublês: isto não prova a API HTTP,
 * políticas remotas, remoção física de arquivos ou concorrência real.
 */
describe('contrato SQL dos duelos v2', () => {
  it.each([
    ['ausente', ''],
    ['público', "INSERT INTO storage.buckets VALUES ('duelos_v2','duelos_v2',true,5242880,ARRAY['audio/wav'])"],
    ['MIME diferente', "INSERT INTO storage.buckets VALUES ('duelos_v2','duelos_v2',false,5242880,ARRAY['audio/mpeg'])"],
    ['limite diferente', "INSERT INTO storage.buckets VALUES ('duelos_v2','duelos_v2',false,10485760,ARRAY['audio/wav'])"],
  ])('recusa bucket %s', async (_nome, fixture) => {
    const banco = new PGlite({ extensions: { pgcrypto } });
    try {
      await banco.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
        CREATE SCHEMA auth; CREATE SCHEMA extensions; CREATE SCHEMA storage;
        CREATE TABLE auth.users(id uuid PRIMARY KEY);
        CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
        ${fixture};`);
      const sql = await readFile('supabase/migrations/20261118001942_duelo_v2_privado.sql', 'utf8');
      await expect(banco.exec(sql)).rejects.toThrow('Bucket duelos_v2 ausente ou configuração divergente');
    } finally {
      await banco.close();
    }
  }, 30_000);

  it('aplica as migrations e executa as provas de privacidade e convites', async () => {
    const banco = new PGlite({ extensions: { pgcrypto } });
    try {
      await banco.exec(`
        CREATE ROLE anon; CREATE ROLE authenticated;
        CREATE SCHEMA auth; CREATE SCHEMA extensions; CREATE SCHEMA storage;
        CREATE TABLE auth.users(id uuid PRIMARY KEY);
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
          SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        $$;
        CREATE TABLE public.administradores_do_aue(usuario_id uuid PRIMARY KEY REFERENCES auth.users(id));
        CREATE FUNCTION public.aue_e_administrador() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
          SELECT EXISTS(SELECT 1 FROM public.administradores_do_aue WHERE usuario_id = auth.uid())
        $$;
        CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean LANGUAGE sql STABLE AS $$
          SELECT coalesce(replace(current_setting('storage.operation', true), 'storage.', '') = ANY(expected_operations), false)
        $$;
        CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
        CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text, UNIQUE(bucket_id, name));
        INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
          VALUES ('duelos_v2', 'duelos_v2', false, 5242880, ARRAY['audio/wav']);
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        GRANT USAGE ON SCHEMA auth, storage TO anon, authenticated;
        GRANT SELECT, INSERT, DELETE ON storage.objects TO authenticated;
        GRANT SELECT ON storage.objects TO anon;
      `);
      for (const arquivo of [
        'supabase/migrations/20261118001942_duelo_v2_privado.sql',
        'supabase/migrations/20261118003111_duelos_v2_convites_recuperaveis.sql',
        'supabase/tests/duelos_v2.sql',
        'supabase/tests/duelos_v2_privacidade.sql',
        'supabase/tests/duelos_v2_convites.sql',
        'supabase/migrations/20261118004900_denuncia_por_duelo_v2.sql',
        'supabase/tests/duelos_v2_denuncia_recuperado.sql',
      ]) {
        await banco.exec(await readFile(arquivo, 'utf8'));
      }
    } finally {
      await banco.close();
    }
  }, 30_000);
});

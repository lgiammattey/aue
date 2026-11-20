import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

describe('registro de nota de áudio publicado', () => {
  it('aceita somente áudio do próprio autor publicado e preserva nota existente', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
        CREATE SCHEMA auth; CREATE SCHEMA storage;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
        CREATE FUNCTION public.aue_e_conta_promovida(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT $1 IS NOT NULL $$;
        CREATE TABLE public.topicos (id uuid PRIMARY KEY, autor_id uuid, status text, anexo_tipo text, anexo_caminho text, resultado_id uuid, consentimento_audio_publico boolean, caminho_do_audio_da_casa text);
        CREATE TABLE public.respostas (id uuid PRIMARY KEY, autor_id uuid, topico_id uuid, status text, anexo_tipo text, anexo_caminho text);
        CREATE TABLE public.arrotos_do_perfil (id uuid PRIMARY KEY, autor_id uuid, perfil_id uuid, estado text, caminho_do_audio text);
        CREATE TABLE storage.objects (bucket_id text, name text, metadata jsonb);
      `);
      await db.exec(await readFile('supabase/migrations/20261120110709_notas_retrospectivas.sql', 'utf8'));
      await db.exec(await readFile('supabase/migrations/20261120111847_registrar_nota_audio_publicado.sql', 'utf8'));
      await db.exec(`
        INSERT INTO public.topicos VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','aberto','audio','som',NULL,false,NULL);
        INSERT INTO public.arrotos_do_perfil VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000011','publicado','perfil');
        INSERT INTO storage.objects VALUES ('anexos_do_forum','som','{"eTag":"v1"}'), ('arrotos_de_perfil','perfil','{"eTag":"v2"}');
      `);
      const registrar = async (tipo: string, id: string, nota: number) => (await db.query<{ ok: boolean }>('SELECT public.registrar_nota_de_audio_publicado($1,$2,$3) AS ok', [tipo, id, nota])).rows[0].ok;
      const id = '00000000-0000-0000-0000-000000000001';
      expect(await registrar('topico', id, 60)).toBe(false);
      await db.exec(`SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000099', false)`);
      expect(await registrar('topico', id, 60)).toBe(false);
      await db.exec(`SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000010', false)`);
      expect(await registrar('topico', id, 101)).toBe(false);
      expect(await registrar('topico', id, 60)).toBe(true);
      expect(await registrar('topico', id, 60)).toBe(true);
      expect(await registrar('topico', id, 80)).toBe(false);
      expect(await registrar('perfil', '00000000-0000-0000-0000-000000000002', 20)).toBe(true);
      await db.exec(`UPDATE public.topicos SET status='oculto'`);
      expect(await registrar('topico', id, 60)).toBe(false);
      await db.exec('SET ROLE anon');
      await expect(db.query(`SELECT public.registrar_nota_de_audio_publicado('topico','${id}',60)`)).rejects.toThrow();
      await db.exec('RESET ROLE; SET ROLE authenticated');
      await expect(db.query(`SELECT public.registrar_nota_de_audio_publicado('topico','${id}',100)`)).rejects.toThrow();
    } finally {
      await db.close();
    }
  });
});

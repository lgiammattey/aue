import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

describe('fila de notas de áudios publicados', () => {
  it('reivindica só publicação visível, valida concessão e ETag e preserva notas existentes', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
        CREATE SCHEMA auth; CREATE SCHEMA storage;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
        CREATE FUNCTION public.aue_e_conta_promovida(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT $1 IS NOT NULL $$;
        CREATE TABLE public.topicos (id uuid PRIMARY KEY, autor_id uuid, status text, anexo_tipo text, anexo_caminho text, resultado_id uuid, consentimento_audio_publico boolean, caminho_do_audio_da_casa text);
        CREATE TABLE public.respostas (id uuid PRIMARY KEY, autor_id uuid, topico_id uuid, status text, anexo_tipo text, anexo_caminho text);
        CREATE TABLE public.arrotos_do_perfil (id uuid PRIMARY KEY, autor_id uuid, perfil_id uuid, estado text, caminho_do_audio text);
        CREATE TABLE storage.objects (bucket_id text, name text, metadata jsonb);
      `);
      await db.exec(await readFile('supabase/migrations/20261120110709_notas_retrospectivas.sql', 'utf8'));
      await db.exec(await readFile('supabase/migrations/20261120114349_fila_notas_publicadas.sql', 'utf8'));
      await db.exec(`
        INSERT INTO public.topicos VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','aberto','audio','som',NULL,false,NULL);
        INSERT INTO storage.objects VALUES ('anexos_do_forum','som','{"eTag":"v1","mimetype":"audio/webm"}');
      `);
      await db.exec('SET ROLE authenticated');
      await expect(db.query('SELECT * FROM public.reivindicar_audios_para_nota(1)')).rejects.toThrow();
      await db.exec('RESET ROLE');
      const primeira = (await db.query<{tipo:string,id:string,etag:string,token:string}>(`SELECT * FROM public.reivindicar_audios_para_nota(1)`)).rows[0];
      expect(primeira).toMatchObject({ tipo: 'topico', etag: 'v1' });
      expect((await db.query('SELECT * FROM public.obter_audio_da_fila($1,$2,$3)', [primeira.tipo, primeira.id, primeira.token])).rows).toHaveLength(1);
      expect((await db.query('SELECT * FROM public.obter_audio_da_fila($1,$2,$3)', [primeira.tipo, primeira.id, '00000000-0000-4000-8000-000000000000'])).rows).toEqual([]);
      expect((await db.query('SELECT * FROM public.reivindicar_audios_para_nota(1)')).rows).toEqual([]);
      const concluir = async (etag: string, token: string, estado: string, nota: number | null) => (await db.query<{ok:boolean}>('SELECT public.concluir_nota_do_audio($1,$2,$3,$4,$5,$6) ok', [primeira.tipo, primeira.id, etag, token, estado, nota])).rows[0].ok;
      expect(await concluir('v2', primeira.token, 'medido', 91)).toBe(false);
      expect(await concluir('v1', primeira.token, 'medido', 91)).toBe(true);
      expect(await concluir('v1', primeira.token, 'medido', 99)).toBe(false);
      expect((await db.query('SELECT nota FROM aue_privado.notas_retrospectivas')).rows).toMatchObject([{ nota: '91' }]);
      expect((await db.query('SELECT * FROM public.reivindicar_audios_para_nota(1)')).rows).toEqual([]);
      await db.exec(`UPDATE storage.objects SET metadata='{"eTag":"v2"}'`);
      const segunda = (await db.query<{token:string}>('SELECT * FROM public.reivindicar_audios_para_nota(1)')).rows[0];
      await db.exec(`UPDATE public.topicos SET status='oculto'`);
      expect(await concluir('v2', segunda.token, 'medido', 75)).toBe(false);
      expect((await db.query('SELECT nota,etag FROM aue_privado.notas_retrospectivas')).rows).toMatchObject([{ nota: '91', etag: 'v1' }]);
      await db.exec(`UPDATE public.topicos SET status='aberto'`);
      const terceira = (await db.query<{token:string}>('SELECT * FROM public.reivindicar_audios_para_nota(1)')).rows[0];
      expect(await concluir('v2', terceira.token, 'erro', null)).toBe(true);
      expect((await db.query('SELECT * FROM public.reivindicar_audios_para_nota(1)')).rows).toEqual([]);
      await db.exec(`UPDATE aue_privado.fila_notas_publicadas SET proxima=now()-interval '1 second'`);
      const quarta = (await db.query<{token:string}>('SELECT * FROM public.reivindicar_audios_para_nota(1)')).rows[0];
      expect(await concluir('v2', quarta.token, 'rejeitado', null)).toBe(true);
      expect((await db.query('SELECT * FROM public.reivindicar_audios_para_nota(1)')).rows).toEqual([]);
      await db.exec(`UPDATE storage.objects SET metadata='{"eTag":"v3"}'`);
      const quinta = (await db.query<{etag:string,token:string}>('SELECT * FROM public.reivindicar_audios_para_nota(1)')).rows[0];
      expect(quinta.etag).toBe('v3');
      expect(await concluir('v3', quinta.token, 'medido', 75)).toBe(true);
      expect((await db.query('SELECT nota,etag FROM aue_privado.notas_retrospectivas')).rows).toMatchObject([{ nota: '75', etag: 'v3' }]);
      await db.exec(`INSERT INTO storage.objects VALUES ('anexos_do_forum','som-novo','{"eTag":"v3"}'); UPDATE public.topicos SET anexo_caminho='som-novo'`);
      const sexto = (await db.query<{caminho:string,etag:string,token:string}>('SELECT * FROM public.reivindicar_audios_para_nota(1)')).rows[0];
      expect(sexto).toMatchObject({ caminho: 'som-novo', etag: 'v3' });
      expect(await concluir('v3', quinta.token, 'medido', 80)).toBe(false);
      expect(await concluir('v3', sexto.token, 'medido', 80)).toBe(true);
    } finally { await db.close(); }
  });
});

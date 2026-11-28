import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

const AUTOR = '00000000-0000-4000-8000-000000000001';
const IMAGEM = `${AUTOR}/forum/10000000-0000-4000-8000-000000000001.webp`;
const WEBM = `${AUTOR}/forum/10000000-0000-4000-8000-000000000002.webm`;
const WAV = `${AUTOR}/forum/10000000-0000-4000-8000-000000000003.wav`;

describe('anexos WAV da Resenha (20261128000042)', () => {
  it('amplia a constraint sem rejeitar imagem WebP e áudio WebM já publicados', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE SCHEMA auth;
        CREATE SCHEMA storage;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT '${AUTOR}'::uuid $$;
        CREATE FUNCTION storage.foldername(p_caminho text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array(p_caminho, '/') $$;
        CREATE FUNCTION public.aue_falhar_conversa(text, text, text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION '%', $2; END $$;
        CREATE FUNCTION public.aue_url_video_externo_canonica(text) RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT $1 $$;
        CREATE TABLE storage.buckets (id text PRIMARY KEY, allowed_mime_types text[]);
        INSERT INTO storage.buckets VALUES ('anexos_do_forum', ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']);
        CREATE TABLE storage.objects (bucket_id text, name text, metadata jsonb);
        CREATE TABLE public.topicos (
          id uuid PRIMARY KEY,
          anexo_tipo text, anexo_caminho text, anexo_mime text,
          anexo_tamanho_bytes integer, anexo_duracao_ms integer, video_externo_url text
        );
        CREATE TABLE public.respostas (
          id uuid PRIMARY KEY,
          anexo_tipo text, anexo_caminho text, anexo_mime text,
          anexo_tamanho_bytes integer, anexo_duracao_ms integer, video_externo_url text
        );
        ALTER TABLE public.topicos ADD CONSTRAINT topicos_anexo_valido CHECK (
          (anexo_tipo = 'imagem' AND anexo_caminho ~ '^[0-9a-f-]{36}/forum/[0-9a-f-]{36}\\.(jpg|png|webp|gif)$'
            AND anexo_mime IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')
            AND anexo_tamanho_bytes BETWEEN 1 AND 8388608 AND anexo_duracao_ms IS NULL AND video_externo_url IS NULL)
          OR (anexo_tipo = 'audio' AND anexo_caminho ~ '^[0-9a-f-]{36}/forum/[0-9a-f-]{36}\\.(webm|ogg|m4a|mp3)$'
            AND anexo_mime IN ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg')
            AND anexo_tamanho_bytes BETWEEN 1 AND 10485760 AND anexo_duracao_ms BETWEEN 1 AND 60000 AND video_externo_url IS NULL)
        );
        ALTER TABLE public.respostas ADD CONSTRAINT respostas_anexo_valido CHECK (anexo_tipo IS NULL);
        INSERT INTO public.topicos VALUES
          ('10000000-0000-4000-8000-000000000001', 'imagem', '${IMAGEM}', 'image/webp', 1024, NULL, NULL),
          ('10000000-0000-4000-8000-000000000002', 'audio', '${WEBM}', 'audio/webm', 2048, 1000, NULL);
      `);

      await db.exec(await readFile('supabase/migrations/20261128000042_anexos_do_forum_aceitam_wav.sql', 'utf8'));

      expect((await db.query<{ total: string }>('SELECT count(*)::text AS total FROM public.topicos')).rows).toEqual([{ total: '2' }]);
      await db.query(`
        INSERT INTO public.topicos VALUES
          ('10000000-0000-4000-8000-000000000003', 'audio', $1, 'audio/wav', 4096, 1000, NULL)
      `, [WAV]);
      expect((await db.query<{ allowed: boolean }>(`
        SELECT 'audio/wav' = ANY(allowed_mime_types) AS allowed
        FROM storage.buckets WHERE id = 'anexos_do_forum'
      `)).rows).toEqual([{ allowed: true }]);
    } finally {
      await db.close();
    }
  });
});

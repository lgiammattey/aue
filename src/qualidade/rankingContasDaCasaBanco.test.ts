import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

describe('Ranking com contas da casa', () => {
  it('usa somente áudio da casa publicado, consentido e audível, preservando uma nota por autor', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE ROLE anon; CREATE ROLE authenticated;
        CREATE SCHEMA aue_privado; CREATE SCHEMA storage;
        CREATE FUNCTION public.aue_e_conta_promovida(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT $1 IS NOT NULL $$;
        CREATE TABLE public.perfis (id uuid, handle text, apelido text, url_do_avatar text);
        CREATE TABLE public.grupos (id uuid, slug text);
        CREATE TABLE public.pautas_de_topicos (pauta_id uuid);
        CREATE TABLE public.contas_da_casa (usuario_id uuid);
        CREATE TABLE public.topicos (id uuid, autor_id uuid, status text, origem text, comunidade_id uuid, anexo_tipo text, anexo_caminho text, criado_em timestamptz, resultado_id uuid, consentimento_audio_publico boolean, caminho_do_audio_da_casa text);
        CREATE TABLE public.resultados (id uuid, nota numeric, caminho_do_audio text, esta_escondido boolean, integridade text);
        CREATE TABLE public.respostas (id uuid, autor_id uuid, topico_id uuid, status text, anexo_tipo text, anexo_caminho text, criado_em timestamptz);
        CREATE TABLE storage.buckets (id text, public boolean);
        CREATE TABLE storage.objects (bucket_id text, name text, owner uuid, metadata jsonb);
        CREATE TABLE aue_privado.notas_retrospectivas (bucket text, caminho text, etag text, nota numeric, versao text);
        INSERT INTO public.perfis VALUES ('00000000-0000-0000-0000-000000000010','giam','Giam',null);
        INSERT INTO public.contas_da_casa VALUES ('00000000-0000-0000-0000-000000000010');
        INSERT INTO public.grupos VALUES ('00000000-0000-0000-0000-000000000099','comunidade');
        INSERT INTO storage.buckets VALUES ('audio_da_casa',true);
        INSERT INTO public.topicos VALUES
          ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','aberto','comunidade','00000000-0000-0000-0000-000000000099',null,null,now(),null,true,'som1'),
          ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000010','oculto','comunidade','00000000-0000-0000-0000-000000000099',null,null,now(),null,true,'oculto'),
          ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000010','aberto','comunidade','00000000-0000-0000-0000-000000000099',null,null,now(),null,false,'sem-consentimento');
        INSERT INTO storage.objects SELECT 'audio_da_casa', v, NULL::uuid, '{"eTag":"a"}'::jsonb FROM unnest(ARRAY['som1','oculto','sem-consentimento']) v;
        INSERT INTO aue_privado.notas_retrospectivas VALUES
          ('audio_da_casa','som1','a',80,'retrospectiva-acustica-legado-v1'),
          ('audio_da_casa','oculto','a',100,'retrospectiva-acustica-legado-v1'),
          ('audio_da_casa','sem-consentimento','a',99,'retrospectiva-acustica-legado-v1');
      `);
      await db.exec(await readFile('supabase/migrations/20261120114323_top_cinco_arrotadores.sql', 'utf8'));
      await db.exec(await readFile('supabase/migrations/20261120120803_ranking_contas_da_casa.sql', 'utf8'));
      const ranking = async () => (await db.query('SELECT * FROM public.top_cinco_arrotadores()')).rows;
      expect(await ranking()).toEqual([{ handle: 'giam', apelido: 'Giam', avatar_url: null, nota: '80', alvo_tipo: 'topico', alvo_id: '00000000-0000-0000-0000-000000000001', fonte: 'casa' }]);
      await db.exec("UPDATE storage.buckets SET public=false WHERE id='audio_da_casa'");
      expect(await ranking()).toEqual([]);
      await db.exec("UPDATE storage.buckets SET public=true WHERE id='audio_da_casa'; UPDATE storage.objects SET metadata='{\"eTag\":\"outro\"}' WHERE name='som1'");
      expect(await ranking()).toEqual([]);
      await db.exec("UPDATE storage.objects SET metadata='{\"eTag\":\"a\"}' WHERE name='som1'; UPDATE public.grupos SET slug=''");
      expect(await ranking()).toEqual([]);
    } finally { await db.close(); }
  });
});

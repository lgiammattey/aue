import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

describe('Top 5 de arrotos públicos', () => {
  it('escolhe a maior nota de cada pessoa, exclui casas, versões não confiáveis e itens ocultos, e não retorna caminhos', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
        CREATE SCHEMA aue_privado; CREATE SCHEMA storage;
        CREATE FUNCTION public.aue_e_conta_promovida(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT $1 IS NOT NULL $$;
        CREATE TABLE public.perfis (id uuid, handle text, apelido text, url_do_avatar text);
        CREATE TABLE public.grupos (id uuid, slug text);
        CREATE TABLE public.pautas_de_topicos (pauta_id uuid);
        CREATE TABLE public.contas_da_casa (usuario_id uuid);
        CREATE TABLE public.topicos (id uuid, autor_id uuid, status text, origem text, comunidade_id uuid, anexo_tipo text, anexo_caminho text, criado_em timestamptz, resultado_id uuid, consentimento_audio_publico boolean);
        CREATE TABLE public.resultados (id uuid, nota numeric, caminho_do_audio text, esta_escondido boolean);
        CREATE TABLE public.respostas (id uuid, autor_id uuid, topico_id uuid, status text, anexo_tipo text, anexo_caminho text, criado_em timestamptz);
        CREATE TABLE storage.objects (bucket_id text, name text, metadata jsonb);
        CREATE TABLE aue_privado.notas_retrospectivas (bucket text, caminho text, etag text, nota numeric, versao text);
        INSERT INTO public.perfis VALUES
          ('00000000-0000-0000-0000-000000000010','ana','Ana',null),
          ('00000000-0000-0000-0000-000000000011','bia','Bia',null),
          ('00000000-0000-0000-0000-000000000012','casa','Casa',null);
        INSERT INTO public.contas_da_casa VALUES ('00000000-0000-0000-0000-000000000012');
        INSERT INTO public.topicos VALUES
          ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','aberto','pessoal',null,'audio','ana1',now()),
          ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000010','aberto','pessoal',null,'audio','ana2',now()),
          ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000011','oculto','pessoal',null,'audio','bia',now()),
          ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000012','aberto','pessoal',null,'audio','casa',now());
        INSERT INTO public.respostas VALUES ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','visivel','audio','bia2',now());
        INSERT INTO storage.objects SELECT 'anexos_do_forum',v, '{"eTag":"a"}'::jsonb FROM unnest(ARRAY['ana1','ana2','bia','bia2','casa']) v;
        INSERT INTO aue_privado.notas_retrospectivas VALUES
          ('anexos_do_forum','ana1','a',30,'retrospectiva-acustica-legado-v1'),
          ('anexos_do_forum','ana2','a',70,'publicacao-acustica-servidor-v1'),
          ('anexos_do_forum','bia','a',100,'retrospectiva-acustica-legado-v1'),
          ('anexos_do_forum','bia2','a',80,'publicacao-acustica-legado-v1'),
          ('anexos_do_forum','casa','a',99,'retrospectiva-acustica-legado-v1');
      `);
      await db.exec(await readFile('supabase/migrations/20261120114323_top_cinco_arrotadores.sql', 'utf8'));
      const ranking = async () => (await db.query<{ handle: string }>('SELECT * FROM public.top_cinco_arrotadores()')).rows;
      expect(await ranking()).toEqual([{ handle: 'ana', apelido: 'Ana', avatar_url: null, nota: '70', alvo_tipo: 'topico', alvo_id: '00000000-0000-0000-0000-000000000002', fonte: 'anexo' }]);
      await db.exec("UPDATE aue_privado.notas_retrospectivas SET versao='publicacao-acustica-servidor-v1' WHERE caminho='bia2'");
      expect((await ranking()).map((r) => r.handle)).toEqual(['bia','ana']);
      await db.exec(`
        INSERT INTO public.resultados VALUES ('00000000-0000-0000-0000-000000000030', 90, 'arena', false);
        INSERT INTO storage.objects VALUES ('audio_records', 'arena', '{}');
        INSERT INTO public.topicos VALUES ('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000010','aberto','pessoal',null,null,null,now(),'00000000-0000-0000-0000-000000000030',true);
      `);
      expect((await ranking())[0]).toMatchObject({handle:'ana', nota:'90', fonte:'arena'});
      await db.exec(`UPDATE public.topicos SET consentimento_audio_publico=false WHERE id='00000000-0000-0000-0000-000000000031'`);
      await db.exec("UPDATE storage.objects SET metadata='{\"eTag\":\"outro\"}' WHERE name='bia2'");
      expect((await ranking()).map((r) => r.handle)).toEqual(['ana']);
      await db.exec(`
        INSERT INTO public.perfis SELECT ('00000000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid, 'user' || n, 'Pessoa ' || n, null FROM generate_series(100,106) n;
        INSERT INTO public.topicos SELECT ('10000000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid, ('00000000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid, 'aberto', 'pessoal', null, 'audio', 'som' || n, now(), null, false FROM generate_series(100,106) n;
        INSERT INTO storage.objects SELECT 'anexos_do_forum', 'som' || n, '{"eTag":"a"}'::jsonb FROM generate_series(100,106) n;
        INSERT INTO aue_privado.notas_retrospectivas SELECT 'anexos_do_forum', 'som' || n, 'a', n-100, 'publicacao-acustica-servidor-v1' FROM generate_series(100,106) n;
      `);
      expect((await ranking()).length).toBe(5);
    } finally { await db.close(); }
  });
});

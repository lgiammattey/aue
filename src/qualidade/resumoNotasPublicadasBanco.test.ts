import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

describe('resumo de notas publicadas', () => {
  it('conta publicações visíveis do autor, inclusive resultado da Arena, e respeita acesso aos áudios de perfil', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
        CREATE SCHEMA auth; CREATE SCHEMA storage;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
        CREATE FUNCTION public.aue_e_conta_promovida(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT $1 IS NOT NULL $$;
        CREATE TABLE public.grupos (id uuid, slug text);
        CREATE TABLE public.pautas_de_topicos (pauta_id uuid);
        CREATE TABLE public.contas_da_casa (usuario_id uuid);
        CREATE TABLE public.topicos (id uuid PRIMARY KEY, autor_id uuid, status text, origem text, comunidade_id uuid, anexo_tipo text, anexo_caminho text, resultado_id uuid, consentimento_audio_publico boolean, caminho_do_audio_da_casa text);
        CREATE TABLE public.respostas (id uuid, autor_id uuid, topico_id uuid, status text, anexo_tipo text, anexo_caminho text);
        CREATE TABLE public.arrotos_do_perfil (id uuid PRIMARY KEY, autor_id uuid, perfil_id uuid, estado text, caminho_do_audio text);
        CREATE TABLE public.resultados (id uuid, nota numeric, caminho_do_audio text, esta_escondido boolean);
        CREATE TABLE storage.objects (bucket_id text, name text, metadata jsonb);
      `);
      await db.exec(await readFile('supabase/migrations/20261120110709_notas_retrospectivas.sql', 'utf8'));
      await db.exec(await readFile('supabase/migrations/20261120111821_resumo_notas_publicadas.sql', 'utf8'));
      await db.exec(`
        INSERT INTO public.grupos VALUES ('00000000-0000-0000-0000-000000000099', 'comunidade');
        INSERT INTO public.topicos VALUES
          ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','aberto','pessoal',null,'audio','som-a',null,false,null),
          ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000010','aberto','comunidade','00000000-0000-0000-0000-000000000099',null,null,'00000000-0000-0000-0000-000000000030',true,null),
          ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000010','oculto','pessoal',null,'audio','som-a',null,false,null),
          ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000011','aberto','pessoal',null,'audio','som-b',null,false,null);
        INSERT INTO public.respostas VALUES ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000004','visivel','audio','som-b');
        INSERT INTO public.arrotos_do_perfil VALUES ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000011','publicado','som-perfil');
        INSERT INTO public.resultados VALUES ('00000000-0000-0000-0000-000000000030',90,'som-resultado',false);
        INSERT INTO storage.objects VALUES ('anexos_do_forum','som-a','{"eTag":"a"}'),('anexos_do_forum','som-b','{"eTag":"b"}'),('arrotos_de_perfil','som-perfil','{"eTag":"p"}'),('audio_records','som-resultado','{}');
        INSERT INTO aue_privado.notas_retrospectivas (bucket,caminho,etag,nota,versao) VALUES ('anexos_do_forum','som-a','a',60,'v1'),('anexos_do_forum','som-b','b',30,'v1'),('arrotos_de_perfil','som-perfil','p',20,'v1');
      `);
      const resumo = async () => (await db.query(`SELECT * FROM public.resumo_notas_publicadas('00000000-0000-0000-0000-000000000010')`)).rows[0];
      expect(await resumo()).toMatchObject({ melhor_nota: '90', media: '60.0', total: 3 });
      await db.exec(`SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000010', false)`);
      expect(await resumo()).toMatchObject({ melhor_nota: '90', media: '50.0', total: 4 });
      // Publicação independente conta mesmo quando usa o mesmo arquivo de outra.
      await db.exec(`INSERT INTO public.topicos VALUES ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000010','aberto','pessoal',null,'audio','som-a',null,false,null)`);
      expect(await resumo()).toMatchObject({ melhor_nota: '90', media: '52.0', total: 5 });
      await db.exec(`UPDATE public.topicos SET status = 'removido' WHERE id = '00000000-0000-0000-0000-000000000007'`);
      // Um mesmo envio gera o post e o arroto do perfil, mas conta só uma vez.
      await db.exec(`INSERT INTO aue_privado.espelhos_de_arroto VALUES ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001')`);
      expect(await resumo()).toMatchObject({ melhor_nota: '90', media: '60.0', total: 3 });
      // Ao ocultar o post, o arroto que permanece no perfil volta a contar.
      await db.exec(`UPDATE public.topicos SET status = 'oculto' WHERE id = '00000000-0000-0000-0000-000000000001'`);
      expect(await resumo()).toMatchObject({ melhor_nota: '90', media: '46.7', total: 3 });
      await db.exec(`UPDATE public.topicos SET status = 'aberto' WHERE id = '00000000-0000-0000-0000-000000000001'; DELETE FROM aue_privado.espelhos_de_arroto`);
      // Sem consentimento, com objeto trocado ou resposta oculta, a nota sai do resumo.
      await db.exec(`UPDATE public.topicos SET consentimento_audio_publico = false WHERE resultado_id IS NOT NULL; UPDATE storage.objects SET metadata = '{"eTag":"novo"}' WHERE name = 'som-a'; UPDATE public.respostas SET status = 'oculto'`);
      expect(await resumo()).toMatchObject({ melhor_nota: '20', media: '20.0', total: 1 });
      await db.exec(`UPDATE public.arrotos_do_perfil SET estado = 'oculto'`);
      expect(await resumo()).toMatchObject({ melhor_nota: null, media: null, total: 0 });
    } finally { await db.close(); }
  });
});

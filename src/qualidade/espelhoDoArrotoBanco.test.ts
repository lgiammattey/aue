import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

describe('espelho de arroto no mural', () => {
  it('vincula os dois cards na mesma transação e verifica autoria e áudio', async () => {
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
        CREATE FUNCTION public.criar_publicacao_pessoal_com_anexo(text,text,text,text,text,integer,integer,text) RETURNS public.topicos LANGUAGE plpgsql AS $$
        DECLARE v public.topicos;
        BEGIN
          INSERT INTO public.topicos VALUES (gen_random_uuid(), auth.uid(), 'aberto', $3, $4, null, false, null) RETURNING * INTO v;
          RETURN v;
        END $$;
      `);
      await db.exec(await readFile('supabase/migrations/20261120110709_notas_retrospectivas.sql', 'utf8'));
      await db.exec(await readFile('supabase/migrations/20261120112635_espelhar_arroto_no_mural.sql', 'utf8'));
      await db.exec(`
        INSERT INTO public.arrotos_do_perfil VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010','publicado','perfil');
        INSERT INTO storage.objects VALUES ('anexos_do_forum','som','{"eTag":"v1"}'), ('anexos_do_forum','outro','{"eTag":"v2"}'), ('arrotos_de_perfil','perfil','{"eTag":"v1"}');
      `);
      const criar = (caminho = 'som') => db.query(`SELECT id FROM public.criar_publicacao_pessoal_espelho('00000000-0000-0000-0000-000000000002','','','audio',$1,'audio/webm',4,1000,NULL)`, [caminho]);
      await expect(criar()).rejects.toThrow();
      await db.exec(`SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000011',false)`);
      await expect(criar()).rejects.toThrow();
      await db.exec(`SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000010',false)`);
      await expect(criar('outro')).rejects.toThrow();
      expect((await criar()).rows).toHaveLength(1);
      await expect(criar()).rejects.toThrow();
      const contagem = await db.query('SELECT (SELECT count(*) FROM public.topicos) AS posts, (SELECT count(*) FROM aue_privado.espelhos_de_arroto) AS espelhos');
      expect(contagem.rows).toMatchObject([{ posts: 1, espelhos: 1 }]);
    } finally { await db.close(); }
  });
});

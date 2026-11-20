import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

describe('notas retrospectivas no banco', () => {
  it('publica só a nota do arquivo atual e oculta conteúdo removido', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
        CREATE SCHEMA auth; CREATE SCHEMA storage;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
        CREATE FUNCTION public.aue_e_conta_promovida(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT $1 IS NOT NULL $$;
        CREATE TABLE public.topicos (id uuid PRIMARY KEY, autor_id uuid, status text, anexo_tipo text, anexo_caminho text, resultado_id uuid, consentimento_audio_publico boolean, caminho_do_audio_da_casa text);
        CREATE TABLE public.respostas (id uuid PRIMARY KEY, autor_id uuid, topico_id uuid, status text, anexo_tipo text, anexo_caminho text);
        CREATE TABLE public.arrotos_do_perfil (id uuid PRIMARY KEY, perfil_id uuid, estado text, caminho_do_audio text);
        CREATE TABLE storage.objects (bucket_id text, name text, metadata jsonb);
      `);
      await db.exec(await readFile('supabase/migrations/20261120110709_notas_retrospectivas.sql', 'utf8'));
      await db.exec(`
        INSERT INTO public.topicos VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'aberto', 'audio', 'som-a', NULL, false, NULL);
        INSERT INTO storage.objects VALUES ('anexos_do_forum', 'som-a', '{"eTag":"v1"}');
        INSERT INTO aue_privado.notas_retrospectivas (bucket,caminho,etag,nota,versao) VALUES ('anexos_do_forum','som-a','v1',73,'piloto');
      `);
      const ler = async () => (await db.query(`SELECT * FROM public.listar_notas_retrospectivas(ARRAY['00000000-0000-0000-0000-000000000001'::uuid])`)).rows;
      expect(await ler()).toMatchObject([{ tipo: 'topico', fonte: 'anexo', nota: '73', versao: 'piloto' }]);
      await db.exec(`UPDATE public.topicos SET anexo_caminho = 'outro'`);
      expect(await ler()).toEqual([]);
      await db.exec(`UPDATE public.topicos SET anexo_caminho = 'som-a'`);
      await db.exec(`UPDATE storage.objects SET metadata = '{"eTag":"v2"}'`);
      expect(await ler()).toEqual([]);
      await db.exec(`UPDATE storage.objects SET metadata = '{"eTag":"v1"}'; UPDATE public.topicos SET status = 'oculto'`);
      expect(await ler()).toEqual([]);
      await db.exec(`
        UPDATE public.topicos SET status = 'aberto';
        INSERT INTO public.respostas VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','visivel','audio','som-a');
        INSERT INTO public.arrotos_do_perfil VALUES ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000010','publicado','som-perfil');
        INSERT INTO storage.objects VALUES ('arrotos_de_perfil', 'som-perfil', '{"eTag":"v1"}');
        INSERT INTO aue_privado.notas_retrospectivas (bucket,caminho,etag,nota,versao) VALUES ('arrotos_de_perfil','som-perfil','v1',54,'piloto');
      `);
      const lerResposta = async () => (await db.query(`SELECT * FROM public.listar_notas_retrospectivas(p_resposta_ids => ARRAY['00000000-0000-0000-0000-000000000002'::uuid])`)).rows;
      const lerPerfil = async () => (await db.query(`SELECT * FROM public.listar_notas_retrospectivas(p_arroto_ids => ARRAY['00000000-0000-0000-0000-000000000003'::uuid])`)).rows;
      expect(await lerResposta()).toMatchObject([{ tipo: 'resposta', nota: '73' }]);
      expect(await lerPerfil()).toEqual([]);
      await db.exec(`SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000010', false)`);
      expect(await lerPerfil()).toMatchObject([{ tipo: 'perfil', nota: '54' }]);
      await db.exec(`UPDATE public.respostas SET status = 'oculto'; UPDATE public.arrotos_do_perfil SET estado = 'oculto'`);
      expect(await lerResposta()).toEqual([]);
      expect(await lerPerfil()).toEqual([]);
      await db.exec('SET ROLE anon');
      await expect(db.query('SELECT * FROM aue_privado.notas_retrospectivas')).rejects.toThrow();
    } finally {
      await db.close();
    }
  });
});

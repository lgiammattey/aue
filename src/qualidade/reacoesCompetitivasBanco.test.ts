import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

const AUTOR = '00000000-0000-0000-0000-000000000010';
const VISITANTE = '00000000-0000-0000-0000-000000000099';
const TOPICO = '10000000-0000-0000-0000-000000000001';

describe('reações competitivas em publicação pessoal (20261120231500)', () => {
  it('aceita voto de sessão anônima numa publicação pessoal, mantém like/dislike exclusivos e alterna atitudes', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE ROLE anon;
        CREATE ROLE authenticated;
        CREATE SCHEMA auth;
        CREATE TABLE auth.users (id uuid PRIMARY KEY);
        INSERT INTO auth.users VALUES ('${AUTOR}'), ('${VISITANTE}');
        CREATE TABLE public.aue_uid_atual (id uuid);
        INSERT INTO public.aue_uid_atual VALUES ('${VISITANTE}');
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
          SELECT id FROM public.aue_uid_atual LIMIT 1
        $$;
        CREATE FUNCTION public.aue_exigir_conta_promovida() RETURNS void LANGUAGE plpgsql AS $$
        BEGIN
          IF auth.uid() IS DISTINCT FROM '${AUTOR}'::uuid THEN
            RAISE EXCEPTION 'Conta promovida exigida' USING ERRCODE = '42501';
          END IF;
        END;
        $$;
        CREATE FUNCTION public.aue_e_conta_promovida(p_uid uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
          SELECT p_uid = '${AUTOR}'::uuid
        $$;
        CREATE TABLE public.perfis (id uuid PRIMARY KEY, handle text, apelido text);
        CREATE TABLE public.grupos (id uuid PRIMARY KEY, slug text, nome varchar);
        CREATE TABLE public.topicos (id uuid PRIMARY KEY, autor_id uuid, titulo text, status text, comunidade_id uuid, origem text, criado_em timestamptz);
        CREATE TABLE public.posts_comunidade (id uuid PRIMARY KEY, group_id uuid, user_id uuid, content text, esta_escondido boolean, created_at timestamptz);
        INSERT INTO public.perfis VALUES ('${AUTOR}', 'autor', 'Autor');
        INSERT INTO public.topicos VALUES ('${TOPICO}', '${AUTOR}', 'Arroto de respeito', 'aberto', null, 'pessoal', now());
      `);

      await db.exec(await readFile('supabase/migrations/20261021001030_reacoes_de_topicos_e_salvos.sql', 'utf8'));
      await db.exec(await readFile('supabase/migrations/20261120231500_reacoes_competitivas_sem_login.sql', 'utf8'));

      // Publicação pessoal não tem comunidade. Visitante com sessão anônima dá
      // like e dislike, que continuam mutuamente exclusivos.
      expect((await db.query<{ alternar_reacao_do_topico: boolean }>('SELECT public.alternar_reacao_do_topico($1, $2)', [TOPICO, 'like'])).rows[0].alternar_reacao_do_topico).toBe(true);
      expect((await db.query<{ alternar_reacao_do_topico: boolean }>('SELECT public.alternar_reacao_do_topico($1, $2)', [TOPICO, 'dislike'])).rows[0].alternar_reacao_do_topico).toBe(true);

      // Reação de atitude é independente de like/dislike e exclusiva entre as atitudes
      await db.query('SELECT public.alternar_reacao_do_topico($1, $2)', [TOPICO, 'dedo']);
      await db.query('SELECT public.alternar_reacao_do_topico($1, $2)', [TOPICO, 'rock']);

      const contagem = (await db.query<{ tipo: string; total: string; minha: boolean }>(
        'SELECT tipo, total::text, minha FROM public.contar_reacoes_dos_topicos($1) ORDER BY tipo',
        [[TOPICO]],
      )).rows;

      expect(contagem).toEqual([
        { tipo: 'dislike', total: '1', minha: true },
        { tipo: 'rock', total: '1', minha: true },
      ]);

      // Tocar novamente na mesma reação remove o voto
      expect((await db.query<{ alternar_reacao_do_topico: boolean }>('SELECT public.alternar_reacao_do_topico($1, $2)', [TOPICO, 'rock'])).rows[0].alternar_reacao_do_topico).toBe(false);

      const aposRemover = (await db.query<{ tipo: string; total: string; minha: boolean }>(
        'SELECT tipo, total::text, minha FROM public.contar_reacoes_dos_topicos($1) ORDER BY tipo',
        [[TOPICO]],
      )).rows;
      expect(aposRemover).toEqual([{ tipo: 'dislike', total: '1', minha: true }]);
    } finally {
      await db.close();
    }
  });
});

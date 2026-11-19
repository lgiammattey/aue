import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { expect, it } from 'vitest';

it('fecha GET direto e consulta a sessão atual sem ampliar acesso', async () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE SCHEMA aue_privado; CREATE SCHEMA extensions;
      CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
      CREATE TABLE auth.sessions (id uuid PRIMARY KEY, user_id uuid);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.uid', true),'')::uuid $$;
      CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT jsonb_build_object('session_id', current_setting('request.session_id', true)) $$;
      CREATE FUNCTION public.aue_e_administrador() RETURNS boolean LANGUAGE sql AS $$ SELECT auth.uid() = '00000000-0000-4000-8000-000000000004'::uuid $$;
      CREATE TABLE aue_privado.gravacoes_v2 (id uuid PRIMARY KEY, caminho text, exclusao_solicitada_em timestamptz, removida_em timestamptz);
      CREATE TABLE aue_privado.denuncias_v2 (id uuid PRIMARY KEY, gravacao_id uuid, estado text);
      CREATE TABLE aue_privado.duelos_v2 (id uuid, token_hash bytea, criador_id uuid, desafiante_id uuid, respondido_em timestamptz);
      CREATE FUNCTION public.aue_v2_revelar_duelo(text) RETURNS jsonb LANGUAGE sql AS $$ SELECT jsonb_build_object('estado', 'indisponivel') $$;
      CREATE TABLE storage.objects (bucket_id text, name text);
      CREATE FUNCTION storage.allow_any_operation(text[]) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
      CREATE FUNCTION aue_privado.pode_remover_audio_v2(text) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      CREATE POLICY duelos_v2_ler ON storage.objects FOR SELECT TO authenticated USING (true);
    `);
    await db.exec(await readFile('supabase/migrations/20261118024347_duelos_v2_audio_privado_edge.sql', 'utf8'));
    const uid = '00000000-0000-4000-8000-000000000001';
    const sid = '00000000-0000-4000-8000-000000000002';
    await db.exec(`INSERT INTO auth.sessions VALUES ('${sid}', '${uid}'); SELECT set_config('request.uid', '${uid}', false); SELECT set_config('request.session_id', '${sid}', false);`);
    expect((await db.query<{ ativa: boolean }>('SELECT public.aue_v2_sessao_ativa() AS ativa')).rows[0].ativa).toBe(true);
    await db.exec(`DELETE FROM auth.sessions WHERE id='${sid}'`);
    expect((await db.query<{ ativa: boolean }>('SELECT public.aue_v2_sessao_ativa() AS ativa')).rows[0].ativa).toBe(false);
    const p = await db.query<{ qual: string }>("SELECT qual FROM pg_policies WHERE policyname = 'duelos_v2_ler'");
    expect(p.rows[0].qual).toContain('object.delete');
    expect(p.rows[0].qual).not.toContain('object.get_authenticated');

    const admin = '00000000-0000-4000-8000-000000000004';
    const denuncia = '00000000-0000-4000-8000-000000000005';
    const gravacao = '00000000-0000-4000-8000-000000000006';
    const caminho = `${uid}/${gravacao}.wav`;
    await db.exec(`INSERT INTO aue_privado.gravacoes_v2(id,caminho) VALUES ('${gravacao}','${caminho}');
      INSERT INTO aue_privado.denuncias_v2 VALUES ('${denuncia}','${gravacao}','pendente');
      INSERT INTO storage.objects VALUES ('duelos_v2','${caminho}');`);
    const consultar = async () => (await db.query<{ r: { estado: string; caminho?: string } }>(`SELECT public.aue_v2_audio_para_moderacao('${denuncia}') AS r`)).rows[0].r;
    expect(await consultar()).toEqual({ estado: 'indisponivel' });
    await db.exec(`SELECT set_config('request.uid', '${admin}', false); INSERT INTO auth.sessions VALUES ('${sid}', '${admin}')`);
    expect(await consultar()).toEqual({ estado: 'disponivel', bucket: 'duelos_v2', caminho });
    await db.exec(`UPDATE aue_privado.denuncias_v2 SET estado = 'restaurada'`);
    expect(await consultar()).toEqual({ estado: 'indisponivel' });
    await db.exec(`UPDATE aue_privado.denuncias_v2 SET estado = 'mantida'; UPDATE aue_privado.gravacoes_v2 SET exclusao_solicitada_em = now()`);
    expect(await consultar()).toEqual({ estado: 'indisponivel' });
    await db.exec(`UPDATE aue_privado.gravacoes_v2 SET exclusao_solicitada_em = NULL; DELETE FROM auth.sessions`);
    expect(await consultar()).toEqual({ estado: 'indisponivel' });

    // A versão do resultado deriva o lado da sessão, nunca do token ou cliente.
    await db.exec(await readFile('supabase/migrations/20261118031702_duelo_v2_lado_no_resultado.sql', 'utf8'));
    await db.exec(`CREATE OR REPLACE FUNCTION public.aue_v2_revelar_duelo_sem_id(text) RETURNS jsonb
      LANGUAGE sql AS $$ SELECT jsonb_build_object('estado','revelado') $$;
      INSERT INTO aue_privado.duelos_v2(id,token_hash,criador_id,desafiante_id,respondido_em)
      VALUES ('00000000-0000-4000-8000-000000000010', extensions.digest(repeat('a',64),'sha256'),
        '${uid}', '00000000-0000-4000-8000-000000000003', now());
      SELECT set_config('request.uid','${uid}',false);`);
    const revelar = async () => (await db.query<{ r: { estado: string; lado_sessao?: string } }>("SELECT public.aue_v2_revelar_duelo(repeat('a',64)) AS r")).rows[0].r;
    expect(await revelar()).toMatchObject({ estado: 'revelado', lado_sessao: 'criador' });
    await db.exec("SELECT set_config('request.uid','00000000-0000-4000-8000-000000000003',false)");
    expect(await revelar()).toMatchObject({ estado: 'revelado', lado_sessao: 'desafiante' });
    await db.exec("SELECT set_config('request.uid','00000000-0000-4000-8000-000000000005',false)");
    expect(await revelar()).toEqual({ estado: 'indisponivel' });
    await db.exec("UPDATE aue_privado.duelos_v2 SET respondido_em=NULL; SELECT set_config('request.uid','00000000-0000-4000-8000-000000000001',false)");
    expect(await revelar()).toEqual({ estado: 'indisponivel' });
  } finally { await db.close(); }
}, 30_000);

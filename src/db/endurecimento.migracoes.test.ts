import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(`${raiz}/supabase/migrations/20261021000247_endurecimento_do_banco.sql`, 'utf8')
  .split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n').replace(/\s+/g, ' ');

describe('endurecimento do banco (migration 20261021000247)', () => {
  it('grupos não aceita escrita direta de visitante nem de sessão autenticada', () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.grupos');
    expect(sql).toContain('DROP POLICY IF EXISTS "Group creators can update their groups" ON public.grupos');
    expect(sql).toContain('REVOKE INSERT, UPDATE, DELETE ON public.grupos FROM anon, authenticated');
    expect(sql).not.toMatch(/CREATE POLICY [^;]* ON public\.grupos/);
  });

  it('tira TRUNCATE, TRIGGER e REFERENCES de todas as tabelas, inclusive das futuras', () => {
    expect(sql).toContain('REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated');
    expect(sql).toContain('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated');
  });

  it('fixa o search_path das 4 funções de nota', () => {
    for (const nome of ['aue_score_v1', 'aue_origin_score_v1', 'aue_classification_v1', 'aue_classification_historica_v1']) {
      expect(sql).toContain(`'${nome}'`);
    }
    expect(sql).toContain('SET search_path = public, pg_temp');
  });

  it('limita áudio por conta e telemetria por sessão', () => {
    expect(sql).toMatch(/audio_records.*foldername\(o\.name\)\)\[1\] = auth\.uid\(\)::text\) < 300/);
    expect(sql).toContain("interval '1 minute') >= 120");
    expect(sql).toContain('CREATE TRIGGER limitar_telemetria_por_sessao BEFORE INSERT ON public.eventos_de_telemetria');
  });
});

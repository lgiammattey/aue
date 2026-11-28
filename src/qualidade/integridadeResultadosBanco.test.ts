import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';
const U = '00000000-0000-4000-8000-000000000010';

describe('integridade dos resultados competitivos', () => {
  it('preserva legado e só abre X1 e comparadores para laudo confirmado pelo servidor', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE ROLE anon; CREATE ROLE authenticated;
        CREATE SCHEMA auth;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$
          SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        $$;
        CREATE TABLE public.resultados (
          id uuid PRIMARY KEY,
          usuario_id uuid,
          criado_em timestamptz NOT NULL DEFAULT now(),
          nota numeric NOT NULL,
          profundidade numeric NOT NULL DEFAULT 0,
          potencia numeric NOT NULL DEFAULT 0,
          duracao numeric NOT NULL DEFAULT 0,
          e_elegivel_para_xp boolean NOT NULL DEFAULT false,
          xp_ganho integer NOT NULL DEFAULT 0
        );
        INSERT INTO public.resultados (id, usuario_id, nota) VALUES
          ('${A}', '${U}', 90), ('${B}', '${U}', 80);
      `);
      await db.exec(await readFile('supabase/migrations/20261128000002_integridade_de_resultados.sql', 'utf8'));
      await db.exec(`SELECT set_config('request.jwt.claim.sub', '${U}', false)`);

      const pode = async (id: string) => (await db.query<{ ok: boolean }>(
        'SELECT public.pode_usar_como_desafiante($1) AS ok', [id],
      )).rows[0].ok;

      expect(await pode(A)).toBe(false);
      expect((await db.query<{ vencedor: string | null }>(
        'SELECT public.aue_compare_results_v1($1, $2) AS vencedor', [A, B],
      )).rows[0].vencedor).toBeNull();
      expect((await db.query<{ vencedor: string | null }>(
        'SELECT public.vencedor_do_round($1, $2) AS vencedor', [A, B],
      )).rows[0].vencedor).toBeNull();

      await db.exec(`UPDATE public.resultados SET integridade = 'verificado_servidor' WHERE id IN ('${A}', '${B}')`);
      expect(await pode(A)).toBe(true);
      expect((await db.query<{ vencedor: string }>(
        'SELECT public.aue_compare_results_v1($1, $2) AS vencedor', [A, B],
      )).rows[0].vencedor).toBe('desafiante');
      expect((await db.query<{ vencedor: string }>(
        'SELECT public.vencedor_do_round($1, $2)::text AS vencedor', [A, B],
      )).rows[0].vencedor).toBe(A);

      await db.exec(`INSERT INTO public.resultados (id, usuario_id, nota) VALUES ('00000000-0000-4000-8000-000000000003', '${U}', 100)`);
      expect((await db.query<{ integridade: string }>(
        "SELECT integridade FROM public.resultados WHERE id = '00000000-0000-4000-8000-000000000003'",
      )).rows[0].integridade).toBe('nao_verificado');
    } finally {
      await db.close();
    }
  });
});

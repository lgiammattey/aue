import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(
  `${raiz}/supabase/migrations/20261020193000_reparar_permissao_helper_anexo_forum.sql`,
  'utf8',
).replace(/\s+/g, ' ');

describe('permissão do helper de anexo do fórum', () => {
  it('libera só a execução exigida pelas policies de Storage', () => {
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.aue_anexo_do_forum_publicado\(text\) FROM PUBLIC/i);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.aue_anexo_do_forum_publicado\(text\) TO anon, authenticated/i);
    expect(sql).not.toMatch(/GRANT (SELECT|INSERT|UPDATE|DELETE) ON storage\.objects/i);
    expect(sql).not.toMatch(/CREATE POLICY/i);
  });
});

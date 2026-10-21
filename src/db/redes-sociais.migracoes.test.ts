import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(`${raiz}/supabase/migrations/20261021004425_formato_das_redes_sociais_do_perfil.sql`, 'utf8')
  .split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n').replace(/\s+/g, ' ');

describe('formato das redes sociais (migration 20261021004425)', () => {
  it('conserta o que já existe com a marca que o trigger de proteção exige', () => {
    expect(sql).toContain("PERFORM set_config('aue.perfil_social', 'sim', true)");
    expect(sql).toMatch(/UPDATE public\.perfis SET tiktok = nullif\(regexp_replace\(tiktok/);
  });

  it('trava o formato de cada rede no banco', () => {
    expect(sql).toContain("CHECK (instagram IS NULL OR instagram ~ '^[A-Za-z0-9._]{1,30}$')");
    expect(sql).toContain("CHECK (tiktok IS NULL OR tiktok ~ '^[A-Za-z0-9._]{1,24}$')");
    expect(sql).toContain("CHECK (youtube IS NULL OR youtube ~ '^[A-Za-z0-9._-]{1,50}$')");
    expect(sql).toContain("CHECK (twitter IS NULL OR twitter ~ '^[A-Za-z0-9_]{1,15}$')");
  });
});

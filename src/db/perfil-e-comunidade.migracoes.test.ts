import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(`${raiz}/supabase/migrations/20261021005643_limites_do_perfil_e_moderador_nao_sai.sql`, 'utf8')
  .split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n').replace(/\s+/g, ' ');

describe('limites do perfil e moderador não sai (migration 20261021005643)', () => {
  it('apelido, bio e cidade têm teto no banco', () => {
    expect(sql).toContain('CHECK (apelido IS NULL OR char_length(apelido) <= 40)');
    expect(sql).toContain('CHECK (bio IS NULL OR char_length(bio) <= 280)');
    expect(sql).toContain('CHECK (cidade IS NULL OR char_length(cidade) <= 60)');
  });

  it('título só muda sem JWT (seed e migration)', () => {
    expect(sql).toContain('IF auth.uid() IS NOT NULL THEN NEW.titulo := OLD.titulo; END IF');
  });

  it('moderador e criador não saem; visitante não executa', () => {
    expect(sql).toContain("m.role = 'admin'");
    expect(sql).toContain('g.created_by = auth.uid()');
    expect(sql).toContain("HINT = 'moderador_nao_sai'");
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.sair_da_comunidade(text) FROM PUBLIC, anon');
  });
});

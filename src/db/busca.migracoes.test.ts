import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(`${raiz}/supabase/migrations/20261020202000_busca_de_pessoas_rodas_e_topicos.sql`, 'utf8')
  .split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n').replace(/\s+/g, ' ');

describe('buscar_no_aue (migration 20261020202000)', () => {
  it('compara com strpos: nenhum caractere do termo vira coringa', () => {
    expect(sql).not.toMatch(/\bLIKE\b|\bILIKE\b|~\*?\s*v_termo/i);
    expect(sql.match(/strpos\(/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it('espelha a visibilidade das leituras existentes', () => {
    expect(sql).toContain('public.aue_e_conta_promovida(p.id)');
    expect(sql).toContain("t.status IN ('aberto', 'fechado')");
    expect(sql).toContain('public.aue_e_conta_promovida(t.autor_id)');
    expect(sql).toContain("lower(g.slug) <> 'acervo'");
  });

  it('limita termo, página e deslocamento', () => {
    expect(sql).toContain('char_length(v_termo) < 2 OR char_length(v_termo) > 60');
    expect(sql).toContain('least(coalesce(p_limite, 20), 51)');
    expect(sql).toContain('least(coalesce(p_deslocamento, 0), 1000)');
  });

  it('é leitura pública, mas fechada para PUBLIC e com search_path fixo', () => {
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.buscar_no_aue\(text, text, integer, integer\) FROM PUBLIC/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.buscar_no_aue\(text, text, integer, integer\) TO anon, authenticated/);
    expect(sql).toContain('SECURITY DEFINER SET search_path = public, pg_temp');
  });
});

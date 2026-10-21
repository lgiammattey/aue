import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const ler = (nome: string) => readFileSync(`${raiz}/supabase/migrations/${nome}`, 'utf8')
  .split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n').replace(/\s+/g, ' ');
const sql = ler('20261021001030_reacoes_de_topicos_e_salvos.sql');
const exclusiva = ler('20261021001154_reacao_de_topico_exclusiva.sql');

describe('reações de tópico e salvos (migrations 20261021001030 e 20261021001154)', () => {
  it('as tabelas ficam fechadas: RLS ligado e nenhum privilégio direto', () => {
    expect(sql).toContain('ALTER TABLE public.reacoes_de_topicos ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.itens_salvos ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('REVOKE ALL ON public.reacoes_de_topicos, public.itens_salvos FROM PUBLIC, anon, authenticated');
    expect(sql).not.toMatch(/CREATE POLICY/);
  });

  it('escrever e ler o que é meu exige conta promovida e não é aberto a visitante', () => {
    expect(sql.match(/PERFORM public\.aue_exigir_conta_promovida\(\)/g)?.length).toBe(2);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.alternar_reacao_do_topico\(uuid, text\), public\.alternar_salvo\(text, uuid\), public\.listar_ids_salvos\(\), public\.listar_meus_salvos\(integer, integer\) FROM PUBLIC, anon/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.contar_reacoes_dos_topicos\(uuid\[\]\) TO anon, authenticated/);
  });

  it('só se reage e salva o que é visível, e a lista não vaza item escondido', () => {
    expect(sql).toContain("t.status IN ('aberto', 'fechado')");
    expect(sql).toContain('NOT p.esta_escondido');
    expect(sql).toContain('WHERE s.user_id = auth.uid()');
  });

  it('as funções têm search_path fixo e limites de página', () => {
    expect(sql.match(/SET search_path = public, pg_temp/g)?.length).toBeGreaterThanOrEqual(5);
    expect(sql).toContain('p_topicos[1:100]');
    expect(sql).toContain('least(coalesce(p_limite, 20), 51)');
  });

  it('🔥, 🤢 e 🏆 são uma escolha só, como nos causos', () => {
    expect(exclusiva).toContain("IF p_tipo IN ('fogo', 'nojo', 'trofeu') THEN DELETE FROM public.reacoes_de_topicos WHERE user_id = auth.uid() AND topico_id = p_topico_id AND tipo IN ('fogo', 'nojo', 'trofeu')");
  });
});

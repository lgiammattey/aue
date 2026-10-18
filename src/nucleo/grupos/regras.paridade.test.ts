import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * As regras do cadastro vivem em dois lugares porque a Edge Function publicada
 * não enxerga `src/`. Se um mudar e o outro não, o formulário aceita o que a
 * função recusa (ou o contrário), e a pessoa só descobre depois do envio.
 */
const lerArquivo = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

describe('paridade das regras de cadastro de grupo', () => {
  it('a cópia do formulário é idêntica à da função', () => {
    const doFormulario = lerArquivo('./regras.ts');
    const daFuncao = lerArquivo('../../../supabase/functions/cadastrar-grupo/regras.ts');
    expect(doFormulario).toBe(daFuncao);
  });
});

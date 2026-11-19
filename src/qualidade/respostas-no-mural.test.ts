import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(import.meta.dirname, '../..');
const ler = (arquivo: string) => readFileSync(resolve(raiz, 'supabase/migrations', arquivo), 'utf8');
const extrair = (sql: string) => sql.match(/CREATE OR REPLACE FUNCTION public\.responder_topico_com_anexo\([\s\S]*?\n\$\$;/)?.[0];

describe('respostas no mural', () => {
  it('remove apenas a exigência de participação da última versão da RPC', () => {
    const anterior = extrair(ler('20261022160611_ampliar_texto_do_forum.sql'));
    const mural = extrair(ler('20261119170716_respostas_no_mural.sql'));
    expect(anterior).toBeDefined();
    expect(mural).toBeDefined();
    const trava = "  IF v_topico.origem = 'comunidade' THEN PERFORM public.aue_exigir_participacao(v_topico.comunidade_id); END IF;\n";
    expect(anterior).toContain(trava);
    expect(mural).toBe(anterior!.replace(trava, ''));
  });
});

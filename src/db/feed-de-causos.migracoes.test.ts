import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Trava de contrato entre o adaptador do feed e o SQL.
 *
 * Não há Postgres no CI, então isto lê o texto: o adaptador só pode usar RPC e
 * coluna que a migração do feed cria ou que já existiam depois da 036. Foi a
 * falta dessa conferência que deixou o feed lendo `score` e `audio_url`.
 */

const raiz = resolve(__dirname, '../..');
const lerSql = (arquivo: string) => readFileSync(resolve(raiz, 'supabase/migrations', arquivo), 'utf8');
const adaptador = readFileSync(resolve(raiz, 'src/plataforma/web/comunidade.ts'), 'utf8');
const feedSql = lerSql('20261018000002_feed_de_causos_contrato.sql');

describe('contrato do feed de causos', () => {
  it('toda RPC chamada pelo adaptador existe no SQL do feed ou na 036', () => {
    const chamadas = [...adaptador.matchAll(/\.rpc\(\s*'([a-z_]+)'/g)].map((m) => m[1]);
    expect(chamadas.length).toBeGreaterThan(0);
    const sql =
      feedSql +
      lerSql('20261018000004_perfil_e_comentarios_aninhados.sql') +
      lerSql('20260807000036_nomenclatura_ptbr_mvp1.sql');
    for (const nome of new Set(chamadas)) {
      expect(sql, `RPC ${nome}`).toMatch(new RegExp(`FUNCTION public\\.${nome}\\(`));
    }
  });

  it('o adaptador não usa mais nomes anteriores à 036 nem colunas que nunca existiram', () => {
    for (const velho of ['audio_url', 'origin_subtype', 'denunciado_em', "'motivo'", 'score,']) {
      expect(adaptador).not.toContain(velho);
    }
    expect(adaptador).not.toMatch(/\.from\('resultados'\)/);
  });

  it('todo tipo de reação que o adaptador envia passa no CHECK de reacoes', () => {
    const check = feedSql.match(/reaction_type IN \(([^)]*)\)/)?.[1] ?? '';
    for (const tipo of ['like', 'fogo', 'nojo', 'trofeu', 'repost']) {
      expect(check).toContain(`'${tipo}'`);
    }
  });

  it('denuncias aceita alvo post e a RLS de post exige consentimento + dono do resultado', () => {
    expect(feedSql).toContain('ADD COLUMN IF NOT EXISTS post_id');
    expect(feedSql).toContain('consentimento_audio_publico AND public.aue_resultado_e_meu(result_id)');
  });

  it('a limpeza da semente só toca nos ids fixos e em conta sem senha', () => {
    const limpeza = lerSql('20261018000003_remove_semente_ficticia.sql');
    expect(limpeza).toContain("encrypted_password = ''");
    expect(limpeza).toContain("email LIKE '%@aue.app'");
  });
});

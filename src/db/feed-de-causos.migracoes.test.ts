import { readdirSync, readFileSync } from 'node:fs';
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
const socialSql = lerSql('20261018000010_rede_social_promovida.sql');

describe('contrato do feed de causos', () => {
  it('toda RPC chamada pelo adaptador existe no SQL do feed ou na 036', () => {
    const chamadas = [...adaptador.matchAll(/\.rpc\(\s*'([a-z_]+)'/g)].map((m) => m[1]);
    expect(chamadas.length).toBeGreaterThan(0);
    const sql =
      feedSql +
      lerSql('20261018000004_perfil_e_comentarios_aninhados.sql') +
      lerSql('20261018000009_feed_e_perfil_da_casa.sql') +
      socialSql +
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

describe('contrato do perfil', () => {
  const perfilSql = lerSql('20261018000005_perfil_foto_redes_conexoes.sql');
  const adaptadorDePerfil = readFileSync(resolve(raiz, 'src/plataforma/web/perfilRemoto.ts'), 'utf8');
  const adaptadorDeConta = readFileSync(resolve(raiz, 'src/plataforma/web/conta.ts'), 'utf8');

  it('toda RPC chamada pelos adaptadores de perfil e conta existe no SQL', () => {
    const chamadas = [...(adaptadorDePerfil + adaptadorDeConta).matchAll(/\.rpc\(\s*'([a-z_]+)'/g)].map((m) => m[1]);
    expect(chamadas.length).toBeGreaterThan(0);
    const sql =
      perfilSql +
      lerSql('20261018000009_feed_e_perfil_da_casa.sql') +
      lerSql('20261018000004_perfil_e_comentarios_aninhados.sql') +
      socialSql +
      lerSql('20260807000036_nomenclatura_ptbr_mvp1.sql');
    for (const nome of new Set(chamadas)) {
      expect(sql, `RPC ${nome}`).toMatch(new RegExp(`FUNCTION public\\.${nome}\\(`));
    }
  });

  it('os parâmetros que o adaptador manda existem na assinatura de atualizar_meu_perfil', () => {
    const assinatura = socialSql.match(/CREATE OR REPLACE FUNCTION public\.atualizar_meu_perfil\(([\s\S]*?)\)\s*RETURNS/)?.[1] ?? '';
    for (const p of ['p_apelido', 'p_handle', 'p_bio', 'p_cidade', 'p_url_do_avatar', 'p_remover_avatar', 'p_instagram', 'p_tiktok', 'p_youtube', 'p_twitter']) {
      expect(assinatura, p).toContain(p);
    }
  });

  it('a foto só aceita arquivo da própria pasta do bucket avatars', () => {
    expect(perfilSql).toContain("'/storage/v1/object/public/avatars/' || v_id::text || '/'");
  });
});

describe('contrato da última definição do feed e do perfil', () => {
  const nomes = readdirSync(resolve(raiz, 'supabase/migrations')).filter((n) => n.endsWith('.sql')).sort();

  /** Colunas do RETURNS TABLE da ÚLTIMA migração que define a função. */
  function colunasDaUltimaDefinicao(funcao: string): { arquivo: string; colunas: string[] } {
    let ultima: { arquivo: string; colunas: string[] } | null = null;
    for (const arquivo of nomes) {
      const sql = lerSql(arquivo).replace(/--[^\n]*/g, '');
      for (const m of sql.matchAll(new RegExp(`CREATE\\s+(?:OR REPLACE\\s+)?FUNCTION public\\.${funcao}\\([\\s\\S]*?RETURNS TABLE \\(([\\s\\S]*?)\\)\\s*LANGUAGE`, 'g'))) {
        ultima = { arquivo, colunas: m[1].split(',').map((c) => c.trim().split(/\s+/)[0]) };
      }
    }
    if (!ultima) throw new Error(`Nenhuma migração define ${funcao} com RETURNS TABLE`);
    return ultima;
  }

  function camposDaInterface(fonte: string, nome: string): string[] {
    const corpo = fonte.match(new RegExp(`interface ${nome} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
    return [...corpo.matchAll(/^\s*(?:readonly\s+)?([a-z_]+)\??:/gm)].map((m) => m[1]);
  }

  it('LinhaDoFeed tem exatamente as colunas que a última listar_feed_de_causos devolve', () => {
    const { arquivo, colunas } = colunasDaUltimaDefinicao('listar_feed_de_causos');
    expect(arquivo).toBe('20261018000010_rede_social_promovida.sql');
    expect(camposDaInterface(adaptador, 'LinhaDoFeed').sort()).toEqual([...colunas].sort());
    expect(colunas.slice(-5)).toEqual(['minhas', 'caminho_do_audio_da_casa', 'comunidade_id', 'comunidade_slug', 'comunidade_nome']);
  });

  it('LinhaDePerfil tem exatamente as colunas que a última obter_perfil_publico devolve', () => {
    const { arquivo, colunas } = colunasDaUltimaDefinicao('obter_perfil_publico');
    expect(arquivo).toBe('20261018000010_rede_social_promovida.sql');
    const perfil = readFileSync(resolve(raiz, 'src/plataforma/web/perfilRemoto.ts'), 'utf8');
    expect(camposDaInterface(perfil, 'LinhaDePerfil').sort()).toEqual([...colunas].sort());
  });
});

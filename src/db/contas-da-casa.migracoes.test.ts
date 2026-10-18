import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { JANELA_DA_CASA } from '../nucleo/elenco/horario';

/**
 * Trava de texto das migrações do elenco da casa (20261018000008 e 000009).
 *
 * Não há Postgres no CI: isto lê o SQL e confere o que a revisão por leitura
 * precisa garantir. Não prova que o SQL roda. Prova que as regras combinadas
 * continuam escritas nele.
 */

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const lerMigracao = (nome: string) => readFileSync(`${RAIZ}/supabase/migrations/${nome}`, 'utf8');
const semComentarios = (sql: string) => sql.replace(/--[^\n]*/g, '');

const ARQUIVO_CONTAS = '20261018000008_contas_da_casa.sql';
const ARQUIVO_FEED = '20261018000009_feed_e_perfil_da_casa.sql';
const contas = lerMigracao(ARQUIVO_CONTAS);
const contasSemComentario = semComentarios(contas);
const feed = lerMigracao(ARQUIVO_FEED);

/** O corpo de uma função (do CREATE até o `$$;` que fecha). */
function corpoDa(sql: string, nome: string): string {
  const inicio = sql.indexOf(`CREATE FUNCTION public.${nome}(`);
  expect(inicio, `CREATE FUNCTION ${nome}`).toBeGreaterThanOrEqual(0);
  const fim = sql.indexOf('$$;', sql.indexOf('AS $$', inicio) + 5);
  return sql.slice(inicio, fim + 3);
}

describe('as migrações do elenco existem, com rollback', () => {
  it.each([ARQUIVO_CONTAS, ARQUIVO_FEED])('%s tem .down.sql na pasta de rollback', (arquivo) => {
    expect(existsSync(`${RAIZ}/supabase/rollback/${arquivo.replace('.sql', '.down.sql')}`)).toBe(true);
  });

  it('vêm depois da 20261018000006, em ordem', () => {
    const nomes = readdirSync(`${RAIZ}/supabase/migrations`).filter((n) => n.endsWith('.sql')).sort();
    expect(nomes.indexOf(ARQUIVO_CONTAS)).toBeGreaterThan(nomes.indexOf('20261018000006_diretorio_de_grupos_externos.sql'));
    expect(nomes.indexOf(ARQUIVO_FEED)).toBe(nomes.indexOf(ARQUIVO_CONTAS) + 1);
  });
});

describe('a migração só traz estrutura', () => {
  it('não cria usuário em auth.users nem insere dado da carga', () => {
    expect(contasSemComentario).not.toMatch(/INSERT\s+INTO\s+auth\./i);
    expect(contasSemComentario).not.toMatch(/INSERT\s+INTO\s+public\.perfis/i);
    // Os únicos INSERT em posts e comentários vivem dentro das funções do service_role.
    const foraDasFuncoes = contasSemComentario.replace(/CREATE FUNCTION[\s\S]*?\$\$;/g, '');
    expect(foraDasFuncoes).not.toMatch(/INSERT\s+INTO\s+public\.(posts_comunidade|comentarios)/i);
  });

  it('nenhum handle, apelido ou e-mail com "lucas" é escrito nas migrações', () => {
    for (const sql of [contasSemComentario, semComentarios(feed)]) {
      const linhas = sql.split('\n').filter((l) => /lucas/i.test(l));
      // A única menção aceita é a trava que PROÍBE o nome.
      for (const l of linhas) expect(l).toContain("position('lucas' IN");
    }
  });

  it('não redefine proteger_estatisticas_do_perfil nem mexe nas policies dos usuários', () => {
    for (const sql of [contasSemComentario, semComentarios(feed)]) {
      expect(sql).not.toMatch(/FUNCTION public\.proteger_estatisticas_do_perfil/);
      expect(sql).not.toMatch(/(CREATE|DROP|ALTER)\s+POLICY/i);
    }
  });
});

describe('contas_da_casa', () => {
  it('RLS ligada, sem policy, sem acesso do cliente', () => {
    expect(contasSemComentario).toContain('ALTER TABLE public.contas_da_casa ENABLE ROW LEVEL SECURITY');
    expect(contasSemComentario).not.toMatch(/POLICY[^;]*contas_da_casa/i);
    expect(contasSemComentario).toContain('REVOKE ALL ON TABLE public.contas_da_casa FROM anon, authenticated');
    expect(contasSemComentario).not.toMatch(/GRANT[^;]*ON TABLE public\.contas_da_casa TO (anon|authenticated|PUBLIC)/i);
  });

  it('o papel é personagem ou agente', () => {
    expect(contasSemComentario).toContain("CHECK (papel IN ('personagem', 'agente'))");
  });
});

describe('bucket audio_da_casa', () => {
  const bucket = contasSemComentario.match(/INSERT INTO storage\.buckets[\s\S]*?;/)?.[0] ?? '';

  it('público, 1 MB, só audio/mp4', () => {
    expect(bucket).toContain("'audio_da_casa', 'audio_da_casa', true, 1048576, ARRAY['audio/mp4']");
  });

  it('nenhuma policy de escrita para usuário: só o service_role escreve', () => {
    expect(contasSemComentario).not.toMatch(/POLICY[\s\S]{0,200}storage\.objects/i);
  });
});

describe('funções do service_role', () => {
  const FUNCOES = ['registrar_conta_da_casa', 'publicar_da_casa', 'comentar_da_casa', 'aue_dentro_da_janela_da_casa'];
  const SEGURAS = ['registrar_conta_da_casa', 'publicar_da_casa', 'comentar_da_casa'];

  it.each(FUNCOES)('%s: revogada de PUBLIC, anon e authenticated; só service_role executa', (nome) => {
    expect(contasSemComentario).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${nome}\\([^)]*\\) FROM PUBLIC;`));
    expect(contasSemComentario).toMatch(
      new RegExp(`REVOKE ALL ON FUNCTION public\\.${nome}\\([^)]*\\) FROM anon, authenticated;`),
    );
    expect(contasSemComentario).toMatch(new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${nome}\\([^)]*\\) TO service_role;`));
    expect(contasSemComentario).not.toMatch(
      new RegExp(`GRANT[^;]*public\\.${nome}\\([^)]*\\) TO[^;]*(anon|authenticated|PUBLIC)`, 'i'),
    );
  });

  it.each(SEGURAS)('%s: SECURITY DEFINER com search_path fixo', (nome) => {
    const corpo = corpoDa(contasSemComentario, nome);
    expect(corpo).toContain('SECURITY DEFINER');
    expect(corpo).toContain('SET search_path = public, pg_temp');
  });

  it('publicar_da_casa e comentar_da_casa: conta da casa, janela, id de fora, idempotente', () => {
    for (const nome of ['publicar_da_casa', 'comentar_da_casa']) {
      const corpo = corpoDa(contasSemComentario, nome);
      expect(corpo, nome).toContain('FROM public.contas_da_casa WHERE usuario_id = p_usuario_id');
      expect(corpo, nome).toContain('public.aue_dentro_da_janela_da_casa(p_criado_em)');
      expect(corpo, nome).toContain('ON CONFLICT (id) DO NOTHING');
    }
    expect(contasSemComentario).toMatch(/publicar_da_casa\(\s*p_id uuid,/);
    expect(contasSemComentario).toMatch(/comentar_da_casa\(\s*p_id uuid,/);
  });

  it('publicar_da_casa: texto, sem resultado, com consentimento, created_at explícito', () => {
    const corpo = corpoDa(contasSemComentario, 'publicar_da_casa');
    expect(corpo).toContain("'text_announcement', NULL");
    expect(corpo).toMatch(/p_criado_em,\s*true,/);
    expect(corpo).toContain('result_id');
    expect(corpo).toContain('consentimento_audio_publico');
    // O áudio só pode ser o do próprio post.
    expect(corpo).toContain("('burpzilla/' || p_id::text || '.m4a')");
  });

  it('comentar_da_casa: o comentário não sai antes do post', () => {
    expect(corpoDa(contasSemComentario, 'comentar_da_casa')).toContain('p_criado_em <= v_post_criado_em');
  });

  it('a janela do SQL é a mesma do núcleo (-03:00)', () => {
    const corpo = corpoDa(contasSemComentario, 'aue_dentro_da_janela_da_casa');
    const lidas = [...corpo.matchAll(/'([^']+-03)'::timestamptz/g)].map((m) => new Date(`${m[1].replace(' ', 'T')}:00`).toISOString());
    expect(lidas).toEqual([JANELA_DA_CASA.inicioUtc, JANELA_DA_CASA.fimUtc]);
  });
});

describe('registrar_conta_da_casa e a trava do perfil', () => {
  const corpo = corpoDa(contasSemComentario, 'registrar_conta_da_casa');

  it('liga o trigger de volta no mesmo corpo, depois do UPDATE', () => {
    const desliga = corpo.indexOf('DISABLE TRIGGER ao_atualizar_perfil');
    const atualiza = corpo.indexOf('UPDATE public.perfis');
    const liga = corpo.indexOf('ENABLE TRIGGER ao_atualizar_perfil');
    expect(desliga).toBeGreaterThan(0);
    expect(atualiza).toBeGreaterThan(desliga);
    expect(liga).toBeGreaterThan(atualiza);
    expect(corpo.match(/DISABLE TRIGGER/g)).toHaveLength(1);
    expect(corpo.match(/ENABLE TRIGGER/g)).toHaveLength(1);
  });

  it('o trigger que ela desliga é o que existe na migração da tradução', () => {
    const traducao = lerMigracao('20260807000036_nomenclatura_ptbr_mvp1.sql');
    expect(traducao).toMatch(/CREATE TRIGGER ao_atualizar_perfil\s+BEFORE UPDATE ON public\.perfis\s+FOR EACH ROW EXECUTE FUNCTION public\.proteger_estatisticas_do_perfil\(\)/);
  });

  it('acerta o que o trigger desfaria: criado_em retroativo e fundador falso', () => {
    expect(corpo).toContain('e_fundador = false');
    expect(corpo).toContain('criado_em = p_criado_em');
    expect(corpo).toContain('bio = p_bio');
    expect(corpo).toContain('handle = p_handle');
  });

  it('só mexe em usuário do domínio interno, e o domínio é o do núcleo', () => {
    expect(corpo).toContain("NOT LIKE '%@contas-da-casa.invalid'");
  });

  it('recusa o nome da squad que é do rival', () => {
    expect(corpo).toContain("position('lucas' IN lower(p_handle || ' ' || p_apelido || ' ' || v_email))");
  });

  it('o ENABLE não pode ficar de fora de nenhum desvio: não há RETURN antes dele', () => {
    const entre = corpo.slice(corpo.indexOf('DISABLE TRIGGER'), corpo.indexOf('ENABLE TRIGGER'));
    expect(entre).not.toMatch(/\bRETURN\b/);
    expect(entre).not.toMatch(/EXCEPTION\s+WHEN/i);
  });
});

describe('feed e perfil (20261018000009)', () => {
  const sql = semComentarios(feed);

  it('listar_feed_de_causos: mesma assinatura da 000004, áudio da casa ao fim, desempate por id', () => {
    const base = semComentarios(lerMigracao('20261018000004_perfil_e_comentarios_aninhados.sql'));
    const assinatura = (s: string) =>
      s.match(/CREATE FUNCTION public\.listar_feed_de_causos\(([\s\S]*?)\)\s*RETURNS TABLE/)?.[1].replace(/\s+/g, ' ').trim();
    expect(assinatura(sql)).toBe(assinatura(base));
    expect(sql).toContain('ORDER BY p.created_at DESC, p.id');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.listar_feed_de_causos(text, integer, uuid, uuid, uuid) TO anon, authenticated');
  });

  it('o áudio da casa só sai com consentimento e autor em contas_da_casa', () => {
    expect(sql).toContain('p.consentimento_audio_publico');
    expect(sql).toContain('EXISTS (SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id = p.user_id)');
  });

  it('o feed não devolve a marca da conta da casa (sem selo no feed)', () => {
    const feedFn = sql.slice(sql.indexOf('listar_feed_de_causos('), sql.indexOf('obter_perfil_publico'));
    const retorno = feedFn.match(/RETURNS TABLE \(([\s\S]*?)\)\s*LANGUAGE/)?.[1] ?? '';
    expect(retorno).not.toMatch(/conta_da_casa|e_da_casa|selo/);
    expect(retorno.trim().endsWith('caminho_do_audio_da_casa text')).toBe(true);
  });

  it('obter_perfil_publico devolve conta_da_casa, vinda de contas_da_casa', () => {
    expect(sql).toMatch(/sou_eu boolean,\s*conta_da_casa boolean\s*\)/);
    expect(sql).toContain('EXISTS (SELECT 1 FROM public.contas_da_casa cc WHERE cc.usuario_id = p.id)');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.obter_perfil_publico(text) TO anon, authenticated');
  });

  it('a última definição das duas funções é a desta migração', () => {
    const nomes = readdirSync(`${RAIZ}/supabase/migrations`).filter((n) => n.endsWith('.sql')).sort();
    for (const funcao of ['listar_feed_de_causos', 'obter_perfil_publico']) {
      const definem = nomes.filter((n) => new RegExp(`CREATE\\s+(?:OR REPLACE\\s+)?FUNCTION public\\.${funcao}\\(`).test(semComentarios(lerMigracao(n))));
      expect(definem.at(-1), funcao).toBe(ARQUIVO_FEED);
    }
  });
});

describe('rollback', () => {
  it('desfaz tudo o que a 000007 criou, nesta ordem de dependência', () => {
    const down = semComentarios(readFileSync(`${RAIZ}/supabase/rollback/20261018000008_contas_da_casa.down.sql`, 'utf8'));
    for (const nome of ['comentar_da_casa', 'publicar_da_casa', 'registrar_conta_da_casa', 'aue_dentro_da_janela_da_casa']) {
      expect(down).toContain(`DROP FUNCTION IF EXISTS public.${nome}(`);
    }
    expect(down).toContain('DROP COLUMN IF EXISTS caminho_do_audio_da_casa');
    expect(down).toContain('DROP TABLE IF EXISTS public.contas_da_casa');
    expect(down).toContain("id = 'audio_da_casa'");
    expect(down.indexOf('DROP FUNCTION')).toBeLessThan(down.indexOf('DROP TABLE'));
  });

  it('o rollback da 000008 devolve as assinaturas anteriores (sem a coluna nova)', () => {
    const down = semComentarios(readFileSync(`${RAIZ}/supabase/rollback/20261018000009_feed_e_perfil_da_casa.down.sql`, 'utf8'));
    expect(down).not.toContain('caminho_do_audio_da_casa');
    expect(down).not.toContain('conta_da_casa');
    expect(down).toContain('ORDER BY p.created_at DESC\n');
  });
});

describe('nomenclatura: o que as migrações do elenco criam está em português', () => {
  const novos = (sql: string, padrao: RegExp) => [...semComentarios(sql).matchAll(padrao)].map((m) => m[1]);

  it('tabelas, colunas e funções novas são as combinadas, em snake_case PT-BR', () => {
    const todas = contas + feed;
    expect(novos(todas, /CREATE TABLE (?:IF NOT EXISTS )?public\.([a-z_]+)/g)).toEqual(['contas_da_casa']);
    expect(novos(todas, /ADD COLUMN IF NOT EXISTS ([a-z_]+)/g)).toEqual(['caminho_do_audio_da_casa']);
    expect(novos(todas, /CREATE FUNCTION public\.([a-z_]+)\(/g).sort()).toEqual(
      [
        'aue_dentro_da_janela_da_casa',
        'comentar_da_casa',
        'listar_feed_de_causos',
        'obter_perfil_publico',
        'publicar_da_casa',
        'registrar_conta_da_casa',
      ].sort(),
    );
    expect(novos(todas, /INSERT INTO storage\.buckets[^V]*VALUES\s*\('([a-z_]+)'/g)).toEqual(['audio_da_casa']);
  });

  it('nenhum identificador aposentado pela tradução aparece no texto', () => {
    // A trava geral está em nomenclatura-ptbr.migracoes.test.ts; aqui só garante que ela vê estes arquivos.
    const posteriores = readdirSync(`${RAIZ}/supabase/migrations`).filter((n) => n > '20260807000036');
    expect(posteriores).toContain(ARQUIVO_CONTAS);
    expect(posteriores).toContain(ARQUIVO_FEED);
  });
});

describe('ADR 0007', () => {
  const adr = readFileSync(`${RAIZ}/docs/technical/adr/0007-audio-publico-da-casa.md`, 'utf8');

  it('foi aceito pelo Luiz, cita o §8 item 9 e a alternativa privada', () => {
    expect(adr).toMatch(/\*\*Status:\*\* aceito/i);
    expect(adr).toContain('§8');
    expect(adr).toContain('item 9');
    expect(adr).toContain('URL assinada');
  });

  it('a migração avisa que depende dele e o índice dos ADRs o lista', () => {
    expect(contas).toContain('ADR 0007');
    expect(readFileSync(`${RAIZ}/docs/technical/adr/README.md`, 'utf8')).toMatch(/0007-audio-publico-da-casa\.md\).*aceito/);
  });
});

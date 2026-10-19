import { beforeAll, describe, expect, it } from 'vitest';
import type {
  CursorDeTopicos,
  CursorDoForum,
  PortaDeForum,
  RespostaDoForum,
  TopicoDoExplorar,
  TopicoDoForum,
} from '../../portas/forum';

/**
 * O fórum contra o ambiente APLICADO (leituras de visitante).
 *
 * Os outros testes do adaptador usam dublê de Supabase e provam o que o adaptador
 * faz com a resposta que alguém inventou. Este prova o que o servidor de verdade
 * devolve ao adaptador: visitante lê, a paginação não repete nem pula, e o cursor
 * (texto do servidor, com microssegundo) volta como veio.
 *
 * COMO SE ATIVA (opt-in, para `npm test` nunca bater no Supabase real sem querer):
 *   AUE_TESTE_SERVIDOR=1 npx vitest run src/plataforma/web/forum.servidor.test.ts
 * além de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` existirem e não serem os
 * marcadores de exemplo (mesma regra de `scripts/grupos-do-supabase.ts`). Sem a
 * variável ou sem credencial, o arquivo inteiro aparece como PULADO, nunca como verde.
 *
 * SÓ LEITURA, SEMPRE. Chave pública (a do navegador), sem sessão: é um visitante.
 * Nenhuma escrita é chamada aqui, nem por engano: o teste não tem `criar`, `responder`,
 * `editar`, `apagar` nem `denunciar`. Nada de service role, nada de SQL manual.
 *
 * Sem dado suficiente no ambiente (menos de 3 itens para paginar), o caso se marca
 * PULADO com o motivo; não passa em branco.
 */

function credenciais(): { url: string; chave: string } | null {
  if (process.env.AUE_TESTE_SERVIDOR !== '1') return null;
  const url = process.env.VITE_SUPABASE_URL ?? '';
  const chave = process.env.VITE_SUPABASE_ANON_KEY ?? '';
  if (!url || !chave) return null;
  if (url.includes('exemplo.supabase.co') || url.includes('aue-dev.supabase.co')) return null;
  if (chave.includes('chave-ficticia') || chave.includes('chave-ausente') || chave.startsWith('YOUR_')) return null;
  return { url, chave };
}

const temAmbiente = credenciais() !== null;

/** Microssegundos desde a época, a partir do texto do servidor (`...:00.123456+00:00`). */
function microsDe(texto: string): bigint {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}(?::?\d{2})?)$/.exec(texto);
  if (!m) throw new Error(`timestamp fora do formato do servidor: ${texto}`);
  const [, a, mes, d, h, mi, s, frac = '', fuso] = m;
  let deslocamentoMin = 0;
  if (fuso !== 'Z') {
    const [hh, mm = '0'] = fuso.slice(1).split(':');
    deslocamentoMin = (Number(hh.slice(0, 2)) * 60 + Number(mm || hh.slice(2) || 0)) * (fuso[0] === '-' ? -1 : 1);
  }
  const ms = Date.UTC(Number(a), Number(mes) - 1, Number(d), Number(h), Number(mi), Number(s)) - deslocamentoMin * 60000;
  return BigInt(ms) * 1000n + BigInt(frac.padEnd(6, '0'));
}

const semRepetir = (ids: readonly string[]) => expect(new Set(ids).size).toBe(ids.length);

describe.skipIf(!temAmbiente)('fórum no ambiente aplicado: leitura de visitante', () => {
  let forum: PortaDeForum;

  beforeAll(async () => {
    // Import tardio: o cliente do Supabase lê a env na hora do import.
    const { criarForumWeb } = await import('./forum');
    forum = criarForumWeb();
  });

  /** Anda a lista inteira de `tamanho` em `tamanho`, devolvendo itens e cursores usados. */
  async function andarPorPaginas<T extends { id: string }, C>(
    pedir: (limite: number, cursor: C | null) => Promise<{ itens: readonly T[]; proximo: C | null }>,
    tamanho: number,
    maxPaginas = 40,
  ) {
    const itens: T[] = [];
    const cursores: C[] = [];
    let cursor: C | null = null;
    for (let i = 0; i < maxPaginas; i++) {
      const pagina = await pedir(tamanho, cursor);
      itens.push(...pagina.itens);
      if (pagina.proximo === null) return { itens, cursores, terminou: true };
      cursores.push(pagina.proximo);
      cursor = pagina.proximo;
    }
    return { itens, cursores, terminou: false };
  }

  async function ok<T>(p: Promise<{ ok: true; valor: T } | { ok: false; motivo: string }>): Promise<T> {
    const r = await p;
    if (!r.ok) throw new Error(`leitura falhou no ambiente: ${r.motivo}`);
    return r.valor;
  }

  it('o diretório responde a visitante e ninguém é membro', async () => {
    const comunidades = await ok(forum.listarComunidadesDoForum());
    expect(comunidades.length).toBeGreaterThan(0);
    for (const c of comunidades) {
      expect(c.slug.trim()).not.toBe('');
      expect(c.souMembro).toBe(false);
      expect(Number.isInteger(c.membrosTotal)).toBe(true);
      expect(Number.isInteger(c.topicosTotal)).toBe(true);
    }
    semRepetir(comunidades.map((c) => c.id));

    const primeira = comunidades[0];
    const obtida = await ok(forum.obterComunidadeDoForum(primeira.slug));
    expect(obtida).toEqual(primeira);
  });

  it('slug que não existe: obterComunidadeDoForum diz null; listarTopicos devolve página vazia, não erro', async () => {
    expect(await ok(forum.obterComunidadeDoForum('slug-que-nao-existe-xyz'))).toBeNull();
    // O servidor só recusa slug em branco. Slug desconhecido vem com zero linhas, e quem diz
    // "não achei" é obterComunidadeDoForum (a tela precisa chamar os dois).
    expect(await ok(forum.listarTopicos('slug-que-nao-existe-xyz'))).toEqual({ itens: [], proximo: null });
    expect(await forum.listarTopicos('   ')).toEqual({ ok: false, motivo: 'comunidadeInexistente' });
  });

  it('visitante lê tópicos sem ser autor e sem dono de nada', async () => {
    const pagina = await ok(forum.explorarTopicos({ limite: 5 }));
    for (const t of pagina.itens) {
      expect(t.comunidade.slug).not.toBe('');
      expect(['aberto', 'fechado']).toContain(t.status);
    }
    if (pagina.itens[0]) {
      const topico = await ok(forum.obterTopico(pagina.itens[0].id));
      expect(topico?.id).toBe(pagina.itens[0].id);
      expect(topico?.souAutor).toBe(false);
    }
  });

  describe.each(['atividade', 'recentes'] as const)('Explorar, ordem %s', (ordem) => {
    it('paginar de 2 em 2 não repete nem pula, e bate com a leitura de uma vez', async (ctx) => {
      const tudo = await ok(forum.explorarTopicos({ ordem, limite: 100 }));
      if (tudo.itens.length < 3) return ctx.skip('ambiente com menos de 3 tópicos: nada para paginar');
      const alvo = Math.min(tudo.itens.length, 12);

      const { itens, cursores } = await andarPorPaginas<TopicoDoExplorar, { valor: string; id: string }>(
        async (limite, cursor) => ok(forum.explorarTopicos({ ordem, limite, cursor })),
        2,
        Math.ceil(alvo / 2),
      );
      const ids = itens.map((t) => t.id);
      semRepetir(ids);
      expect(ids).toEqual(tudo.itens.slice(0, ids.length).map((t) => t.id));
      expect(ids.length).toBeGreaterThanOrEqual(alvo - 1);

      // Cursor é o texto do servidor, sem conversão: igual ao campo da última linha de cada página.
      const campo = ordem === 'atividade' ? 'ultimaAtividadeEm' : 'criadoEm';
      cursores.forEach((c, i) => expect(c.valor).toBe(itens[i * 2 + 1][campo]));

      // Ordem estrita por (valor, id) decrescente, no microssegundo.
      for (let i = 1; i < itens.length; i++) {
        const a = microsDe(itens[i - 1][campo]);
        const b = microsDe(itens[i][campo]);
        expect(a >= b).toBe(true);
        if (a === b) expect(itens[i - 1].id > itens[i].id).toBe(true);
      }
    });
  });

  describe.each(['atividade', 'recentes'] as const)('tópicos da comunidade com mais tópicos, ordem %s', (ordem) => {
    it('paginar de 2 em 2 não repete nem pula (cursor leva o fixado)', async (ctx) => {
      const comunidades = await ok(forum.listarComunidadesDoForum());
      const maior = [...comunidades].sort((a, b) => b.topicosTotal - a.topicosTotal)[0];
      if (!maior || maior.topicosTotal < 3) return ctx.skip('nenhuma comunidade com 3 tópicos ou mais');

      const tudo = await ok(forum.listarTopicos(maior.slug, { ordem, limite: 100 }));
      const { itens, terminou } = await andarPorPaginas<TopicoDoForum, CursorDeTopicos>(
        async (limite, cursor) => ok(forum.listarTopicos(maior.slug, { ordem, limite, cursor })),
        2,
        Math.ceil(tudo.itens.length / 2) + 2,
      );
      expect(terminou).toBe(true);
      const ids = itens.map((t) => t.id);
      semRepetir(ids);
      expect(ids).toEqual(tudo.itens.map((t) => t.id));
      expect(ids.length).toBe(maior.topicosTotal);
      for (const t of itens) expect(t.comunidade.slug).toBe(maior.slug);

      if (ordem === 'atividade') {
        // Fixados primeiro, depois a atividade mais recente.
        const fixadoFim = itens.findLastIndex((t) => t.fixado);
        const naoFixadoIni = itens.findIndex((t) => !t.fixado);
        if (fixadoFim >= 0 && naoFixadoIni >= 0) expect(fixadoFim).toBeLessThan(naoFixadoIni);
      }
    });
  });

  it('respostas de um tópico: paginar de 2 em 2, em ordem cronológica, sem repetir nem pular', async (ctx) => {
    const explorar = await ok(forum.explorarTopicos({ limite: 100 }));
    const com = explorar.itens.filter((t) => t.respostasTotal >= 3).sort((a, b) => b.respostasTotal - a.respostasTotal)[0];
    if (!com) return ctx.skip('nenhum tópico com 3 respostas ou mais neste ambiente');

    const tudo = await ok(forum.listarRespostasDoTopico(com.id, { limite: 200 }));
    const { itens, terminou } = await andarPorPaginas<RespostaDoForum, CursorDoForum>(
      async (limite, cursor) => ok(forum.listarRespostasDoTopico(com.id, { limite, cursor })),
      2,
      Math.ceil(tudo.itens.length / 2) + 2,
    );
    expect(terminou).toBe(true);
    const ids = itens.map((r) => r.id);
    semRepetir(ids);
    expect(ids).toEqual(tudo.itens.map((r) => r.id));
    for (let i = 1; i < itens.length; i++) {
      expect(microsDe(itens[i - 1].criadoEm) <= microsDe(itens[i].criadoEm)).toBe(true);
    }
  });

  it('listas do autor: handle que não existe devolve página vazia (não prova que a pessoa existe)', async () => {
    expect(await ok(forum.listarTopicosDoAutor('ninguem-com-esse-handle-xyz'))).toEqual({ itens: [], proximo: null });
    expect(await ok(forum.listarRespostasDoAutor('ninguem-com-esse-handle-xyz'))).toEqual({ itens: [], proximo: null });
  });
});

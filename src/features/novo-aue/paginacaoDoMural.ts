import type { CursorDoForum, PaginaDoForum, PortaDeForum, PublicacaoPessoal, TopicoDoExplorar } from '../../portas/forum';

type Fonte<T> = { itens: T[]; cursor: CursorDoForum | null; iniciada: boolean; };
type Entrada = { tipo: 'comunidade'; valor: TopicoDoExplorar } | { tipo: 'pessoal'; valor: PublicacaoPessoal };
const LIMITE = 30;

/** Mantém uma cabeça conhecida de cada origem antes de emitir cada publicação. */
export function criarPaginacaoDoMural(forum: PortaDeForum) {
  let comunidades: Fonte<TopicoDoExplorar> = { itens: [], cursor: null, iniciada: false };
  let pessoais: Fonte<PublicacaoPessoal> = { itens: [], cursor: null, iniciada: false };
  const temMais = (c: Fonte<TopicoDoExplorar>, p: Fonte<PublicacaoPessoal>) => c.itens.length > 0 || p.itens.length > 0 || !c.iniciada || !p.iniciada || c.cursor !== null || p.cursor !== null;
  async function proxima() {
    // Estado só é confirmado ao fim: falha de qualquer leitura permite repetir sem lacunas.
    const c = { ...comunidades, itens: [...comunidades.itens] };
    const p = { ...pessoais, itens: [...pessoais.itens] };
    const saida: Entrada[] = [];
    async function completar<T>(fonte: Fonte<T>, ler: (cursor: CursorDoForum | null) => Promise<{ ok: true; valor: PaginaDoForum<CursorDoForum, T> } | { ok: false }>) {
      if (fonte.itens.length || (fonte.iniciada && !fonte.cursor)) return;
      const resultado = await ler(fonte.cursor);
      if (!resultado.ok) throw new Error('Não foi possível carregar as publicações.');
      fonte.itens.push(...resultado.valor.itens);
      fonte.cursor = resultado.valor.proximo;
      fonte.iniciada = true;
    }
    while (saida.length < LIMITE) {
      await Promise.all([
        completar(c, (cursor) => forum.explorarTopicos({ limite: LIMITE, ordem: 'recentes', ...(cursor ? { cursor } : {}) })),
        completar(p, (cursor) => forum.listarPublicacoesPessoais ? forum.listarPublicacoesPessoais({ limite: LIMITE, ...(cursor ? { cursor } : {}) }) : Promise.resolve({ ok: true, valor: { itens: [], proximo: null } })),
      ]);
      const a = c.itens[0]; const b = p.itens[0];
      if (!a && !b) break;
      // Horário do servidor conserva microssegundos; desempata por UUID como as RPCs.
      const micros = (data: string) => (data.match(/\.(\d+)/)?.[1] ?? '').padEnd(6, '0').slice(3, 6);
      const compare = a && b ? Date.parse(a.criadoEm) - Date.parse(b.criadoEm) || micros(a.criadoEm).localeCompare(micros(b.criadoEm)) || a.id.localeCompare(b.id) : 0;
      if (a && (!b || compare >= 0)) saida.push({ tipo: 'comunidade', valor: c.itens.shift()! });
      else if (b) saida.push({ tipo: 'pessoal', valor: p.itens.shift()! });
    }
    return { entradas: saida, temMais: temMais(c, p), confirmar: () => { comunidades = c; pessoais = p; } };
  }
  return { proxima };
}

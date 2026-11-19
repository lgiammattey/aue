import { describe, expect, it, vi } from 'vitest';
import type { CursorDoForum, PortaDeForum, PublicacaoPessoal, TopicoDoExplorar } from '../../portas/forum';
import { criarPaginacaoDoMural } from './paginacaoDoMural';

function registro(id: string, n: number) {
  return { id, criadoEm: new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString() };
}
function fonte<T>(itens: T[]) {
  return vi.fn(async ({ cursor }: { cursor?: CursorDoForum } = {}) => {
    const offset = cursor ? Number(cursor.id) : 0;
    const pagina = itens.slice(offset, offset + 30);
    return { ok: true as const, valor: { itens: pagina, proximo: pagina.length === 30 ? { id: String(offset + 30), valor: 'cursor' } : null } };
  });
}

describe('paginação do mural', () => {
  it('intercala fontes assimétricas sem adiantar registros antigos nem perder itens', async () => {
    const topicos = Array.from({ length: 85 }, (_, i) => registro(`c${i}`, 200 - i)) as TopicoDoExplorar[];
    const pessoais = Array.from({ length: 8 }, (_, i) => registro(`p${i}`, 180 - i * 10)) as PublicacaoPessoal[];
    const forum = { explorarTopicos: fonte(topicos), listarPublicacoesPessoais: fonte(pessoais) } as unknown as PortaDeForum;
    const mural = criarPaginacaoDoMural(forum);
    const recebidos = [];
    let temMais = true;
    while (temMais) {
      const pagina = await mural.proxima();
      recebidos.push(...pagina.entradas.map((entrada) => entrada.valor));
      temMais = pagina.temMais;
      pagina.confirmar();
    }
    const esperado = [...topicos, ...pessoais].sort((a, b) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm) || b.id.localeCompare(a.id));
    expect(recebidos.map((item) => item.id)).toEqual(esperado.map((item) => item.id));
    expect(new Set(recebidos.map((item) => item.id)).size).toBe(93);
  });
  it('permite repetir uma página sem avançar quando uma fonte falha', async () => {
    const topicos = fonte([registro('c', 2)] as TopicoDoExplorar[]);
    const pessoais = fonte([registro('p', 1)] as PublicacaoPessoal[]);
    pessoais.mockRejectedValueOnce(new Error('offline'));
    const mural = criarPaginacaoDoMural({ explorarTopicos: topicos, listarPublicacoesPessoais: pessoais } as unknown as PortaDeForum);
    await expect(mural.proxima()).rejects.toThrow();
    const pagina = await mural.proxima();
    expect(pagina.entradas.map((entrada) => entrada.valor.id)).toEqual(['c', 'p']);
    pagina.confirmar();
    expect(pagina.temMais).toBe(false);
  });
  it('não avança o cursor antes da confirmação de montagem', async () => {
    const mural = criarPaginacaoDoMural({ explorarTopicos: fonte([registro('c', 2)] as TopicoDoExplorar[]), listarPublicacoesPessoais: fonte([]) } as unknown as PortaDeForum);
    const primeiro = await mural.proxima();
    const repetido = await mural.proxima();
    expect(primeiro.entradas).toEqual(repetido.entradas);
  });
});

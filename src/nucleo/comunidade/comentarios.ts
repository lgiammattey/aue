import type { RespostaDeCauso } from '../../portas/comunidade';

export interface ItemOrdenado {
  readonly resposta: RespostaDeCauso;
  readonly nivel: 0 | 1 | 2;
}

/**
 * Ordena a lista plana em árvore (pai, depois filhos) e fixa o recuo em três
 * níveis — o mesmo teto do banco. Filho cujo pai não veio na lista (escondido,
 * por exemplo) sobe para a raiz em vez de sumir.
 */
export function ordenarEmNiveis(lista: readonly RespostaDeCauso[]): ItemOrdenado[] {
  const ids = new Set(lista.map((r) => r.id));
  const filhos = new Map<string | undefined, RespostaDeCauso[]>();
  for (const r of lista) {
    const chave = r.respostaAId && ids.has(r.respostaAId) ? r.respostaAId : undefined;
    filhos.set(chave, [...(filhos.get(chave) ?? []), r]);
  }
  const saida: ItemOrdenado[] = [];
  const visitar = (pai: string | undefined, nivel: 0 | 1 | 2) => {
    for (const r of filhos.get(pai) ?? []) {
      saida.push({ resposta: r, nivel });
      visitar(r.id, Math.min(nivel + 1, 2) as 0 | 1 | 2);
    }
  };
  visitar(undefined, 0);
  return saida;
}

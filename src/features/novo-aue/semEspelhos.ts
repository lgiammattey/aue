import type { ItemDoFeed } from './tipos';

/**
 * Todo post antigo (causo) tem um tópico espelho no banco (migração do acervo, ADR 0010).
 * As duas leituras entram na mesma lista e o post aparecia duas vezes. Fica a cópia de
 * causo, que traz as reações, os comentários e o áudio de antes, e o espelho sai.
 *
 * O espelho nasce com o mesmo autor e a mesma data do post, e é por isso que casa.
 * Tópico escrito de verdade como tópico (sem causo por trás) nunca é tocado.
 */
const chave = (autorHandle: string | undefined, criadoEm: string): string | null => {
  const quando = new Date(criadoEm).getTime();
  return autorHandle && Number.isFinite(quando) ? `${autorHandle.toLowerCase()}|${quando}` : null;
};

export function semEspelhosDeCausos(itens: readonly ItemDoFeed[]): ItemDoFeed[] {
  const deCausos = new Set<string>();
  for (const item of itens) {
    if (item.tipo !== 'causo') continue;
    const c = chave(item.autorHandle, item.criadoEm);
    if (c) deCausos.add(c);
  }
  if (deCausos.size === 0) return [...itens];
  return itens.filter((item) => {
    if (item.tipo !== 'topico') return true;
    const c = chave(item.autorHandle, item.criadoEm);
    return !(c && deCausos.has(c));
  });
}

import { textoDeMembros, textoDeTopicos } from '../../nucleo/forum/apresentacao';

/** "12 tópicos · 34 membros": os números que o servidor contou, sem somar nada. */
export function metaDoCabecalho(c: { readonly topicosTotal: number; readonly membrosTotal: number }): string {
  return `${textoDeTopicos(c.topicosTotal)} · ${textoDeMembros(c.membrosTotal)}`;
}

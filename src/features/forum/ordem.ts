import type { OrdemDosTopicos } from '../../portas/forum';

/** `?ordem=novos` vira `recentes`; qualquer outra coisa é a atividade recente. */
export function ordemDaUrl(valor: string | null): OrdemDosTopicos {
  return valor === 'novos' ? 'recentes' : 'atividade';
}

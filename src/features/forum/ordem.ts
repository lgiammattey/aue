import type { OrdemDosTopicos } from '../../portas/forum';

/** `?ordem=novos` vira `recentes`; qualquer outra coisa é a atividade recente. */
export function ordemDaUrl(valor: string | null): OrdemDosTopicos {
  return valor === 'novos' ? 'recentes' : 'atividade';
}

export type IdDaAbaDoPerfil = 'topicos' | 'respostas';

/** `?aba=respostas` abre as respostas. Qualquer outro valor (ou nenhum) é a aba de tópicos. */
export function abaDaUrl(valor: string | null): IdDaAbaDoPerfil {
  return valor === 'respostas' ? 'respostas' : 'topicos';
}

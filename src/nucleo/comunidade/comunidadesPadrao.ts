import type { Comunidade } from '../../portas/comunidade';

/**
 * As comunidades que o Auê tem hoje (só as que existem no banco).
 *
 * Evita o problema de "feed vazio" (cold start). O app já nasce com espaços
 * temáticos consagrados pela zoeira brasileira.
 */
export const COMUNIDADES_PADRAO: readonly Comunidade[] = [
  {
    id: 'comu-eu-arroto-e-dai',
    slug: 'eu-arroto-e-dai',
    nome: 'Eu arroto, e daí?',
    descricao: 'A comunidade mãe do Auê. Orgulho do estrago e zero pudor social.',
    icone: '🦍',
  },
  {
    id: 'comu-arrotos-youtube',
    slug: 'arrotos-youtube',
    nome: 'Arrotos no YouTube',
    descricao: 'Vídeos que a roda trouxe do YouTube para assistir e comentar.',
    icone: '▶',
  },
];

export function obterComunidadePorSlug(slug: string): Comunidade | undefined {
  if (!slug) return undefined;
  const limpo = slug.toLowerCase().trim();
  return COMUNIDADES_PADRAO.find((c) => c.slug.toLowerCase() === limpo || c.nome.toLowerCase() === limpo);
}

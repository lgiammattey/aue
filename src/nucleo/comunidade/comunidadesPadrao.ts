import type { Comunidade } from '../../portas/comunidade';

/**
 * As comunidades oficiais de fábrica do Auê 3.0.
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
    id: 'comu-reuniao-da-firma',
    slug: 'reuniao-da-firma',
    nome: 'Na reunião da firma',
    descricao: 'Microfone aberto sem querer no Meet e a culpa jogada no ar condicionado.',
    icone: '💼',
  },
  {
    id: 'comu-primeiro-encontro',
    slug: 'primeiro-encontro',
    nome: 'Primeiro encontro',
    descricao: 'O momento que era pra ser romântico e virou trauma inesquecível.',
    icone: '💔',
  },
  {
    id: 'comu-trovao-da-madrugada',
    slug: 'trovao-da-madrugada',
    nome: 'Arroto trovão',
    descricao: 'Aquele que treme o vidro da sala, acorda o cachorro e assusta o vizinho.',
    icone: '⚡',
  },
  {
    id: 'comu-cerveja-e-churrasco',
    slug: 'cerveja-e-churrasco',
    nome: 'Cerveja & Churrasco',
    descricao: 'Domingo, mesa de plástico, cerveja trincando e disputa de honra.',
    icone: '🍺',
  },
] as const;

export function obterComunidadePorSlug(slug: string): Comunidade | undefined {
  return COMUNIDADES_PADRAO.find((c) => c.slug === slug);
}

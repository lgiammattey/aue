import type { Comunidade } from '../../portas/comunidade';

/**
 * As comunidades oficiais de fábrica do Auê 3.0.
 *
 * Evita o problema de "feed vazio" (cold start). O app já nasce com espaços
 * temáticos consagrados pela zoeira brasileira.
 */
export const COMUNIDADES_PADRAO: readonly Comunidade[] = [
  {
    id: 'comu-bonde-geral',
    slug: 'bonde-geral',
    nome: 'Bonde Geral',
    descricao: 'A praça central da zoeira. Todo mundo arrota aqui.',
    icone: '📢',
  },
  {
    id: 'comu-cerveja-gelada',
    slug: 'cerveja-gelada',
    nome: 'Cerveja Gelada',
    descricao: 'Arroto de long neck, chope e lata trincando.',
    icone: '🍺',
  },
  {
    id: 'comu-refri-cia',
    slug: 'refri-cia',
    nome: 'Refri & Cia',
    descricao: 'Gás de refrigerante. Grave no peito é lei.',
    icone: '🥤',
  },
  {
    id: 'comu-historias-de-arroto',
    slug: 'historias-de-arroto',
    nome: 'Histórias de Arroto',
    descricao: 'Casos, vexames e lendas de família.',
    icone: '📖',
  },
  {
    id: 'comu-churrasco-raiz',
    slug: 'churrasco-raiz',
    nome: 'Churrasco Raiz',
    descricao: 'Pós-picanha e farofa. Respeito máximo.',
    icone: '🥩',
  },
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
] as const;

export function obterComunidadePorSlug(slug: string): Comunidade | undefined {
  if (!slug) return undefined;
  const limpo = slug.toLowerCase().trim();
  return COMUNIDADES_PADRAO.find((c) => c.slug.toLowerCase() === limpo || c.nome.toLowerCase() === limpo);
}

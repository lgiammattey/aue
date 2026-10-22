/**
 * Categorias públicas que o Auê acompanha no painel administrativo.
 *
 * O caminho inteiro nunca entra na telemetria: slugs, ids de tópico e
 * parâmetros podem revelar mais do que o painel precisa para medir alcance.
 */
export const PAGINAS_MONITORADAS = [
  'feed',
  'comunidades',
  'comunidade',
  'topico',
  'explorar',
  'arena',
  'perfil',
  'entrada',
  'publica',
] as const;

export type PaginaMonitorada = (typeof PAGINAS_MONITORADAS)[number];

export function paginaMonitoradaDoCaminho(caminho: string): PaginaMonitorada | null {
  if (caminho === '/' || caminho === '/feed' || caminho === '/seguindo') return 'feed';
  if (caminho === '/comunidades') return 'comunidades';
  if (/^\/c\/[^/]+\/t\/[^/]+$/.test(caminho)) return 'topico';
  if (/^\/c\/[^/]+(?:\/novo)?$/.test(caminho)) return 'comunidade';
  if (caminho === '/explorar') return 'explorar';
  if (caminho === '/arena' || caminho.startsWith('/arena/') || /^\/(?:b|x1|d)\/[^/]+$/.test(caminho)) return 'arena';
  if (caminho === '/perfil' || /^\/(?:u|perfil)\/[^/]+$/.test(caminho)) return 'perfil';
  if (caminho === '/login' || caminho === '/entrar' || caminho === '/redefinir-senha') return 'entrada';
  if (['/como-jogar', '/como-arrotar', '/tipos-de-arroto', '/ranking-de-arrotos', '/grupos', '/privacidade', '/termos'].includes(caminho)) return 'publica';
  return null;
}

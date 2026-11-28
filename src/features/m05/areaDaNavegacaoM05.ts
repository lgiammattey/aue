export function areaDaNavegacaoM05(caminho: string) {
  if (caminho === '/' || caminho === '/en') return 'inicio';
  if (caminho === '/feed' || caminho === '/seguindo') return 'resenha';
  if (caminho === '/arena' || caminho === '/arena/em-breve') return 'arrotar';
  if (caminho === '/disputas' || caminho === '/duelo') return 'disputas';
  if (caminho === '/perfil' || caminho.startsWith('/u/') || caminho.startsWith('/perfil/')) return 'perfil';
  return null;
}

/** O atalho legado conserva sua intenção, inclusive com a Arena v2 ligada. */
export function abreArenaV2(caminho: string, busca: string): boolean {
  if (caminho === '/arena') return true;
  return caminho === '/' && new URLSearchParams(busca).get('gravar') !== '1';
}

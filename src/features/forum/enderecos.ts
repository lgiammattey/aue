export const enderecoDaComunidade = (slug: string) => `/c/${encodeURIComponent(slug)}`;
export const enderecoDoTopico = (slug: string, id: string) =>
  `/c/${encodeURIComponent(slug)}/t/${encodeURIComponent(id)}`;

/** Endereço compartilhável de uma fala, sem depender da posição dela na paginação. */
export const enderecoDaResposta = (slug: string, topicoId: string, respostaId: string) =>
  `${enderecoDoTopico(slug, topicoId)}?resposta=${encodeURIComponent(respostaId)}`;

/** Leitura pura da query: URL inválida não vira resposta nem chamada ao servidor. */
export function respostaDoEndereco(search: string): string | null {
  const termo = search.startsWith('?') ? search.slice(1) : search;
  for (const parte of termo.split('&')) {
    const [chave, ...valor] = parte.split('=');
    if (chave !== 'resposta') continue;
    try {
      const id = decodeURIComponent(valor.join('=').replace(/\+/g, ' ')).trim();
      return id || null;
    } catch {
      return null;
    }
  }
  return null;
}
export const enderecoDoPerfil = (handle: string) => `/u/${encodeURIComponent(handle)}`;

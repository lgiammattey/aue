export const enderecoDaComunidade = (slug: string) => `/c/${encodeURIComponent(slug)}`;
export const enderecoDoTopico = (slug: string, id: string) =>
  `/c/${encodeURIComponent(slug)}/t/${encodeURIComponent(id)}`;

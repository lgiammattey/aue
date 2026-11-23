/**
 * Marca a página atual como "não indexar" e troca o título da aba. Devolve a
 * função que desfaz as duas coisas quando a pessoa sai da página.
 *
 * Serve às telas que o Firebase entrega com HTTP 200 porque a rota é do app
 * (ex.: página não encontrada): sem isto o Google trataria a URL como página real.
 * Reaproveita o `<meta name="robots">` do `index.html` em vez de criar um segundo
 * com valor contrário.
 */
export function marcarPaginaNaoIndexavel(titulo: string): () => void {
  const tituloAnterior = document.title;
  const existente = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  const conteudoAnterior = existente?.content ?? null;
  const meta = existente ?? Object.assign(document.createElement('meta'), { name: 'robots' });
  meta.content = 'noindex';
  if (!existente) document.head.appendChild(meta);
  document.title = titulo;
  return () => {
    if (existente && conteudoAnterior !== null) existente.content = conteudoAnterior;
    else meta.remove();
    document.title = tituloAnterior;
  };
}

/**
 * Troca o idioma e o título do documento enquanto uma página em outro idioma
 * está na tela. Devolve a função que restaura os dois.
 *
 * Existe porque o service worker entrega o `index.html` em PT-BR para qualquer
 * navegação interna. Sem isto, quem já visitou o site abre `/en` com
 * `<html lang="pt-BR">` e título em português: leitor de tela pronuncia o
 * inglês com sotaque errado e a aba mente sobre a página.
 */
export function definirIdiomaETitulo(idioma: string, titulo: string): () => void {
  const raiz = document.documentElement;
  const idiomaAnterior = raiz.lang;
  const tituloAnterior = document.title;
  raiz.lang = idioma;
  document.title = titulo;
  return () => {
    raiz.lang = idiomaAnterior;
    document.title = tituloAnterior;
  };
}

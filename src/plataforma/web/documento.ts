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

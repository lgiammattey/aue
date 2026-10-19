import { Route } from 'react-router-dom';
import { LayoutDoForum } from './ShellDoForum';
import { TelaComunidadeDoForum } from './TelaComunidadeDoForum';
import { TelaDiretorio } from './TelaDiretorio';
import { TelaExplorar } from './TelaExplorar';
import { TelaTopico } from './TelaTopico';

/**
 * As rotas de leitura do fórum (cartão 0017, pedaço 2b), para entrar dentro de
 * um `<Routes>`. Compartilham uma casca só: a navegação não remonta ao passar
 * de uma tela para outra.
 *
 * `/comunidade/:slug` e `/comunidades/:slug` NÃO estão aqui de propósito: seguem
 * na tela antiga até o corte (pedaço 2e).
 */
export function rotasDoForum() {
  return (
    <Route element={<LayoutDoForum />}>
      <Route path="/comunidades" element={<TelaDiretorio />} />
      <Route path="/explorar" element={<TelaExplorar />} />
      <Route path="/c/:slug" element={<TelaComunidadeDoForum />} />
      <Route path="/c/:slug/t/:id" element={<TelaTopico />} />
    </Route>
  );
}

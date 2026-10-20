import { Route } from 'react-router-dom';
import { LayoutDoForum } from './ShellDoForum';
import { TelaComunidadeDoForum } from './TelaComunidadeDoForum';
import { TelaDiretorio } from './TelaDiretorio';
import { TelaExplorar } from './TelaExplorar';
import { TelaNovoTopico } from './TelaNovoTopico';
import { TelaTopico } from './TelaTopico';

/**
 * As rotas do fórum (cartão 0017, pedaços 2b e 2c), para entrar dentro de
 * um `<Routes>`. Compartilham uma casca só: a navegação não remonta ao passar
 * de uma tela para outra.
 *
 * Diretório e comunidade pertencem ao OpenDesign. Não podem ser declarados de
 * novo aqui: duas rotas idênticas deixam a escolha visual dependente da
 * prioridade interna do React Router e podem trazer a casca antiga de volta.
 */
export function rotasDoForum({ incluirRaizesDaComunidade = true }: { readonly incluirRaizesDaComunidade?: boolean } = {}) {
  return (
    <Route element={<LayoutDoForum />}>
      {incluirRaizesDaComunidade && <Route path="/comunidades" element={<TelaDiretorio />} />}
      <Route path="/explorar" element={<TelaExplorar />} />
      {incluirRaizesDaComunidade && (
        <Route path="/c/:slug" element={<TelaComunidadeDoForum />}>
          {/* Formulário de novo tópico: por cima da lista da comunidade (cartão 0017, pedaço 2c). */}
          <Route path="novo" element={<TelaNovoTopico />} />
        </Route>
      )}
      <Route path="/c/:slug/t/:id" element={<TelaTopico />} />
    </Route>
  );
}

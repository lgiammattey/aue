import { describe, expect, it } from 'vitest';

import {
  MARCADOR_DAS_COMUNIDADES,
  montarListaEstaticaDasComunidades,
} from './paginaEstatica';

describe('lista estática das comunidades', () => {
  it('aponta para a comunidade real e escapa conteúdo vindo do banco', () => {
    const html = montarListaEstaticaDasComunidades([
      { slug: 'eu-arroto-e-dai', nome: 'Eu Arroto, e Daí?', descricao: 'Resenha <sem HTML>' },
    ]);

    expect(html).toContain('<a href="/c/eu-arroto-e-dai">Eu Arroto, e Daí?</a>');
    expect(html).toContain('Resenha &lt;sem HTML&gt;');
  });

  it('mantém uma mensagem honesta caso a lista esteja vazia', () => {
    expect(montarListaEstaticaDasComunidades([])).toContain('assim que houver uma publicada');
    expect(MARCADOR_DAS_COMUNIDADES).toBe('<!--COMUNIDADES_ESTATICAS-->');
  });
});

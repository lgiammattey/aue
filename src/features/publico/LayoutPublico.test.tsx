// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LayoutPublico } from './LayoutPublico';

function montar() {
  render(
    <MemoryRouter initialEntries={['/como-jogar']}>
      <LayoutPublico eyebrow="Guia" titulo="Título" resumo="Resumo">
        <p>Conteúdo</p>
      </LayoutPublico>
    </MemoryRouter>,
  );
  return screen.getByLabelText('Navegação do Auê');
}

describe('casca das páginas públicas', () => {
  afterEach(() => {
    cleanup();
  });

  it('usa a mesma navegação da rede', () => {
    const navegacao = montar();

    expect(navegacao.textContent).toContain('Feed');
    expect(navegacao.textContent).toContain('Comunidades');
    expect(navegacao.textContent).toContain('Tropa');
    expect(navegacao.textContent).toContain('Arena');
    expect(navegacao.textContent).toContain('Eu');
  });

  it('mantém o conteúdo no centro da casca OpenDesign', () => {
    montar();

    expect(document.querySelector('.app.od-informativo')).toBeTruthy();
    expect(screen.getByText('Título')).toBeTruthy();
    expect(screen.getByText('Conteúdo')).toBeTruthy();
  });
});

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

    expect(navegacao.textContent).toContain('Início');
    expect(navegacao.textContent).toContain('Ranking');
    expect(navegacao.textContent).toContain('Grupos Zap');
    expect(navegacao.textContent).toContain('Seguindo');
    expect(navegacao.textContent).toContain('Perfil');
    expect(navegacao.textContent).toContain('ARROTAR');
  });

  it('mantém o conteúdo no centro da casca OpenDesign', () => {
    montar();

    expect(document.querySelector('.app.od-informativo')).toBeTruthy();
    expect(screen.getByText('Título')).toBeTruthy();
    expect(screen.getByText('Conteúdo')).toBeTruthy();
  });
});

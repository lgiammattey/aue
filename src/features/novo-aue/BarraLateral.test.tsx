// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BarraLateral } from './BarraLateral';

afterEach(cleanup);

function CaminhoAtual() {
  return <output data-testid="caminho-atual">{useLocation().pathname}</output>;
}

describe('BarraLateral do App Shell', () => {
  it('não renderiza barra inferior mobile e mantém os destinos do novo App Shell', () => {
    const abrirGravador = vi.fn();
    render(
      <MemoryRouter initialEntries={['/']}>
        <BarraLateral
          viewAtual="feed"
          estaAutenticado
          aoMudarView={vi.fn()}
          aoAbrirGravadorRapido={abrirGravador}
          aoSair={vi.fn()}
        />
        <CaminhoAtual />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('navigation', { name: 'Navegação móvel inferior' })).toBeNull();
    expect(document.querySelector('.mobile-bottom-nav')).toBeNull();

    const desktop = within(screen.getByRole('navigation', { name: 'Menu principal' }));
    expect(desktop.getByRole('link', { name: 'Ranking' }).getAttribute('href')).toBe('/ranking-de-arrotos');
    expect(desktop.getByRole('link', { name: 'Grupos Zap' }).getAttribute('href')).toBe('/grupos');

    fireEvent.click(desktop.getByRole('button', { name: 'Seguindo' }));
    expect(screen.getByTestId('caminho-atual').textContent).toBe('/seguindo');

    fireEvent.click(desktop.getByRole('button', { name: 'Perfil' }));
    expect(screen.getByTestId('caminho-atual').textContent).toBe('/perfil');

    fireEvent.click(desktop.getByRole('button', { name: 'Início' }));
    expect(screen.getByTestId('caminho-atual').textContent).toBe('/');

    fireEvent.click(desktop.getByRole('button', { name: 'ARROTAR' }));
    expect(abrirGravador).toHaveBeenCalledOnce();
  });
});

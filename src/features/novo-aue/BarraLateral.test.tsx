// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { BarraLateral } from './BarraLateral';

function CaminhoAtual() {
  return <output data-testid="caminho-atual">{useLocation().pathname}</output>;
}

describe('BarraLateral mobile', () => {
  it('abre o gravador rápido e deixa a Tropa no lugar do X1', () => {
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

    const navegacaoMobile = within(screen.getByRole('navigation', { name: 'Navegação móvel inferior' }));

    fireEvent.click(navegacaoMobile.getByRole('button', { name: 'Gravar um arroto para publicar' }));
    expect(abrirGravador).toHaveBeenCalledOnce();
    expect(navegacaoMobile.queryByRole('button', { name: /Desafios X1/i })).toBeNull();

    fireEvent.click(navegacaoMobile.getByRole('button', { name: 'Grupos WhatsApp' }));
    expect(screen.getByTestId('caminho-atual').textContent).toBe('/grupos');

    fireEvent.click(navegacaoMobile.getByRole('button', { name: 'Minha Tropa' }));
    expect(screen.getByTestId('caminho-atual').textContent).toBe('/seguindo');

    fireEvent.click(navegacaoMobile.getByRole('button', { name: 'Meu perfil' }));
    expect(screen.getByTestId('caminho-atual').textContent).toBe('/perfil');

    fireEvent.click(navegacaoMobile.getByRole('button', { name: 'Mural' }));
    expect(screen.getByTestId('caminho-atual').textContent).toBe('/feed');

    const desktop = within(screen.getByRole('navigation', { name: 'Menu principal' }));
    fireEvent.click(desktop.getByRole('button', { name: 'Grupos WhatsApp' }));
    expect(screen.getByTestId('caminho-atual').textContent).toBe('/grupos');
    fireEvent.click(desktop.getByRole('button', { name: 'Arena' }));
    expect(screen.getByTestId('caminho-atual').textContent).toBe('/arena');
    fireEvent.click(desktop.getByRole('button', { name: 'Mural' }));
    expect(screen.getByTestId('caminho-atual').textContent).toBe('/feed');
  });
});

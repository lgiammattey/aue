// @vitest-environment jsdom
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TelaLanding } from './TelaLanding';

describe('TelaLanding (Protótipo Canônico Landing.dc.html)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renderiza o wordmark Auê!, títulos e botões principais de entrada', () => {
    render(
      <MemoryRouter>
        <TelaLanding />
      </MemoryRouter>,
    );

    expect(screen.getByText('Auê!')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Tá rolando agora' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Entra no bonde hoje.' })).toBeTruthy();

    expect(screen.getByRole('button', { name: 'Continuar com Google' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Criar conta' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Arrotar sem conta' })).toBeTruthy();
  });

  it('permite alternar entre tema escuro e tema claro no rodapé', () => {
    render(
      <MemoryRouter>
        <TelaLanding />
      </MemoryRouter>,
    );

    const btnTema = screen.getByRole('button', { name: /Tema claro|Tema escuro/ });
    expect(btnTema).toBeTruthy();

    fireEvent.click(btnTema);
    expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { App } from './App';

describe('Jornada do App (Entrada Inteligente e Transição para Arena)', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, 'Test', '/');
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('exibe a Landing na raiz "/" para primeiro visitante sem sessão', async () => {
    render(<App />);

    // Deve exibir os elementos da Landing
    expect(await screen.findByRole('heading', { level: 1, name: 'Tá rolando agora' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Arrotar sem conta' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explorar o feed sem conta' })).toBeTruthy();
  });

  it('mantém o visitante deslogado na Landing na raiz "/" sem forçar o feed', async () => {
    localStorage.setItem('aue.visitou', 'true');
    render(<App />);

    // Mesmo com dados no localStorage, deslogado permanece na Landing com opções públicas
    expect(await screen.findByRole('heading', { level: 1, name: 'Tá rolando agora' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explorar o feed sem conta' })).toBeTruthy();
  });

  it('exibe o Feed diretamente quando acessa a rota "/feed"', async () => {
    window.history.pushState({}, 'Feed', '/feed');
    render(<App />);

    // Deve exibir o Feed do Bonde do Arroto diretamente
    expect(await screen.findByPlaceholderText('O que tá rolando no bonde?')).toBeTruthy();
  });

  it('abre a Arena diretamente na rota "/arena" integrada à casca com navegação para o Feed', async () => {
    window.history.pushState({}, 'Arena', '/arena');
    render(<App />);

    // Deve conter a navegação integrada com acesso ao Feed e a aba Auê
    expect(await screen.findByRole('button', { name: 'Feed' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Auê' }).length).toBeGreaterThanOrEqual(1);
  });

  it('abre o desafio X1 diretamente pela rota "/x1/:code" na Arena', async () => {
    window.history.pushState({}, 'Desafio X1', '/x1/k4x9');
    render(<App />);

    // Deve carregar a Arena com o desafio
    const elementos = await screen.findAllByText(/Auê/i);
    expect(elementos.length).toBeGreaterThan(0);
  });

  it('abre a visão de comunidades pela rota plural "/comunidades"', async () => {
    window.history.pushState({}, 'Comunidades', '/comunidades');
    render(<App />);

    // Deve renderizar a aba de Comunidade ativa
    expect(await screen.findByRole('button', { name: 'Comunidade' })).toBeTruthy();
  });
});


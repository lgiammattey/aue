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

  it('vai direto para o Feed na raiz "/" quando o usuário já visitou o site antes', async () => {
    localStorage.setItem('aue.visitou', 'true');
    render(<App />);

    // Deve exibir o Feed do Bonde do Arroto diretamente
    expect(await screen.findByPlaceholderText('O que tá rolando no bonde?')).toBeTruthy();
  });

  it('abre a Arena diretamente na rota "/arena" com o botão "Voltar pro Feed"', async () => {
    window.history.pushState({}, 'Arena', '/arena');
    render(<App />);

    // Deve conter o botão de retorno ao feed
    expect(await screen.findByRole('button', { name: 'Voltar para o Feed' })).toBeTruthy();
  });
});

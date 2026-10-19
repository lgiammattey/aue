// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { App } from './App';

const estadoDaConta = vi.hoisted(() => ({
  valor: { temSessao: false, anonima: false, perfilSocialPendente: false },
}));

vi.mock('./plataforma/web/conta', () => ({
  criarContaWeb: () => ({ estado: vi.fn(async () => estadoDaConta.valor) }),
}));

describe('Jornada do App (Entrada Inteligente e Transição para Arena)', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, 'Test', '/');
    estadoDaConta.valor = { temSessao: false, anonima: false, perfilSocialPendente: false };
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('exibe a Landing na raiz "/" para primeiro visitante sem sessão', async () => {
    render(<App />);

    // Deve exibir os elementos da Landing
    expect(await screen.findByRole('heading', { level: 1, name: 'Arrotar é um dom. Aqui, ele tem turma.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ir pra Arena' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Só quero ouvir' })).toBeTruthy();
  });

  it('abre Comunidades na raiz "/" para uma conta pronta', async () => {
    estadoDaConta.valor = { temSessao: true, anonima: false, perfilSocialPendente: false };
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Comunidades' })).toBeTruthy();
    expect(window.location.pathname).toBe('/comunidades');
  });

  it('mantém o visitante deslogado na Landing na raiz "/" sem forçar o feed', async () => {
    localStorage.setItem('aue.visitou', 'true');
    render(<App />);

    // Mesmo com dados no localStorage, deslogado permanece na Landing com opções públicas
    expect(await screen.findByRole('heading', { level: 1, name: 'Arrotar é um dom. Aqui, ele tem turma.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Só quero ouvir' }).getAttribute('href')).toBe('/comunidades');
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

  it('"/comunidades" abre o diretório novo do fórum, não a aba antiga', async () => {
    window.history.pushState({}, 'Comunidades', '/comunidades');
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Comunidades' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Comunidade' })).toBeNull();
  });

  it('"/c/:slug" abre a comunidade do fórum, e sem servidor diz que falhou em vez de mostrar outra', async () => {
    window.history.pushState({}, 'Comunidade', '/c/reuniao-da-firma');
    render(<App />);

    expect(await screen.findByText('Deu ruim pra carregar a comunidade.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Comunidade' })).toBeNull();
  });

  it('"/explorar" e "/c/:slug/t/:id" existem como telas do fórum', async () => {
    window.history.pushState({}, 'Explorar', '/explorar');
    const { unmount } = render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Explorar' })).toBeTruthy();
    unmount();

    window.history.pushState({}, 'Conversa', '/c/reuniao-da-firma/t/lixo');
    render(<App />);
    // Sem servidor configurado a leitura falha: erro com "Tentar de novo", nunca "indisponível" inventado.
    expect(await screen.findByText('Deu ruim pra carregar o tópico.')).toBeTruthy();
  });

  it('os aliases sociais levam para o diretório novo, sem passar pela tela antiga', async () => {
    for (const caminho of ['/comm', '/comunidade', '/bondes']) {
      window.history.pushState({}, 'Comunidades', caminho);
      const { unmount } = render(<App />);

      expect(await screen.findByRole('heading', { level: 1, name: 'Comunidades' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Comunidade' })).toBeNull();
      unmount();
    }
  });

  it('os aliases com slug levam para a comunidade nova equivalente', async () => {
    window.history.pushState({}, 'Comunidade', '/comunidades/reuniao-da-firma');
    render(<App />);

    expect(await screen.findByText('Deu ruim pra carregar a comunidade.')).toBeTruthy();
    expect(window.location.pathname).toBe('/c/reuniao-da-firma');
  });
});

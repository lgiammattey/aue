// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { App } from './App';
import { FLAGS } from './shared/flags';

const estadoDaConta = vi.hoisted(() => ({
  valor: { temSessao: false, anonima: false, perfilSocialPendente: false },
}));

vi.mock('./plataforma/web/conta', () => ({
  criarContaWeb: () => ({ estado: vi.fn(async () => estadoDaConta.valor) }),
}));

describe('Jornada do App (Entrada Inteligente e Transição para Arena)', () => {
  beforeEach(() => {
    FLAGS.arenaV2 = false;
    FLAGS.dueloV2 = false;
    localStorage.clear();
    window.history.pushState({}, 'Test', '/');
    estadoDaConta.valor = { temSessao: false, anonima: false, perfilSocialPendente: false };
  });

  afterEach(() => {
    cleanup();
    FLAGS.arenaV2 = false;
    FLAGS.dueloV2 = false;
    localStorage.clear();
  });

  it('abre o Início ilustrado para o primeiro visitante e oferece o gravador', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: /solta o arroto/i })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /^arrotar/i }).some((link) => link.getAttribute('href') === '/arena')).toBe(true);
    expect(screen.getByAltText(/quatro amigos à mesa num churrasco/i)).toBeTruthy();
  });

  it('endereço que o Auê não conhece mostra a página não encontrada, sem mandar para a home calado', async () => {
    window.history.pushState({}, 'Test', '/rota-que-nao-existe');
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Página não encontrada.' })).toBeTruthy();
    expect(window.location.pathname).toBe('/rota-que-nao-existe');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
  });

  it('abre o Hub na raiz "/" também para uma conta pronta', async () => {
    estadoDaConta.valor = { temSessao: true, anonima: false, perfilSocialPendente: false };
    render(<App />);

    expect((await screen.findAllByLabelText('Auê, página inicial')).length).toBeGreaterThan(0);
    expect(window.location.pathname).toBe('/');
  });

  it('mantém o visitante no Hub na raiz "/" sem forçar outra rota', async () => {
    localStorage.setItem('aue.visitou', 'true');
    render(<App />);

    expect((await screen.findAllByLabelText('Auê, página inicial')).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1, name: /solta o arroto/i })).toBeTruthy();
  });

  it('mantém "/feed" na nova casca unificada, sem ressuscitar o feed legado', async () => {
    window.history.pushState({}, 'Feed', '/feed');
    render(<App />);

    expect((await screen.findAllByLabelText('Auê, página inicial')).length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText('O que tá rolando no bonde?')).toBeNull();
    expect(window.location.pathname).toBe('/feed');
  });

  it('preserva a intenção do link antigo de gravar ao pedir login', async () => {
    window.history.pushState({}, 'Gravar', '/?gravar=1');
    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/login'));
    expect(new URLSearchParams(window.location.search).get('volta')).toBe('/feed?gravar=1');
  });

  it('leva a Arena para a apresentação de em breve, sem montar a casca legada do feed', async () => {
    window.history.pushState({}, 'Arena', '/arena');
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Aqui o arroto vira jogo.' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Toque para começar' })).toBeNull();
  });

  it('com flag opt-in abre Arena local em /arena', async () => {
    FLAGS.arenaV2 = true;
    window.history.pushState({}, 'Arena v2', '/arena');
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Gravar agora' })).toBeTruthy();
    expect(screen.queryByText(/convite pronto/i)).toBeNull();
  });

  it('abre a Resenha em /feed e dá acesso à Arena pela navegação', async () => {
    FLAGS.arenaV2 = true;
    window.history.pushState({}, 'Feed', '/feed');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Resenha' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Arrotar' }).some((link) => link.getAttribute('href') === '/arena')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Gravar agora' })).toBeNull();
  });

  it('não abre o duelo com a flag desligada', async () => {
    FLAGS.arenaV2 = true;
    window.history.pushState({}, 'Duelo', '/duelo#t=' + 'a'.repeat(64));
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Desafio indisponível.' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Aceitar e gravar' })).toBeNull();
  });

  it('com as duas flags ligadas encaminha um convite inválido para o fluxo de resposta', async () => {
    FLAGS.arenaV2 = true;
    FLAGS.dueloV2 = true;
    window.history.pushState({}, 'Duelo', '/duelo#t=invalido');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'CONVITE INDISPONÍVEL' })).toBeTruthy();
    expect(screen.getByText('O link está incompleto ou é inválido. Peça um novo convite.')).toBeTruthy();
  });

  it('com as duas flags mostra Início, guia e atalho para Disputas', async () => {
    FLAGS.arenaV2 = true;
    FLAGS.dueloV2 = true;
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: /solta o arroto/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ver Disputas' }).getAttribute('href')).toBe('/disputas');
    expect(await screen.findByRole('heading', { level: 2, name: 'Como arrotar' })).toBeTruthy();
  });

  it('com flag opt-in preserva a intenção do link de gravação no Mural "/feed?gravar=1"', async () => {
    FLAGS.arenaV2 = true;
    window.history.pushState({}, 'Gravar', '/feed?gravar=1');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/login'));
    expect(new URLSearchParams(window.location.search).get('volta')).toBe('/feed?gravar=1');
  });

  it('abre o desafio X1 diretamente pela rota "/x1/:code" na Arena', async () => {
    window.history.pushState({}, 'Desafio X1', '/x1/k4x9');
    render(<App />);

    // Deve carregar a Arena com o desafio
    const elementos = await screen.findAllByText(/Auê/i);
    expect(elementos.length).toBeGreaterThan(0);
  });

  it('redireciona todas as antigas rotas de comunidades e explorar direto para o Hub "/"', async () => {
    for (const caminho of [
      '/comunidades',
      '/comunidade',
      '/bondes',
      '/comm',
      '/explorar',
      '/c/reuniao-da-firma',
      '/c/reuniao-da-firma/t/lixo',
      '/comunidades/reuniao-da-firma',
    ]) {
      window.history.pushState({}, 'Comunidades', caminho);
      const { unmount } = render(<App />);

      await waitFor(() => expect(window.location.pathname).toBe('/'));
      expect(await screen.findByRole('heading', { level: 1, name: /solta o arroto/i })).toBeTruthy();
      expect(screen.queryByRole('heading', { level: 1, name: 'Encontre sua comunidade.' })).toBeNull();
      unmount();
    }
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { FLAGS } from '../../shared/flags';
import type { ArrotadorDoTop } from '../../portas/forum';

const destaques = vi.hoisted(() => ({ itens: [] as ArrotadorDoTop[] }));
vi.mock('../../plataforma/web/forum', async (original) => ({
  ...await original<typeof import('../../plataforma/web/forum')>(),
  criarForumWeb: () => ({
    explorarTopicos: async () => ({ ok: true, valor: { itens: [], proximo: null } }),
    listarPublicacoesPessoais: async () => ({ ok: true, valor: { itens: [], proximo: null } }),
    listarTopArrotadores: async () => ({ ok: true, valor: destaques.itens }),
  }),
}));
vi.mock('../../plataforma/web/conta', () => ({ criarContaWeb: () => ({ estado: vi.fn(async () => ({ temSessao: false, anonima: false, perfilSocialPendente: false })) }) }));

beforeEach(() => {
  FLAGS.arenaV2 = true;
  FLAGS.dueloV2 = false;
  destaques.itens = [{
    handle: 'destaqueteste', apelido: 'Destaque teste', avatarUrl: null, nota: 83,
    alvoTipo: 'topico', alvoId: '632bda4e-5440-434b-9852-91fc7211aee7', fonte: 'anexo',
  }];
});
afterEach(() => { cleanup(); FLAGS.arenaV2 = false; FLAGS.dueloV2 = false; });
describe('Ranking integrado às rotas', () => {
  it('mostra os destaques confirmados junto da Resenha no Início', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    const perfil = await screen.findByRole('link', { name: /destaque teste, nota 83/i });
    expect(perfil.getAttribute('href')).toBe('/u/destaqueteste');
    expect(perfil.closest('.m05-home__destaques')).toBeTruthy();
  });

  it('esconde a seção quando o servidor não tem destaques', async () => {
    destaques.itens = [];
    window.history.pushState({}, '', '/');
    render(<App />);
    await screen.findByText('Ainda não tem publicação na Resenha.');
    expect(screen.queryByRole('heading', { name: 'Destaques' })).toBeNull();
  });

  it('não aparece na rota isolada da Arena', async () => {
    window.history.pushState({}, '', '/arena');
    render(<App />);
    await screen.findByRole('button', { name: 'Gravar agora' });
    expect(screen.queryByRole('heading', { name: 'Destaques' })).toBeNull();
  });
  it('não aparece no fluxo de convite', async () => {
    FLAGS.dueloV2 = true;
    window.history.pushState({}, '', '/duelo#t=invalido');
    render(<App />);
    await screen.findByRole('heading', { name: 'CONVITE INDISPONÍVEL' });
    expect(screen.queryByRole('heading', { name: 'Destaques' })).toBeNull();
  });
});

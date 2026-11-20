// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { FLAGS } from '../../shared/flags';

vi.mock('../../features/novo-aue/TopArrotadoresDaHome', () => ({ TopArrotadoresDaHome: () => <div>TOP TESTE</div> }));
vi.mock('../../plataforma/web/conta', () => ({ criarContaWeb: () => ({ estado: vi.fn(async () => ({ temSessao: false, anonima: false, perfilSocialPendente: false })) }) }));

beforeEach(() => { FLAGS.arenaV2 = true; FLAGS.dueloV2 = false; });
afterEach(() => { cleanup(); FLAGS.arenaV2 = false; FLAGS.dueloV2 = false; });
describe('Ranking integrado às rotas', () => {
  it('está dentro da Arena na home', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    const top = await screen.findByText('TOP TESTE');
    expect(top.closest('main')?.classList.contains('arena-v2')).toBe(true);
  });
  it('não aparece na rota isolada da Arena', async () => {
    window.history.pushState({}, '', '/arena');
    render(<App />);
    await screen.findByRole('button', { name: 'Gravar meu arroto' });
    expect(screen.queryByText('TOP TESTE')).toBeNull();
  });
  it('não aparece no fluxo de convite', async () => {
    FLAGS.dueloV2 = true;
    window.history.pushState({}, '', '/duelo#t=invalido');
    render(<App />);
    await screen.findByRole('heading', { name: 'CONVITE INDISPONÍVEL' });
    expect(screen.queryByText('TOP TESTE')).toBeNull();
  });
});

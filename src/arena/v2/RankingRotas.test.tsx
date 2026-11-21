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
  it('está dentro da Home unificada', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    const tops = await screen.findAllByText('TOP TESTE');
    expect(tops.length).toBeGreaterThanOrEqual(1);
    expect(tops[0].closest('.app')).toBeTruthy();
  });
  it('não aparece na rota isolada da Arena', async () => {
    window.history.pushState({}, '', '/arena');
    render(<App />);
    await screen.findByRole('button', { name: 'Gravar agora' });
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

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { CursorDoForum, PortaDeForum, TopicoDoExplorar } from '../../portas/forum';
import { limparListasVistas } from './hooks';
import { Rotas, ambienteFalso, forumFalso, itemDoExplorar, sondas } from './dublesParaTeste';

beforeEach(limparListasVistas);
afterEach(cleanup);

const pagina = (itens: TopicoDoExplorar[], proximo: CursorDoForum | null = null) => ({
  ok: true as const,
  valor: { itens, proximo },
});

function abrir(explorar: PortaDeForum['explorarTopicos'], entrada = '/explorar', extra = {}) {
  const forum = forumFalso({ explorarTopicos: explorar });
  render(<Rotas entrada={entrada} m={{ forum, ...extra }} />);
  return forum;
}

describe('/explorar', () => {
  it('lista tópicos com a comunidade sempre à vista, cada uma como link próprio', async () => {
    abrir(vi.fn(async () => pagina([itemDoExplorar({ id: '1', respostasTotal: 8 }), itemDoExplorar({ id: '2', comunidade: { id: 'x', slug: 'refri', nome: 'Refri & Cia' } })])));
    const titulo = await screen.findByRole('link', { name: 'Tópico 1' });
    expect(titulo.getAttribute('href')).toBe('/c/cerveja-gelada/t/1');
    const linha = titulo.closest('li')!;
    expect(within(linha).getByRole('link', { name: 'Cerveja Gelada' }).getAttribute('href')).toBe('/c/cerveja-gelada');
    expect(linha.textContent).toContain('Ana Souza · 8 respostas · atividade há 3 h');
    const outra = screen.getByRole('link', { name: 'Tópico 2' }).closest('li')!;
    expect(within(outra).getByRole('link', { name: 'Refri & Cia' }).getAttribute('href')).toBe('/c/refri');
  });

  it('é só leitura: sem composer, sem "Para você" nem "Seguindo", sem busca, sem botão de escrita', async () => {
    abrir(vi.fn(async () => pagina([itemDoExplorar({ id: '1' })])));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByText(/para você|seguindo|em alta|movimentados/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /novo tópico|postar|participar|responder/i })).toBeNull();
    expect(screen.getByRole('link', { name: 'Ver comunidades' }).getAttribute('href')).toBe('/comunidades');
  });

  it('H1 "Explorar", título da aba e item ativo na navegação', async () => {
    const ambiente = ambienteFalso();
    abrir(vi.fn(async () => pagina([itemDoExplorar({ id: '1' })])), '/explorar', { ambiente });
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Explorar');
    expect(ambiente.titulo).toBe('Explorar · Auê!');
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Explorar' }).getAttribute('aria-current')).toBe('page');
  });

  it('tópico fechado mostra o marcador; fixado não aparece no Explorar', async () => {
    abrir(vi.fn(async () => pagina([itemDoExplorar({ id: '1', status: 'fechado', fixado: true })])));
    const linha = (await screen.findByRole('link', { name: 'Tópico 1' })).closest('li')!;
    expect(linha.textContent).toContain('Fechado');
    expect(linha.textContent).not.toContain('Fixado');
  });

  it('vazio de verdade: "Nada rolando por aí ainda." com botão para as comunidades', async () => {
    abrir(vi.fn(async () => pagina([])));
    expect(await screen.findByText('Nada rolando por aí ainda.')).toBeDefined();
    expect(screen.getByText('Entra numa comunidade e abre o primeiro tópico.')).toBeDefined();
    expect(screen.getAllByRole('link', { name: 'Ver comunidades' }).length).toBe(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('erro NUNCA vira vazio; Tentar de novo refaz a chamada', async () => {
    const explorar = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce(pagina([itemDoExplorar({ id: '1' })]));
    abrir(explorar);
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Deu ruim pra carregar os tópicos.');
    expect(screen.queryByText('Nada rolando por aí ainda.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: 'Tópico 1' })).toBeDefined();
  });

  it('sem internet o erro diz "Sem internet."', async () => {
    abrir(vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })), '/explorar', { ambiente: ambienteFalso({ online: false }) });
    expect((await screen.findByRole('alert')).textContent).toContain('Sem internet.');
  });

  it('?ordem=novos vai como recentes, a troca atualiza a URL e recarrega do começo', async () => {
    const explorar = vi.fn(async (op?: { ordem?: string }) => pagina([itemDoExplorar({ id: op?.ordem === 'recentes' ? 'novo' : 'ativo' })]));
    abrir(explorar as PortaDeForum['explorarTopicos'], '/explorar?ordem=novos');
    await screen.findByRole('link', { name: 'Tópico novo' });
    expect(explorar).toHaveBeenCalledWith(expect.objectContaining({ ordem: 'recentes', limite: 30, cursor: null }));
    fireEvent.click(screen.getByRole('button', { name: 'Atividade recente' }));
    await screen.findByRole('link', { name: 'Tópico ativo' });
    expect(sondas.caminho).toBe('/explorar');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Atividade recente' }).getAttribute('aria-pressed')).toBe('true'));
  });

  it('"Ver mais tópicos" devolve o cursor como veio e não duplica', async () => {
    const CURSOR: CursorDoForum = { valor: '2026-10-19T14:32:10.123456+00:00', id: '2' };
    const explorar = vi
      .fn()
      .mockResolvedValueOnce(pagina([itemDoExplorar({ id: '1' }), itemDoExplorar({ id: '2' })], CURSOR))
      .mockResolvedValueOnce(pagina([itemDoExplorar({ id: '2' }), itemDoExplorar({ id: '3' })], null));
    abrir(explorar);
    await screen.findByRole('link', { name: 'Tópico 2' });
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais tópicos' }));
    await screen.findByRole('link', { name: 'Tópico 3' });
    expect(explorar.mock.calls[1][0].cursor).toBe(CURSOR);
    expect(screen.getAllByRole('link', { name: /^Tópico \d$/ })).toHaveLength(3);
  });
});

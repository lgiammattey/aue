// @vitest-environment jsdom
/** Regressões do contrato de Explorar; a rota vive na casca OpenDesign. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { CursorDoForum, PortaDeForum, TopicoDoExplorar } from '../../portas/forum';
import { ambienteFalso, contaFalsa, forumFalso, itemDoExplorar } from './dublesParaTeste';
import { TelaExplorarOpenDesign } from '../novo-aue/TelaExplorarOpenDesign';

afterEach(cleanup);
const pagina = (itens: TopicoDoExplorar[], proximo: CursorDoForum | null = null) => ({ ok: true as const, valor: { itens, proximo } });

function abrir(explorar: PortaDeForum['explorarTopicos'], entrada = '/explorar', ambiente = ambienteFalso()) {
  const forum = forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })), explorarTopicos: explorar });
  render(<MemoryRouter initialEntries={[entrada]}><Routes><Route path="/explorar" element={<TelaExplorarOpenDesign portaForum={forum} portaConta={contaFalsa({ temSessao: false })} ambiente={ambiente} />} /></Routes></MemoryRouter>);
  return forum;
}

describe('Explorar na casca OpenDesign', () => {
  it('mantém tópico e comunidade em links distintos', async () => {
    abrir(vi.fn(async () => pagina([itemDoExplorar({ id: '1', respostasTotal: 8 })])));
    const titulo = await screen.findByRole('link', { name: 'Tópico 1' });
    expect(titulo.getAttribute('href')).toBe('/c/cerveja-gelada/t/1');
    expect(within(titulo.closest('li')!).getByRole('link', { name: 'Cerveja Gelada' }).getAttribute('href')).toBe('/c/cerveja-gelada');
  });

  it('usa a casca da Tropa sem ressuscitar a shell legada', async () => {
    abrir(vi.fn(async () => pagina([itemDoExplorar({ id: '1' })])));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(document.querySelector('.app')).toBeTruthy();
    expect(document.querySelector('.forum-shell')).toBeNull();
    expect(screen.getByRole('button', { name: 'Feed' })).toBeTruthy();
  });

  it('tem busca real e não oferece escrita de tópico ou resposta', async () => {
    abrir(vi.fn(async () => pagina([itemDoExplorar({ id: '1' })])));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(screen.getByLabelText('Buscar pessoas, rodas e publicações')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /novo tópico|postar|participar|responder/i })).toBeNull();
  });

  it('vazio, erro e offline não se confundem', async () => {
    const { unmount } = render(<MemoryRouter><TelaExplorarOpenDesign portaForum={forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })), explorarTopicos: vi.fn(async () => pagina([])) })} portaConta={contaFalsa({ temSessao: false })} ambiente={ambienteFalso()} /></MemoryRouter>);
    expect(await screen.findByText('Nada rolando por aí ainda.')).toBeTruthy();
    unmount();
    abrir(vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })), '/explorar', ambienteFalso({ online: false }));
    expect((await screen.findByRole('alert')).textContent).toContain('Sem internet.');
  });

  it('ordem e cursor continuam sendo entregues ao contrato', async () => {
    const cursor: CursorDoForum = { valor: '2026-10-19T14:32:10.123456+00:00', id: '2' };
    const explorar = vi.fn().mockResolvedValueOnce(pagina([itemDoExplorar({ id: '1' })], cursor)).mockResolvedValueOnce(pagina([itemDoExplorar({ id: '2' })]));
    abrir(explorar, '/explorar?ordem=novos');
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(explorar).toHaveBeenCalledWith(expect.objectContaining({ ordem: 'recentes', cursor: null }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais tópicos' }));
    await screen.findByRole('link', { name: 'Tópico 2' });
    expect(explorar.mock.calls[1][0].cursor).toBe(cursor);
  });

  it('falha ao paginar preserva os tópicos que já chegaram', async () => {
    const cursor: CursorDoForum = { valor: '2026-10-19T14:32:10.123456+00:00', id: '1' };
    const explorar = vi.fn().mockResolvedValueOnce(pagina([itemDoExplorar({ id: '1' })], cursor)).mockResolvedValueOnce({ ok: false, motivo: 'falhou' });
    abrir(explorar);
    await screen.findByRole('link', { name: 'Tópico 1' });
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais tópicos' }));
    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Tópico 1' })).toBeTruthy();
  });
});

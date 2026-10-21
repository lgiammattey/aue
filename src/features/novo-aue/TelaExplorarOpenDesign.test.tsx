// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { CursorDoForum, PortaDeForum, TopicoDoExplorar } from '../../portas/forum';
import { contaFalsa, forumFalso, itemDoExplorar } from '../forum/dublesParaTeste';
import { TelaExplorarOpenDesign } from './TelaExplorarOpenDesign';

afterEach(cleanup);

const pagina = (itens: TopicoDoExplorar[], proximo: CursorDoForum | null = null) => ({ ok: true as const, valor: { itens, proximo } });
const perfil = {
  id: 'p1', handle: 'ana', apelido: 'Ana', fundador: false, daCasa: false, criadoEm: '2026-10-20T00:00:00Z', totalCausos: 0, totalSeguidores: 0, totalSeguindo: 0, euSigo: false, souEu: true,
};

function abrir(forum: PortaDeForum, entrada = '/explorar') {
  return render(<MemoryRouter initialEntries={[entrada]}><Routes><Route path="/explorar" element={<TelaExplorarOpenDesign portaForum={forum} portaConta={contaFalsa({ temSessao: false })} portaPerfil={{ obterMeuPerfil: vi.fn(async () => perfil) } as never} />} /></Routes></MemoryRouter>);
}

describe('TelaExplorarOpenDesign', () => {
  it('usa a casca da Tropa, sem a casca legada do fórum, e separa os links do tópico e da roda', async () => {
    const forum = forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })), explorarTopicos: vi.fn(async () => pagina([itemDoExplorar({ id: '1' })])) });
    abrir(forum);
    const topico = await screen.findByRole('link', { name: 'Tópico 1' });
    expect(screen.getByTestId('explorar-opendesign').classList.contains('app')).toBe(true);
    expect(document.querySelector('.forum-shell')).toBeNull();
    expect(topico.getAttribute('href')).toBe('/c/cerveja-gelada/t/1');
    expect(within(topico.closest('li')!).getByRole('link', { name: 'Cerveja Gelada' }).getAttribute('href')).toBe('/c/cerveja-gelada');
  });

  it('mantém busca e tipo na URL e usa a porta do servidor', async () => {
    const buscar = vi.fn(async () => ({ ok: true as const, valor: { itens: [{ tipo: 'pessoa' as const, id: 'p', comunidadeSlug: null, comunidadeNome: null, titulo: null, handle: 'tiago', apelido: 'Tiago', avatarUrl: null, criadoEm: null }], proximo: null } }));
    const forum = forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })), explorarTopicos: vi.fn(async () => pagina([])), buscarNoAue: buscar });
    abrir(forum);
    fireEvent.change(screen.getByLabelText('Buscar pessoas, rodas e publicações'), { target: { value: 'tiago' } });
    fireEvent.click(within(screen.getByLabelText('Buscar pessoas, rodas e publicações').closest('form')!).getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('link', { name: /Tiago/ })).toBeTruthy();
    expect(buscar).toHaveBeenCalledWith({ termo: 'tiago', tipo: 'pessoas' });
    fireEvent.click(screen.getByRole('tab', { name: 'Publicações' }));
    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith({ termo: 'tiago', tipo: 'topicos' }));
  });

  it('troca ordem pela URL e pagina sem repetir o cursor', async () => {
    const cursor: CursorDoForum = { valor: '2026-10-21T00:00:00Z', id: '2' };
    const explorar = vi.fn()
      .mockResolvedValueOnce(pagina([itemDoExplorar({ id: '1' }), itemDoExplorar({ id: '2' })], cursor))
      .mockResolvedValueOnce(pagina([itemDoExplorar({ id: '2' }), itemDoExplorar({ id: '3' })], null));
    const forum = forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })), explorarTopicos: explorar });
    abrir(forum);
    await screen.findByRole('link', { name: 'Tópico 2' });
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais tópicos' }));
    await screen.findByRole('link', { name: 'Tópico 3' });
    expect(explorar.mock.calls[1][0].cursor).toBe(cursor);
    expect(screen.getAllByRole('link', { name: /^Tópico \d$/ })).toHaveLength(3);
  });

  it('troca de mais novos para atividade recente na própria URL e refaz a leitura', async () => {
    const explorar = vi.fn(async (opcoes?: { ordem?: string }) => pagina([itemDoExplorar({ id: opcoes?.ordem === 'recentes' ? 'novo' : 'ativo' })]));
    const forum = forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })), explorarTopicos: explorar });
    abrir(forum, '/explorar?ordem=novos');
    await screen.findByRole('link', { name: 'Tópico novo' });
    expect(explorar).toHaveBeenCalledWith(expect.objectContaining({ ordem: 'recentes', cursor: null }));
    fireEvent.click(screen.getByRole('button', { name: 'Atividade recente' }));
    await screen.findByRole('link', { name: 'Tópico ativo' });
    expect(explorar).toHaveBeenLastCalledWith(expect.objectContaining({ ordem: 'atividade', cursor: null }));
  });

  it('não confunde vazio com falha de leitura', async () => {
    const vazio = forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })), explorarTopicos: vi.fn(async () => pagina([])) });
    const { unmount } = abrir(vazio);
    expect(await screen.findByText('Nada rolando por aí ainda.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    unmount();
    const falha = forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })), explorarTopicos: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })) });
    abrir(falha);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Nada rolando por aí ainda.')).toBeNull();
  });
});

// @vitest-environment jsdom
/** A busca pertence à descoberta OpenDesign, mas conserva o contrato do fórum. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { PaginaDeBusca, PortaDeForum, ResultadoDeBusca } from '../../portas/forum';
import { ambienteFalso, contaFalsa, forumFalso } from './dublesParaTeste';
import { TelaExplorarOpenDesign } from '../novo-aue/TelaExplorarOpenDesign';

afterEach(cleanup);
const pessoa = (handle: string, apelido = 'Ana'): ResultadoDeBusca => ({ tipo: 'pessoa', id: `p-${handle}`, comunidadeSlug: null, comunidadeNome: null, titulo: null, handle, apelido, avatarUrl: null, criadoEm: null });
const topico = (id: string, titulo: string): ResultadoDeBusca => ({ tipo: 'topico', id, comunidadeSlug: 'eu-arroto-e-dai', comunidadeNome: 'Eu arroto, e daí?', titulo, handle: 'giam', apelido: 'Giam', avatarUrl: null, criadoEm: null });
const pagina = (itens: ResultadoDeBusca[], proximo: number | null = null): { ok: true; valor: PaginaDeBusca } => ({ ok: true, valor: { itens, proximo } });

function abrir(buscar: NonNullable<PortaDeForum['buscarNoAue']>, entrada: string) {
  const forum = forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })), explorarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })), buscarNoAue: buscar });
  render(<MemoryRouter initialEntries={[entrada]}><Routes><Route path="/explorar" element={<TelaExplorarOpenDesign portaForum={forum} portaConta={contaFalsa({ temSessao: false })} ambiente={ambienteFalso()} />} /></Routes></MemoryRouter>);
  return forum;
}

describe('busca no Explorar OpenDesign', () => {
  it('pessoa abre o perfil pelo resultado do servidor', async () => {
    const buscar = vi.fn(async () => pagina([pessoa('tiago_aue', 'Tiago')]));
    abrir(buscar, '/explorar?q=tiago');
    expect((await screen.findByRole('link', { name: /Tiago/ })).getAttribute('href')).toBe('/u/tiago_aue');
    expect(buscar).toHaveBeenCalledWith({ termo: 'tiago', tipo: 'pessoas' });
  });
  it('publicação preserva o tópico e a roda de origem', async () => {
    const buscar = vi.fn(async () => pagina([topico('t1', 'Arroto no churrasco')]));
    abrir(buscar, '/explorar?q=churrasco&tipo=topicos');
    expect((await screen.findByRole('link', { name: /Arroto no churrasco/ })).getAttribute('href')).toBe('/c/eu-arroto-e-dai/t/t1');
  });
  it('troca abas pela mesma porta', async () => {
    const buscar = vi.fn(async () => pagina([]));
    abrir(buscar, '/explorar?q=churrasco');
    await screen.findByText(/Nada encontrado/);
    fireEvent.click(screen.getByRole('tab', { name: 'Rodas' }));
    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith({ termo: 'churrasco', tipo: 'comunidades' }));
  });
  it('vazio e erro não se confundem', async () => {
    const buscar = vi.fn().mockResolvedValueOnce({ ok: false, motivo: 'falhou' }).mockResolvedValueOnce(pagina([pessoa('lima')]));
    abrir(buscar, '/explorar?q=lima');
    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: /lima/ })).toBeTruthy();
  });
  it('paginação mantém o primeiro resultado quando a próxima página falha', async () => {
    const buscar = vi.fn().mockResolvedValueOnce(pagina([pessoa('a_aue')], 20)).mockResolvedValueOnce({ ok: false, motivo: 'falhou' });
    abrir(buscar, '/explorar?q=aue');
    await screen.findByRole('link', { name: /a_aue/ });
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais' }));
    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /a_aue/ })).toBeTruthy();
  });
  it('termo curto não chama o servidor', async () => {
    const buscar = vi.fn(async () => pagina([]));
    abrir(buscar, '/explorar?q=a');
    expect(await screen.findByText(/pelo menos 2 letras/)).toBeTruthy();
    expect(buscar).not.toHaveBeenCalled();
  });
  it('caracteres especiais chegam intactos ao servidor e o destino é codificado', async () => {
    const buscar = vi.fn(async () => pagina([pessoa('a.b')]));
    abrir(buscar, `/explorar?q=${encodeURIComponent('100% _x\\')}`);
    expect((await screen.findByRole('link', { name: /a\.b/ })).getAttribute('href')).toBe('/u/a.b');
    expect(buscar).toHaveBeenCalledWith({ termo: '100% _x\\', tipo: 'pessoas' });
  });
  it('formulário envia a busca pela URL', async () => {
    const buscar = vi.fn(async () => pagina([pessoa('giam')]));
    abrir(buscar, '/explorar');
    const campo = screen.getByLabelText('Buscar pessoas, rodas e publicações');
    fireEvent.change(campo, { target: { value: 'giam' } });
    fireEvent.click(within(campo.closest('form')!).getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('link', { name: /giam/ })).toBeTruthy();
  });
});

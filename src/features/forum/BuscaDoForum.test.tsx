// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PaginaDeBusca, PortaDeForum, ResultadoDeBusca } from '../../portas/forum';
import { limparListasVistas } from './hooks';
import { Rotas, forumFalso } from './dublesParaTeste';

beforeEach(limparListasVistas);
afterEach(cleanup);

const pessoa = (handle: string, apelido = 'Ana'): ResultadoDeBusca => ({
  tipo: 'pessoa', id: `p-${handle}`, comunidadeSlug: null, comunidadeNome: null, titulo: null,
  handle, apelido, avatarUrl: null, criadoEm: null,
});
const topico = (id: string, titulo: string): ResultadoDeBusca => ({
  tipo: 'topico', id, comunidadeSlug: 'eu-arroto-e-dai', comunidadeNome: 'Eu arroto, e daí?', titulo,
  handle: 'giam', apelido: 'Giam', avatarUrl: null, criadoEm: '2026-10-19T12:00:00Z',
});
const pagina = (itens: ResultadoDeBusca[], proximo: number | null = null): { ok: true; valor: PaginaDeBusca } =>
  ({ ok: true, valor: { itens, proximo } });

function abrir(buscar: NonNullable<PortaDeForum['buscarNoAue']>, entrada: string) {
  const forum = forumFalso({
    explorarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })),
    buscarNoAue: buscar,
  });
  render(<Rotas entrada={entrada} m={{ forum }} />);
  return forum;
}

describe('busca no Explorar', () => {
  it('pessoa: busca por nome/@ e leva ao perfil', async () => {
    const buscar = vi.fn(async () => pagina([pessoa('tiago_aue', 'Tiago')]));
    abrir(buscar, '/explorar?q=tiago');
    const link = await screen.findByRole('link', { name: /Tiago/ });
    expect(link.getAttribute('href')).toBe('/u/tiago_aue');
    expect(buscar).toHaveBeenCalledWith({ termo: 'tiago', tipo: 'pessoas' });
  });

  it('abas separam Pessoas, Rodas e Publicações; publicação abre o tópico certo na comunidade de origem', async () => {
    const buscar = vi.fn(async (o) => (o.tipo === 'topicos' ? pagina([topico('t1', 'Arroto no churrasco')]) : pagina([])));
    abrir(buscar, '/explorar?q=churrasco&tipo=topicos');
    const link = await screen.findByRole('link', { name: /Arroto no churrasco/ });
    expect(link.getAttribute('href')).toBe('/c/eu-arroto-e-dai/t/t1');
    expect(link.textContent).toContain('Eu arroto, e daí?');
    fireEvent.click(screen.getByRole('tab', { name: 'Rodas' }));
    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith({ termo: 'churrasco', tipo: 'comunidades' }));
  });

  it('vazio de verdade diz o termo e não parece erro', async () => {
    abrir(vi.fn(async () => pagina([])), '/explorar?q=zzzz');
    expect(await screen.findByText(/Nada encontrado para “zzzz”/)).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('falha do servidor NÃO vira vazio e Tentar de novo refaz a busca', async () => {
    const buscar = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce(pagina([pessoa('lima')]));
    abrir(buscar, '/explorar?q=lima');
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.queryByText(/Nada encontrado/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: /lima/ })).toBeDefined();
  });

  it('paginação: Ver mais manda o deslocamento e acrescenta sem repetir', async () => {
    const buscar = vi
      .fn()
      .mockResolvedValueOnce(pagina([pessoa('a_aue')], 20))
      .mockResolvedValueOnce(pagina([pessoa('b_aue')], null));
    abrir(buscar, '/explorar?q=aue');
    await screen.findByRole('link', { name: /a_aue/ });
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais' }));
    await screen.findByRole('link', { name: /b_aue/ });
    expect(buscar).toHaveBeenLastCalledWith({ termo: 'aue', tipo: 'pessoas', deslocamento: 20 });
    expect(screen.getAllByRole('link', { name: /a_aue/ })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Ver mais' })).toBeNull();
  });

  it('caracteres especiais vão ao servidor intactos e links são codificados', async () => {
    const buscar = vi.fn(async () => pagina([pessoa('a.b')]));
    abrir(buscar, `/explorar?q=${encodeURIComponent('100% _x\\')}`);
    await screen.findByRole('link', { name: /a\.b/ });
    expect(buscar).toHaveBeenCalledWith({ termo: '100% _x\\', tipo: 'pessoas' });
  });

  it('termo com 1 letra não chama o servidor e explica', async () => {
    const buscar = vi.fn(async () => pagina([]));
    abrir(buscar, '/explorar?q=a');
    expect(await screen.findByText(/pelo menos 2 letras/)).toBeDefined();
    expect(buscar).not.toHaveBeenCalled();
  });

  it('o termo fica na URL: enviar o formulário grava ?q= para o voltar do navegador', async () => {
    const buscar = vi.fn(async () => pagina([pessoa('giam')]));
    abrir(buscar, '/explorar');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'giam' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('link', { name: /giam/ })).toBeDefined();
    expect(buscar).toHaveBeenCalledWith({ termo: 'giam', tipo: 'pessoas' });
  });
});

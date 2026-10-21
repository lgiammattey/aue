// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ItemSalvo, PortaDeForum } from '../../portas/forum';
import { SalvosDoPerfil } from './SalvosDoPerfil';

afterEach(cleanup);

const item = (n: number, tipo: 'topico' | 'causo' = 'topico'): ItemSalvo => ({
  tipo, id: `id-${n}`, titulo: `Post ${n}`, comunidadeSlug: 'eu-arroto-e-dai', comunidadeNome: 'Eu arroto, e daí?',
  autorHandle: 'ana', autorApelido: 'Ana', criadoEm: '2026-10-20T10:00:00Z',
});

const abrir = (forum: Partial<PortaDeForum>) =>
  render(<MemoryRouter><SalvosDoPerfil forum={forum as PortaDeForum} /></MemoryRouter>);

describe('Salvos do perfil', () => {
  it('lista o que o servidor devolveu e abre o post certo', async () => {
    abrir({ listarMeusSalvos: vi.fn(async () => ({ ok: true as const, valor: { itens: [item(1), item(2, 'causo')], proximo: null } })) });
    expect((await screen.findByRole('link', { name: /Post 1/ })).getAttribute('href')).toBe('/c/eu-arroto-e-dai/t/id-1');
    expect(screen.getByRole('link', { name: /Post 2/ }).getAttribute('href')).toBe('/historia/id-2');
  });

  it('vazio de verdade não parece erro', async () => {
    abrir({ listarMeusSalvos: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })) });
    expect(await screen.findByText('Nenhum post salvo ainda.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('falha NÃO vira vazio e Tentar de novo refaz a leitura', async () => {
    const listar = vi.fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce({ ok: true, valor: { itens: [item(1)], proximo: null } });
    abrir({ listarMeusSalvos: listar });
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Nenhum post salvo ainda.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: /Post 1/ })).toBeTruthy();
  });

  it('Ver mais acrescenta a próxima página sem repetir', async () => {
    const listar = vi.fn()
      .mockResolvedValueOnce({ ok: true, valor: { itens: [item(1)], proximo: 20 } })
      .mockResolvedValueOnce({ ok: true, valor: { itens: [item(2)], proximo: null } });
    abrir({ listarMeusSalvos: listar });
    await screen.findByRole('link', { name: /Post 1/ });
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais' }));
    await screen.findByRole('link', { name: /Post 2/ });
    expect(listar).toHaveBeenLastCalledWith({ deslocamento: 20 });
    expect(screen.getAllByRole('link', { name: /Post 1/ })).toHaveLength(1);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ver mais' })).toBeNull());
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeForum } from '../../portas/forum';
import { VersaoMobileOpenDesign } from './VersaoMobileOpenDesign';

describe('VersaoMobileOpenDesign (1:1 com mobile.html)', () => {
  afterEach(() => {
    cleanup();
  });

  const mockForum: PortaDeForum = {
    listarComunidadesDoForum: vi.fn(async () => ({
      ok: true,
      valor: [
        { id: '1', slug: 'arena', nome: 'Arena do Arroto', criadoEm: '2026-01-01' },
      ],
    })),
    obterComunidadeDoForum: vi.fn(),
    listarTopicos: vi.fn(),
    obterTopico: vi.fn(),
    listarRespostasDoTopico: vi.fn(),
    explorarTopicos: vi.fn(async () => ({
      ok: true,
      valor: { itens: [], cursorProximo: null },
    })),
    listarTopicosDoAutor: vi.fn(),
    criarTopico: vi.fn(async (pedido) => ({
      ok: true,
      valor: {
        id: 'topico-mob-1',
        comunidade: { slug: pedido.comunidadeSlug },
        titulo: pedido.titulo,
        criadoEm: new Date().toISOString(),
      },
    })),
    responderTopico: vi.fn(),
    editarTopico: vi.fn(),
    editarResposta: vi.fn(),
    apagarTopico: vi.fn(),
    apagarResposta: vi.fn(),
    denunciarTopico: vi.fn(),
    denunciarResposta: vi.fn(),
  };

  const mockComunidade: PortaDeComunidade = {
    listarComunidades: vi.fn(async () => []),
    listarFeed: vi.fn(async () => [
      {
        id: 'causo-1',
        comunidadeId: '1',
        comunidadeSlug: 'arena',
        autorNome: 'Lili',
        conteudo: 'Arrotei no meio da aula online',
        criadoEm: '2026-10-19',
        nota: 88,
      },
    ]),
    obterCauso: vi.fn(),
    postarCauso: vi.fn(),
    alternarReacao: vi.fn(),
    entrarComunidade: vi.fn(async () => ({ ok: true })),
    sairComunidade: vi.fn(async () => ({ ok: true })),
    listarMinhasComunidades: vi.fn(async () => []),
    listarComunidadesSugeridas: vi.fn(async () => []),
  };

  it('renderiza os elementos da tela móvel e a bottom nav', async () => {
    render(
      <MemoryRouter>
        <VersaoMobileOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/O que arrotaram hoje\?/)).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Rodas/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Soltar/ })).toBeTruthy();
  });

  it('permite alternar abas da barra inferior', async () => {
    render(
      <MemoryRouter>
        <VersaoMobileOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
        />
      </MemoryRouter>,
    );

    const btnRodas = screen.getByRole('button', { name: /Rodas/ });
    fireEvent.click(btnRodas);

    expect(await screen.findByRole('heading', { level: 1, name: 'Comunidades' })).toBeTruthy();
    expect(await screen.findByText('r/arena')).toBeTruthy();
  });

  it('abre o bottom sheet ao clicar em Soltar', async () => {
    render(
      <MemoryRouter>
        <VersaoMobileOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
        />
      </MemoryRouter>,
    );

    const btnSoltar = screen.getByRole('button', { name: /Soltar/ });
    fireEvent.click(btnSoltar);

    expect(screen.getByRole('heading', { level: 2, name: 'Soltar um arroto' })).toBeTruthy();
    expect(screen.getByLabelText('Título')).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
      ok: true as const,
      valor: [
        {
          id: '1',
          slug: 'arena',
          nome: 'Arena do Arroto',
          descricao: 'Roda móvel',
          icone: null,
          membrosTotal: 10,
          topicosTotal: 1,
          ultimaAtividadeEm: '2026-01-01',
          souMembro: false,
        },
      ],
    })),
    obterComunidadeDoForum: vi.fn(),
    listarTopicos: vi.fn(),
    obterTopico: vi.fn(),
    listarRespostasDoTopico: vi.fn(),
    explorarTopicos: vi.fn(async () => ({
      ok: true as const,
      valor: { itens: [], proximo: null },
    })),
    listarTopicosDoAutor: vi.fn(),
    listarRespostasDoAutor: vi.fn(),
    criarTopico: vi.fn(async (pedido) => ({
      ok: true as const,
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
        curtidas: 0,
        totalComentarios: 0,
        reposts: 0,
        reacoes: { fogo: 0, riso: 0, choque: 0, trofeu: 0, nojo: 0 } as const,
      },
    ]),
    obterCauso: vi.fn(),
    postarCauso: vi.fn(),
    alternarReacao: vi.fn(),
    alternarCurtida: vi.fn(),
    alternarRepost: vi.fn(),
    listarRespostas: vi.fn(async () => []),
    adicionarResposta: vi.fn(),
    apagarCauso: vi.fn(),
    denunciarCauso: vi.fn(),
    entrarComunidade: vi.fn(async () => true),
    sairComunidade: vi.fn(async () => true),
    listarMinhasComunidades: vi.fn(async () => []),
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
    expect(screen.getByLabelText('Voltar para a versão web do Auê').textContent?.trim()).toBe('AUÊ!');
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

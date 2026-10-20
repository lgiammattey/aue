// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeForum } from '../../portas/forum';
import { TelaComunidadeOpenDesign } from './TelaComunidadeOpenDesign';
import { TelaDiretorioOpenDesign } from './TelaDiretorioOpenDesign';

describe('Telas de Comunidade Open Design (1:1 com protótipo)', () => {
  afterEach(() => {
    cleanup();
  });

  const mockForum: PortaDeForum = {
    listarComunidadesDoForum: vi.fn(async () => ({
      ok: true as const,
      valor: [
        {
          id: 'comm-1',
          slug: 'arena-do-arroto',
          nome: 'Arena do Arroto',
          descricao: 'O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.',
          icone: null,
          membrosTotal: 42800,
          topicosTotal: 120,
          ultimaAtividadeEm: '2026-10-19T10:00:00Z',
          souMembro: false,
        },
        {
          id: 'comm-2',
          slug: 'arroto-em-video',
          nome: 'Arroto em Vídeo',
          descricao: 'Vídeos, duelos e momentos que pediam uma câmera ligada.',
          icone: null,
          membrosTotal: 18200,
          topicosTotal: 45,
          ultimaAtividadeEm: '2026-10-19T10:00:00Z',
          souMembro: true,
        },
      ],
    })),
    obterComunidadeDoForum: vi.fn(async (slug: string) => ({
      ok: true as const,
      valor: {
        id: `comm-${slug}`,
        slug,
        nome: slug === 'arena-do-arroto' ? 'Arena do Arroto' : slug,
        descricao: 'O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.',
        icone: null,
        membrosTotal: 42800,
        topicosTotal: 120,
        ultimaAtividadeEm: '2026-10-19T10:00:00Z',
        souMembro: false,
      },
    })),
    listarTopicos: vi.fn(async (slug: string) => ({
      ok: true as const,
      valor: {
        itens: [
          {
            id: 'top-1',
            comunidade: { id: 'comm-1', slug, nome: 'Arena do Arroto' },
            autor: { id: 'usr-1', apelido: 'Fernando F', handle: 'fernando_f', avatarUrl: null },
            titulo: 'O áudio mais curto da semana conseguiu ser o mais comentado.',
            corpo: 'Acabei de ouvir e não acreditei no tempo que durou.',
            status: 'aberto' as const,
            fixado: false,
            criadoEm: '2026-10-19T12:00:00Z',
            editadoEm: null,
            ultimaAtividadeEm: '2026-10-19T12:00:00Z',
            respostasTotal: 28,
            souAutor: false,
            audio: null,
          },
        ],
        proximo: null,
      },
    })),
    obterTopico: vi.fn(),
    listarRespostasDoTopico: vi.fn(),
    explorarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })),
    listarTopicosDoAutor: vi.fn(),
    listarRespostasDoAutor: vi.fn(),
    criarTopico: vi.fn(),
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
    listarFeed: vi.fn(async () => []),
    obterCauso: vi.fn(),
    postarCauso: vi.fn(),
    alternarReacao: vi.fn(),
    alternarCurtida: vi.fn(),
    alternarRepost: vi.fn(),
    listarRespostas: vi.fn(),
    adicionarResposta: vi.fn(),
    apagarCauso: vi.fn(),
    entrarComunidade: vi.fn(async () => true),
    sairComunidade: vi.fn(async () => true),
    listarMinhasComunidades: vi.fn(async () => []),
    denunciarCauso: vi.fn(),
  };

  it('renderiza os elementos 1:1 da tela de comunidade (hero, title, cover, info, membros e admin button)', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/c/arena-do-arroto']}>
        <Routes>
          <Route
            path="/c/:slug"
            element={
              <TelaComunidadeOpenDesign
                portaForum={mockForum}
                portaComunidade={mockComunidade}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Hero e título r/arena-do-arroto
    expect(await screen.findByRole('heading', { level: 1, name: 'r/arena-do-arroto' })).toBeTruthy();
    expect(screen.getAllByText('O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.').length).toBeGreaterThan(0);

    // Botão de Entrar
    const btnEntrar = container.querySelector('#joinCommunity');
    expect(btnEntrar).toBeTruthy();
    expect(btnEntrar?.textContent).toBe('Entrar');

    // Botão Administrar comunidade
    const btnAdmin = container.querySelector('#manageCommunity');
    expect(btnAdmin).toBeTruthy();

    // Colunas da comunidade: Feed, Moderadores e Regras rápidas
    expect(screen.getByText('Feed da comunidade')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Moderadores' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2, name: 'Regras rápidas' }).length).toBeGreaterThan(0);

    // Card fixado
    expect(screen.getByText('Antes de soltar: leia as regras da comunidade.')).toBeTruthy();

    // Tópico real carregado
    expect(await screen.findByText('O áudio mais curto da semana conseguiu ser o mais comentado.')).toBeTruthy();
  });

  it('permite alternar entre Entrar e Entrou chamando a porta com feedback na tela', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/c/arena-do-arroto']}>
        <Routes>
          <Route
            path="/c/:slug"
            element={
              <TelaComunidadeOpenDesign
                portaForum={mockForum}
                portaComunidade={mockComunidade}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { level: 1, name: 'r/arena-do-arroto' });
    const btnEntrar = container.querySelector('#joinCommunity') as HTMLButtonElement;
    expect(btnEntrar).toBeTruthy();
    fireEvent.click(btnEntrar);

    // Vira "Entrou" e exibe o toast de feedback
    expect(btnEntrar.textContent).toBe('Entrou');
    expect(screen.getByText('Você entrou na comunidade.')).toBeTruthy();
  });

  it('abre o modal Administrar comunidade e salva novas regras e moderadores', async () => {
    render(
      <MemoryRouter initialEntries={['/c/arena-do-arroto']}>
        <Routes>
          <Route
            path="/c/:slug"
            element={
              <TelaComunidadeOpenDesign
                portaForum={mockForum}
                portaComunidade={mockComunidade}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const btnAdmin = await screen.findByRole('button', { name: 'Administrar comunidade' });
    fireEvent.click(btnAdmin);

    // Modal aberto 1:1
    expect(screen.getByRole('heading', { level: 2, name: 'Administrar comunidade' })).toBeTruthy();
    expect(screen.getByLabelText('Regras da comunidade')).toBeTruthy();
    expect(screen.getByLabelText('Moderadores')).toBeTruthy();

    // Altera regras e salva
    const textareaRegras = screen.getByLabelText('Regras da comunidade');
    fireEvent.change(textareaRegras, { target: { value: 'Nova regra 1 da roda\nNova regra 2 da roda' } });

    const btnSalvar = screen.getByRole('button', { name: 'Salvar gestão' });
    fireEvent.click(btnSalvar);

    // Verifica que atualizou na tela e deu feedback
    expect(await screen.findByText('Gestão da comunidade salva.')).toBeTruthy();
    expect(screen.getByText('Nova regra 1 da roda')).toBeTruthy();
    expect(screen.getByText('Nova regra 2 da roda')).toBeTruthy();
  });

  it('renderiza o diretório de comunidades 1:1 com todas as rodas', async () => {
    render(
      <MemoryRouter initialEntries={['/comunidades']}>
        <Routes>
          <Route
            path="/comunidades"
            element={
              <TelaDiretorioOpenDesign
                portaForum={mockForum}
                portaComunidade={mockComunidade}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Comunidades' })).toBeTruthy();
    expect(screen.getByText('Rodas do Auê')).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ Fundar comunidade' })).toBeTruthy();
    expect(screen.getAllByText('r/arena-do-arroto').length).toBeGreaterThan(0);
    expect(screen.getAllByText('r/arroto-em-video').length).toBeGreaterThan(0);
  });
});

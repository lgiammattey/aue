// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PainelDireito } from './PainelDireito';
import { VersaoMobileOpenDesign } from './VersaoMobileOpenDesign';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeForum } from '../../portas/forum';

describe('Adsterra no OpenDesign — placements ficam desligados até publicação explícita', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.querySelectorAll('script[data-aue-adsterra]').forEach((el) => el.remove());
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('não exibe Smartlink externo sem a flag de publicação', () => {
    render(
      <MemoryRouter>
        <PainelDireito
          comunidades={[]}
          aoAbrirComunidade={() => {}}
          viewAtual="feed"
        />
      </MemoryRouter>
    );

    expect(screen.queryByText('Combustível Oficial 🍺')).toBeNull();
  });

  it('não injeta Social Bar no webapp mobile', async () => {
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
          reacoes: { fogo: 0, riso: 0, choque: 0, trofeu: 0, nojo: 0 },
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

    const mockForum: PortaDeForum = {
      listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })),
      obterComunidadeDoForum: vi.fn(),
      listarTopicos: vi.fn(),
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

    render(
      <MemoryRouter>
        <VersaoMobileOpenDesign
          portaComunidade={mockComunidade}
          portaForum={mockForum}
        />
      </MemoryRouter>
    );

    expect(document.querySelector('script[data-aue-adsterra="socialbar"]')).toBeNull();
    vi.advanceTimersByTime(3600);
    expect(document.querySelector('script[data-aue-adsterra="socialbar"]')).toBeNull();
    expect(screen.queryByText('Parceiro Oficial')).toBeNull();
    expect(screen.queryByText('Combustível pro Bonde 🍺')).toBeNull();
  });
});

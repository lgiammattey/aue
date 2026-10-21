// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
          possoGerirMidia: true,
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
        possoGerirMidia: true,
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
    obterTopico: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })),
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
                portaConta={{ estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: false })) } as any}
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
    const contaAutenticada = {
      estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: false })),
    } as any;
    const { container } = render(
      <MemoryRouter initialEntries={['/c/arena-do-arroto']}>
        <Routes>
          <Route
            path="/c/:slug"
            element={
              <TelaComunidadeOpenDesign
                portaForum={mockForum}
                portaComunidade={mockComunidade}
                portaConta={contaAutenticada}
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

    // Só confirma a entrada depois da porta responder.
    await waitFor(() => expect(btnEntrar.textContent).toBe('Entrou'));
    expect(screen.getByText('Você entrou na comunidade.')).toBeTruthy();
  });

  const forumComDetalhes = (extra: Partial<PortaDeForum> = {}): PortaDeForum => ({
    ...mockForum,
    obterDetalhesDaComunidade: vi.fn(async () => ({
      ok: true as const,
      valor: { regras: ['Regra do servidor.'], moderadores: [{ handle: 'giamzinn_aue', apelido: 'giamz' }] },
    })),
    definirRegrasDaComunidade: vi.fn(async () => ({ ok: true as const, valor: true as const })),
    ...extra,
  });

  const renderizarComunidade = (forum: PortaDeForum, slug = 'arena-do-arroto') =>
    render(
      <MemoryRouter initialEntries={[`/c/${slug}`]}>
        <Routes>
          <Route
            path="/c/:slug"
            element={<TelaComunidadeOpenDesign portaForum={forum} portaComunidade={mockComunidade} />}
          />
        </Routes>
      </MemoryRouter>,
    );

  it('Administrar comunidade: salva as regras no servidor e só então mostra na tela', async () => {
    const forum = forumComDetalhes();
    renderizarComunidade(forum);

    fireEvent.click(await screen.findByRole('button', { name: 'Administrar comunidade' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Administrar comunidade' })).toBeTruthy();
    expect(screen.getByText(/u\/giamzinn_aue · moderação/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Regras da comunidade'), { target: { value: 'Nova regra 1 da roda\nNova regra 2 da roda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar regras' }));

    expect(await screen.findByText('Regras salvas.')).toBeTruthy();
    expect(forum.definirRegrasDaComunidade).toHaveBeenCalledWith('arena-do-arroto', ['Nova regra 1 da roda', 'Nova regra 2 da roda']);
    expect(screen.queryByText('Gestão da comunidade salva.')).toBeNull();
  });

  it('Administrar comunidade: se o servidor recusar, mostra o erro e as regras da tela não mudam', async () => {
    const forum = forumComDetalhes({
      definirRegrasDaComunidade: vi.fn(async () => ({ ok: false as const, motivo: 'naoEAutor' as const })),
    });
    renderizarComunidade(forum);

    fireEvent.click(await screen.findByRole('button', { name: 'Administrar comunidade' }));
    fireEvent.change(screen.getByLabelText('Regras da comunidade'), { target: { value: 'Regra que não vale' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar regras' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Só a moderação');
    expect(screen.queryByText('Regras salvas.')).toBeNull();
    expect(screen.queryAllByRole('listitem').map((li) => li.textContent)).not.toContain('Regra que não vale');
  });

  it('comunidade que o servidor não conhece mostra "não encontrada", sem dados inventados', async () => {
    const forum = forumComDetalhes({
      obterComunidadeDoForum: vi.fn(async () => ({ ok: true as const, valor: null })),
    });
    renderizarComunidade(forum, 'bonde-geral');

    expect(await screen.findByText('Comunidade não encontrada.')).toBeTruthy();
    expect(screen.queryByText(/membros/)).toBeNull();
    expect(screen.queryByText('42,8k')).toBeNull();
    expect(screen.queryByRole('button', { name: '+ Soltar arroto na roda' })).toBeNull();
  });

  it('sem regras no servidor, a aba Sobre diz isso em vez de inventar moderadores', async () => {
    const forum = forumComDetalhes({
      obterDetalhesDaComunidade: vi.fn(async () => ({ ok: true as const, valor: { regras: [], moderadores: [] } })),
    });
    renderizarComunidade(forum);

    fireEvent.click(await screen.findByRole('button', { name: 'Sobre' }));
    expect(await screen.findByText('Essa comunidade ainda não tem regras escritas.')).toBeTruthy();
    expect(screen.getByText('Nenhum moderador definido.')).toBeTruthy();
    expect(screen.queryByText(/barulhofausto|ana_tempo/)).toBeNull();
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
    expect(screen.queryByRole('button', { name: /Fundar comunidade/ })).toBeNull();
    expect(screen.getAllByText('r/arena-do-arroto').length).toBeGreaterThan(0);
    expect(screen.getAllByText('r/arroto-em-video').length).toBeGreaterThan(0);
  });

  it('alterna entre as abas Causos e Sobre exibindo regras e moderadores', async () => {
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

    // Inicialmente na aba Causos
    expect(await screen.findByRole('heading', { level: 2, name: 'Feed da comunidade' })).toBeTruthy();

    // Clica na aba Sobre
    const btnSobre = screen.getByRole('button', { name: 'Sobre' });
    fireEvent.click(btnSobre);

    // Verifica que exibiu Regras rápidas e Moderadores
    expect(screen.getAllByRole('heading', { level: 2, name: 'Regras rápidas' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('heading', { level: 2, name: 'Moderadores' }).length).toBeGreaterThanOrEqual(1);

    // Volta para a aba Posts
    const btnPosts = screen.getByRole('button', { name: /Posts|Causos/ });
    fireEvent.click(btnPosts);
    expect(screen.getByRole('heading', { level: 2, name: 'Feed da comunidade' })).toBeTruthy();
  });

  it('exibe erro caso a rota direta de tópico /c/:slug/t/:id não encontre o tópico', async () => {
    render(
      <MemoryRouter initialEntries={['/c/arena-do-arroto/t/inexistente']}>
        <Routes>
          <Route
            path="/c/:slug/t/:id"
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

    expect(await screen.findByText('Deu ruim pra carregar o tópico.')).toBeTruthy();
  });
});

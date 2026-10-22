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

    // Hero e título humano da comunidade
    expect(await screen.findByRole('heading', { level: 1, name: 'Arena do Arroto' })).toBeTruthy();
    expect(screen.getAllByText('O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.').length).toBeGreaterThan(0);

    // Botão de Entrar
    const btnEntrar = container.querySelector('#joinCommunity');
    expect(btnEntrar).toBeTruthy();
    // O mock é de quem modera: o botão diz isso e não deixa sair.
    expect(btnEntrar?.textContent).toBe('Moderador');
    expect((btnEntrar as HTMLButtonElement).disabled).toBe(true);

    // Botão Administrar comunidade
    const btnAdmin = container.querySelector('#manageCommunity');
    expect(btnAdmin).toBeTruthy();

    // Comunidade abre a lista de tópicos e preserva suas regras.
    expect(screen.getByText('Tópicos')).toBeTruthy();

    // Card fixado
    expect(screen.getByText('Antes de criar um tópico: leia as regras da comunidade.')).toBeTruthy();

    // Tópico real carregado
    expect(await screen.findByText('O áudio mais curto da semana conseguiu ser o mais comentado.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Abrir tópico: O áudio mais curto/ })).toBeTruthy();
    expect(screen.queryByRole('toolbar', { name: 'Ações do causo' })).toBeNull();
    expect(mockForum.listarTopicos).toHaveBeenCalledWith('arena-do-arroto', { ordem: 'atividade' });

    fireEvent.click(screen.getByRole('button', { name: 'Recentes' }));
    await waitFor(() => expect(mockForum.listarTopicos).toHaveBeenLastCalledWith('arena-do-arroto', { ordem: 'recentes' }));
  });

  const comoMembroComum = (): PortaDeForum => ({
    ...mockForum,
    obterComunidadeDoForum: vi.fn(async (slug: string) => ({
      ok: true as const,
      valor: {
        id: `comm-${slug}`, slug, nome: 'Arena do Arroto', descricao: 'Descrição', icone: null,
        membrosTotal: 10, topicosTotal: 1, ultimaAtividadeEm: '2026-10-19T10:00:00Z', souMembro: false, possoGerirMidia: false,
      },
    })),
    listarComunidadesDoForum: vi.fn(async () => ({
      ok: true as const,
      valor: [{
        id: 'comm-1', slug: 'arena-do-arroto', nome: 'Arena do Arroto', descricao: 'Descrição', icone: null,
        membrosTotal: 10, topicosTotal: 1, ultimaAtividadeEm: '2026-10-19T10:00:00Z', souMembro: false, possoGerirMidia: false,
      }],
    })),
  });

  const abrirComunidade = (forum: PortaDeForum, comunidade: PortaDeComunidade = mockComunidade) => {
    const contaAutenticada = {
      estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: false })),
    } as any;
    return render(
      <MemoryRouter initialEntries={['/c/arena-do-arroto']}>
        <Routes>
          <Route
            path="/c/:slug"
            element={<TelaComunidadeOpenDesign portaForum={forum} portaComunidade={comunidade} portaConta={contaAutenticada} />}
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('entrar e sair: o botão diz "Participando" (toque para sair), a contagem de membros acompanha e a porta é chamada', async () => {
    const comunidade = { ...mockComunidade, entrarComunidade: vi.fn(async () => true), sairComunidade: vi.fn(async () => true) };
    const { container } = abrirComunidade(comoMembroComum(), comunidade);

    await screen.findByRole('heading', { level: 1, name: 'Arena do Arroto' });
    const botao = container.querySelector('#joinCommunity') as HTMLButtonElement;
    expect(botao.textContent).toBe('Entrar');
    expect(screen.getAllByText(/10 membros|10 na roda/).length).toBeGreaterThan(0);

    fireEvent.click(botao);
    await waitFor(() => expect(botao.textContent).toBe('Participando'));
    expect(comunidade.entrarComunidade).toHaveBeenCalledWith('arena-do-arroto');
    expect(screen.getByText('Você entrou na comunidade.')).toBeTruthy();
    expect(screen.getAllByText(/11 membros|11 na roda/).length).toBeGreaterThan(0);
    expect(botao.getAttribute('aria-label')).toBe('Participando de Arena do Arroto. Tocar para sair.');

    fireEvent.click(botao);
    await waitFor(() => expect(botao.textContent).toBe('Entrar'));
    expect(comunidade.sairComunidade).toHaveBeenCalledWith('arena-do-arroto');
    expect(screen.getByText('Você saiu da comunidade.')).toBeTruthy();
    expect(screen.getAllByText(/10 membros|10 na roda/).length).toBeGreaterThan(0);
  });

  it('se a porta recusar, não muda o botão nem a contagem e avisa', async () => {
    const comunidade = { ...mockComunidade, entrarComunidade: vi.fn(async () => false) };
    const { container } = abrirComunidade(comoMembroComum(), comunidade);
    await screen.findByRole('heading', { level: 1, name: 'Arena do Arroto' });
    const botao = container.querySelector('#joinCommunity') as HTMLButtonElement;
    fireEvent.click(botao);
    expect(await screen.findByText('Não deu para atualizar sua participação agora.')).toBeTruthy();
    expect(botao.textContent).toBe('Entrar');
    expect(screen.getAllByText(/10 membros|10 na roda/).length).toBeGreaterThan(0);
  });

  it('moderador não sai: o botão diz "Moderador", fica desabilitado e a porta nunca é chamada', async () => {
    const comunidade = { ...mockComunidade, sairComunidade: vi.fn(async () => true) };
    const { container } = abrirComunidade(mockForum, comunidade);
    await screen.findByRole('heading', { level: 1, name: 'Arena do Arroto' });
    const botao = container.querySelector('#joinCommunity') as HTMLButtonElement;
    expect(botao.textContent).toBe('Moderador');
    expect(botao.disabled).toBe(true);
    expect(botao.getAttribute('title')).toMatch(/administração do Auê/);
    fireEvent.click(botao);
    expect(comunidade.sairComunidade).not.toHaveBeenCalled();
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

    expect(await screen.findByRole('heading', { level: 1, name: 'Encontre sua comunidade.' })).toBeTruthy();
    expect(screen.getAllByText('Comunidades').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Fundar comunidade/ })).toBeNull();
    expect(screen.getAllByText('Arena do Arroto').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Arroto em Vídeo').length).toBeGreaterThan(0);
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
    expect(await screen.findByRole('heading', { level: 2, name: 'Tópicos' })).toBeTruthy();

    // Clica na aba Sobre
    const btnSobre = screen.getByRole('button', { name: 'Sobre' });
    fireEvent.click(btnSobre);

    // Verifica que exibiu Regras rápidas e Moderadores
    expect(screen.getAllByRole('heading', { level: 2, name: 'Regras rápidas' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('heading', { level: 2, name: 'Moderadores' }).length).toBeGreaterThanOrEqual(1);

    // Volta para a aba Posts
    const btnPosts = screen.getByRole('button', { name: /Posts|Causos/ });
    fireEvent.click(btnPosts);
    expect(screen.getByRole('heading', { level: 2, name: 'Tópicos' })).toBeTruthy();
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

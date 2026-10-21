// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';
import type { PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import { TelaPerfilOpenDesign } from './TelaPerfilOpenDesign';

describe('Tela de Perfil Open Design (1:1 com protótipo)', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPerfilLogado: PerfilPublico = {
    id: 'user-123',
    handle: 'arrotador_3573',
    apelido: 'burpKing',
    avatarUrl: undefined,
    bio: 'Colecionador de causos improváveis.',
    cidade: 'São Paulo, SP',
    fundador: false,
    daCasa: false,
    criadoEm: '2026-10-18T10:00:00Z',
    totalCausos: 3,
    totalSeguidores: 0,
    totalSeguindo: 1,
    euSigo: false,
    souEu: true,
  };

  const mockCausos = [
    {
      id: 'causo-1',
      conteudo: 'Coe galera',
      comunidadeId: 'c-1',
      autorNome: 'burpKing',
      autorHandle: 'arrotador_3573',
      comunidadeSlug: 'eu-arroto-e-dai',
      criadoEm: '2026-10-19T14:00:00Z',
      curtidas: 0,
      totalComentarios: 0,
      reposts: 0,
      reacoes: { fogo: 0, riso: 0, choque: 0, trofeu: 0, nojo: 0 } as const,
      meu: true,
    },
    {
      id: 'causo-2',
      conteudo: 'oi',
      comunidadeId: 'c-1',
      autorNome: 'burpKing',
      autorHandle: 'arrotador_3573',
      comunidadeSlug: 'eu-arroto-e-dai',
      criadoEm: '2026-10-18T12:00:00Z',
      curtidas: 0,
      totalComentarios: 0,
      reposts: 0,
      reacoes: { fogo: 0, riso: 0, choque: 0, trofeu: 0, nojo: 0 } as const,
      meu: true,
    },
    {
      id: 'causo-3',
      conteudo: 'oi na roda geral',
      comunidadeId: 'c-2',
      autorNome: 'burpKing',
      autorHandle: 'arrotador_3573',
      comunidadeSlug: 'bonde-geral',
      criadoEm: '2026-10-18T11:00:00Z',
      curtidas: 0,
      totalComentarios: 0,
      reposts: 0,
      reacoes: { fogo: 0, riso: 0, choque: 0, trofeu: 0, nojo: 0 } as const,
      meu: true,
    },
  ];

  const mockPerfilPort: PortaDePerfil = {
    obterMeuPerfil: vi.fn(async () => mockPerfilLogado),
    obterPerfil: vi.fn(async (handle: string) => {
      if (handle === 'arrotador_3573') return mockPerfilLogado;
      if (handle === 'douglas') {
        return {
          id: 'user-douglas',
          handle: 'douglas',
          apelido: 'Douglas Garcia',
          bio: 'Moderador informal da mesa do canto.',
          cidade: 'São Paulo, SP',
          fundador: true,
          daCasa: false,
          criadoEm: '2024-03-01T00:00:00Z',
          totalCausos: 39,
          totalSeguidores: 86,
          totalSeguindo: 14,
          euSigo: false,
          souEu: false,
        };
      }
      return null;
    }),
    obterMeuPerfilParaEdicao: vi.fn(async () => ({
      apelido: mockPerfilLogado.apelido,
      handle: mockPerfilLogado.handle,
      bio: mockPerfilLogado.bio,
      cidade: mockPerfilLogado.cidade,
    })),
    alternarSeguir: vi.fn(async () => ({ ok: true as const, seguindo: true })),
    concluirMeuPerfilSocial: vi.fn(async (d) => ({
      ok: true as const,
      perfil: { ...mockPerfilLogado, ...d },
    })),
    atualizarMeuPerfil: vi.fn(async (d) => ({
      ok: true as const,
      perfil: { ...mockPerfilLogado, ...d },
    })),
    enviarFoto: vi.fn(async () => ({ ok: true as const, perfil: mockPerfilLogado })),
    removerFoto: vi.fn(async () => ({ ok: true as const, perfil: mockPerfilLogado })),
    enviarCapa: vi.fn(async () => ({ ok: true as const, perfil: mockPerfilLogado })),
    removerCapa: vi.fn(async () => ({ ok: true as const, perfil: mockPerfilLogado })),
    listarConexoes: vi.fn(async () => []),
  };

  const mockContaPort: PortaDeConta = {
    estado: vi.fn(async () => ({
      temSessao: true,
      anonima: false,
      perfilSocialPendente: false,
      podeParticiparSocialmente: true,
    })),
    entrar: vi.fn(async () => ({ ok: true as const })),
    cadastrar: vi.fn(async () => ({ ok: true as const })),
    enviarLinkDeRedefinicao: vi.fn(async () => ({ ok: true as const })),
    redefinirSenha: vi.fn(async () => ({ ok: true as const })),
    sair: vi.fn(async () => true),
  };

  const mockComunidadePort: PortaDeComunidade = {
    listarFeed: vi.fn(async () => mockCausos),
    postarCauso: vi.fn(),
    alternarReacao: vi.fn(),
    alternarCurtida: vi.fn(),
    alternarRepost: vi.fn(),
    listarRespostas: vi.fn(async () => []),
    adicionarResposta: vi.fn(),
    apagarCauso: vi.fn(),
    denunciarCauso: vi.fn(),
    obterCauso: vi.fn(),
    listarComunidades: vi.fn(async () => []),
    entrarComunidade: vi.fn(async () => true),
    sairComunidade: vi.fn(async () => true),
    listarMinhasComunidades: vi.fn(async () => []),
  };

  it('renderiza os elementos 1:1 da tela de perfil com dados reais do Supabase', async () => {
    render(
      <MemoryRouter initialEntries={['/perfil']}>
        <Routes>
          <Route
            path="/perfil"
            element={
              <TelaPerfilOpenDesign
                portaPerfil={mockPerfilPort}
                portaConta={mockContaPort}
                portaComunidade={mockComunidadePort}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Hero com título, handle e bio reais
    expect(await screen.findByRole('heading', { level: 1, name: 'burpKing' })).toBeTruthy();
    expect(document.querySelector('.pf-handle')?.textContent).toBe('@arrotador_3573');
    expect(document.getElementById('profileBio')?.textContent).toBe('Colecionador de causos improváveis.');
    expect(screen.getAllByText(/São Paulo, SP/).length).toBeGreaterThan(0);

    // Botões de ação 1:1
    const acoes = within(document.querySelector('.pf-acts') as HTMLElement);
    expect(acoes.getByRole('button', { name: 'Editar perfil' })).toBeTruthy();
    expect(acoes.getByRole('button', { name: 'Compartilhar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trocar foto do perfil' })).toBeTruthy();
    // A faixa da capa existe no DOM (o CSS a mostra de 700px para cima).
    expect(screen.getByRole('button', { name: 'Trocar capa' })).toBeTruthy();
    // Sem botão de chat e sem bolinha de online.
    expect(screen.queryByRole('button', { name: /chat|mensagem/i })).toBeNull();
    expect(screen.queryByText(/online/i)).toBeNull();
    // "Novo post" só aparece no estado vazio, não no cabeçalho.
    expect(screen.queryByRole('button', { name: /Novo post/ })).toBeNull();

    // Métricas públicas reais, sem karma ou estatística inventada.
    expect(screen.getAllByText(/Posts|Causos/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Seguidores').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Seguindo').length).toBeGreaterThan(0);
    expect(screen.queryByText('karma de arroto')).toBeNull();

    // Atividade com os causos reais do usuário
    expect(await screen.findByText('Coe galera')).toBeTruthy();
    expect(screen.getByText('oi na roda geral')).toBeTruthy();

    expect(screen.getByRole('heading', { level: 2, name: 'Sobre esta ficha' })).toBeTruthy();
  });

  const abrirPerfil = (perfil: PerfilPublico, entrada = '/perfil') =>
    render(
      <MemoryRouter initialEntries={[entrada]}>
        <Routes>
          <Route
            path={entrada}
            element={
              <TelaPerfilOpenDesign
                portaPerfil={{ ...mockPerfilPort, obterMeuPerfil: vi.fn(async () => perfil), obterPerfil: vi.fn(async () => perfil) }}
                portaConta={mockContaPort}
                portaComunidade={mockComunidadePort}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

  it('Compartilhar copia o link PÚBLICO (/u/:handle), não /perfil, que mostraria o perfil de quem abrir', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    abrirPerfil(mockPerfilLogado);
    await screen.findByRole('heading', { level: 1, name: 'burpKing' });
    fireEvent.click(within(document.querySelector('.pf-acts') as HTMLElement).getByRole('button', { name: 'Compartilhar' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/u/arrotador_3573`));
    expect(await screen.findByText('Link copiado.')).toBeTruthy();
  });

  it('redes sociais viram links certos; valor antigo com link é consertado e lixo não vira link', async () => {
    abrirPerfil({
      ...mockPerfilLogado,
      tiktok: 'https://www.tiktok.com/@giamzinn',
      instagram: 'leosam77',
      youtube: 'https://evil.com/x',
    });
    await screen.findByRole('heading', { level: 1, name: 'burpKing' });
    expect(screen.getByRole('link', { name: 'TikTok' }).getAttribute('href')).toBe('https://www.tiktok.com/@giamzinn');
    expect(screen.getByRole('link', { name: 'Instagram' }).getAttribute('href')).toBe('https://instagram.com/leosam77');
    expect(screen.queryByRole('link', { name: 'YouTube' })).toBeNull();
  });

  it('Seguidores e Seguindo abrem a lista de verdade; falha mostra erro e Tentar de novo refaz', async () => {
    const listarConexoes = vi.fn()
      .mockResolvedValueOnce([{ id: 'u1', handle: 'lima', apelido: 'Lima', euSigo: true }])
      .mockRejectedValueOnce(new Error('fora do ar'))
      .mockResolvedValueOnce([]);
    render(
      <MemoryRouter initialEntries={['/perfil']}>
        <Routes>
          <Route
            path="/perfil"
            element={
              <TelaPerfilOpenDesign
                portaPerfil={{ ...mockPerfilPort, listarConexoes }}
                portaConta={mockContaPort}
                portaComunidade={mockComunidadePort}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /Ver quem segue/ }));
    expect(await screen.findByRole('link', { name: /Lima/ })).toBeTruthy();
    expect(listarConexoes).toHaveBeenLastCalledWith('arrotador_3573', 'seguidores');
    fireEvent.click(screen.getByRole('button', { name: 'Fechar lista' }));

    fireEvent.click(screen.getByRole('button', { name: /Ver quem é seguido/ }));
    expect((await screen.findByRole('alert')).textContent).toContain('Não deu para carregar a lista');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Ninguém por aqui ainda.')).toBeTruthy();
  });

  it('abre o modal Editar perfil e salva atualizações com feedback', async () => {
    render(
      <MemoryRouter initialEntries={['/perfil']}>
        <Routes>
          <Route
            path="/perfil"
            element={
              <TelaPerfilOpenDesign
                portaPerfil={mockPerfilPort}
                portaConta={mockContaPort}
                portaComunidade={mockComunidadePort}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const btnEditar = await screen.findByRole('button', { name: 'Editar perfil' });
    fireEvent.click(btnEditar);

    // Modal aberto 1:1 com campos
    expect(await screen.findByRole('heading', { level: 2, name: 'Editar perfil' })).toBeTruthy();
    const inputNome = screen.getByLabelText('Nome de exibição');
    const inputHandle = screen.getByLabelText('@ do Auê');
    const inputBio = screen.getByLabelText('Bio');

    fireEvent.change(inputNome, { target: { value: 'burpMaster' } });
    fireEvent.change(inputHandle, { target: { value: '@burp_master' } });
    fireEvent.change(inputBio, { target: { value: 'Nova bio da roda.' } });

    const btnSalvar = screen.getByRole('button', { name: 'Salvar mudanças' });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(mockPerfilPort.atualizarMeuPerfil).toHaveBeenCalledWith(
        expect.objectContaining({
          apelido: 'burpMaster',
          handle: 'burp_master',
          bio: 'Nova bio da roda.',
        }),
      );
    });

    expect(await screen.findByText(/Perfil atualizado/)).toBeTruthy();
  });

  it('permite visualizar outro perfil via rota /u/:handle', async () => {
    render(
      <MemoryRouter initialEntries={['/u/douglas']}>
        <Routes>
          <Route
            path="/u/:handle"
            element={
              <TelaPerfilOpenDesign
                portaPerfil={mockPerfilPort}
                portaConta={mockContaPort}
                portaComunidade={mockComunidadePort}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Douglas Garcia' })).toBeTruthy();
    expect(screen.getByText('@douglas')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Seguir' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir meu perfil' }).textContent).toContain('burpKing');
    expect(screen.queryByRole('button', { name: '+ Novo post' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Editar perfil' })).toBeNull();
  });

  describe('abas, cartões e troca de foto (Fase A, cartão 0030)', () => {
    const emVazio = { ...mockComunidadePort, listarFeed: vi.fn(async () => []) };

    const abrir = (perfil: PerfilPublico, entrada = '/perfil', extras: Partial<{ portaPerfil: PortaDePerfil; portaComunidade: PortaDeComunidade }> = {}) =>
      render(
        <MemoryRouter initialEntries={[entrada]}>
          <Routes>
            <Route
              path="/perfil"
              element={
                <TelaPerfilOpenDesign
                  portaPerfil={extras.portaPerfil ?? { ...mockPerfilPort, obterMeuPerfil: vi.fn(async () => perfil), obterPerfil: vi.fn(async () => perfil) }}
                  portaConta={mockContaPort}
                  portaComunidade={extras.portaComunidade ?? mockComunidadePort}
                />
              }
            />
          </Routes>
        </MemoryRouter>,
      );

    it('dono vê Posts, Arrotos e Salvos; visitante só Posts e Arrotos; Curtidas não existe no DOM; sem contador no rótulo', async () => {
      abrir(mockPerfilLogado);
      await screen.findByRole('heading', { level: 1, name: 'burpKing' });
      const abas = within(screen.getByRole('tablist', { name: 'Abas do perfil' })).getAllByRole('tab');
      expect(abas.map((a) => a.textContent)).toEqual(['Posts', 'Arrotos', 'Salvos']);
      expect(screen.queryByText('Curtidas')).toBeNull();
      expect(screen.queryByRole('tab', { name: /Curtidas/ })).toBeNull();
      cleanup();

      abrir({ ...mockPerfilLogado, souEu: false });
      await screen.findByRole('heading', { level: 1, name: 'burpKing' });
      expect(within(screen.getByRole('tablist', { name: 'Abas do perfil' })).getAllByRole('tab').map((a) => a.textContent)).toEqual(['Posts', 'Arrotos']);
    });

    it('setas, Home e End trocam de aba e só a ativa entra na ordem do Tab', async () => {
      abrir(mockPerfilLogado);
      await screen.findByRole('heading', { level: 1, name: 'burpKing' });
      const lista = screen.getByRole('tablist', { name: 'Abas do perfil' });
      const [posts, arrotos, salvos] = within(lista).getAllByRole('tab');
      expect(posts.getAttribute('tabindex')).toBe('0');
      expect(arrotos.getAttribute('tabindex')).toBe('-1');
      fireEvent.keyDown(lista, { key: 'ArrowRight' });
      expect(arrotos.getAttribute('aria-selected')).toBe('true');
      expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(arrotos.id);
      fireEvent.keyDown(lista, { key: 'End' });
      expect(salvos.getAttribute('aria-selected')).toBe('true');
      fireEvent.keyDown(lista, { key: 'ArrowRight' });
      expect(posts.getAttribute('aria-selected')).toBe('true');
      fireEvent.keyDown(lista, { key: 'ArrowLeft' });
      expect(salvos.getAttribute('aria-selected')).toBe('true');
      fireEvent.keyDown(lista, { key: 'Home' });
      expect(posts.getAttribute('aria-selected')).toBe('true');
    });

    it('a aba aberta vem da URL (?aba=arrotos) e salvos de outra pessoa cai em Posts', async () => {
      abrir(mockPerfilLogado, '/perfil?aba=arrotos');
      await screen.findByRole('heading', { level: 1, name: 'burpKing' });
      expect(screen.getByRole('tab', { name: 'Arrotos' }).getAttribute('aria-selected')).toBe('true');
      cleanup();
      abrir({ ...mockPerfilLogado, souEu: false }, '/perfil?aba=salvos');
      await screen.findByRole('heading', { level: 1, name: 'burpKing' });
      expect(screen.getByRole('tab', { name: 'Posts' }).getAttribute('aria-selected')).toBe('true');
    });

    it('posts viram CardDoPost no perfil: @handle, r/roda em linha própria, curtida só da porta e sem nota nem emoji', async () => {
      abrir(mockPerfilLogado);
      const cards = await waitFor(() => {
        const achados = document.querySelectorAll('article.card-do-post--perfil');
        expect(achados).toHaveLength(3);
        return [...achados] as HTMLElement[];
      });
      const primeiro = within(cards[0]);
      expect(primeiro.getByText('@arrotador_3573')).toBeTruthy();
      expect(primeiro.getByText('r/eu-arroto-e-dai')).toBeTruthy();
      expect(primeiro.getByText('Coe galera')).toBeTruthy();
      expect(primeiro.getByRole('button', { name: 'Mais ações' })).toBeTruthy();
      for (const nome of ['🔥', '🤢', '🏆', 'Salvar']) expect(primeiro.queryByRole('button', { name: nome })).toBeNull();
      expect(primeiro.queryByText('NOTA')).toBeNull();
      // O 0 do coração vem da contagem que a porta devolveu, não de enchimento.
      expect(primeiro.getByRole('button', { name: 'Curtir' }).textContent).toContain('0');
    });

    it('o coração do perfil está ligado à porta real: curtir chama alternarCurtida e relê o causo', async () => {
      const alternarCurtida = vi.fn(async () => ({ ok: true as const, curtidas: 1, curtido: true }));
      const obterCauso = vi.fn(async () => ({ ...mockCausos[0], curtidas: 1, curtidoPorMim: true }));
      abrir(mockPerfilLogado, '/perfil', { portaComunidade: { ...mockComunidadePort, alternarCurtida, obterCauso } as unknown as PortaDeComunidade });
      const cards = await waitFor(() => {
        const achados = document.querySelectorAll('article.card-do-post--perfil');
        expect(achados).toHaveLength(3);
        return [...achados] as HTMLElement[];
      });
      fireEvent.click(within(cards[0]).getByRole('button', { name: 'Curtir' }));
      await waitFor(() => expect(alternarCurtida).toHaveBeenCalledWith('causo-1'));
      await waitFor(() => expect(within(cards[0]).getByRole('button', { name: 'Curtir' }).textContent).toContain('1'));
      expect(within(cards[0]).getByRole('button', { name: 'Curtir' }).getAttribute('aria-pressed')).toBe('true');
      // Nenhum texto de contagem de curtidas solto fora dos cards.
      expect(screen.queryByText(/curtidas/i)).toBeNull();
    });

    it('perfil sem posts mostra o estado vazio; só o dono tem "Novo post"', async () => {
      abrir(mockPerfilLogado, '/perfil', { portaComunidade: emVazio });
      expect(await screen.findByRole('heading', { level: 2, name: 'Nenhum post publicado ainda.' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Novo post' })).toBeTruthy();
      cleanup();
      abrir({ ...mockPerfilLogado, souEu: false }, '/perfil', { portaComunidade: emVazio });
      expect(await screen.findByRole('heading', { level: 2, name: 'Nenhum post publicado ainda.' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Novo post' })).toBeNull();
    });

    it('erro ao ler os posts diz que foi erro e Tentar de novo refaz a leitura', async () => {
      const listarFeed = vi.fn().mockRejectedValueOnce(new Error('fora')).mockResolvedValue(mockCausos);
      abrir(mockPerfilLogado, '/perfil', { portaComunidade: { ...mockComunidadePort, listarFeed } });
      expect((await screen.findByRole('alert')).textContent).toContain('Não deu para carregar os posts agora.');
      fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
      await waitFor(() => expect(document.querySelectorAll('article.card-do-post--perfil')).toHaveLength(3));
    });

    it('Melhor nota fica no topo de Arrotos; campo vazio de bio, cidade e redes não ocupa espaço', async () => {
      abrir({ ...mockPerfilLogado, melhorNota: 82, bio: undefined, cidade: undefined });
      await screen.findByRole('heading', { level: 1, name: 'burpKing' });
      expect(document.getElementById('profileBio')).toBeNull();
      expect(document.querySelector('.pf-social')).toBeNull();
      expect(document.querySelector('.pf-meta')?.textContent).toBe('na roda desde 2026');
      fireEvent.click(screen.getByRole('tab', { name: 'Arrotos' }));
      expect(within(document.querySelector('.pf-best') as HTMLElement).getByText('82')).toBeTruthy();
    });

    it('bio longa ganha "ver mais" e "ver menos"', async () => {
      abrir({ ...mockPerfilLogado, bio: 'x'.repeat(120) });
      const mais = await screen.findByRole('button', { name: 'ver mais' });
      expect(mais.getAttribute('aria-expanded')).toBe('false');
      fireEvent.click(mais);
      expect(screen.getByRole('button', { name: 'ver menos' }).getAttribute('aria-expanded')).toBe('true');
    });

    it('tocar no avatar do dono abre a folha de foto; Trocar chama o seletor; Esc fecha; sem foto não há Remover', async () => {
      abrir(mockPerfilLogado);
      const avatar = await screen.findByRole('button', { name: 'Trocar foto do perfil' });
      fireEvent.click(avatar);
      const folha = screen.getByRole('dialog', { name: 'Foto do perfil' });
      expect(within(folha).getByRole('button', { name: 'Trocar foto' })).toBeTruthy();
      expect(within(folha).queryByRole('button', { name: 'Remover foto' })).toBeNull();
      fireEvent.keyDown(folha, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Foto do perfil' })).toBeNull();

      fireEvent.click(avatar);
      const seletor = screen.getByLabelText('Escolher nova foto de perfil') as HTMLInputElement;
      const clique = vi.spyOn(seletor, 'click');
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Foto do perfil' })).getByRole('button', { name: 'Trocar foto' }));
      expect(clique).toHaveBeenCalledOnce();
      expect(screen.queryByRole('dialog', { name: 'Foto do perfil' })).toBeNull();
    });

    it('com foto, a folha oferece Remover foto e chama o handler que já existia', async () => {
      const removerFoto = vi.fn(async () => ({ ok: true as const, perfil: { ...mockPerfilLogado, avatarUrl: undefined } }));
      const comFoto = { ...mockPerfilLogado, avatarUrl: 'https://cdn.test/eu.jpg' };
      abrir(comFoto, '/perfil', { portaPerfil: { ...mockPerfilPort, obterMeuPerfil: vi.fn(async () => comFoto), obterPerfil: vi.fn(async () => comFoto), removerFoto } });
      fireEvent.click(await screen.findByRole('button', { name: 'Trocar foto do perfil' }));
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Foto do perfil' })).getByRole('button', { name: 'Remover foto' }));
      await waitFor(() => expect(removerFoto).toHaveBeenCalledOnce());
    });

    it('visitante não tem botão no avatar: nada abre troca de foto', async () => {
      abrir({ ...mockPerfilLogado, souEu: false });
      await screen.findByRole('heading', { level: 1, name: 'burpKing' });
      expect(screen.queryByRole('button', { name: 'Trocar foto do perfil' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Trocar capa' })).toBeNull();
    });

    it('no Editar perfil ficam Trocar capa e Remover capa, com os handlers existentes', async () => {
      const removerCapa = vi.fn(async () => ({ ok: true as const, perfil: { ...mockPerfilLogado, capaUrl: undefined } }));
      const comCapa = { ...mockPerfilLogado, capaUrl: 'https://cdn.test/capa.jpg' };
      abrir(comCapa, '/perfil', { portaPerfil: { ...mockPerfilPort, obterMeuPerfil: vi.fn(async () => comCapa), obterPerfil: vi.fn(async () => comCapa), removerCapa } });
      fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
      const modal = within(await screen.findByRole('dialog', { name: 'Editar perfil' }));
      const seletor = screen.getByLabelText('Escolher nova capa do perfil') as HTMLInputElement;
      const clique = vi.spyOn(seletor, 'click');
      fireEvent.click(modal.getByRole('button', { name: 'Trocar capa' }));
      expect(clique).toHaveBeenCalledOnce();
      fireEvent.click(modal.getByRole('button', { name: 'Remover capa' }));
      await waitFor(() => expect(removerCapa).toHaveBeenCalledOnce());
    });

    it('visitante vê "Seguir" neutro (solid) e o mesmo botão de compartilhar', async () => {
      abrir({ ...mockPerfilLogado, souEu: false });
      const acoes = within(await waitFor(() => {
        const el = document.querySelector('.pf-acts') as HTMLElement | null;
        expect(el).toBeTruthy();
        return el as HTMLElement;
      }));
      expect(acoes.getByRole('button', { name: 'Seguir' }).className).toContain('pf-btn--solid');
      expect(acoes.getByRole('button', { name: 'Compartilhar' })).toBeTruthy();
      expect(acoes.queryByRole('button', { name: 'Editar perfil' })).toBeNull();
    });

    it('Seguidores e Seguindo continuam botões com alvo próprio na linha dos três números', async () => {
      abrir(mockPerfilLogado);
      await screen.findByRole('heading', { level: 1, name: 'burpKing' });
      const numeros = document.querySelector('.pf-stats') as HTMLElement;
      expect(numeros.children).toHaveLength(3);
      expect([...numeros.children].map((c) => c.querySelector('span')?.textContent)).toEqual(['Posts', 'Seguidores', 'Seguindo']);
    });
  });
});

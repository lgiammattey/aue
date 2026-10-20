// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeForum } from '../../portas/forum';
import { InicioOpenDesign } from './InicioOpenDesign';

describe('InicioOpenDesign (1:1 com protótipo Open Design)', () => {
  afterEach(() => {
    cleanup();
  });

  const mockForum: PortaDeForum = {
    listarComunidadesDoForum: vi.fn(async () => ({
      ok: true as const,
      valor: [
        {
          id: '1',
          slug: 'arena-do-arroto',
          nome: 'Arena do Arroto',
          descricao: 'Roda oficial da arena',
          icone: null,
          membrosTotal: 120,
          topicosTotal: 10,
          ultimaAtividadeEm: '2026-01-01',
          souMembro: false,
        },
        {
          id: '2',
          slug: 'arroto-em-video',
          nome: 'Arroto em Vídeo',
          descricao: 'Vídeos da comunidade',
          icone: null,
          membrosTotal: 80,
          topicosTotal: 5,
          ultimaAtividadeEm: '2026-01-01',
          souMembro: false,
        },
      ],
    })),
    obterComunidadeDoForum: vi.fn(),
    listarTopicos: vi.fn(),
    obterTopico: vi.fn(),
    listarRespostasDoTopico: vi.fn(async () => ({
      ok: true as const,
      valor: {
        itens: [
          {
            id: 'resp-1',
            topicoId: 'topico-1',
            paiId: null,
            nivel: 0 as const,
            autor: { id: 'autor-2', handle: 'pedro_som', apelido: 'Pedro Som', avatarUrl: null },
            corpo: 'Esse som foi histórico na firma!',
            status: 'publicado' as const,
            criadoEm: '2026-10-19T11:00:00Z',
            editadoEm: null,
            souAutor: false,
          },
        ],
        proximo: null,
      },
    })),
    explorarTopicos: vi.fn(async () => ({
      ok: true as const,
      valor: {
        itens: [
          {
            id: 'topico-1',
            comunidade: { id: '1', slug: 'arena-do-arroto', nome: 'Arena do Arroto' },
            titulo: 'Arroto que quebrou a taça da sala',
            autor: { id: 'autor-1', handle: 'ze_do_eco', apelido: 'Zé do Eco', avatarUrl: null },
            status: 'aberto' as const,
            fixado: false,
            criadoEm: '2026-10-19T10:00:00Z',
            ultimaAtividadeEm: '2026-10-19T10:00:00Z',
            respostasTotal: 12,
          },
        ],
        proximo: null,
      },
    })),
    listarTopicosDoAutor: vi.fn(),
    listarRespostasDoAutor: vi.fn(),
    criarTopico: vi.fn(async (pedido) => ({
      ok: true as const,
      valor: {
        id: 'novo-123',
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
    listarFeed: vi.fn(async () => []),
    obterCauso: vi.fn(),
    postarCauso: vi.fn(),
    alternarReacao: vi.fn(),
    alternarCurtida: vi.fn(),
    alternarRepost: vi.fn(),
    listarRespostas: vi.fn(async () => []),
    adicionarResposta: vi.fn(),
    apagarCauso: vi.fn(),
    entrarComunidade: vi.fn(async () => true),
    sairComunidade: vi.fn(async () => true),
    listarMinhasComunidades: vi.fn(async () => []),
    denunciarCauso: vi.fn(),
  };

  it('renderiza os elementos principais da casca 1:1 e consome portas reais', async () => {
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          autenticado={false}
          aoEntrar={vi.fn()}
        />
      </MemoryRouter>,
    );

    // Marca Auê
    expect(screen.getByLabelText('Auê, página inicial')).toBeTruthy();

    // Botão Soltar Arroto na sidebar
    expect(screen.getByRole('button', { name: '+ Soltar um arroto' })).toBeTruthy();

    // Hero 1:1
    expect(await screen.findByRole('heading', { level: 1, name: 'A comunidade dos arrotadores.' })).toBeTruthy();

    // Feed com tópico real carregado da porta
    expect(await screen.findByText('Arroto que quebrou a taça da sala')).toBeTruthy();
    expect(screen.getByText('u/ze_do_eco')).toBeTruthy();

    // Comunidades reais na sidebar e rightbar
    expect(screen.getAllByText('r/arena-do-arroto').length).toBeGreaterThan(0);
  });

  it('permite alternar abas de ordenação Quentes, Novos e Top', async () => {
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          autenticado={true}
        />
      </MemoryRouter>,
    );

    const abaNovos = screen.getByRole('button', { name: 'Novos' });
    fireEvent.click(abaNovos);
    expect(screen.getByText('Comunidade · Novos')).toBeTruthy();

    const abaTop = screen.getByRole('button', { name: 'Top' });
    fireEvent.click(abaTop);
    expect(screen.getByText('Comunidade · Top')).toBeTruthy();
  });

  it('abre o modal de publicação ao clicar em Soltar um arroto e envia dados reais', async () => {
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          autenticado={true}
        />
      </MemoryRouter>,
    );

    const btnSoltar = screen.getByRole('button', { name: '+ Soltar um arroto' });
    fireEvent.click(btnSoltar);

    // Modal aberto
    expect(screen.getByRole('heading', { level: 2, name: 'Soltar um arroto' })).toBeTruthy();

    // Preenche e publica
    const inputTitulo = screen.getByLabelText('Título da publicação');
    fireEvent.change(inputTitulo, { target: { value: 'Meu novo causo épico' } });

    const btnPublicar = screen.getByRole('button', { name: 'Publicar no Auê' });
    fireEvent.click(btnPublicar);

    await waitFor(() => {
      expect(mockForum.criarTopico).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Meu novo causo épico',
        }),
      );
    });
  });

  it('abre modal institucional ao clicar nos links do rodapé', async () => {
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          autenticado={true}
        />
      </MemoryRouter>,
    );

    const btnSobre = screen.getByRole('button', { name: 'Sobre o Auê' });
    fireEvent.click(btnSobre);

    expect(await screen.findByRole('heading', { level: 2, name: 'Sobre o Auê' })).toBeTruthy();
    expect(screen.getByText(/O Auê é uma comunidade brasileira/)).toBeTruthy();
  });

  it('renderiza a tela de login 1:1 e permite alternar entre os painéis de autenticação', async () => {
    const mockConta = {
      estado: vi.fn(async () => ({ temSessao: false, anonima: false, perfilSocialPendente: false, podeParticiparSocialmente: false })),
      cadastrar: vi.fn(),
      entrar: vi.fn(async () => ({ ok: true as const })),
      enviarLinkDeRedefinicao: vi.fn(async () => ({ ok: true as const })),
      redefinirSenha: vi.fn(),
      sair: vi.fn(async () => true),
    };

    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          portaConta={mockConta}
          viewInicial="auth"
        />
      </MemoryRouter>,
    );

    // Painel Login 1:1
    expect(screen.getByRole('heading', { level: 1, name: 'Entra na roda' })).toBeTruthy();
    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Entrar no Auê' })).toBeTruthy();

    // Alterna para Esqueci minha senha (recover)
    const btnEsqueci = screen.getByRole('button', { name: 'Esqueci minha senha' });
    fireEvent.click(btnEsqueci);
    expect(screen.getByRole('heading', { level: 1, name: 'Recuperar senha' })).toBeTruthy();

    // Alterna para Pedir convite (invite)
    const btnVoltar = screen.getByRole('button', { name: 'Voltar para entrar' });
    fireEvent.click(btnVoltar);
    const btnConvite = screen.getByRole('button', { name: 'Pedir convite' });
    fireEvent.click(btnConvite);
    expect(screen.getByRole('heading', { level: 1, name: 'Pedir convite' })).toBeTruthy();
  });

  it('permite abrir o modal de comentários, ler a conversa e responder na roda', async () => {
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          autenticado={true}
        />
      </MemoryRouter>,
    );

    // Espera o post carregar
    expect(await screen.findByText('Arroto que quebrou a taça da sala')).toBeTruthy();

    // Clica no botão de comentários
    const btnComentarios = screen.getByRole('button', { name: /12 comentários/i });
    fireEvent.click(btnComentarios);

    // Diálogo aberto com cabeçalho
    expect(await screen.findByRole('heading', { level: 2, name: 'Resenha na roda' })).toBeTruthy();

    // Comentário da porta carregado
    expect(await screen.findByText('Esse som foi histórico na firma!')).toBeTruthy();
    expect(screen.getByText('Pedro Som')).toBeTruthy();

    // Digita e envia uma resposta
    const inputResposta = screen.getByPlaceholderText('Responder para a roda…');
    fireEvent.change(inputResposta, { target: { value: 'Eu estava lá e confirmo o eco!' } });

    const btnEnviar = screen.getByRole('button', { name: 'Responder' });
    fireEvent.click(btnEnviar);

    await waitFor(() => {
      expect(mockForum.responderTopico).toHaveBeenCalledWith(
        expect.objectContaining({
          corpo: 'Eu estava lá e confirmo o eco!',
        }),
      );
    });

    // Nova resposta renderizada na lista
    expect(await screen.findByText('Eu estava lá e confirmo o eco!')).toBeTruthy();
  });
});

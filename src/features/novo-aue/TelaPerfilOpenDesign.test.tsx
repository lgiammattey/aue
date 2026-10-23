// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
      reacoes: { fogo: 0, riso: 0, choque: 0, trofeu: 0 } as const,
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
      reacoes: { fogo: 0, riso: 0, choque: 0, trofeu: 0 } as const,
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
      reacoes: { fogo: 0, riso: 0, choque: 0, trofeu: 0 } as const,
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
    alternarSeguir: vi.fn(async () => ({ ok: true, seguindo: true })),
    concluirMeuPerfilSocial: vi.fn(async (d) => ({
      ok: true,
      perfil: { ...mockPerfilLogado, ...d },
    })),
    atualizarMeuPerfil: vi.fn(async (d) => ({
      ok: true,
      perfil: { ...mockPerfilLogado, ...d },
    })),
    enviarFoto: vi.fn(async () => ({ ok: true, perfil: mockPerfilLogado })),
    removerFoto: vi.fn(async () => ({ ok: true, perfil: mockPerfilLogado })),
    listarConexoes: vi.fn(async () => []),
  };

  const mockContaPort: PortaDeConta = {
    estado: vi.fn(async () => ({
      temSessao: true,
      anonima: false,
      perfilSocialPendente: false,
      podeParticiparSocialmente: true,
    })),
    entrarComEmail: vi.fn(),
    cadastrarComEmail: vi.fn(),
    enviarLinkDeRedefinicao: vi.fn(),
    sair: vi.fn(),
  };

  const mockComunidadePort: PortaDeComunidade = {
    listarFeed: vi.fn(async () => mockCausos),
    postarCauso: vi.fn(),
    curtirCauso: vi.fn(),
    descurtirCauso: vi.fn(),
    denunciarCauso: vi.fn(),
    obterCauso: vi.fn(),
    listarComunidades: vi.fn(async () => []),
    obterComunidade: vi.fn(),
    entrarNaComunidade: vi.fn(async () => ({ ok: true })),
    sairDaComunidade: vi.fn(async () => ({ ok: true })),
    comunidadesQueFacoParte: vi.fn(async () => []),
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
    expect(screen.getByText(/u\/arrotador_3573/)).toBeTruthy();
    expect(document.getElementById('profileBio')?.textContent).toBe('Colecionador de causos improváveis.');
    expect(screen.getAllByText(/São Paulo, SP/).length).toBeGreaterThan(0);

    // Botões de ação 1:1
    expect(screen.getByRole('button', { name: 'Editar perfil' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '↗ Compartilhar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ Novo post' })).toBeTruthy();

    // Stats
    expect(screen.getByText('karma de arroto')).toBeTruthy();
    expect(screen.getByText('posts publicados')).toBeTruthy();
    expect(screen.getByText('comentários certeiros')).toBeTruthy();

    // Atividade com os causos reais do usuário
    expect(await screen.findByText('Coe galera')).toBeTruthy();
    expect(screen.getByText('oi na roda geral')).toBeTruthy();

    // Painéis laterais 1:1
    expect(screen.getByRole('heading', { level: 2, name: 'Conquistas' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Comunidades favoritas' })).toBeTruthy();
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
    const inputBio = screen.getByLabelText('Bio');

    fireEvent.change(inputNome, { target: { value: 'burpMaster' } });
    fireEvent.change(inputBio, { target: { value: 'Nova bio da roda.' } });

    const btnSalvar = screen.getByRole('button', { name: 'Salvar mudanças' });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(mockPerfilPort.atualizarMeuPerfil).toHaveBeenCalledWith(
        expect.objectContaining({
          apelido: 'burpMaster',
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
    expect(screen.getByText(/u\/douglas/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Seguir' })).toBeTruthy();
  });
});

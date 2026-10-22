// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';
import type { PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import type { PortaDeForum } from '../../portas/forum';
import { TelaPerfilOpenDesign } from './TelaPerfilOpenDesign';

const eu: PerfilPublico = {
  id: 'user-123', handle: 'arrotador_3573', apelido: 'burpKing',
  bio: 'Colecionador de causos improváveis.', cidade: 'São Paulo, SP',
  fundador: false, daCasa: false, criadoEm: '2026-10-18T10:00:00Z',
  totalCausos: 3, totalSeguidores: 0, totalSeguindo: 1, euSigo: false, souEu: true,
};

const outraPessoa: PerfilPublico = {
  ...eu, id: 'user-douglas', handle: 'douglas', apelido: 'Douglas Garcia',
  bio: 'Moderador informal da mesa do canto.', totalCausos: 39, totalSeguidores: 86,
  totalSeguindo: 14, souEu: false,
};

const paginaVazia = { ok: true as const, valor: { itens: [], proximo: null } };

const forum = {
  listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })),
  explorarTopicos: vi.fn(async () => paginaVazia),
  listarTopicosDoAutor: vi.fn(async () => paginaVazia),
  listarRespostasDoAutor: vi.fn(async () => paginaVazia),
  listarPublicacoesPessoais: vi.fn(async () => paginaVazia),
  listarPublicacoesPessoaisDoAutor: vi.fn(async () => paginaVazia),
  listarPublicacoesMarcadas: vi.fn(async () => paginaVazia),
} as unknown as PortaDeForum;

const comunidade: PortaDeComunidade = {
  listarFeed: vi.fn(async () => []), postarCauso: vi.fn(), alternarReacao: vi.fn(),
  alternarCurtida: vi.fn(), alternarRepost: vi.fn(), listarRespostas: vi.fn(async () => []),
  adicionarResposta: vi.fn(), apagarCauso: vi.fn(), denunciarCauso: vi.fn(), obterCauso: vi.fn(),
  listarComunidades: vi.fn(async () => []), entrarComunidade: vi.fn(async () => true),
  sairComunidade: vi.fn(async () => true), listarMinhasComunidades: vi.fn(async () => []),
};

const conta: PortaDeConta = {
  estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: false, podeParticiparSocialmente: true })),
  entrar: vi.fn(), cadastrar: vi.fn(), enviarLinkDeRedefinicao: vi.fn(), redefinirSenha: vi.fn(), sair: vi.fn(),
};

function portaPerfil(perfil: PerfilPublico): PortaDePerfil {
  return {
    obterMeuPerfil: vi.fn(async () => eu),
    obterPerfil: vi.fn(async () => perfil),
    obterMeuPerfilParaEdicao: vi.fn(async () => ({ apelido: eu.apelido, handle: eu.handle, bio: eu.bio, cidade: eu.cidade })),
    alternarSeguir: vi.fn(async () => ({ ok: true as const, seguindo: true })),
    concluirMeuPerfilSocial: vi.fn(), atualizarMeuPerfil: vi.fn(), enviarFoto: vi.fn(), removerFoto: vi.fn(),
    enviarCapa: vi.fn(), removerCapa: vi.fn(), listarConexoes: vi.fn(async () => []),
  };
}

function abrir(perfil: PerfilPublico) {
  render(
    <MemoryRouter initialEntries={[`/u/${perfil.handle}`]}>
      <Routes>
        <Route path="/u/:handle" element={<TelaPerfilOpenDesign portaForum={forum} portaComunidade={comunidade} portaConta={conta} portaPerfil={portaPerfil(perfil)} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Tela de Perfil Open Design', () => {
  afterEach(() => {
    cleanup();
    document.body.removeAttribute('style');
  });

  it('mostra identidade, ações por ícone e controles de mídia discretos no perfil próprio', async () => {
    abrir(eu);

    expect(await screen.findByRole('heading', { level: 1, name: 'burpKing' })).toBeTruthy();
    expect(screen.getAllByText('@arrotador_3573').length).toBeGreaterThan(0);
    expect(screen.getByText('Colecionador de causos improváveis.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Editar perfil' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Compartilhar perfil' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trocar foto' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Adicionar capa' })).toBeTruthy();
    expect(screen.getByLabelText('Escolher nova foto de perfil')).toBeTruthy();
    expect(screen.getByLabelText('Escolher nova capa do perfil')).toBeTruthy();
  });

  it('mantém Posts, Marcados, Arrotos e Salvos como abas do dono', async () => {
    abrir(eu);
    await screen.findByRole('heading', { level: 1, name: 'burpKing' });

    expect(screen.getByRole('tab', { name: /Posts/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Marcados/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Arrotos/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Salvos' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Criar novo post' }).textContent).toContain('Alguma merda');
  });

  it('abre a edição sem transformar trocar foto e capa em CTAs permanentes e fixa a leitura por trás', async () => {
    abrir(eu);
    await screen.findByRole('heading', { level: 1, name: 'burpKing' });

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    expect(await screen.findByRole('dialog', { name: 'Editar perfil' })).toBeTruthy();
    expect(document.body.style.position).toBe('fixed');

    fireEvent.click(screen.getByRole('button', { name: 'Fechar modal' }));
    expect(document.body.style.position).toBe('');
  });

  it('mostra seguir, mas não oferece os controles privados ao visitar outra pessoa', async () => {
    abrir(outraPessoa);
    expect(await screen.findByRole('heading', { level: 1, name: 'Douglas Garcia' })).toBeTruthy();

    expect(screen.getByRole('button', { name: 'Seguir' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Compartilhar perfil' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Editar perfil' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Trocar foto' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Adicionar capa' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Salvos' })).toBeNull();
  });
});

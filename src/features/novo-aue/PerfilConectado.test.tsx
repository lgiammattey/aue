// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PerfilConectado } from './PerfilConectado';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';
import type { PerfilPublico, PortaDePerfil } from '../../portas/perfil';

const perfil: PerfilPublico = {
  id: 'pessoa-1', handle: 'betao', apelido: 'Betão', bio: 'Um arroto por vez.', cidade: 'São Paulo', fundador: false, daCasa: false,
  criadoEm: '2026-10-01T12:00:00Z', totalCausos: 1, totalSeguidores: 4, totalSeguindo: 2, euSigo: false, souEu: true,
};

function portas(perfilAtual: PerfilPublico | null = perfil) {
  const perfilPort: PortaDePerfil = {
    obterPerfil: vi.fn(), obterMeuPerfil: vi.fn(async () => perfilAtual), obterMeuPerfilParaEdicao: vi.fn(), alternarSeguir: vi.fn(),
    concluirMeuPerfilSocial: vi.fn(), atualizarMeuPerfil: vi.fn(), enviarFoto: vi.fn(), removerFoto: vi.fn(), enviarCapa: vi.fn(), removerCapa: vi.fn(), listarConexoes: vi.fn(async () => []),
  };
  const comunidadePort = { listarFeed: vi.fn(async () => [{ id: 'c1', comunidadeId: 'g1', comunidadeSlug: 'firma', autorNome: 'Betão', conteudo: 'Foi alto.', reacoes: { fogo: 0, nojo: 0, trofeu: 0 }, curtidas: 0, reposts: 0, totalComentarios: 0, criadoEm: '2026-10-02T12:00:00Z' }]) } as unknown as PortaDeComunidade;
  const contaPort: PortaDeConta = { estado: vi.fn(async () => ({ temSessao: true, anonima: false, podeParticiparSocialmente: true })), cadastrar: vi.fn(), entrar: vi.fn(), enviarLinkDeRedefinicao: vi.fn(), redefinirSenha: vi.fn(), sair: vi.fn(async () => true) };
  return { perfilPort, comunidadePort, contaPort };
}

afterEach(cleanup);

describe('PerfilConectado', () => {
  it('lê a ficha e as resenhas reais pelas portas, sem contagem local', async () => {
    const { perfilPort, comunidadePort, contaPort } = portas();
    render(<BrowserRouter><PerfilConectado portaPerfil={perfilPort} portaComunidade={comunidadePort} portaConta={contaPort} aoEntrar={vi.fn()} /></BrowserRouter>);

    expect(await screen.findByRole('heading', { name: 'Betão' })).toBeTruthy();
    expect(screen.getByText('@betao · Chegou em 2026')).toBeTruthy();
    expect(await screen.findByText('Foi alto.')).toBeTruthy();
    expect(comunidadePort.listarFeed).toHaveBeenCalledWith({ autorId: 'pessoa-1', limite: 50 });
    expect(perfilPort.obterMeuPerfil).toHaveBeenCalledOnce();
  });

  it('não transforma perfil ausente em perfil inventado', async () => {
    const { perfilPort, comunidadePort, contaPort } = portas(null);
    render(<BrowserRouter><PerfilConectado portaPerfil={perfilPort} portaComunidade={comunidadePort} portaConta={contaPort} aoEntrar={vi.fn()} /></BrowserRouter>);

    expect(await screen.findByText('Seu perfil ainda não está pronto.')).toBeTruthy();
    await waitFor(() => expect(comunidadePort.listarFeed).not.toHaveBeenCalled());
  });

  it('mostra a falha de conexões, sem deixar uma ação parecer bem-sucedida', async () => {
    const { perfilPort, comunidadePort, contaPort } = portas();
    perfilPort.listarConexoes = vi.fn(async () => { throw new Error('indisponível'); });
    render(<BrowserRouter><PerfilConectado portaPerfil={perfilPort} portaComunidade={comunidadePort} portaConta={contaPort} aoEntrar={vi.fn()} /></BrowserRouter>);

    await screen.findByRole('heading', { name: 'Betão' });
    screen.getAllByRole('button', { name: /seguidores/i })[0].click();
    expect((await screen.findByRole('alert')).textContent).toBe('Não deu para carregar as conexões agora.');
  });
});

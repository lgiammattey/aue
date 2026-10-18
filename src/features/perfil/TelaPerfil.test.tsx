// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TelaPerfil } from './TelaPerfil';
import type { PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';

const base: PerfilPublico = {
  id: 'u1',
  handle: 'betao',
  apelido: 'Betão',
  fundador: false,
  criadoEm: '2026-08-01T00:00:00Z',
  totalCausos: 2,
  melhorNota: 91,
  totalSeguidores: 3,
  totalSeguindo: 1,
  euSigo: false,
  souEu: false,
};

const comunidade = {
  listarFeed: vi.fn(async () => []),
  alternarCurtida: vi.fn(),
  alternarRepost: vi.fn(),
  listarRespostas: vi.fn(async () => []),
  adicionarResposta: vi.fn(),
  denunciarCauso: vi.fn(),
} as unknown as PortaDeComunidade;

const conta = (anonima = true): PortaDeConta => ({
  estado: vi.fn(async () => ({ temSessao: true, anonima, email: anonima ? undefined : 'b@aue.com' })),
  cadastrar: vi.fn(),
  entrar: vi.fn(),
  enviarLinkDeRedefinicao: vi.fn(),
  redefinirSenha: vi.fn(),
  sair: vi.fn(async () => true),
});

const props = {
  aoVoltar: vi.fn(),
  aoArrotar: vi.fn(),
  aoAbrirHistoria: vi.fn(),
  aoAbrirPerfil: vi.fn(),
  aoEntrar: vi.fn(),
};

afterEach(cleanup);

describe('TelaPerfil', () => {
  it('mostra o perfil dos outros com os números do servidor e segue pela porta', async () => {
    const portaPerfil: PortaDePerfil = {
      obterPerfil: vi.fn(async () => base),
      obterMeuPerfil: vi.fn(),
      alternarSeguir: vi.fn(async () => ({ ok: true, seguindo: true })),
      atualizarMeuPerfil: vi.fn(),
    };
    render(<TelaPerfil handle="betao" portaPerfil={portaPerfil} portaComunidade={comunidade} portaConta={conta()} {...props} />);

    expect(await screen.findByText('@betao', { selector: 'b' })).toBeDefined();
    expect(screen.getByText('91')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }));
    expect(await screen.findByRole('button', { name: 'Seguindo' })).toBeDefined();
    expect(portaPerfil.alternarSeguir).toHaveBeenCalledWith('u1');
  });

  it('perfil que não existe diz isso, em vez de mostrar um inventado', async () => {
    const portaPerfil: PortaDePerfil = {
      obterPerfil: vi.fn(async () => null),
      obterMeuPerfil: vi.fn(),
      alternarSeguir: vi.fn(),
      atualizarMeuPerfil: vi.fn(),
    };
    render(<TelaPerfil handle="fantasma" portaPerfil={portaPerfil} portaComunidade={comunidade} portaConta={conta()} {...props} />);
    expect(await screen.findByText('Esse arrotador não existe.')).toBeDefined();
  });

  it('meu perfil: conta anônima oferece criar conta; handle em uso aparece como erro', async () => {
    const portaPerfil: PortaDePerfil = {
      obterPerfil: vi.fn(),
      obterMeuPerfil: vi.fn(async () => ({ ...base, souEu: true })),
      alternarSeguir: vi.fn(),
      atualizarMeuPerfil: vi.fn(async () => ({ ok: false as const, motivo: 'handleEmUso' as const })),
    };
    render(<TelaPerfil portaPerfil={portaPerfil} portaComunidade={comunidade} portaConta={conta(true)} {...props} />);

    expect(await screen.findByText('Sua conta é anônima')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(props.aoEntrar).toHaveBeenCalledWith('cadastro');

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText(/já é de outra pessoa/)).toBeDefined();
  });

  it('conta com e-mail mostra o e-mail e permite sair', async () => {
    const portaConta = conta(false);
    const portaPerfil: PortaDePerfil = {
      obterPerfil: vi.fn(),
      obterMeuPerfil: vi.fn(async () => ({ ...base, souEu: true })),
      alternarSeguir: vi.fn(),
      atualizarMeuPerfil: vi.fn(),
    };
    render(<TelaPerfil portaPerfil={portaPerfil} portaComunidade={comunidade} portaConta={portaConta} {...props} />);
    expect(await screen.findByText('b@aue.com')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(portaConta.sair).toHaveBeenCalled();
  });
});

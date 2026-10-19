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
  daCasa: false,
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

function portaDePerfil(sobrepor: Partial<PortaDePerfil> = {}): PortaDePerfil {
  return {
    obterPerfil: vi.fn(async () => base),
    obterMeuPerfil: vi.fn(async () => ({ ...base, souEu: true })),
    alternarSeguir: vi.fn(async () => ({ ok: true, seguindo: true })),
    atualizarMeuPerfil: vi.fn(),
    enviarFoto: vi.fn(),
    removerFoto: vi.fn(),
    listarConexoes: vi.fn(async () => []),
    ...sobrepor,
  };
}

const compartilhamentoFalso = (resultado: 'ok' | 'indisponivel' = 'ok') =>
  ({
    compartilhar: vi.fn(async () => (resultado === 'ok' ? { ok: true as const, via: 'texto' as const } : { ok: false as const, motivo: 'indisponivel' as const })),
    sabeMandarImagem: () => false,
    copiar: vi.fn(async () => true),
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
    const portaPerfil: PortaDePerfil = portaDePerfil();
    render(<TelaPerfil handle="betao" portaPerfil={portaPerfil} portaComunidade={comunidade} portaConta={conta(false)} {...props} />);

    expect(await screen.findByText('@betao', { selector: 'b' })).toBeDefined();
    expect(screen.getByText('91')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }));
    expect(await screen.findByRole('button', { name: 'Seguindo' })).toBeDefined();
    expect(portaPerfil.alternarSeguir).toHaveBeenCalledWith('u1');
  });

  it('perfil que não existe diz isso, em vez de mostrar um inventado', async () => {
    const portaPerfil: PortaDePerfil = portaDePerfil({ obterPerfil: vi.fn(async () => null) });
    render(<TelaPerfil handle="fantasma" portaPerfil={portaPerfil} portaComunidade={comunidade} portaConta={conta()} {...props} />);
    expect(await screen.findByText('Esse arrotador não existe.')).toBeDefined();
  });

  it('visitante não ganha perfil próprio: a tela pede promoção sem consultar ou editar perfil', async () => {
    const portaPerfil: PortaDePerfil = portaDePerfil({
      atualizarMeuPerfil: vi.fn(async () => ({ ok: false as const, motivo: 'handleEmUso' as const })),
    });
    render(<TelaPerfil portaPerfil={portaPerfil} portaComunidade={comunidade} portaConta={conta(true)} {...props} />);

    expect(await screen.findByText('Seu perfil público começa com uma conta')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(props.aoEntrar).toHaveBeenCalledWith('cadastro');
    expect(portaPerfil.obterMeuPerfil).not.toHaveBeenCalled();
  });

  it('conta com e-mail mostra o e-mail e permite sair', async () => {
    const portaConta = conta(false);
    const portaPerfil: PortaDePerfil = portaDePerfil();
    render(<TelaPerfil portaPerfil={portaPerfil} portaComunidade={comunidade} portaConta={portaConta} {...props} />);
    expect(await screen.findByText('b@aue.com')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(portaConta.sair).toHaveBeenCalled();
  });

  it('foto: manda o arquivo pela porta e mostra a nova; falha vira aviso', async () => {
    const enviarFoto = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, perfil: { ...base, souEu: true, avatarUrl: 'https://x/foto.jpg' } })
      .mockResolvedValueOnce({ ok: false, motivo: 'formatoInvalido' });
    const portaPerfil = portaDePerfil({ enviarFoto });
    render(<TelaPerfil portaPerfil={portaPerfil} portaComunidade={comunidade} portaConta={conta(false)} {...props} />);

    const entrada = (await screen.findByLabelText('Trocar foto do perfil')) as HTMLInputElement;
    const arquivo = new File(['x'], 'eu.png', { type: 'image/png' });
    fireEvent.change(entrada, { target: { files: [arquivo] } });
    expect((await screen.findByAltText('Betão')).getAttribute('src')).toBe('https://x/foto.jpg');
    expect(enviarFoto).toHaveBeenCalledWith(arquivo);

    fireEvent.change(entrada, { target: { files: [new File(['x'], 'eu.gif', { type: 'image/gif' })] } });
    expect(await screen.findByText('Use uma foto JPG, PNG ou WebP.')).toBeDefined();
  });

  it('seguidores: abre a lista pelo servidor e leva ao perfil de quem aparece', async () => {
    const listarConexoes = vi.fn(async () => [
      { id: 'u2', handle: 'ana', apelido: 'Ana', euSigo: false },
    ]);
    render(
      <TelaPerfil
        handle="betao"
        portaPerfil={portaDePerfil({ listarConexoes })}
        portaComunidade={comunidade}
        portaConta={conta()}
        {...props}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: /seguidores/ }));
    expect(listarConexoes).toHaveBeenCalledWith('betao', 'seguidores');
    fireEvent.click(await screen.findByRole('button', { name: /Ana/ }));
    expect(props.aoAbrirPerfil).toHaveBeenCalledWith('ana');
  });

  it('redes sociais viram link seguro, só com o usuário', async () => {
    const perfil = { ...base, instagram: 'betao.ti', twitter: 'betao' };
    render(
      <TelaPerfil
        handle="betao"
        portaPerfil={portaDePerfil({ obterPerfil: vi.fn(async () => perfil) })}
        portaComunidade={comunidade}
        portaConta={conta()}
        {...props}
      />,
    );
    const insta = await screen.findByRole('link', { name: /Instagram @betao.ti/ });
    expect(insta.getAttribute('href')).toBe('https://instagram.com/betao.ti');
    expect(insta.getAttribute('rel')).toContain('noopener');
    expect(screen.getByRole('link', { name: /X @betao/ }).getAttribute('href')).toBe('https://x.com/betao');
  });

  it('compartilhar manda o link do perfil; sem folha do sistema, copia e avisa', async () => {
    const indisponivel = compartilhamentoFalso('indisponivel');
    render(
      <TelaPerfil
        handle="betao"
        portaPerfil={portaDePerfil()}
        portaComunidade={comunidade}
        portaConta={conta()}
        compartilhamento={indisponivel}
        {...props}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }));
    expect(await screen.findByText('Link do perfil copiado.')).toBeDefined();
    expect(indisponivel.copiar).toHaveBeenCalledWith(expect.stringContaining('/u/betao'));
  });
});

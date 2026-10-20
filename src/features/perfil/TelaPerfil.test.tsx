// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render as renderizarSemRota, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { dependencias, forumFalso } from '../forum/dublesParaTeste';
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

const conta = (anonima = true, perfilSocialPendente = false): PortaDeConta => ({
  estado: vi.fn(async () => ({ temSessao: true, anonima, perfilSocialPendente, email: anonima ? undefined : 'b@aue.com' })),
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
    obterMeuPerfilParaEdicao: vi.fn(async () => ({ apelido: 'Betão', handle: 'betao' })),
    alternarSeguir: vi.fn(async () => ({ ok: true, seguindo: true })),
    concluirMeuPerfilSocial: vi.fn(),
    atualizarMeuPerfil: vi.fn(),
    enviarFoto: vi.fn(),
    removerFoto: vi.fn(),
    enviarCapa: vi.fn(),
    removerCapa: vi.fn(),
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

const render = (ui: ReactElement) => renderizarSemRota(<MemoryRouter>{ui}</MemoryRouter>);

const vazia = async () => ({ ok: true as const, valor: { itens: [], proximo: null } });
const dependenciasDoForum = dependencias({
  forum: forumFalso({ listarTopicosDoAutor: vi.fn(vazia), listarRespostasDoAutor: vi.fn(vazia) }),
});

const props = {
  dependenciasDoForum,
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
    // "Não achei" é do cabeçalho: sem abas e sem texto de "sem tópicos ainda".
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByText(/ainda não abriu/)).toBeNull();
  });

  it('cinco abas juntas para o próprio perfil (Curtidos só nele), Resenhas aberta sem parâmetro', async () => {
    render(<TelaPerfil portaPerfil={portaDePerfil()} portaComunidade={comunidade} portaConta={conta(false)} {...props} />);
    const abas = await screen.findAllByRole('tab');
    expect(abas.map((a) => a.textContent)).toEqual(['Resenhas', 'Com áudio', 'Curtidos', 'Tópicos', 'Respostas']);
    expect(screen.getByRole('tab', { name: 'Resenhas' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/resenhas/, { selector: 'span' })).toBeDefined();
  });

  it('perfil de outra pessoa: sem Curtidos; Tópicos pela URL lê pelo @ do servidor', async () => {
    const forum = forumFalso({ listarTopicosDoAutor: vi.fn(vazia), listarRespostasDoAutor: vi.fn(vazia) });
    const feed = { ...comunidade, listarFeed: vi.fn(async () => []) } as typeof comunidade;
    renderizarSemRota(
      <MemoryRouter initialEntries={['/u/betao?aba=topicos']}>
        <TelaPerfil handle="BETAO" portaPerfil={portaDePerfil()} portaComunidade={feed} portaConta={conta(false)} {...props} dependenciasDoForum={dependencias({ forum })} />
      </MemoryRouter>,
    );
    const abas = await screen.findAllByRole('tab');
    expect(abas.map((a) => a.textContent)).toEqual(['Resenhas', 'Com áudio', 'Tópicos', 'Respostas']);
    expect(screen.getByRole('tab', { name: 'Tópicos' }).getAttribute('aria-selected')).toBe('true');
    expect(await screen.findByRole('heading', { name: '@betao ainda não abriu nenhum tópico.' })).toBeDefined();
    expect(forum.listarTopicosDoAutor).toHaveBeenCalledWith('betao', { limite: 30, cursor: null });
    // Aba do fórum aberta: o feed de resenhas nem é lido.
    expect(feed.listarFeed).not.toHaveBeenCalled();
  });

  it('no próprio perfil o vazio de Tópicos fala com a pessoa', async () => {
    renderizarSemRota(
      <MemoryRouter initialEntries={['/perfil?aba=topicos']}>
        <TelaPerfil portaPerfil={portaDePerfil()} portaComunidade={comunidade} portaConta={conta(false)} {...props} />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Você ainda não abriu nenhum tópico.' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Ver comunidades' }).getAttribute('href')).toBe('/comunidades');
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

  it('primeira chegada abre a ficha curta e entra no Bonde só depois de salvar', async () => {
    const concluirMeuPerfilSocial = vi.fn(async () => ({ ok: true as const, perfil: { ...base, souEu: true } }));
    const aoVoltar = vi.fn();
    render(
      <TelaPerfil
        boasVindas
        portaPerfil={portaDePerfil({ concluirMeuPerfilSocial })}
        portaComunidade={comunidade}
        portaConta={conta(false)}
        {...props}
        aoVoltar={aoVoltar}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Seu perfil' })).toBeDefined();
    expect((screen.getByLabelText('Apelido') as HTMLInputElement).value).toBe('Betão');
    expect((screen.getByLabelText('Seu @') as HTMLInputElement).value).toBe('betao');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Feed' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Entrar no Bonde' }));
    await waitFor(() => expect(concluirMeuPerfilSocial).toHaveBeenCalledWith(expect.objectContaining({ apelido: 'Betão', handle: 'betao' })));
    await waitFor(() => expect(aoVoltar).toHaveBeenCalledTimes(1));
  });

  it('primeira chegada mostra erro e não abre o feed se o perfil não salvar', async () => {
    const concluirMeuPerfilSocial = vi.fn(async () => ({ ok: false as const, motivo: 'handleEmUso' as const }));
    const aoVoltar = vi.fn();
    render(
      <TelaPerfil
        boasVindas
        portaPerfil={portaDePerfil({ concluirMeuPerfilSocial })}
        portaComunidade={comunidade}
        portaConta={conta(false)}
        {...props}
        aoVoltar={aoVoltar}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Entrar no Bonde' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Esse @ já é de outra pessoa');
    expect(aoVoltar).not.toHaveBeenCalled();
  });

  it('estado persistente pendente abre a ficha mesmo sem a query de boas-vindas', async () => {
    const portaPerfil = portaDePerfil();
    render(
      <TelaPerfil
        portaPerfil={portaPerfil}
        portaComunidade={comunidade}
        portaConta={conta(false, true)}
        {...props}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Seu perfil' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();
    expect(portaPerfil.obterMeuPerfilParaEdicao).toHaveBeenCalledTimes(1);
    expect(portaPerfil.obterMeuPerfil).not.toHaveBeenCalled();
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

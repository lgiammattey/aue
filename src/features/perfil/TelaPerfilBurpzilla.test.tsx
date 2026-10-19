// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render as renderizarSemRota, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { dependencias, forumFalso } from '../forum/dublesParaTeste';
import { TelaPerfil } from './TelaPerfil';
import type { PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import type { CausoPostado, PortaDeComunidade } from '../../portas/comunidade';
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
    obterMeuPerfilParaEdicao: vi.fn(async () => ({ apelido: 'Betão', handle: 'betao' })),
    alternarSeguir: vi.fn(async () => ({ ok: true, seguindo: true })),
    concluirMeuPerfilSocial: vi.fn(),
    atualizarMeuPerfil: vi.fn(),
    enviarFoto: vi.fn(),
    removerFoto: vi.fn(),
    listarConexoes: vi.fn(async () => []),
    ...sobrepor,
  };
}

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


const ROTULO_SIMBOLO = 'Usuário da casa, Burpzilla';

const causoDaCasa: CausoPostado = {
  id: 'c1',
  comunidadeId: 'x',
  comunidadeSlug: 'feed',
  autorNome: 'Giam',
  autorHandle: 'giam',
  autorHandleDoServidor: true,
  conteudo: 'Burpzilla acordou.',
  reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
  curtidas: 0,
  reposts: 0,
  totalComentarios: 0,
  criadoEm: '2026-08-28T12:00:00Z',
};

function renderizar(perfil: PerfilPublico, causos: CausoPostado[] = []) {
  return render(
    <TelaPerfil
      handle={perfil.handle}
      portaPerfil={portaDePerfil({ obterPerfil: vi.fn(async () => perfil) })}
      portaComunidade={{ ...comunidade, listarFeed: vi.fn(async () => causos) } as unknown as PortaDeComunidade}
      portaConta={conta()}
      {...props}
    />,
  );
}

describe('TelaPerfil: símbolo Burpzilla', () => {
  it('aparece só quando daCasa é true, com nome acessível e sem foco', async () => {
    const { container } = renderizar({ ...base, handle: 'giam', apelido: 'Giam', daCasa: true });
    const simbolo = await screen.findByRole('img', { name: ROTULO_SIMBOLO });
    expect(simbolo.getAttribute('width')).toBe('18');
    expect(simbolo.getAttribute('focusable')).toBe('false');
    expect(simbolo.getAttribute('fill')).toBe('currentColor');
    expect(simbolo.getAttribute('title')).toBeNull();
    expect(simbolo.querySelector('title')).toBeNull();
    expect(container.querySelectorAll(`[aria-label="${ROTULO_SIMBOLO}"]`).length).toBe(1);
  });

  it('não aparece para usuário comum', async () => {
    renderizar(base);
    await screen.findByText('Betão');
    expect(screen.queryByRole('img', { name: ROTULO_SIMBOLO })).toBeNull();
  });

  it('nunca aparece nos cards do perfil, nem do perfil da casa', async () => {
    const { container } = renderizar({ ...base, handle: 'giam', apelido: 'Giam', daCasa: true }, [causoDaCasa]);
    const card = await screen.findByTestId('card-causo-c1');
    expect(card.querySelector('svg[role="img"]')).toBeNull();
    expect(card.textContent).not.toMatch(/Burpzilla\s*$/);
    expect(container.querySelectorAll(`[aria-label="${ROTULO_SIMBOLO}"]`).length).toBe(1);
  });

  it('o perfil da casa não usa o verde elétrico em lugar nenhum', async () => {
    const { container } = renderizar({ ...base, handle: 'giam', apelido: 'Giam', daCasa: true });
    await screen.findByRole('img', { name: ROTULO_SIMBOLO });
    expect(container.innerHTML.toLowerCase()).not.toContain('c6ff00');
    expect(container.querySelector('svg[role="img"]')?.getAttribute('style') ?? '').not.toMatch(/accent|c6ff00/i);
  });
});

describe('TelaPerfil: estados', () => {
  it('carregando é um status educado', async () => {
    let soltar: (p: PerfilPublico) => void = () => undefined;
    const demora = new Promise<PerfilPublico>((r) => {
      soltar = r;
    });
    render(
      <TelaPerfil handle="betao" portaPerfil={portaDePerfil({ obterPerfil: vi.fn(() => demora) })} portaComunidade={comunidade} portaConta={conta()} {...props} />,
    );
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain('Carregando perfil');
    soltar(base);
    await screen.findByText('Betão');
  });

  it('perfil inexistente oferece Voltar ao Bonde', async () => {
    const aoVoltar = vi.fn();
    render(
      <TelaPerfil handle="fantasma" portaPerfil={portaDePerfil({ obterPerfil: vi.fn(async () => null) })} portaComunidade={comunidade} portaConta={conta()} {...props} aoVoltar={aoVoltar} />,
    );
    expect(await screen.findByText('Esse arrotador não existe.')).toBeDefined();
    expect(screen.queryByText(/Não deu para abrir o perfil/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao Bonde' }));
    expect(aoVoltar).toHaveBeenCalled();
  });

  it('falha de rede é outro estado: não diz que não existe, e tenta de novo', async () => {
    const aoVoltar = vi.fn();
    const obterPerfil = vi.fn().mockRejectedValueOnce(new Error('sem rede')).mockResolvedValue(base);
    render(
      <TelaPerfil handle="betao" portaPerfil={portaDePerfil({ obterPerfil })} portaComunidade={comunidade} portaConta={conta()} {...props} aoVoltar={aoVoltar} />,
    );
    expect(await screen.findByText('Não deu para abrir o perfil. Tenta de novo.')).toBeDefined();
    expect(screen.queryByText('Esse arrotador não existe.')).toBeNull();

    const tentar = screen.getByRole('button', { name: 'Tentar de novo' });
    expect(tentar.style.minHeight).toBe('44px');
    const voltar = screen.getAllByRole('button', { name: 'Voltar' }).find((b) => b.textContent === 'Voltar');
    fireEvent.click(voltar!);
    expect(aoVoltar).toHaveBeenCalled();

    fireEvent.click(tentar);
    expect(await screen.findByText('Betão')).toBeDefined();
    expect(obterPerfil).toHaveBeenCalledTimes(2);
  });
});

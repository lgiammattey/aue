// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CausoPostado, PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeForum, ReacoesDoTopico } from '../../portas/forum';
import type { ItemDoFeed } from './tipos';
import { engajamentoDoCauso, useEngajamento } from './useEngajamento';

afterEach(cleanup);

const ID = '11111111-1111-4111-8111-111111111111';
const topico: ItemDoFeed = {
  id: `topico-${ID}`, tipo: 'topico', comunidadeSlug: 'eu-arroto-e-dai', titulo: 'T', corpo: '',
  autorNome: 'Ana', criadoEm: '2026-10-20T10:00:00Z', respostasTotal: 0,
};
const causoItem: ItemDoFeed = { ...topico, id: `causo-${ID}`, tipo: 'causo' };

const reacoes = (like: number, minhas: ReacoesDoTopico['minhas'] = []): ReacoesDoTopico => ({
  total: { like, fogo: 0, nojo: 0, trofeu: 0 }, minhas,
});

function montar(forum: Partial<PortaDeForum>, opcoes: { auth?: boolean; comunidade?: Partial<PortaDeComunidade> } = {}) {
  const aoPedirEntrada = vi.fn();
  const exibirToast = vi.fn();
  const itens = [topico, causoItem];
  const retorno = renderHook(() => useEngajamento({
    forum: forum as PortaDeForum,
    comunidadePort: (opcoes.comunidade ?? {}) as PortaDeComunidade,
    estaAutenticado: opcoes.auth ?? true,
    aoPedirEntrada,
    exibirToast,
    itens,
  }));
  return { ...retorno, aoPedirEntrada, exibirToast };
}

describe('useEngajamento', () => {
  it('busca uma vez as contagens dos tópicos da tela e mostra o que o servidor disse', async () => {
    const contar = vi.fn(async () => ({ ok: true as const, valor: { [ID]: reacoes(4, ['like']) } }));
    const { result } = montar({ contarReacoesDosTopicos: contar, alternarReacaoDoTopico: vi.fn() });
    await waitFor(() => expect(result.current.propsDeEngajamento(topico).reacoes.like).toBe(4));
    expect(result.current.propsDeEngajamento(topico).minhas).toEqual(['like']);
    expect(contar).toHaveBeenCalledTimes(1);
    expect(contar).toHaveBeenCalledWith([ID]);
  });

  it('reagir em tópico chama o servidor e relê a contagem (não soma na tela)', async () => {
    const contar = vi.fn()
      .mockResolvedValueOnce({ ok: true, valor: {} })
      .mockResolvedValueOnce({ ok: true, valor: { [ID]: reacoes(1, ['like']) } });
    const alternar = vi.fn(async () => ({ ok: true as const, valor: true }));
    const { result } = montar({ contarReacoesDosTopicos: contar, alternarReacaoDoTopico: alternar });
    await waitFor(() => expect(contar).toHaveBeenCalledTimes(1));
    await act(async () => result.current.propsDeEngajamento(topico).aoCurtir?.());
    expect(alternar).toHaveBeenCalledWith(ID, 'like');
    await waitFor(() => expect(result.current.propsDeEngajamento(topico).reacoes.like).toBe(1));
    expect(result.current.propsDeEngajamento(topico).minhas).toContain('like');
  });

  it('falha do servidor mostra o motivo e não mexe na contagem', async () => {
    const contar = vi.fn(async () => ({ ok: true as const, valor: { [ID]: reacoes(2) } }));
    const { result, exibirToast } = montar({
      contarReacoesDosTopicos: contar,
      alternarReacaoDoTopico: vi.fn(async () => ({ ok: false as const, motivo: 'semConfirmacao' as const })),
    });
    await waitFor(() => expect(result.current.propsDeEngajamento(topico).reacoes.like).toBe(2));
    await act(async () => result.current.propsDeEngajamento(topico).aoReagir?.('fogo'));
    expect(exibirToast).toHaveBeenCalledWith('Não deu para registrar sua reação agora.');
    expect(result.current.propsDeEngajamento(topico).reacoes.fogo).toBe(0);
    expect(result.current.propsDeEngajamento(topico).reacoes.like).toBe(2);
  });

  it('passou do limite: mostra o aviso próprio e não mexe na contagem', async () => {
    const contar = vi.fn(async () => ({ ok: true as const, valor: { [ID]: reacoes(2) } }));
    const { result, exibirToast } = montar({
      contarReacoesDosTopicos: contar,
      alternarReacaoDoTopico: vi.fn(async () => ({ ok: false as const, motivo: 'limiteDeFrequencia' as const })),
      alternarSalvo: vi.fn(async () => ({ ok: false as const, motivo: 'limiteDeFrequencia' as const })),
    });
    await waitFor(() => expect(result.current.propsDeEngajamento(topico).reacoes.like).toBe(2));
    await act(async () => result.current.propsDeEngajamento(topico).aoCurtir?.());
    await act(async () => result.current.propsDeEngajamento(topico).aoAlternarSalvar?.());
    expect(exibirToast).toHaveBeenCalledWith('Muita reação de uma vez. Tenta daqui a pouco.');
    expect(exibirToast).toHaveBeenCalledWith('Muita coisa de uma vez. Tenta daqui a pouco.');
    expect(result.current.propsDeEngajamento(topico).reacoes.like).toBe(2);
  });

  it('visitante é levado a entrar e nada vai ao servidor', async () => {
    const alternar = vi.fn();
    const alternarSalvo = vi.fn();
    const { result, aoPedirEntrada } = montar(
      { contarReacoesDosTopicos: vi.fn(async () => ({ ok: true as const, valor: {} })), alternarReacaoDoTopico: alternar, alternarSalvo },
      { auth: false },
    );
    await act(async () => result.current.propsDeEngajamento(topico).aoCurtir?.());
    await act(async () => result.current.propsDeEngajamento(topico).aoAlternarSalvar?.());
    expect(aoPedirEntrada).toHaveBeenNthCalledWith(1, 'Entre na sua conta para reagir.');
    expect(aoPedirEntrada).toHaveBeenNthCalledWith(2, 'Entre na sua conta para salvar.');
    expect(alternar).not.toHaveBeenCalled();
    expect(alternarSalvo).not.toHaveBeenCalled();
  });

  it('salvar: parte do que o servidor guardou, alterna pela resposta e avisa', async () => {
    const alternarSalvo = vi.fn(async () => ({ ok: true as const, valor: false }));
    const { result, exibirToast } = montar({
      listarIdsSalvos: vi.fn(async () => ({ ok: true as const, valor: [{ tipo: 'topico' as const, id: ID }] })),
      alternarSalvo,
      contarReacoesDosTopicos: vi.fn(async () => ({ ok: true as const, valor: {} })),
    });
    await waitFor(() => expect(result.current.propsDeEngajamento(topico).salvo).toBe(true));
    expect(result.current.propsDeEngajamento(causoItem).salvo).toBe(false);
    await act(async () => result.current.propsDeEngajamento(topico).aoAlternarSalvar?.());
    expect(alternarSalvo).toHaveBeenCalledWith('topico', ID);
    await waitFor(() => expect(result.current.propsDeEngajamento(topico).salvo).toBe(false));
    expect(exibirToast).toHaveBeenCalledWith('Removido dos salvos.');
  });

  it('falha ao salvar não troca o estado e diz isso', async () => {
    const { result, exibirToast } = montar({
      listarIdsSalvos: vi.fn(async () => ({ ok: true as const, valor: [] })),
      alternarSalvo: vi.fn(async () => ({ ok: false as const, motivo: 'semConfirmacao' as const })),
      contarReacoesDosTopicos: vi.fn(async () => ({ ok: true as const, valor: {} })),
    });
    await act(async () => result.current.propsDeEngajamento(topico).aoAlternarSalvar?.());
    expect(exibirToast).toHaveBeenCalledWith('Não deu para salvar agora.');
    expect(result.current.propsDeEngajamento(topico).salvo).toBe(false);
  });

  it('causo: curtir usa a porta de comunidade e relê o causo inteiro', async () => {
    const causo = {
      id: ID, curtidas: 7, curtidoPorMim: true, minhaReacao: 'fogo', reacoes: { fogo: 3, nojo: 0, trofeu: 0 },
    } as unknown as CausoPostado;
    const alternarCurtida = vi.fn(async () => ({ ok: true, curtidas: 7, curtido: true }));
    const obterCauso = vi.fn(async () => causo);
    const { result } = montar(
      { contarReacoesDosTopicos: vi.fn(async () => ({ ok: true as const, valor: {} })), alternarReacaoDoTopico: vi.fn() },
      { comunidade: { alternarCurtida, obterCauso } },
    );
    await act(async () => result.current.propsDeEngajamento(causoItem).aoCurtir?.());
    expect(alternarCurtida).toHaveBeenCalledWith(ID);
    await waitFor(() => expect(result.current.propsDeEngajamento(causoItem).reacoes.like).toBe(7));
    expect(result.current.propsDeEngajamento(causoItem).minhas).toEqual(['like', 'fogo']);
  });

  it('engajamentoDoCauso traduz contagens e marcas', () => {
    const c = { curtidas: 2, curtidoPorMim: false, minhaReacao: 'trofeu', reacoes: { fogo: 1, nojo: 2, trofeu: 3 } } as unknown as CausoPostado;
    expect(engajamentoDoCauso(c)).toEqual({ like: 2, fogo: 1, nojo: 2, trofeu: 3, minhas: ['trofeu'] });
  });

  it('sem a capacidade na porta, o botão nem é oferecido', () => {
    const { result } = montar({});
    expect(result.current.propsDeEngajamento(topico).aoCurtir).toBeUndefined();
    expect(result.current.propsDeEngajamento(topico).aoAlternarSalvar).toBeUndefined();
  });
});

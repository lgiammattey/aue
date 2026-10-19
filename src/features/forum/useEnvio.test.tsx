// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import type { ResultadoDaEscrita } from '../../portas/forum';
import { useEnvio } from './useEnvio';

afterEach(cleanup);

const ok: ResultadoDaEscrita<string> = { ok: true, valor: 'feito' };
const recusado: ResultadoDaEscrita<string> = { ok: false, motivo: 'falhou' };

function pendente() {
  let soltar!: (r: ResultadoDaEscrita<string>) => void;
  const promessa = new Promise<ResultadoDaEscrita<string>>((resolve) => (soltar = resolve));
  return { promessa, soltar };
}

describe('useEnvio: trava de duplo toque', () => {
  it('segundo envio enquanto o primeiro está no ar é ignorado (null) e não chama a ação', async () => {
    const { result } = renderHook(() => useEnvio());
    const p = pendente();
    const acao = vi.fn(() => p.promessa);
    let primeiro!: Promise<ResultadoDaEscrita<string> | null>;
    let segundo!: Promise<ResultadoDaEscrita<string> | null>;
    act(() => {
      primeiro = result.current.enviar(acao);
      segundo = result.current.enviar(acao);
    });
    expect(await segundo).toBeNull();
    expect(acao).toHaveBeenCalledTimes(1);
    expect(result.current.enviando).toBe(true);
    await act(async () => p.soltar(ok));
    expect(await primeiro).toEqual(ok);
    expect(result.current.enviando).toBe(false);
  });

  it('com falha, solta a trava: dá pra tentar de novo, e só então a ação roda outra vez', async () => {
    const { result } = renderHook(() => useEnvio());
    const acao = vi.fn().mockResolvedValueOnce(recusado).mockResolvedValueOnce(ok);
    let r1: ResultadoDaEscrita<string> | null = null;
    await act(async () => {
      r1 = await result.current.enviar(acao);
    });
    expect(r1).toEqual(recusado);
    expect(result.current.enviando).toBe(false);
    let r2: ResultadoDaEscrita<string> | null = null;
    await act(async () => {
      r2 = await result.current.enviar(acao);
    });
    expect(r2).toEqual(ok);
    expect(acao).toHaveBeenCalledTimes(2);
  });

  it('travarSeOk: depois do ok a trava NÃO solta, nem na mesma volta do laço de eventos', async () => {
    const { result } = renderHook(() => useEnvio());
    const acao = vi.fn(async () => ok);
    await act(async () => {
      await result.current.enviar(acao, { travarSeOk: true });
    });
    // Entre o ok e a tela sair do ar ainda cabe um toque: ele não pode criar o segundo.
    let terceiro: ResultadoDaEscrita<string> | null = recusado;
    await act(async () => {
      terceiro = await result.current.enviar(acao, { travarSeOk: true });
    });
    expect(terceiro).toBeNull();
    expect(acao).toHaveBeenCalledTimes(1);
    expect(result.current.enviando).toBe(true);
  });

  it('travarSeOk não trava a falha: só o sucesso', async () => {
    const { result } = renderHook(() => useEnvio());
    const acao = vi.fn().mockResolvedValueOnce(recusado).mockResolvedValueOnce(ok);
    await act(async () => {
      await result.current.enviar(acao, { travarSeOk: true });
    });
    expect(result.current.enviando).toBe(false);
    await act(async () => {
      await result.current.enviar(acao, { travarSeOk: true });
    });
    expect(acao).toHaveBeenCalledTimes(2);
  });

  it('exceção da porta vira semConfirmacao (pode ter gravado), nunca sucesso nem silêncio', async () => {
    const { result } = renderHook(() => useEnvio());
    let r: ResultadoDaEscrita<string> | null = null;
    await act(async () => {
      r = await result.current.enviar(async () => {
        throw new Error('rede');
      });
    });
    expect(r).toEqual({ ok: false, motivo: 'semConfirmacao' });
    expect(result.current.enviando).toBe(false);
  });
});

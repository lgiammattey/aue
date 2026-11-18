import { describe, expect, it } from 'vitest';
import { wavDaEmissao } from './wavDaEmissao';

describe('wavDaEmissao', () => {
  it('gera WAV mono reproduzível com apenas as amostras recebidas', async () => {
    const emissao = new Float32Array([-1, -0.5, 0, 0.5, 1]);
    const arquivo = wavDaEmissao(emissao, 8000);
    const bytes = await arquivo.arrayBuffer();
    const dados = new DataView(bytes);
    const texto = (inicio: number, tamanho: number) => String.fromCharCode(...new Uint8Array(bytes, inicio, tamanho));
    expect(arquivo.type).toBe('audio/wav');
    expect(texto(0, 4)).toBe('RIFF');
    expect(dados.getUint32(4, true)).toBe(bytes.byteLength - 8);
    expect(texto(8, 4)).toBe('WAVE');
    expect(texto(12, 4)).toBe('fmt ');
    expect(dados.getUint16(20, true)).toBe(1);
    expect(dados.getUint16(22, true)).toBe(1);
    expect(dados.getUint32(24, true)).toBe(8000);
    expect(dados.getUint32(28, true)).toBe(16000);
    expect(dados.getUint16(32, true)).toBe(2);
    expect(dados.getUint16(34, true)).toBe(16);
    expect(texto(36, 4)).toBe('data');
    expect(dados.getUint32(40, true)).toBe(emissao.length * 2);
    expect(Array.from({ length: emissao.length }, (_, i) => dados.getInt16(44 + 2 * i, true)))
      .toEqual([-32768, -16384, 0, 16384, 32767]);
  });

  it('limita overshoot finito ao intervalo PCM sem distorcer o cabeçalho', async () => {
    const dados = new DataView(await wavDaEmissao(new Float32Array([-1.2, 1.2]), 48000).arrayBuffer());
    expect(dados.getInt16(44, true)).toBe(-32768);
    expect(dados.getInt16(46, true)).toBe(32767);
  });

  it('rejeita dados inválidos, vazios e gravações fora do limite', () => {
    expect(() => wavDaEmissao(new Float32Array(), 48000)).toThrow();
    expect(() => wavDaEmissao(new Float32Array([NaN]), 48000)).toThrow();
    expect(() => wavDaEmissao(new Float32Array([Infinity]), 48000)).toThrow();
    expect(() => wavDaEmissao(new Float32Array([0]), 0)).toThrow();
    expect(() => wavDaEmissao(new Float32Array([0]), 48000.5)).toThrow();
    expect(() => wavDaEmissao(new Float32Array(10501), 1000)).toThrow();
  });
});

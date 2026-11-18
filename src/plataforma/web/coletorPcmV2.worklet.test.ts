import { afterEach, expect, it, vi } from 'vitest';
import { wavDaEmissao } from './wavDaEmissao';

type ColetorTeste = {
  port: { onmessage: ((evento: { data: string }) => void) | null; postMessage: ReturnType<typeof vi.fn> };
  process: (inputs: Float32Array[][]) => boolean;
};

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

it('divide o PCM na amostra de calibração e conserva a folga para o callback de limite', async () => {
  let Construtor!: new () => ColetorTeste;
  vi.stubGlobal('sampleRate', 1000);
  vi.stubGlobal('AudioWorkletProcessor', class { port = { onmessage: null, postMessage: vi.fn() }; });
  vi.stubGlobal('registerProcessor', (_nome: string, classe: new () => ColetorTeste) => { Construtor = classe; });
  // @ts-expect-error O módulo é executado pelo navegador na thread de áudio.
  await import('./coletorPcmV2.worklet.js');
  const coletor = new Construtor();
  const ambiente = new Float32Array(500).fill(0.01);
  const emissao = new Float32Array(10_200).fill(0.1);
  coletor.process([[ambiente]]);
  expect(coletor.port.postMessage).toHaveBeenCalledWith({ tipo: 'calibrado' });
  coletor.process([[emissao]]);
  expect(coletor.port.postMessage).toHaveBeenCalledWith({ tipo: 'limite' });
  coletor.port.onmessage?.({ data: 'finalizar' });
  const [dados] = coletor.port.postMessage.mock.calls.at(-1)!;
  expect(dados.ambiente).toHaveLength(500);
  expect(dados.emissao).toHaveLength(10_200);
  expect(dados.excedeu).toBe(false);
});

it('declara excesso quando não é possível preservar mais amostras sem limite de memória', async () => {
  let Construtor!: new () => ColetorTeste;
  vi.stubGlobal('sampleRate', 1000);
  vi.stubGlobal('AudioWorkletProcessor', class { port = { onmessage: null, postMessage: vi.fn() }; });
  vi.stubGlobal('registerProcessor', (_nome: string, classe: new () => ColetorTeste) => { Construtor = classe; });
  // @ts-expect-error O módulo é executado pelo navegador na thread de áudio.
  await import('./coletorPcmV2.worklet.js');
  const coletor = new Construtor();
  coletor.process([[new Float32Array(11_001)]]);
  coletor.port.onmessage?.({ data: 'finalizar' });
  const [dados] = coletor.port.postMessage.mock.calls.at(-1)!;
  expect(dados.emissao).toHaveLength(10_500);
  expect(dados.excedeu).toBe(true);
});

it('não coloca no WAV os quadros de calibração que terminam no mesmo bloco', async () => {
  let Construtor!: new () => ColetorTeste;
  vi.stubGlobal('sampleRate', 1000);
  vi.stubGlobal('AudioWorkletProcessor', class { port = { onmessage: null, postMessage: vi.fn() }; });
  vi.stubGlobal('registerProcessor', (_nome: string, classe: new () => ColetorTeste) => { Construtor = classe; });
  // @ts-expect-error O módulo é executado pelo navegador na thread de áudio.
  await import('./coletorPcmV2.worklet.js');
  const coletor = new Construtor();
  coletor.process([[new Float32Array(498).fill(0.75)]]);
  coletor.process([[new Float32Array([0.75, 0.75, 0.25, -0.25, 0.5])]]);
  coletor.port.onmessage?.({ data: 'finalizar' });
  const [dados] = coletor.port.postMessage.mock.calls.at(-1)!;
  expect(dados.ambiente).toHaveLength(500);
  const wav = new DataView(await wavDaEmissao(dados.emissao, dados.sampleRate).arrayBuffer());
  expect(wav.getUint32(40, true)).toBe(6);
  expect([wav.getInt16(44, true), wav.getInt16(46, true), wav.getInt16(48, true)]).toEqual([8192, -8192, 16384]);
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarCapturaPcmV2 } from './capturaPcmV2';

const trilha = () => ({ stop: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() });
const no = () => ({ connect: vi.fn(), disconnect: vi.fn() });
class ContextoFalso {
  static ultimo: ContextoFalso;
  state: AudioContextState = 'running';
  onstatechange: (() => void) | null = null;
  destination = no();
  audioWorklet = { addModule: vi.fn(async () => {}) };
  gain = { ...no(), gain: { value: 1 } };
  fonte = no();
  analisador = { ...no(), fftSize: 2048, getFloatTimeDomainData: vi.fn() };
  constructor() { ContextoFalso.ultimo = this; }
  resume = vi.fn(async () => {});
  close = vi.fn(async () => {});
  createMediaStreamSource() { return this.fonte; }
  createAnalyser() { return this.analisador; }
  createGain() { return this.gain; }
}
class ColetorFalso {
  static ultimo: ColetorFalso;
  onprocessorerror: (() => void) | null = null;
  port = { onmessage: null as ((e: { data: unknown }) => void) | null, postMessage: vi.fn(), close: vi.fn() };
  connect = vi.fn();
  disconnect = vi.fn();
  constructor() { ColetorFalso.ultimo = this; }
  enviar(data: unknown) { this.port.onmessage?.({ data }); }
}
class GravadorFalso {
  static ultimo: GravadorFalso;
  static isTypeSupported = vi.fn((tipo: string) => tipo === 'audio/mp4');
  static opcoes: MediaRecorderOptions | undefined;
  static rejeitaOpcoes = false;
  state = 'inactive';
  mimeType = 'audio/mp4';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(_stream: MediaStream, opcoes?: MediaRecorderOptions) { if (opcoes && GravadorFalso.rejeitaOpcoes) throw new Error('formato indisponível'); GravadorFalso.ultimo = this; GravadorFalso.opcoes = opcoes; }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; }
  finalizar() { this.ondataavailable?.({ data: new Blob(['fim'], { type: this.mimeType }) }); this.onstop?.(); }
}
const eventos = () => ({ aoCalibrar: vi.fn(), aoLimite: vi.fn(), aoErro: vi.fn() });
function instalar(pedir: () => Promise<unknown>) {
  vi.stubGlobal('AudioContext', ContextoFalso);
  vi.stubGlobal('AudioWorkletNode', ColetorFalso);
  vi.stubGlobal('MediaRecorder', GravadorFalso);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: pedir } });
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); GravadorFalso.rejeitaOpcoes = false; GravadorFalso.isTypeSupported.mockReset(); GravadorFalso.isTypeSupported.mockImplementation((tipo) => tipo === 'audio/mp4'); });

describe('captura PCM v2', () => {
  it('usa uma fonte, mantém a saída muda e entrega os dois sinais e o último bloco do mesmo gravador', async () => {
    const track = trilha();
    const pedir = vi.fn(async () => ({ getTracks: () => [track] }));
    instalar(pedir);
    const captura = criarCapturaPcmV2();
    const notificacoes = eventos();
    expect(await captura.iniciar(notificacoes)).toEqual({ ok: true });
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(GravadorFalso.isTypeSupported).toHaveBeenCalledWith('audio/mp4');
    expect(GravadorFalso.opcoes).toEqual({ mimeType: 'audio/mp4' });
    expect(ContextoFalso.ultimo.gain.gain.value).toBe(0);
    ColetorFalso.ultimo.enviar({ tipo: 'calibrado' });
    expect(notificacoes.aoCalibrar).toHaveBeenCalledOnce();
    const resultado = captura.parar();
    expect(track.stop).toHaveBeenCalledOnce();
    expect(ColetorFalso.ultimo.port.postMessage).toHaveBeenCalledWith('finalizar');
    GravadorFalso.ultimo.finalizar();
    ColetorFalso.ultimo.enviar({ tipo: 'dados', ambiente: new Float32Array(500).fill(0.01), emissao: new Float32Array([0.2]), sampleRate: 1000, excedeu: false });
    const valor = await resultado;
    expect(valor.ok).toBe(true);
    if (!valor.ok) return;
    expect(valor.audio.size).toBe(3);
    expect(valor.formato).toBe('audio/mp4');
    expect(valor.sampleRate).toBe(1000);
    expect([...valor.ambiente]).toHaveLength(500);
    expect([...valor.emissao]).toHaveLength(1);
    expect(ContextoFalso.ultimo.close).toHaveBeenCalledOnce();
  });

  it('deixa o navegador escolher quando não há formato declarado como suportado', async () => {
    GravadorFalso.isTypeSupported.mockReturnValue(false);
    const track = trilha();
    instalar(async () => ({ getTracks: () => [track] }));
    const captura = criarCapturaPcmV2();
    expect(await captura.iniciar(eventos())).toEqual({ ok: true });
    expect(GravadorFalso.opcoes).toBeUndefined();
    captura.cancelar();
  });

  it('recua para o formato padrão quando o navegador rejeita um tipo anunciado', async () => {
    GravadorFalso.rejeitaOpcoes = true;
    const track = trilha();
    instalar(async () => ({ getTracks: () => [track] }));
    const captura = criarCapturaPcmV2();
    expect(await captura.iniciar(eventos())).toEqual({ ok: true });
    expect(GravadorFalso.opcoes).toBeUndefined();
    captura.cancelar();
  });

  it('informa se o gravador termina espontaneamente', async () => {
    const track = trilha();
    instalar(async () => ({ getTracks: () => [track] }));
    const captura = criarCapturaPcmV2();
    const notificacoes = eventos();
    await captura.iniciar(notificacoes);
    GravadorFalso.ultimo.onstop?.();
    expect(notificacoes.aoErro).toHaveBeenCalledWith('gravacao_incompleta');
    expect(track.stop).toHaveBeenCalled();
  });

  it('solta uma permissão concedida depois do cancelamento', async () => {
    let liberar!: (valor: unknown) => void;
    const track = trilha();
    instalar(() => new Promise((resolve) => { liberar = resolve; }));
    const captura = criarCapturaPcmV2();
    const inicio = captura.iniciar(eventos());
    captura.cancelar();
    liberar({ getTracks: () => [track] });
    expect(await inicio).toEqual({ ok: false, motivo: 'cancelada' });
    expect(track.stop).toHaveBeenCalledOnce();
    expect(ContextoFalso.ultimo.close).toHaveBeenCalledOnce();
  });

  it('libera a trilha se a inicialização do Worklet ficar suspensa', async () => {
    vi.useFakeTimers();
    const track = trilha();
    instalar(async () => {
      ContextoFalso.ultimo.audioWorklet.addModule = vi.fn(() => new Promise<void>(() => {}));
      return { getTracks: () => [track] };
    });
    const captura = criarCapturaPcmV2();
    const iniciando = captura.iniciar(eventos());
    await vi.advanceTimersByTimeAsync(3000);
    expect(await iniciando).toEqual({ ok: false, motivo: 'pcm_indisponivel' });
    expect(track.stop).toHaveBeenCalledOnce();
  });

  it('não entrega sucesso ao parar durante a calibração', async () => {
    const track = trilha();
    instalar(async () => ({ getTracks: () => [track] }));
    const captura = criarCapturaPcmV2();
    await captura.iniciar(eventos());
    const resultado = captura.parar();
    GravadorFalso.ultimo.finalizar();
    ColetorFalso.ultimo.enviar({ tipo: 'dados', ambiente: new Float32Array(250), emissao: new Float32Array(0), sampleRate: 1000, excedeu: false });
    expect(await resultado).toEqual({ ok: false, motivo: 'gravacao_incompleta' });
    expect(track.stop).toHaveBeenCalled();
  });

  it('não finge que houve calibração quando o grafo não entrega amostras', async () => {
    vi.useFakeTimers();
    const track = trilha();
    instalar(async () => ({ getTracks: () => [track] }));
    const captura = criarCapturaPcmV2();
    const notificacoes = eventos();
    await captura.iniciar(notificacoes);
    await vi.advanceTimersByTimeAsync(3000);
    expect(notificacoes.aoErro).toHaveBeenCalledWith('pcm_indisponivel');
    expect(notificacoes.aoCalibrar).not.toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalledOnce();
  });

  it('devolve erro se o PCM não chega após finalizar e solta o microfone antes do timeout', async () => {
    vi.useFakeTimers();
    const track = trilha();
    instalar(async () => ({ getTracks: () => [track] }));
    const captura = criarCapturaPcmV2();
    await captura.iniciar(eventos());
    ColetorFalso.ultimo.enviar({ tipo: 'calibrado' });
    const resultado = captura.parar();
    expect(track.stop).toHaveBeenCalledOnce();
    GravadorFalso.ultimo.finalizar();
    await vi.advanceTimersByTimeAsync(3000);
    expect(await resultado).toEqual({ ok: false, motivo: 'pcm_indisponivel' });
  });

  it('cancela uma finalização pendente sem esperar eventos que talvez não cheguem', async () => {
    const track = trilha();
    instalar(async () => ({ getTracks: () => [track] }));
    const captura = criarCapturaPcmV2();
    await captura.iniciar(eventos());
    const resultado = captura.parar();
    captura.cancelar();
    expect(await resultado).toEqual({ ok: false, motivo: 'cancelada' });
  });
});

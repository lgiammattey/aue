// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarGravacaoLivreDoForum, DURACAO_MAXIMA_DA_GRAVACAO_LIVRE_MS } from './gravacaoLivreDoForum';

function trilha() { return { stop: vi.fn() }; }
function streamFalso(trilhas = [trilha()]) { return { getTracks: () => trilhas } as unknown as MediaStream; }

class GravadorFalso {
  static ultimo: GravadorFalso | null = null;
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/mp4';
  ondataavailable: ((evento: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  start() { this.state = 'recording'; GravadorFalso.ultimo = this; }
  stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['voz'], { type: this.mimeType }) }); this.onstop?.(); }
}

function navegador(getUserMedia: () => Promise<MediaStream>) {
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  vi.stubGlobal('MediaRecorder', GravadorFalso);
}

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); GravadorFalso.ultimo = null; });

describe('gravação livre do composer', () => {
  it('entrega Blob e duração real ao parar manualmente, e solta o stream', async () => {
    vi.useFakeTimers();
    const faixa = trilha();
    navegador(async () => streamFalso([faixa]));
    const gravacao = criarGravacaoLivreDoForum();
    const inicio = await gravacao.iniciar();
    if (!inicio.ok) throw new Error('o microfone devia iniciar');
    expect(gravacao.estaGravando()).toBe(true);
    vi.advanceTimersByTime(1_234);
    gravacao.parar();
    const fim = await inicio.conclusao;
    expect(fim).toMatchObject({ ok: true, encerramento: 'manual' });
    if (!fim.ok) return;
    expect(fim.audio.formato).toBe('audio/mp4');
    expect(fim.audio.mimeParaEnvio).toBe('audio/mp4');
    expect(fim.audio.duracaoMs).toBe(1234);
    expect(fim.audio.dados).toBeInstanceOf(Blob);
    expect(faixa.stop).toHaveBeenCalledOnce();
    expect(gravacao.estaGravando()).toBe(false);
  });

  it('preserva o formato cru e normaliza codecs para a base aceita pelo upload', async () => {
    navegador(async () => streamFalso());
    const gravacao = criarGravacaoLivreDoForum();
    const inicio = await gravacao.iniciar();
    if (!inicio.ok) throw new Error('o microfone devia iniciar');
    GravadorFalso.ultimo!.mimeType = 'audio/webm;codecs=opus';
    gravacao.parar();
    const fim = await inicio.conclusao;
    if (!fim.ok) throw new Error('devia entregar áudio');
    expect(fim.audio.formato).toBe('audio/webm;codecs=opus');
    expect(fim.audio.mimeParaEnvio).toBe('audio/webm');
    expect(fim.audio.dados.type).toBe('audio/webm');
  });

  it('fecha sozinho aos 60 s e devolve áudio aproveitável com motivo explícito', async () => {
    vi.useFakeTimers();
    navegador(async () => streamFalso());
    const inicio = await criarGravacaoLivreDoForum().iniciar();
    if (!inicio.ok) throw new Error('o microfone devia iniciar');
    vi.advanceTimersByTime(DURACAO_MAXIMA_DA_GRAVACAO_LIVRE_MS);
    const fim = await inicio.conclusao;
    expect(fim).toMatchObject({ ok: true, encerramento: 'limite' });
    if (fim.ok) expect(fim.audio.duracaoMs).toBe(DURACAO_MAXIMA_DA_GRAVACAO_LIVRE_MS);
  });

  it('traduz permissão negada, ausência de aparelho e APIs ausentes sem fingir gravação', async () => {
    navegador(async () => { throw Object.assign(new Error('não'), { name: 'NotAllowedError' }); });
    expect(await criarGravacaoLivreDoForum().iniciar()).toEqual({ ok: false, motivo: 'negado' });
    navegador(async () => { throw Object.assign(new Error('nada'), { name: 'NotFoundError' }); });
    expect(await criarGravacaoLivreDoForum().iniciar()).toEqual({ ok: false, motivo: 'indisponivel' });
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('MediaRecorder', undefined);
    expect(await criarGravacaoLivreDoForum().iniciar()).toEqual({ ok: false, motivo: 'indisponivel' });
  });

  it('identifica quando o endereço HTTP não pode usar o microfone', async () => {
    vi.stubGlobal('isSecureContext', false);
    navegador(async () => streamFalso());

    expect(await criarGravacaoLivreDoForum().iniciar()).toEqual({ ok: false, motivo: 'inseguro' });
  });

  it('cancelar não entrega áudio e também para a trilha', async () => {
    const faixa = trilha();
    navegador(async () => streamFalso([faixa]));
    const gravacao = criarGravacaoLivreDoForum();
    const inicio = await gravacao.iniciar();
    if (!inicio.ok) throw new Error('o microfone devia iniciar');
    gravacao.cancelar();
    // O cleanup de desmontagem pode vir logo depois do botão Cancelar.
    gravacao.cancelar();
    await expect(inicio.conclusao).resolves.toEqual({ ok: false, motivo: 'cancelado' });
    expect(faixa.stop).toHaveBeenCalledOnce();
  });
});

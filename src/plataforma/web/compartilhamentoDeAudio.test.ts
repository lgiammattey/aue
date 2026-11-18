// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarCompartilhamentoDeAudioWeb } from './compartilhamentoDeAudio';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
function navegador(aceita: boolean, compartilhar = vi.fn(async (_pedido: ShareData) => {})) {
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: vi.fn(() => aceita) });
  Object.defineProperty(navigator, 'share', { configurable: true, value: compartilhar });
  return compartilhar;
}
describe('compartilhamento do arquivo de áudio', () => {
  it.each([['audio/wav', 'aue-gravacao.wav'], ['audio/webm;codecs=opus', 'aue-gravacao.webm'], ['audio/mp4', 'aue-gravacao.m4a'], ['audio/exemplo', 'aue-gravacao.bin']])('preserva MIME %s e usa extensão adequada', async (mime, nome) => {
    const share = navegador(true);
    const audio = new Blob(['som'], { type: mime });
    expect(await criarCompartilhamentoDeAudioWeb().compartilhar(audio)).toBe('aberto');
    const arquivo = share.mock.calls[0][0].files?.[0];
    expect(arquivo?.name).toBe(nome);
    expect(arquivo?.type).toBe(mime);
    expect(arquivo?.size).toBe(audio.size);
  });
  it('não troca arquivo por texto se o navegador não suporta esse tipo', async () => {
    const share = navegador(false);
    expect(await criarCompartilhamentoDeAudioWeb().compartilhar(new Blob(['a'], { type: 'audio/wav' }))).toBe('indisponivel');
    expect(share).not.toHaveBeenCalled();
  });
  it('distingue cancelamento de falha real', async () => {
    const share = navegador(true, vi.fn(async (_pedido: ShareData) => { throw new DOMException('fechado', 'AbortError'); }));
    const adapter = criarCompartilhamentoDeAudioWeb();
    expect(await adapter.compartilhar(new Blob(['a']))).toBe('cancelado');
    share.mockRejectedValueOnce(new Error('falhou'));
    expect(await adapter.compartilhar(new Blob(['a']))).toBe('falhou');
  });
  it('solicita download e libera o endereço temporário', () => {
    vi.useFakeTimers();
    const criar = vi.fn(() => 'blob:teste');
    const liberar = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: criar });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: liberar });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { expect(this.download).toBe('aue-gravacao.webm'); });
    expect(criarCompartilhamentoDeAudioWeb().baixar(new Blob(['a'], { type: 'audio/webm' }))).toBe(true);
    expect(click).toHaveBeenCalledOnce();
    expect(liberar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(liberar).toHaveBeenCalledWith('blob:teste');
  });
  it('informa falha ao iniciar download e libera endereço criado', () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:erro' });
    const liberar = vi.fn();
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: liberar });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('bloqueado'); });
    expect(criarCompartilhamentoDeAudioWeb().baixar(new Blob(['a']))).toBe(false);
    expect(liberar).toHaveBeenCalledWith('blob:erro');
  });

});

import { describe, expect, it, vi } from 'vitest';
import { soltar, tocarExclusivo } from './audioUnico';

function audioFalso(falhaNoPlay = false) {
  return {
    play: vi.fn(() => (falhaNoPlay ? Promise.reject(new Error('negado')) : Promise.resolve())),
    pause: vi.fn(),
  } as unknown as HTMLAudioElement & { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> };
}

describe('audioUnico', () => {
  it('pausa o áudio anterior e avisa a tela dele quando outro começa', async () => {
    const a = audioFalso();
    const b = audioFalso();
    const aoPararA = vi.fn();
    await tocarExclusivo(a, aoPararA);
    await tocarExclusivo(b, vi.fn());
    expect(a.pause).toHaveBeenCalledTimes(1);
    expect(aoPararA).toHaveBeenCalledTimes(1);
    expect(b.pause).not.toHaveBeenCalled();
  });

  it('não pausa quem já terminou', async () => {
    const a = audioFalso();
    const aoPararA = vi.fn();
    await tocarExclusivo(a, aoPararA);
    soltar(a);
    await tocarExclusivo(audioFalso(), vi.fn());
    expect(a.pause).not.toHaveBeenCalled();
    expect(aoPararA).not.toHaveBeenCalled();
  });

  it('se o play falha, devolve o erro e não segura a vez', async () => {
    const ruim = audioFalso(true);
    await expect(tocarExclusivo(ruim, vi.fn())).rejects.toThrow('negado');
    const b = audioFalso();
    await tocarExclusivo(b, vi.fn());
    expect(ruim.pause).not.toHaveBeenCalled();
  });
});

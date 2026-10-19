/**
 * Um áudio de causo por vez.
 *
 * Cada card e a página da história criam o próprio `Audio`. Sem coordenação,
 * dar play num segundo arroto deixava o primeiro tocando por cima. Este módulo
 * guarda quem está tocando e pausa o anterior (avisando a tela dele) antes de
 * soltar o novo.
 */

interface Tocando {
  readonly audio: HTMLAudioElement;
  readonly aoParar: () => void;
}

let atual: Tocando | null = null;

/**
 * Toca `audio` pausando qualquer outro que esteja tocando por aqui.
 * `aoParar` roda quando este áudio for interrompido por outro. Se o `play()`
 * falhar, o registro é desfeito e o erro sobe para a tela mostrar.
 */
export async function tocarExclusivo(audio: HTMLAudioElement, aoParar: () => void): Promise<void> {
  if (atual && atual.audio !== audio) {
    atual.audio.pause();
    atual.aoParar();
  }
  atual = { audio, aoParar };
  try {
    await audio.play();
  } catch (erro) {
    soltar(audio);
    throw erro;
  }
}

/** Esse áudio acabou, foi pausado ou a tela dele saiu: não ocupa mais a vez. */
export function soltar(audio: HTMLAudioElement): void {
  if (atual?.audio === audio) atual = null;
}

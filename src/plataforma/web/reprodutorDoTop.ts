/** Reprodução compartilhada entre os itens do ranking. */
export function criarReprodutorDoTop(aoTerminar: () => void) {
  let audio: HTMLAudioElement | null = null;
  return {
    async tocar(url: string) {
      if (!audio) audio = new Audio();
      audio.pause();
      audio.src = url;
      audio.onended = aoTerminar;
      audio.onerror = aoTerminar;
      await audio.play();
    },
    pausar() { audio?.pause(); },
    soltar() {
      if (!audio) return;
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.src = '';
      audio = null;
    },
  };
}

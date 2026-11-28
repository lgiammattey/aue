import { soltar, tocarExclusivo } from './audioUnico';

export function criarReproducaoDaResenha() {
  let audio: HTMLAudioElement | null = null;

  function descartar() {
    if (!audio) return;
    soltar(audio);
    audio.pause();
    audio.onloadedmetadata = null;
    audio.ondurationchange = null;
    audio.ontimeupdate = null;
    audio.onended = null;
    audio.onerror = null;
    audio.removeAttribute('src');
    audio = null;
  }

  return {
    carregar(url: string, eventos: {
      duracao: (segundos: number | null) => void;
      tempo: (segundos: number) => void;
      terminou: () => void;
      falhou: () => void;
    }) {
      descartar();
      const elemento = new Audio(url);
      const lerDuracao = () => eventos.duracao(Number.isFinite(elemento.duration) && elemento.duration > 0 ? elemento.duration : null);
      elemento.onloadedmetadata = lerDuracao;
      elemento.ondurationchange = lerDuracao;
      elemento.ontimeupdate = () => eventos.tempo(elemento.currentTime || 0);
      elemento.onended = () => { soltar(elemento); eventos.terminou(); };
      elemento.onerror = () => { soltar(elemento); eventos.falhou(); };
      audio = elemento;
    },
    async tocar(aoInterromper: () => void) {
      if (!audio) throw new Error('Áudio indisponível.');
      await tocarExclusivo(audio, aoInterromper);
    },
    pausar() {
      if (!audio) return;
      audio.pause();
      soltar(audio);
    },
    descartar,
  };
}

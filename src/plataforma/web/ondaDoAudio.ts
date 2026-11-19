/** Onda real de um áudio local. A biblioteca e as APIs do navegador ficam aqui. */
export interface ControleDaOnda {
  alternar(): Promise<void>;
  buscar(segundos: number): void;
  encerrar(): void;
}

interface EventosDaOnda {
  aoProntificar(duracao: number): void;
  aoAtualizar(segundos: number): void;
  aoMudarReproducao(tocando: boolean): void;
  aoFalhar(): void;
}

export async function criarOndaDoAudio(container: HTMLElement, media: HTMLAudioElement, eventos: EventosDaOnda): Promise<ControleDaOnda> {
  const { default: WaveSurfer } = await import('wavesurfer.js');
  const onda = WaveSurfer.create({
    container,
    media,
    height: 38,
    waveColor: '#b7b4a9',
    progressColor: '#25251f',
    cursorWidth: 0,
    barWidth: 3,
    barGap: 3,
    barRadius: 2,
    barMinHeight: 2,
    normalize: true,
    interact: false,
  });
  onda.on('ready', eventos.aoProntificar);
  onda.on('timeupdate', eventos.aoAtualizar);
  onda.on('play', () => eventos.aoMudarReproducao(true));
  onda.on('pause', () => eventos.aoMudarReproducao(false));
  onda.on('finish', () => eventos.aoMudarReproducao(false));
  onda.on('error', eventos.aoFalhar);
  return {
    alternar: () => onda.playPause(),
    buscar: (segundos) => onda.setTime(segundos),
    encerrar: () => { if (!media.paused) media.pause(); onda.destroy(); },
  };
}

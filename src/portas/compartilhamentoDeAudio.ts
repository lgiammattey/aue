/** A folha do sistema pode ser aberta sem que seja possível saber se alguém recebeu. */
export type ResultadoCompartilharAudio = 'aberto' | 'cancelado' | 'indisponivel' | 'falhou';

export interface CompartilhamentoDeAudio {
  compartilhar(audio: Blob): Promise<ResultadoCompartilharAudio>;
  /** Inicia o download; o navegador pode impedir ou pedir confirmação. */
  baixar(audio: Blob): boolean;
}

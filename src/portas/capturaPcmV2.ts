/** Captura experimental da Arena: áudio e PCM da mesma fonte, sem enviar nada. */
export type FalhaCapturaPcmV2 =
  | 'permissao_negada'
  | 'microfone_indisponivel'
  | 'pcm_indisponivel'
  | 'cancelada'
  | 'gravacao_incompleta'
  | 'limite_excedido';

export type InicioCapturaPcmV2 = { readonly ok: true } | { readonly ok: false; readonly motivo: FalhaCapturaPcmV2 };
export type ResultadoCapturaPcmV2 =
  | { readonly ok: false; readonly motivo: FalhaCapturaPcmV2 }
  | {
      readonly ok: true;
      readonly audio: Blob;
      readonly formato: string;
      readonly ambiente: Float32Array;
      readonly emissao: Float32Array;
      readonly sampleRate: number;
    };

export interface CapturaPcmV2 {
  /** Começa a escuta: o primeiro meio segundo de PCM é referência de ambiente. */
  iniciar(eventos: { aoCalibrar: () => void; aoLimite: () => void; aoErro: (motivo: FalhaCapturaPcmV2) => void }): Promise<InicioCapturaPcmV2>;
  /** Para a trilha imediatamente e espera o último bloco do gravador e do Worklet. */
  parar(): Promise<ResultadoCapturaPcmV2>;
  /** Invalida pedidos pendentes e libera todos os recursos. */
  cancelar(): void;
  nivelAtual(): number;
  estaGravando(): boolean;
}

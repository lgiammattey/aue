/** Etapas observáveis: não contém áudio, valores do laudo nem identificadores. */
export type EventoArenaV2 =
  | 'abriu_arena_v2'
  | 'iniciou_gravacao'
  | 'concluiu_gravacao'
  | 'falhou_gravacao'
  | 'laudo_disponivel'
  | 'laudo_indisponivel'
  | 'abriu_compartilhamento_audio'
  | 'solicitou_download_audio'
  | 'confirmou_maioridade'
  | 'ouviu_arroto'
  | 'clicou_anuncio';

export interface TelemetriaArenaV2 {
  registrar(evento: EventoArenaV2): void;
}

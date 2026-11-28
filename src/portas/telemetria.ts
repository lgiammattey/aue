/**
 * A porta da telemetria — o funil da Arena e acessos agregados a páginas.
 *
 * A Arena manda o nome do evento e o adaptador cuida da sessão e do envio
 * (ADR 0001 §2 e §7).
 *
 * TELEMETRIA NUNCA É DO CAMINHO CRÍTICO. `registrar` não devolve promessa: quem
 * chama não tem como (nem deve) esperar por ela. Falha de rede, de
 * configuração ou de banco é tratada dentro do adaptador — nunca sobe, nunca
 * aparece para quem está jogando.
 */

import type { PaginaMonitorada } from '../nucleo/telemetria/paginas';

/** Eventos permitidos pela tabela `eventos_de_telemetria`. */
export const EVENTOS_DE_TELEMETRIA = [
  'abriu_arena',
  'iniciou_arroto',
  'recebeu_nota',
  'tentou_novamente',
  'compartilhou',
  'criou_x1',
  'abriu_x1',
  'respondeu_x1',
  'pediu_revanche',
  'concluiu_roda',
  'visitou_pagina',
] as const;

export type EventoDeTelemetria = (typeof EVENTOS_DE_TELEMETRIA)[number];

export interface DetalheDoEvento {
  /** Código do convite usado somente para deduplicar ocorrências no navegador. */
  readonly batalhaCodigo?: string;
  /** Categoria pública, sem URL, slug, termo de busca ou identificador. */
  readonly pagina?: PaginaMonitorada;
}

export interface Telemetria {
  /**
   * Registra o evento. Best-effort, silencioso e sem retorno: dispara e
   * esquece. Nunca lança, nunca bloqueia a jornada, nunca aparece como erro
   * para quem está jogando.
   */
  registrar(evento: EventoDeTelemetria, detalhe?: DetalheDoEvento): void;
}

/**
 * Leitura de uma pauta temática de comunidade.
 *
 * Contrato puro: UI não sabe sobre RPC, Supabase ou como uma pauta preserva os
 * tópicos originais. Cada entrada conserva a identidade completa do tópico.
 */
import type { ResultadoDaLeitura, TopicoDoForum } from './forum';

export interface PautaDoForum {
  /** O tópico sintético que dá título e endereço canônico à conversa. */
  readonly pauta: TopicoDoForum;
  /** Publicações originais, na ordem editorial explícita da pauta. */
  readonly entradas: readonly TopicoDoForum[];
  /** Original solicitado por um link antigo, para a UI ancorar/focar. */
  readonly entradaEmFocoId: string | null;
}

export interface PortaDePautas {
  /**
   * Resolve uma pauta ou qualquer tópico original que esteja dentro dela.
   * `null` diz que o tópico não pertence a pauta e a tela mantém o fluxo normal.
   */
  obterPautaPorTopico(topicoId: string): Promise<ResultadoDaLeitura<PautaDoForum | null>>;
}

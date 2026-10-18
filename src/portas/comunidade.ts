/**
 * A porta de Comunidades e Feed de Causos do Auê 3.0.
 *
 * Contrato puro: a interface que as telas de Comunidade e Feed chamam.
 * Zero React, zero Supabase, zero DOM (ADR 0001 §2 e ADR 0004).
 */

export type TipoDeReacao = 'fogo' | 'nojo' | 'trofeu';

export interface Comunidade {
  readonly id: string;
  readonly slug: string;
  readonly nome: string;
  readonly descricao: string;
  readonly icone: string;
  readonly totalMembros?: number;
}

export interface RespostaDeCauso {
  readonly id: string;
  readonly causoId: string;
  readonly autorNome: string;
  readonly autorHandle: string;
  readonly conteudo: string;
  readonly criadoEm: string;
  /** Identificador da resposta-pai quando for resposta aninhada (estilo Twitter) */
  readonly respostaAId?: string;
}

export interface CausoPostado {
  readonly id: string;
  readonly comunidadeId: string;
  readonly comunidadeSlug: string;
  readonly autorNome: string;
  readonly autorHandle?: string;
  readonly conteudo: string;
  /** Vínculo opcional com a nota do juiz de IA */
  readonly resultadoId?: string;
  readonly nota?: number;
  readonly audioUrl?: string;
  readonly duracaoSegundos?: number;
  readonly videoUrl?: string;
  readonly imagemUrl?: string;
  readonly origem?: string;
  readonly reacoes: Readonly<Record<TipoDeReacao, number>>;
  readonly minhaReacao?: TipoDeReacao | null;
  readonly curtidas: number;
  readonly curtidoPorMim?: boolean;
  readonly reposts: number;
  readonly repostadoPorMim?: boolean;
  readonly totalComentarios: number;
  readonly comentarios?: readonly RespostaDeCauso[];
  readonly criadoEm: string;
  readonly meu?: boolean;
}

export interface PedidoDePostagemDeCauso {
  readonly comunidadeSlug: string;
  readonly conteudo: string;
  readonly autorNome: string;
  readonly autorHandle?: string;
  /** Identificador do resultado da Arena (se houver arroto atrelado) */
  readonly resultadoId?: string;
  readonly nota?: number;
  readonly audioUrl?: string;
  readonly duracaoSegundos?: number;
  readonly origem?: string;
  /**
   * TRAVA LGPD: Para postar um arroto na comunidade pública, o jogador precisa
   * autorizar expressamente. Sem isso, a porta rejeita na hora.
   */
  readonly consentimentoAudioPublico: boolean;
}

export type ResultadoDaPostagem =
  | { readonly ok: true; readonly causo: CausoPostado }
  | { readonly ok: false; readonly motivo: 'consentimentoObrigatorio' }
  | { readonly ok: false; readonly motivo: 'conteudoVazio' }
  | { readonly ok: false; readonly motivo: 'semRede' }
  | { readonly ok: false; readonly motivo: 'falhou'; readonly detalhe: string };

export interface FiltrosDoFeed {
  readonly comunidadeSlug?: string;
  readonly limite?: number;
}

export interface PortaDeComunidade {
  /** Lista as comunidades disponíveis (ex: "Eu arroto, e daí?", "Na reunião da firma") */
  listarComunidades(): Promise<readonly Comunidade[]>;

  /** Lista o feed de causos (global ou filtrado por comunidade) */
  listarFeed(filtros?: FiltrosDoFeed): Promise<readonly CausoPostado[]>;

  /** Publica um novo causo no feed com consentimento de áudio verificado */
  postarCauso(pedido: PedidoDePostagemDeCauso): Promise<ResultadoDaPostagem>;

  /** Alterna reação em um post (fogo, nojo, troféu) */
  alternarReacao(
    causoId: string,
    reacao: TipoDeReacao,
  ): Promise<{ readonly ok: boolean; readonly reacoes: Readonly<Record<TipoDeReacao, number>> }>;

  /** Alterna curtida principal (estilo coração do Twitter) */
  alternarCurtida(causoId: string): Promise<{ readonly ok: boolean; readonly curtidas: number; readonly curtido: boolean }>;

  /** Alterna repostagem de um causo no feed */
  alternarRepost(causoId: string): Promise<{ readonly ok: boolean; readonly reposts: number; readonly repostado: boolean }>;

  /** Lista respostas de um causo (threads) */
  listarRespostas(causoId: string): Promise<readonly RespostaDeCauso[]>;

  /** Adiciona uma resposta a um causo (com suporte a resposta aninhada) */
  adicionarResposta(
    causoId: string,
    conteudo: string,
    autorNome: string,
    autorHandle?: string,
    respostaAId?: string,
  ): Promise<RespostaDeCauso | null>;

  /** Entra em uma comunidade */
  entrarComunidade(slug: string): Promise<boolean>;

  /** Sai de uma comunidade */
  sairComunidade(slug: string): Promise<boolean>;

  /** Lista slugs de comunidades que o jogador participa */
  listarMinhasComunidades(): Promise<readonly string[]>;

  /** Denuncia um post e oculta o áudio/conteúdo */
  denunciarCauso(causoId: string, motivo: string): Promise<boolean>;
}

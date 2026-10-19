/**
 * A porta do fórum de comunidades: comunidade, tópico e resposta.
 *
 * Contrato puro (ADR 0001 §2, ADR 0010): zero React, zero Supabase, zero DOM.
 * Cartão 0017, pedaço 2a. Entrar e sair de comunidade NÃO estão aqui: seguem em
 * `PortaDeComunidade` (`entrarComunidade`, `sairComunidade`,
 * `listarMinhasComunidades`) e são reaproveitados como estão.
 *
 * REGRAS QUE ESTA PORTA GARANTE PARA QUEM CHAMA
 * - Falha nunca vira lista vazia. Toda operação devolve `ok: false` com um motivo;
 *   `ok: true` com zero itens significa que o servidor respondeu e não há nada.
 * - Cursor é a string do servidor, com microssegundo. Quem chama devolve o cursor
 *   como veio; ninguém converte para `Date`.
 * - O erro se decide pelo HINT do servidor. HINT desconhecido é `falhou`.
 * - Nenhuma escrita recebe autor, nota, contagem ou permissão do cliente.
 * - Nenhuma escrita anexa áudio (o contrato de áudio de tópico ainda não fechou).
 */

// ---------------------------------------------------------------------------
// Motivos
// ---------------------------------------------------------------------------

/** Por que uma LEITURA não trouxe dados. */
export type MotivoDeLeitura =
  | 'semServidor'
  | 'comunidadeInexistente'
  | 'cursorInvalido'
  | 'ordemInvalida'
  /** Rede, tempo esgotado, resposta malformada ou HINT que o cliente não conhece. */
  | 'falhou';

/** Por que uma ESCRITA não foi feita (ou não se sabe se foi). */
export type MotivoDeEscrita =
  | 'semServidor'
  /** Visitante, sessão que caiu ou conta sem promoção. A tela mostra o convite. */
  | 'precisaEntrar'
  | 'naoEMembro'
  | 'tituloInvalido'
  | 'corpoInvalido'
  | 'respostaInvalida'
  | 'comunidadeInexistente'
  | 'topicoFechado'
  | 'topicoNaoEncontrado'
  | 'paiInvalido'
  | 'respostaNaoEncontrada'
  | 'audioSemConsentimento'
  | 'naoEAutor'
  | 'nadaParaEditar'
  /** O servidor recusou (ou nem chegou a ser chamado) e sabemos que NÃO gravou. */
  | 'falhou'
  /**
   * Rede, tempo esgotado, 5xx ou resposta malformada: pode ter gravado. A tela
   * pede para conferir antes de tentar de novo (não há chave de idempotência).
   */
  | 'semConfirmacao';

export type ResultadoDaLeitura<T> =
  | { readonly ok: true; readonly valor: T }
  | { readonly ok: false; readonly motivo: MotivoDeLeitura };

export type ResultadoDaEscrita<T> =
  | { readonly ok: true; readonly valor: T }
  | { readonly ok: false; readonly motivo: MotivoDeEscrita };

// ---------------------------------------------------------------------------
// Cursor e página
// ---------------------------------------------------------------------------

/** `valor` e `id` da última linha da página anterior, exatamente como o servidor mandou. */
export interface CursorDoForum {
  readonly valor: string;
  readonly id: string;
}

/** Em `listarTopicos` o cursor leva também o `fixado` da última linha. */
export interface CursorDeTopicos extends CursorDoForum {
  readonly fixado: boolean;
}

export interface PaginaDoForum<C extends CursorDoForum = CursorDoForum, T = unknown> {
  readonly itens: readonly T[];
  /**
   * Cursor da próxima página, ou `null` quando a página veio menor que o limite
   * (não há próxima). Página cheia sempre traz cursor: a próxima pode vir vazia.
   */
  readonly proximo: C | null;
}

// ---------------------------------------------------------------------------
// Dados lidos
// ---------------------------------------------------------------------------

export interface ReferenciaDeComunidade {
  readonly id: string;
  readonly slug: string;
  readonly nome: string;
}

export interface AutorDoForum {
  readonly id: string;
  /** `null` quando a conta não tem apelido: a tela cai no @, nunca inventa nome. */
  readonly apelido: string | null;
  /** O @ real, ou `null` se o servidor não mandou. */
  readonly handle: string | null;
  readonly avatarUrl: string | null;
}

export interface ComunidadeDoForum extends ReferenciaDeComunidade {
  readonly descricao: string;
  readonly icone: string | null;
  /** O que o servidor contou. Nunca somado nem arredondado no cliente. */
  readonly membrosTotal: number;
  readonly topicosTotal: number;
  /** `null` quando a comunidade não tem tópico visível. */
  readonly ultimaAtividadeEm: string | null;
  /** Falso para visitante. Não entra ninguém no Bonde Geral: quem decide é a tela com `listarMinhasComunidades`. */
  readonly souMembro: boolean;
}

/** O que o servidor devolve sobre o áudio e a nota do tópico. Tudo `null` quando não há. */
export interface AnexoDeAudioDoTopico {
  readonly resultadoId: string | null;
  readonly nota: number | null;
  readonly duracao: number | null;
  readonly subtipoDeOrigem: string | null;
  readonly caminhoDoAudio: string | null;
  readonly caminhoDoAudioDaCasa: string | null;
}

export type StatusDoTopico = 'aberto' | 'fechado';

export interface TopicoDoForum {
  readonly id: string;
  readonly comunidade: ReferenciaDeComunidade;
  readonly autor: AutorDoForum;
  readonly titulo: string;
  readonly corpo: string;
  readonly status: StatusDoTopico;
  readonly fixado: boolean;
  readonly criadoEm: string;
  readonly editadoEm: string | null;
  readonly ultimaAtividadeEm: string;
  readonly respostasTotal: number;
  /** Decide se a tela mostra Editar e Apagar. */
  readonly souAutor: boolean;
  /** `null` quando o servidor não mandou resultado nem caminho de áudio. */
  readonly audio: AnexoDeAudioDoTopico | null;
}

export type StatusDaResposta = 'visivel' | 'oculto' | 'removido';

export interface RespostaDoForum {
  readonly id: string;
  readonly topicoId: string;
  readonly paiId: string | null;
  readonly nivel: 0 | 1 | 2;
  /** `null` na casca: resposta apagada ou oculta que ainda tem filha visível. */
  readonly autor: AutorDoForum | null;
  readonly corpo: string | null;
  readonly status: StatusDaResposta;
  readonly criadoEm: string;
  readonly editadoEm: string | null;
  readonly souAutor: boolean;
}

/** Linha do Explorar: sem corpo, sem áudio, sem nota. */
export interface TopicoDoExplorar {
  readonly id: string;
  readonly comunidade: ReferenciaDeComunidade;
  readonly autor: AutorDoForum;
  readonly titulo: string;
  readonly status: StatusDoTopico;
  readonly fixado: boolean;
  readonly criadoEm: string;
  readonly ultimaAtividadeEm: string;
  readonly respostasTotal: number;
}

export interface TopicoDoAutor {
  readonly id: string;
  readonly comunidade: ReferenciaDeComunidade;
  readonly titulo: string;
  readonly corpo: string;
  readonly status: StatusDoTopico;
  readonly fixado: boolean;
  readonly criadoEm: string;
  readonly editadoEm: string | null;
  readonly ultimaAtividadeEm: string;
  readonly respostasTotal: number;
}

export interface RespostaDoAutor {
  readonly id: string;
  readonly topicoId: string;
  readonly topicoTitulo: string;
  readonly comunidade: ReferenciaDeComunidade;
  readonly paiId: string | null;
  readonly nivel: 0 | 1 | 2;
  readonly corpo: string;
  readonly criadoEm: string;
  readonly editadoEm: string | null;
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

export type OrdemDosTopicos = 'atividade' | 'recentes';

export interface OpcoesDeListagemDeTopicos {
  readonly ordem?: OrdemDosTopicos;
  /** O servidor limita a 100. */
  readonly limite?: number;
  readonly cursor?: CursorDeTopicos | null;
}

export interface OpcoesDoExplorar {
  readonly ordem?: OrdemDosTopicos;
  readonly limite?: number;
  readonly cursor?: CursorDoForum | null;
}

export interface OpcoesDePaginaCronologica {
  /** Respostas do tópico: o servidor limita a 200. Listas do autor: 100. */
  readonly limite?: number;
  readonly cursor?: CursorDoForum | null;
}

/** Autor, nota, contagem e áudio não entram: o servidor decide. */
export interface PedidoDeNovoTopico {
  readonly comunidadeSlug: string;
  readonly titulo: string;
  readonly corpo: string;
}

export interface PedidoDeResposta {
  readonly topicoId: string;
  readonly corpo: string;
  /** Responde outra resposta. Sem ele, responde o tópico. */
  readonly paiId?: string | null;
}

export interface PedidoDeEdicaoDeTopico {
  readonly topicoId: string;
  readonly titulo?: string;
  readonly corpo?: string;
}

export interface PedidoDeEdicaoDeResposta {
  readonly respostaId: string;
  readonly corpo: string;
}

// ---------------------------------------------------------------------------
// O que o servidor devolveu numa escrita
// ---------------------------------------------------------------------------

export interface TopicoCriado {
  readonly id: string;
  readonly criadoEm: string;
}

export interface RespostaCriada {
  readonly id: string;
  readonly topicoId: string;
  readonly paiId: string | null;
  readonly nivel: 0 | 1 | 2;
  readonly criadoEm: string;
}

export interface TopicoEditado {
  readonly id: string;
  readonly titulo: string;
  readonly corpo: string;
  readonly editadoEm: string;
}

export interface RespostaEditada {
  readonly id: string;
  readonly corpo: string;
  readonly editadoEm: string;
}

// ---------------------------------------------------------------------------
// A porta
// ---------------------------------------------------------------------------

export interface PortaDeForum {
  // Leituras (visitante lê tudo)

  /** Diretório. Só comunidade com slug de verdade. */
  listarComunidadesDoForum(): Promise<ResultadoDaLeitura<readonly ComunidadeDoForum[]>>;

  /** `valor: null` = slug inexistente (a tela mostra "não achei", nunca outra comunidade). */
  obterComunidadeDoForum(slug: string): Promise<ResultadoDaLeitura<ComunidadeDoForum | null>>;

  /**
   * Tópicos de UMA comunidade. O servidor só recusa slug em BRANCO
   * (`comunidadeInexistente`). Slug desconhecido devolve `ok: true` com zero itens,
   * igual a comunidade vazia: para distinguir "não achei" de "vazia", a tela chama
   * `obterComunidadeDoForum` (que devolve `valor: null` quando o slug não existe).
   */
  listarTopicos(
    slug: string,
    opcoes?: OpcoesDeListagemDeTopicos,
  ): Promise<ResultadoDaLeitura<PaginaDoForum<CursorDeTopicos, TopicoDoForum>>>;

  /** `valor: null` = ausente, oculto, removido ou de autor sem conta promovida. */
  obterTopico(topicoId: string): Promise<ResultadoDaLeitura<TopicoDoForum | null>>;

  /** Respostas em ordem cronológica. */
  listarRespostasDoTopico(
    topicoId: string,
    opcoes?: OpcoesDePaginaCronologica,
  ): Promise<ResultadoDaLeitura<PaginaDoForum<CursorDoForum, RespostaDoForum>>>;

  /** Tópicos de todas as comunidades, cada um com a sua. */
  explorarTopicos(
    opcoes?: OpcoesDoExplorar,
  ): Promise<ResultadoDaLeitura<PaginaDoForum<CursorDoForum, TopicoDoExplorar>>>;

  /**
   * Zero itens NÃO prova que a pessoa existe: handle inexistente, conta sem promoção
   * e conta sem conteúdo devolvem o mesmo. Quem diz "perfil não encontrado" é o cabeçalho do perfil.
   */
  listarTopicosDoAutor(
    handle: string,
    opcoes?: OpcoesDePaginaCronologica,
  ): Promise<ResultadoDaLeitura<PaginaDoForum<CursorDoForum, TopicoDoAutor>>>;

  listarRespostasDoAutor(
    handle: string,
    opcoes?: OpcoesDePaginaCronologica,
  ): Promise<ResultadoDaLeitura<PaginaDoForum<CursorDoForum, RespostaDoAutor>>>;

  // Escritas (conta promovida e membro; visitante recebe `precisaEntrar`)

  criarTopico(pedido: PedidoDeNovoTopico): Promise<ResultadoDaEscrita<TopicoCriado>>;
  responderTopico(pedido: PedidoDeResposta): Promise<ResultadoDaEscrita<RespostaCriada>>;
  editarTopico(pedido: PedidoDeEdicaoDeTopico): Promise<ResultadoDaEscrita<TopicoEditado>>;
  editarResposta(pedido: PedidoDeEdicaoDeResposta): Promise<ResultadoDaEscrita<RespostaEditada>>;
  apagarTopico(topicoId: string): Promise<ResultadoDaEscrita<true>>;
  apagarResposta(respostaId: string): Promise<ResultadoDaEscrita<true>>;
  /** Já ter denunciado conta como registrada (o servidor ignora a repetição). */
  denunciarTopico(topicoId: string, motivo: string): Promise<ResultadoDaEscrita<true>>;
  denunciarResposta(respostaId: string, motivo: string): Promise<ResultadoDaEscrita<true>>;
}

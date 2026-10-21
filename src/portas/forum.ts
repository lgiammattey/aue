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
 * - Um item pode ter no máximo uma mídia: imagem/GIF, áudio livre de até 60 s ou
 *   vídeo YouTube/TikTok. Documento e vídeo enviado não entram no contrato.
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
  /** Passou do teto de escritas da conta (por minuto ou por hora). O servidor recusou antes de gravar. */
  | 'limiteDeFrequencia'
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
  /** URL pública derivada do caminho persistido e da revisão; nunca vem pronta do banco. */
  readonly avatarUrl?: string | null;
  /** URL pública derivada do caminho persistido e da revisão; nunca vem pronta do banco. */
  readonly capaUrl?: string | null;
  /** O que o servidor contou. Nunca somado nem arredondado no cliente. */
  readonly membrosTotal: number;
  readonly topicosTotal: number;
  /** `null` quando a comunidade não tem tópico visível. */
  readonly ultimaAtividadeEm: string | null;
  /** Falso para visitante. Não entra ninguém no Bonde Geral: quem decide é a tela com `listarMinhasComunidades`. */
  readonly souMembro: boolean;
  /** Criador ou moderador (papel `admin`) reconhecido pelo servidor. */
  readonly possoGerirMidia?: boolean;
}

export type ReacaoDoTopico = 'like' | 'fogo' | 'nojo' | 'trofeu';

/** Contagem pública e o que a conta atual já marcou. */
export interface ReacoesDoTopico {
  readonly total: Readonly<Record<ReacaoDoTopico, number>>;
  readonly minhas: readonly ReacaoDoTopico[];
}

export type TipoDeItemSalvo = 'topico' | 'causo';

export interface ItemSalvo {
  readonly tipo: TipoDeItemSalvo;
  readonly id: string;
  readonly titulo: string;
  readonly comunidadeSlug: string;
  readonly comunidadeNome: string;
  readonly autorHandle: string | null;
  readonly autorApelido: string | null;
  readonly criadoEm: string;
}

export interface PaginaDeSalvos {
  readonly itens: readonly ItemSalvo[];
  readonly proximo: number | null;
}

/** Regras e moderação reais, como o servidor guarda. Nada daqui vem fixo no cliente. */
export interface DetalhesDaComunidadeDoForum {
  readonly regras: readonly string[];
  readonly moderadores: readonly { readonly handle: string; readonly apelido: string | null }[];
}

/** Só a imagem já normalizada pelo editor segue para esta porta. */
export type TipoDeMidiaDaComunidade = 'avatar' | 'capa';

export interface PedidoDeMidiaDaComunidade {
  readonly comunidadeSlug: string;
  readonly tipo: TipoDeMidiaDaComunidade;
  /** JPEG final do recorte. A plataforma confere MIME e limite antes do upload. */
  readonly arquivo: Blob;
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

/** Mídia livre de uma conversa. `caminho` não é URL: a plataforma o assina. */
export type AnexoDoForum =
  | {
      readonly alvo: 'topico' | 'resposta';
      readonly alvoId: string;
      readonly tipo: 'imagem' | 'audio';
      readonly caminho: string;
      readonly mime: string;
      readonly tamanhoBytes: number;
      /** Só áudio; o banco nunca aceita mais que 60.000 ms. */
      readonly duracaoMs: number | null;
      readonly urlVideo: null;
    }
  | {
      readonly alvo: 'topico' | 'resposta';
      readonly alvoId: string;
      readonly tipo: 'videoExterno';
      readonly caminho: null;
      readonly mime: null;
      readonly tamanhoBytes: null;
      readonly duracaoMs: null;
      /** URL canônica, limitada a YouTube ou TikTok no servidor. */
      readonly urlVideo: string;
    };

/** O arquivo ainda é rascunho, pertencente à pessoa, até a RPC publicá-lo. */
export interface PedidoDeEnvioDeAnexoDoForum {
  readonly tipo: 'imagem' | 'audio';
  readonly arquivo: Blob;
  /** Obrigatória para áudio; vem da gravação, não é estimada pela tela. */
  readonly duracaoMs?: number;
}

/** Gravação de voz livre: não passa pela Arena nem recebe nota. */
export interface AudioLivreDoForum {
  readonly dados: Blob;
  /** MIME efetivamente produzido pelo navegador, inclusive parâmetros/codecs. */
  readonly formato: string;
  /** Base MIME usada para Storage/RPC (`audio/webm;codecs=opus` -> `audio/webm`). */
  readonly mimeParaEnvio: string;
  /** Medida entre o start e o stop real do MediaRecorder. Nunca estimada pela UI. */
  readonly duracaoMs: number;
}

export type ResultadoDaGravacaoLivreDoForum =
  | { readonly ok: true; readonly audio: AudioLivreDoForum; readonly encerramento: 'manual' | 'limite' }
  | { readonly ok: false; readonly motivo: 'negado' | 'indisponivel' | 'falhou' | 'naoGravando' | 'cancelado'; readonly detalhe?: string };

export type InicioDaGravacaoLivreDoForum =
  | { readonly ok: true; readonly conclusao: Promise<ResultadoDaGravacaoLivreDoForum> }
  | Exclude<ResultadoDaGravacaoLivreDoForum, { readonly ok: true }>;

/** Implementada apenas pela plataforma web: ela é dona do stream até concluir. */
export interface GravacaoLivreDoForum {
  iniciar(): Promise<InicioDaGravacaoLivreDoForum>;
  parar(): void;
  cancelar(): void;
  estaGravando(): boolean;
}

export type AnexoParaPublicar =
  | {
      readonly tipo: 'imagem' | 'audio';
      readonly caminho: string;
      readonly mime: string;
      readonly tamanhoBytes: number;
      readonly duracaoMs?: number;
    }
  | { readonly tipo: 'videoExterno'; readonly url: string };

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

/** Até duas respostas visíveis por tópico, buscadas para uma página inteira. */
export interface PreviaDeRespostaDoTopico {
  readonly topicoId: string;
  readonly resposta: RespostaDoForum;
  /** Vem nesta mesma leitura; URLs privadas ainda precisam ser assinadas. */
  readonly anexo: AnexoDoForum | null;
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

export type TipoDeBusca = 'pessoas' | 'comunidades' | 'topicos';

export interface ResultadoDeBusca {
  readonly tipo: 'pessoa' | 'comunidade' | 'topico';
  readonly id: string;
  readonly comunidadeSlug: string | null;
  readonly comunidadeNome: string | null;
  /** Nome da comunidade ou título do tópico; `null` para pessoa. */
  readonly titulo: string | null;
  readonly handle: string | null;
  readonly apelido: string | null;
  readonly avatarUrl: string | null;
  readonly criadoEm: string | null;
}

export interface OpcoesDeBusca {
  readonly termo: string;
  readonly tipo: TipoDeBusca;
  readonly limite?: number;
  readonly deslocamento?: number;
}

/** `proximo` é o deslocamento da página seguinte, ou `null` quando acabou. */
export interface PaginaDeBusca {
  readonly itens: readonly ResultadoDeBusca[];
  readonly proximo: number | null;
}

export interface OpcoesDePaginaCronologica {
  /** Respostas do tópico: o servidor limita a 200. Listas do autor: 100. */
  readonly limite?: number;
  readonly cursor?: CursorDoForum | null;
}

/** Autor, nota, contagem e áudio não entram: o servidor decide. */
export interface PedidoDeNovoTopico {
  readonly comunidadeSlug: string;
  /** Legado/explorar. Composer atual pode omitir: o servidor deriva do texto. */
  readonly titulo?: string;
  readonly corpo: string;
  readonly anexo?: AnexoParaPublicar | null;
}

export interface PedidoDeResposta {
  readonly topicoId: string;
  readonly corpo: string;
  /** Responde outra resposta. Sem ele, responde o tópico. */
  readonly paiId?: string | null;
  readonly anexo?: AnexoParaPublicar | null;
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
  /** `valor: null` quando o slug não existe. */
  obterDetalhesDaComunidade?(slug: string): Promise<ResultadoDaLeitura<DetalhesDaComunidadeDoForum | null>>;

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

  /**
   * Uma resposta e a cadeia de pais que a torna legível. É a leitura estreita
   * usada por link direto: não pagina nem baixa a conversa inteira.
   * `ok: true` com lista vazia quer dizer que a resposta não está disponível
   * naquele tópico (apagada, oculta, de outra conversa ou endereço inválido).
   */
  obterContextoDaResposta?(
    topicoId: string,
    respostaId: string,
  ): Promise<ResultadoDaLeitura<readonly RespostaDoForum[]>>;

  /** Leitura em lote para cards: máximo de 2 respostas visíveis por tópico. */
  listarPreviaRespostasDosTopicos?(
    topicoIds: readonly string[],
  ): Promise<ResultadoDaLeitura<readonly PreviaDeRespostaDoTopico[]>>;

  /** Busca no servidor por pessoas (nome/@), comunidades e tópicos. Termo com menos de 2 letras volta vazio. */
  buscarNoAue?(opcoes: OpcoesDeBusca): Promise<ResultadoDaLeitura<PaginaDeBusca>>;

  /** Contagens públicas por tópico (até 100 por chamada). Tópico sem reação não aparece no mapa. */
  contarReacoesDosTopicos?(topicoIds: readonly string[]): Promise<ResultadoDaLeitura<Readonly<Record<string, ReacoesDoTopico>>>>;
  /** `valor: true` quando a reação ficou ligada, `false` quando foi desligada. */
  alternarReacaoDoTopico?(topicoId: string, tipo: ReacaoDoTopico): Promise<ResultadoDaEscrita<boolean>>;
  /** `valor: true` quando ficou salvo, `false` quando saiu dos salvos. */
  alternarSalvo?(tipo: TipoDeItemSalvo, itemId: string): Promise<ResultadoDaEscrita<boolean>>;
  /** Só o que a própria conta salvou. */
  listarIdsSalvos?(): Promise<ResultadoDaLeitura<readonly { readonly tipo: TipoDeItemSalvo; readonly id: string }[]>>;
  listarMeusSalvos?(opcoes?: { readonly limite?: number; readonly deslocamento?: number }): Promise<ResultadoDaLeitura<PaginaDeSalvos>>;

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

  /** Busca a mídia dos cards já retornados por uma página; não vaza anexo oculto. */
  listarAnexosDoForum?(ids: {
    readonly topicoIds?: readonly string[];
    readonly respostaIds?: readonly string[];
  }): Promise<ResultadoDaLeitura<readonly AnexoDoForum[]>>;

  /** Gera URL curta para mídia do bucket privado. Link externo não passa aqui. */
  assinarAnexoDoForum?(caminho: string): Promise<ResultadoDaLeitura<string>>;

  /** Fábrica injetada pela plataforma; tela não conhece MediaRecorder nem navigator. */
  criarGravacaoLivreDoForum?(): GravacaoLivreDoForum;

  // Escritas (conta promovida e membro; visitante recebe `precisaEntrar`)

  criarTopico(pedido: PedidoDeNovoTopico): Promise<ResultadoDaEscrita<TopicoCriado>>;
  responderTopico(pedido: PedidoDeResposta): Promise<ResultadoDaEscrita<RespostaCriada>>;
  /** Envia o JPEG normalizado e só então o referencia pela RPC segura. */
  definirMidiaDaComunidade?(pedido: PedidoDeMidiaDaComunidade): Promise<ResultadoDaEscrita<ComunidadeDoForum>>;
  /** Só criador ou moderador (papel `admin`); o servidor recusa o resto com `naoEAutor`. */
  definirRegrasDaComunidade?(comunidadeSlug: string, regras: readonly string[]): Promise<ResultadoDaEscrita<true>>;
  /** Remove a referência pública e incrementa a revisão de cache da mídia. */
  removerMidiaDaComunidade?(
    comunidadeSlug: string,
    tipo: TipoDeMidiaDaComunidade,
  ): Promise<ResultadoDaEscrita<ComunidadeDoForum>>;
  enviarAnexoDoForum?(pedido: PedidoDeEnvioDeAnexoDoForum): Promise<ResultadoDaEscrita<AnexoParaPublicar>>;
  editarTopico(pedido: PedidoDeEdicaoDeTopico): Promise<ResultadoDaEscrita<TopicoEditado>>;
  editarResposta(pedido: PedidoDeEdicaoDeResposta): Promise<ResultadoDaEscrita<RespostaEditada>>;
  apagarTopico(topicoId: string): Promise<ResultadoDaEscrita<true>>;
  apagarResposta(respostaId: string): Promise<ResultadoDaEscrita<true>>;
  /** Já ter denunciado conta como registrada (o servidor ignora a repetição). */
  denunciarTopico(topicoId: string, motivo: string): Promise<ResultadoDaEscrita<true>>;
  denunciarResposta(respostaId: string, motivo: string): Promise<ResultadoDaEscrita<true>>;
}

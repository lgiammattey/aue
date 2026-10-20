import { configuracaoAusente, supabase } from '../../db/supabase';
import { criarGravacaoLivreDoForum } from './gravacaoLivreDoForum';
import type {
  AnexoDoForum,
  AnexoDeAudioDoTopico,
  AnexoParaPublicar,
  AutorDoForum,
  ComunidadeDoForum,
  CursorDeTopicos,
  CursorDoForum,
  MotivoDeEscrita,
  MotivoDeLeitura,
  OrdemDosTopicos,
  PaginaDoForum,
  PortaDeForum,
  PreviaDeRespostaDoTopico,
  ReferenciaDeComunidade,
  ResultadoDaEscrita,
  ResultadoDaLeitura,
  RespostaCriada,
  RespostaDoAutor,
  RespostaDoForum,
  RespostaEditada,
  StatusDaResposta,
  StatusDoTopico,
  TopicoCriado,
  TopicoDoAutor,
  TopicoDoExplorar,
  TopicoDoForum,
  TopicoEditado,
} from '../../portas/forum';

/**
 * Adaptador do fórum (ADR 0010, migrações 20261019000014 e 16). Só ele fala com as
 * RPCs; a tela fala com `PortaDeForum`.
 *
 * - Cursor: a string que o servidor mandou volta idêntica. Nada aqui passa por
 *   `Date` nem por `toISOString`, por causa do microssegundo.
 * - Erro: decidido pelo HINT. HINT que o contexto não conhece vira falha genérica.
 * - Falha de leitura é `ok: false`, nunca lista vazia.
 */

const TEMPO_DA_LEITURA_MS = 6000;
const TEMPO_DA_ESCRITA_MS = 20000;

const LIMITE_PADRAO_DE_TOPICOS = 30;
const LIMITE_MAXIMO_DE_TOPICOS = 100;
const LIMITE_PADRAO_DE_RESPOSTAS = 50;
const LIMITE_MAXIMO_DE_RESPOSTAS = 200;
const LIMITE_PADRAO_DO_AUTOR = 30;
const LIMITE_MAXIMO_DO_AUTOR = 100;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function servidorConfigurado(): boolean {
  if (configuracaoAusente) return false;
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (url.includes('aue-dev.supabase.co') || url.includes('exemplo.supabase.co')) return false;
  if (chave.includes('chave-ficticia') || chave.includes('chave-ausente')) return false;
  return true;
}

function comTempo<T>(promessa: PromiseLike<T>, ms: number, rotulo: string): Promise<T> {
  let relogio: ReturnType<typeof setTimeout>;
  const limite = new Promise<never>((_, rejeitar) => {
    relogio = setTimeout(() => rejeitar(new Error(`Tempo esgotado: ${rotulo}`)), ms);
  });
  return Promise.race([Promise.resolve(promessa), limite]).finally(() => clearTimeout(relogio));
}

// ---------------------------------------------------------------------------
// Erro: o HINT decide
// ---------------------------------------------------------------------------

interface ErroDoServidor {
  readonly code?: string | null;
  readonly hint?: string | null;
  /** Status HTTP, quando o cliente o repassa junto do erro. */
  readonly status?: number | null;
}

const HINTS_DE_LEITURA: Readonly<Record<string, MotivoDeLeitura>> = {
  comunidade_inexistente: 'comunidadeInexistente',
  cursor_invalido: 'cursorInvalido',
  ordem_invalida: 'ordemInvalida',
};

const HINTS_DE_ESCRITA: Readonly<Record<string, MotivoDeEscrita>> = {
  titulo_invalido: 'tituloInvalido',
  corpo_invalido: 'corpoInvalido',
  resposta_invalida: 'respostaInvalida',
  comunidade_inexistente: 'comunidadeInexistente',
  nao_e_membro: 'naoEMembro',
  topico_fechado: 'topicoFechado',
  topico_nao_encontrado: 'topicoNaoEncontrado',
  pai_invalido: 'paiInvalido',
  resposta_nao_encontrada: 'respostaNaoEncontrada',
  audio_sem_consentimento: 'audioSemConsentimento',
  nao_e_autor: 'naoEAutor',
  nada_para_editar: 'nadaParaEditar',
};

// `Object.hasOwn` evita que um HINT como "constructor" ou "__proto__" case com o protótipo.
function porHint<M>(tabela: Readonly<Record<string, M>>, hint: string | null | undefined): M | undefined {
  const chave = (hint ?? '').trim();
  return chave && Object.hasOwn(tabela, chave) ? tabela[chave] : undefined;
}

function motivoDeLeitura(erro: ErroDoServidor): MotivoDeLeitura {
  return porHint(HINTS_DE_LEITURA, erro.hint) ?? 'falhou';
}

/** Classes de SQLSTATE em que o Postgres recusou antes de gravar (22, 23, 42, P0). */
const RECUSA_DEFINITIVA = /^(22|23|42|P0)/;

function motivoDeEscrita(erro: ErroDoServidor): MotivoDeEscrita {
  const conhecido = porHint(HINTS_DE_ESCRITA, erro.hint);
  if (conhecido) return conhecido;
  const code = erro.code ?? '';
  const semHint = !(erro.hint ?? '').trim();
  // "Ação social exige conta promovida" e "permission denied" de visitante: 42501 sem HINT.
  if (code === '42501' && semHint) return 'precisaEntrar';
  // JWT expirado: o PostgREST recusa antes de executar a função, então nada foi gravado.
  if (code === 'PGRST301' || erro.status === 401) return 'precisaEntrar';
  // HINT desconhecido com recusa do Postgres: falha genérica, e sabemos que não gravou.
  if (RECUSA_DEFINITIVA.test(code)) return 'falhou';
  // Rede, 5xx, PGRST, cancelamento: pode ter gravado.
  return 'semConfirmacao';
}

// ---------------------------------------------------------------------------
// Leitura defensiva da linha
// ---------------------------------------------------------------------------

type Linha = Record<string, unknown>;

class RespostaMalformada extends Error {}

function malformada(campo: string): never {
  throw new RespostaMalformada(`campo inválido: ${campo}`);
}

function linhaDe(v: unknown): Linha {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) malformada('linha');
  return v as Linha;
}

function texto(l: Linha, c: string): string {
  const v = l[c];
  if (typeof v !== 'string' || v === '') malformada(c);
  return v;
}

/** Texto que pode ser vazio (corpo de tópico migrado, descrição). */
function textoLivre(l: Linha, c: string): string {
  const v = l[c];
  if (v === null || v === undefined) return '';
  if (typeof v !== 'string') malformada(c);
  return v;
}

function textoOuNulo(l: Linha, c: string): string | null {
  const v = l[c];
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') malformada(c);
  return v === '' ? null : v;
}

function inteiro(l: Linha, c: string): number {
  const v = l[c];
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) malformada(c);
  return v;
}

function numeroOuNulo(l: Linha, c: string): number | null {
  const v = l[c];
  if (v === null || v === undefined) return null;
  if (typeof v !== 'number' || !Number.isFinite(v)) malformada(c);
  return v;
}

function booleano(l: Linha, c: string): boolean {
  const v = l[c];
  if (typeof v !== 'boolean') malformada(c);
  return v;
}

function nivel(l: Linha): 0 | 1 | 2 {
  const v = l.nivel;
  if (v !== 0 && v !== 1 && v !== 2) malformada('nivel');
  return v;
}

function statusDoTopico(l: Linha): StatusDoTopico {
  const v = l.status;
  if (v !== 'aberto' && v !== 'fechado') malformada('status');
  return v;
}

function statusDaResposta(l: Linha): StatusDaResposta {
  const v = l.status;
  if (v !== 'visivel' && v !== 'oculto' && v !== 'removido') malformada('status');
  return v;
}

function comunidadeDe(l: Linha, prefixo = 'comunidade'): ReferenciaDeComunidade {
  return { id: texto(l, `${prefixo}_id`), slug: texto(l, `${prefixo}_slug`), nome: texto(l, `${prefixo}_nome`) };
}

function autorDe(l: Linha): AutorDoForum {
  return {
    id: texto(l, 'autor_id'),
    apelido: textoOuNulo(l, 'apelido'),
    handle: textoOuNulo(l, 'handle'),
    avatarUrl: textoOuNulo(l, 'url_do_avatar'),
  };
}

function lista(dados: unknown): Linha[] {
  if (!Array.isArray(dados)) malformada('lista');
  return dados.map(linhaDe);
}

function paraComunidadeDoForum(l: Linha): ComunidadeDoForum {
  return {
    id: texto(l, 'id'),
    slug: texto(l, 'slug'),
    nome: texto(l, 'nome'),
    descricao: textoLivre(l, 'descricao'),
    icone: textoOuNulo(l, 'icone'),
    membrosTotal: inteiro(l, 'membros_total'),
    topicosTotal: inteiro(l, 'topicos_total'),
    ultimaAtividadeEm: textoOuNulo(l, 'ultima_atividade_em'),
    souMembro: booleano(l, 'sou_membro'),
  };
}

function paraTopico(l: Linha): TopicoDoForum {
  const anexo: AnexoDeAudioDoTopico = {
    resultadoId: textoOuNulo(l, 'resultado_id'),
    nota: numeroOuNulo(l, 'nota'),
    duracao: numeroOuNulo(l, 'duracao'),
    subtipoDeOrigem: textoOuNulo(l, 'subtipo_de_origem'),
    caminhoDoAudio: textoOuNulo(l, 'caminho_do_audio'),
    caminhoDoAudioDaCasa: textoOuNulo(l, 'caminho_do_audio_da_casa'),
  };
  const temAnexo = anexo.resultadoId !== null || anexo.caminhoDoAudio !== null || anexo.caminhoDoAudioDaCasa !== null;
  return {
    id: texto(l, 'id'),
    comunidade: comunidadeDe(l),
    autor: autorDe(l),
    titulo: texto(l, 'titulo'),
    corpo: textoLivre(l, 'corpo'),
    status: statusDoTopico(l),
    fixado: booleano(l, 'fixado'),
    criadoEm: texto(l, 'criado_em'),
    editadoEm: textoOuNulo(l, 'editado_em'),
    ultimaAtividadeEm: texto(l, 'ultima_atividade_em'),
    respostasTotal: inteiro(l, 'respostas_total'),
    souAutor: booleano(l, 'sou_autor'),
    audio: temAnexo ? anexo : null,
  };
}

function paraResposta(l: Linha): RespostaDoForum {
  const status = statusDaResposta(l);
  const casca = l.autor_id === null || l.autor_id === undefined;
  // Casca (apagada ou oculta com filha visível) não traz autor nem corpo. Visível sem autor é malformada.
  if (casca && status === 'visivel') malformada('autor_id');
  return {
    id: texto(l, 'id'),
    topicoId: texto(l, 'topico_id'),
    paiId: textoOuNulo(l, 'pai_id'),
    nivel: nivel(l),
    autor: casca ? null : autorDe(l),
    corpo: casca ? null : texto(l, 'corpo'),
    status,
    criadoEm: texto(l, 'criado_em'),
    editadoEm: textoOuNulo(l, 'editado_em'),
    souAutor: booleano(l, 'sou_autor'),
  };
}

function paraTopicoDoExplorar(l: Linha): TopicoDoExplorar {
  return {
    id: texto(l, 'id'),
    comunidade: comunidadeDe(l),
    autor: autorDe(l),
    titulo: texto(l, 'titulo'),
    status: statusDoTopico(l),
    fixado: booleano(l, 'fixado'),
    criadoEm: texto(l, 'criado_em'),
    ultimaAtividadeEm: texto(l, 'ultima_atividade_em'),
    respostasTotal: inteiro(l, 'respostas_total'),
  };
}

function paraTopicoDoAutor(l: Linha): TopicoDoAutor {
  return {
    id: texto(l, 'id'),
    comunidade: comunidadeDe(l),
    titulo: texto(l, 'titulo'),
    corpo: textoLivre(l, 'corpo'),
    status: statusDoTopico(l),
    fixado: booleano(l, 'fixado'),
    criadoEm: texto(l, 'criado_em'),
    editadoEm: textoOuNulo(l, 'editado_em'),
    ultimaAtividadeEm: texto(l, 'ultima_atividade_em'),
    respostasTotal: inteiro(l, 'respostas_total'),
  };
}

function paraRespostaDoAutor(l: Linha): RespostaDoAutor {
  return {
    id: texto(l, 'id'),
    topicoId: texto(l, 'topico_id'),
    topicoTitulo: texto(l, 'topico_titulo'),
    comunidade: comunidadeDe(l),
    paiId: textoOuNulo(l, 'pai_id'),
    nivel: nivel(l),
    corpo: texto(l, 'corpo'),
    criadoEm: texto(l, 'criado_em'),
    editadoEm: textoOuNulo(l, 'editado_em'),
  };
}

function inteiroPositivoOuNulo(l: Linha, c: string): number | null {
  const v = l[c];
  if (v === null || v === undefined) return null;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) malformada(c);
  return v;
}

function paraAnexoDoForum(l: Linha): AnexoDoForum {
  const alvo = texto(l, 'alvo_tipo');
  if (alvo !== 'topico' && alvo !== 'resposta') malformada('alvo_tipo');
  const tipo = texto(l, 'tipo');
  const alvoId = texto(l, 'alvo_id');
  if (tipo === 'video_externo') {
    return {
      alvo, alvoId, tipo: 'videoExterno', caminho: null, mime: null,
      tamanhoBytes: null, duracaoMs: null, urlVideo: texto(l, 'url_video'),
    };
  }
  if (tipo !== 'imagem' && tipo !== 'audio') malformada('tipo');
  const duracaoMs = inteiroPositivoOuNulo(l, 'duracao_ms');
  if ((tipo === 'audio') !== (duracaoMs !== null)) malformada('duracao_ms');
  return {
    alvo, alvoId, tipo, caminho: texto(l, 'caminho'), mime: texto(l, 'mime'),
    tamanhoBytes: inteiroPositivoOuNulo(l, 'tamanho_bytes') ?? malformada('tamanho_bytes'),
    duracaoMs, urlVideo: null,
  };
}

function anexoDaPrevia(l: Linha, respostaId: string): AnexoDoForum | null {
  const tipo = textoOuNulo(l, 'anexo_tipo');
  if (tipo === null) return null;
  return paraAnexoDoForum({
    alvo_tipo: 'resposta', alvo_id: respostaId, tipo,
    caminho: l.anexo_caminho, mime: l.anexo_mime,
    tamanho_bytes: l.anexo_tamanho_bytes, duracao_ms: l.anexo_duracao_ms,
    url_video: l.video_externo_url,
  });
}

function paraPreviaDeResposta(l: Linha): PreviaDeRespostaDoTopico {
  const resposta = paraResposta(l);
  return { topicoId: resposta.topicoId, resposta, anexo: anexoDaPrevia(l, resposta.id) };
}

function parametrosDoAnexo(anexo: AnexoParaPublicar | null | undefined): Record<string, unknown> {
  if (!anexo) {
    return {
      p_anexo_tipo: null, p_anexo_caminho: null, p_anexo_mime: null,
      p_anexo_tamanho_bytes: null, p_anexo_duracao_ms: null, p_url_video: null,
    };
  }
  if (anexo.tipo === 'videoExterno') {
    return {
      p_anexo_tipo: 'video_externo', p_anexo_caminho: null, p_anexo_mime: null,
      p_anexo_tamanho_bytes: null, p_anexo_duracao_ms: null, p_url_video: anexo.url,
    };
  }
  return {
    p_anexo_tipo: anexo.tipo, p_anexo_caminho: anexo.caminho, p_anexo_mime: anexo.mime,
    p_anexo_tamanho_bytes: anexo.tamanhoBytes,
    p_anexo_duracao_ms: anexo.tipo === 'audio' ? anexo.duracaoMs ?? null : null,
    p_url_video: null,
  };
}

const EXTENSAO_POR_MIME: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3',
};

/** `MediaRecorder` costuma acrescentar codecs; o bucket aceita apenas a base. */
export function normalizarMimeParaAnexo(mime: string): string {
  return mime.trim().toLowerCase().split(';', 1)[0] ?? '';
}

// ---------------------------------------------------------------------------
// Paginação
// ---------------------------------------------------------------------------

function limiteEfetivo(pedido: number | undefined, padrao: number, maximo: number): number {
  if (pedido === undefined || !Number.isFinite(pedido)) return padrao;
  return Math.max(1, Math.min(Math.trunc(pedido), maximo));
}

/**
 * Página cheia traz cursor da última linha. O `valor` sai do texto cru da linha
 * (`criado_em` ou `ultima_atividade_em`), idêntico ao que o servidor mandou.
 */
function paginaDe<T, C extends CursorDoForum>(
  linhas: readonly Linha[],
  limite: number,
  traduzir: (linha: Linha) => T,
  cursorDe: (linha: Linha, item: T) => C,
): PaginaDoForum<C, T> {
  const itens = linhas.map(traduzir);
  const i = itens.length - 1;
  return { itens, proximo: itens.length >= limite ? cursorDe(linhas[i], itens[i]) : null };
}

function ordemOuPadrao(ordem: OrdemDosTopicos | undefined): OrdemDosTopicos {
  return ordem ?? 'atividade';
}

// ---------------------------------------------------------------------------
// A porta
// ---------------------------------------------------------------------------

export function criarForumWeb(opcoes: { forcarOffline?: boolean } = {}): PortaDeForum {
  const usaServidor = (): boolean => !opcoes.forcarOffline && servidorConfigurado();

  async function ler<T>(
    rpc: string,
    args: Record<string, unknown>,
    tratar: (linhas: Linha[]) => T,
  ): Promise<ResultadoDaLeitura<T>> {
    if (!usaServidor()) return { ok: false, motivo: 'semServidor' };
    try {
      const { data, error } = await comTempo(supabase.rpc(rpc, args), TEMPO_DA_LEITURA_MS, rpc);
      if (error) {
        const motivo = motivoDeLeitura(error);
        if (motivo === 'falhou') console.error(`Falha ao ler ${rpc}`, error);
        return { ok: false, motivo };
      }
      return { ok: true, valor: tratar(lista(data)) };
    } catch (erro) {
      console.error(`Falha ao ler ${rpc}`, erro);
      return { ok: false, motivo: 'falhou' };
    }
  }

  /** Quem não tem conta de verdade nem chega ao servidor: a tela mostra o convite. */
  async function temConta(): Promise<boolean | 'erro'> {
    try {
      const { data, error } = await comTempo(supabase.auth.getSession(), TEMPO_DA_LEITURA_MS, 'sessão');
      if (error) {
        // Rede ou erro ilegível: não sabemos nada. Qualquer outro erro de auth (refresh token
        // inválido, sessão revogada) é sessão que caiu: a tela mostra o convite.
        const nome = (error as { name?: string }).name ?? '';
        return nome === 'AuthRetryableFetchError' || nome === 'AuthUnknownError' || !nome.startsWith('Auth')
          ? 'erro'
          : false;
      }
      const usuario = data.session?.user;
      return Boolean(usuario) && usuario?.is_anonymous !== true;
    } catch {
      return 'erro';
    }
  }

  async function escrever<T>(
    rpc: string,
    args: Record<string, unknown>,
    tratar: (dados: unknown) => T,
  ): Promise<ResultadoDaEscrita<T>> {
    if (!usaServidor()) return { ok: false, motivo: 'semServidor' };
    const conta = await temConta();
    if (conta === 'erro') return { ok: false, motivo: 'falhou' };
    if (!conta) return { ok: false, motivo: 'precisaEntrar' };
    try {
      const { data, error } = await comTempo(supabase.rpc(rpc, args), TEMPO_DA_ESCRITA_MS, rpc);
      if (error) {
        const motivo = motivoDeEscrita(error);
        if (motivo === 'falhou' || motivo === 'semConfirmacao') console.error(`Falha em ${rpc}`, error);
        return { ok: false, motivo };
      }
      // Resposta que não entendemos: o servidor pode ter gravado, então não é "falhou".
      return { ok: true, valor: tratar(data) };
    } catch (erro) {
      console.error(`Falha em ${rpc}`, erro);
      return { ok: false, motivo: 'semConfirmacao' };
    }
  }

  /** O servidor devolve `true` em apagar e denunciar; qualquer outra coisa não é confirmação. */
  const exigirVerdadeiro = (dados: unknown): true => {
    if (dados !== true) malformada('retorno');
    return true;
  };

  return {
    listarComunidadesDoForum() {
      return ler('listar_comunidades_do_forum', {}, (linhas) => linhas.map(paraComunidadeDoForum));
    },

    obterComunidadeDoForum(slug) {
      return ler('obter_comunidade_do_forum', { p_slug: slug }, (linhas) =>
        linhas.length ? paraComunidadeDoForum(linhas[0]) : null,
      );
    },

    listarTopicos(slug, op = {}) {
      const ordem = ordemOuPadrao(op.ordem);
      const limite = limiteEfetivo(op.limite, LIMITE_PADRAO_DE_TOPICOS, LIMITE_MAXIMO_DE_TOPICOS);
      return ler(
        'listar_topicos',
        {
          p_slug: slug,
          p_limite: limite,
          p_ordem: ordem,
          p_cursor_valor: op.cursor?.valor ?? null,
          p_cursor_id: op.cursor?.id ?? null,
          p_cursor_fixado: op.cursor?.fixado ?? false,
        },
        (linhas) =>
          paginaDe(linhas, limite, paraTopico, (l, t): CursorDeTopicos => ({
            valor: texto(l, ordem === 'atividade' ? 'ultima_atividade_em' : 'criado_em'),
            id: t.id,
            fixado: t.fixado,
          })),
      );
    },

    async obterTopico(topicoId) {
      // Id que nem é UUID não existe: "não achei", sem gastar uma ida ao servidor.
      if (!UUID.test(topicoId)) return usaServidor() ? { ok: true, valor: null } : { ok: false, motivo: 'semServidor' };
      return ler('obter_topico', { p_topico_id: topicoId }, (linhas) => (linhas.length ? paraTopico(linhas[0]) : null));
    },

    async listarRespostasDoTopico(topicoId, op = {}) {
      const limite = limiteEfetivo(op.limite, LIMITE_PADRAO_DE_RESPOSTAS, LIMITE_MAXIMO_DE_RESPOSTAS);
      if (!UUID.test(topicoId)) {
        return usaServidor()
          ? { ok: true, valor: { itens: [], proximo: null } }
          : { ok: false, motivo: 'semServidor' };
      }
      return ler(
        'listar_respostas_do_topico',
        {
          p_topico_id: topicoId,
          p_limite: limite,
          p_cursor_criado_em: op.cursor?.valor ?? null,
          p_cursor_id: op.cursor?.id ?? null,
        },
        (linhas) =>
          paginaDe(linhas, limite, paraResposta, (l, r): CursorDoForum => ({ valor: texto(l, 'criado_em'), id: r.id })),
      );
    },

    listarPreviaRespostasDosTopicos(topicoIds) {
      const ids = [...new Set(topicoIds)].filter((id) => UUID.test(id)).slice(0, 100);
      if (ids.length === 0) {
        return usaServidor()
          ? Promise.resolve({ ok: true as const, valor: [] as readonly PreviaDeRespostaDoTopico[] })
          : Promise.resolve({ ok: false as const, motivo: 'semServidor' as const });
      }
      return ler(
        'listar_previa_respostas_dos_topicos',
        { p_topicos: ids, p_limite_por_topico: 2 },
        (linhas) => linhas.map(paraPreviaDeResposta),
      );
    },

    explorarTopicos(op = {}) {
      const ordem = ordemOuPadrao(op.ordem);
      const limite = limiteEfetivo(op.limite, LIMITE_PADRAO_DE_TOPICOS, LIMITE_MAXIMO_DE_TOPICOS);
      return ler(
        'explorar_topicos',
        {
          p_limite: limite,
          p_ordem: ordem,
          p_cursor_valor: op.cursor?.valor ?? null,
          p_cursor_id: op.cursor?.id ?? null,
        },
        (linhas) =>
          paginaDe(linhas, limite, paraTopicoDoExplorar, (l, t): CursorDoForum => ({
            valor: texto(l, ordem === 'atividade' ? 'ultima_atividade_em' : 'criado_em'),
            id: t.id,
          })),
      );
    },

    listarTopicosDoAutor(handle, op = {}) {
      const limite = limiteEfetivo(op.limite, LIMITE_PADRAO_DO_AUTOR, LIMITE_MAXIMO_DO_AUTOR);
      return ler(
        'listar_topicos_do_autor',
        {
          p_handle: handle,
          p_limite: limite,
          p_cursor_criado_em: op.cursor?.valor ?? null,
          p_cursor_id: op.cursor?.id ?? null,
        },
        (linhas) =>
          paginaDe(linhas, limite, paraTopicoDoAutor, (l, t): CursorDoForum => ({ valor: texto(l, 'criado_em'), id: t.id })),
      );
    },

    listarRespostasDoAutor(handle, op = {}) {
      const limite = limiteEfetivo(op.limite, LIMITE_PADRAO_DO_AUTOR, LIMITE_MAXIMO_DO_AUTOR);
      return ler(
        'listar_respostas_do_autor',
        {
          p_handle: handle,
          p_limite: limite,
          p_cursor_criado_em: op.cursor?.valor ?? null,
          p_cursor_id: op.cursor?.id ?? null,
        },
        (linhas) =>
          paginaDe(linhas, limite, paraRespostaDoAutor, (l, r): CursorDoForum => ({ valor: texto(l, 'criado_em'), id: r.id })),
      );
    },

    listarAnexosDoForum(ids) {
      const topicos = [...new Set(ids.topicoIds ?? [])].filter((id) => UUID.test(id));
      const respostas = [...new Set(ids.respostaIds ?? [])].filter((id) => UUID.test(id));
      if (topicos.length === 0 && respostas.length === 0) {
        return usaServidor()
          ? Promise.resolve({ ok: true as const, valor: [] as readonly AnexoDoForum[] })
          : Promise.resolve({ ok: false as const, motivo: 'semServidor' as const });
      }
      return ler(
        'listar_anexos_do_forum',
        { p_topicos: topicos, p_respostas: respostas },
        (linhas) => linhas.map(paraAnexoDoForum),
      );
    },

    async assinarAnexoDoForum(caminho) {
      if (!usaServidor()) return { ok: false, motivo: 'semServidor' };
      try {
        const { data, error } = await comTempo(
          supabase.storage.from('anexos_do_forum').createSignedUrl(caminho, 300),
          TEMPO_DA_LEITURA_MS,
          'assinar_anexo_do_forum',
        );
        if (error || !data?.signedUrl) {
          if (error) console.error('Falha ao assinar anexo do fórum', error);
          return { ok: false, motivo: 'falhou' };
        }
        return { ok: true, valor: data.signedUrl };
      } catch (erro) {
        console.error('Falha ao assinar anexo do fórum', erro);
        return { ok: false, motivo: 'falhou' };
      }
    },

    criarGravacaoLivreDoForum,

    criarTopico(pedido) {
      return escrever(
        'criar_topico_com_anexo',
        {
          p_slug: pedido.comunidadeSlug,
          p_titulo: pedido.titulo ?? '',
          p_corpo: pedido.corpo,
          ...parametrosDoAnexo(pedido.anexo),
        },
        (dados): TopicoCriado => {
          const l = linhaDe(dados);
          return { id: texto(l, 'id'), criadoEm: texto(l, 'criado_em') };
        },
      );
    },

    responderTopico(pedido) {
      return escrever(
        'responder_topico_com_anexo',
        {
          p_topico_id: pedido.topicoId,
          p_corpo: pedido.corpo,
          p_pai_id: pedido.paiId ?? null,
          ...parametrosDoAnexo(pedido.anexo),
        },
        (dados): RespostaCriada => {
          const l = linhaDe(dados);
          return {
            id: texto(l, 'id'),
            topicoId: texto(l, 'topico_id'),
            paiId: textoOuNulo(l, 'pai_id'),
            nivel: nivel(l),
            criadoEm: texto(l, 'criado_em'),
          };
        },
      );
    },

    async enviarAnexoDoForum(pedido) {
      if (!usaServidor()) return { ok: false, motivo: 'semServidor' };
      const conta = await temConta();
      if (conta === 'erro') return { ok: false, motivo: 'falhou' };
      if (!conta) return { ok: false, motivo: 'precisaEntrar' };
      const mime = normalizarMimeParaAnexo(pedido.arquivo.type);
      const extensao = EXTENSAO_POR_MIME[mime];
      const limite = pedido.tipo === 'imagem' ? 8 * 1024 * 1024 : 10 * 1024 * 1024;
      const duracao = pedido.duracaoMs;
      if (!extensao || pedido.arquivo.size < 1 || pedido.arquivo.size > limite
        || (pedido.tipo === 'imagem' && !mime.startsWith('image/'))
        || (pedido.tipo === 'audio' && (!mime.startsWith('audio/') || !Number.isInteger(duracao) || duracao! < 1 || duracao! > 60_000))) {
        return { ok: false, motivo: 'falhou' };
      }
      try {
        const sessao = await supabase.auth.getSession();
        const uid = sessao.data.session?.user.id;
        if (!uid || sessao.data.session?.user.is_anonymous) return { ok: false, motivo: 'precisaEntrar' };
        const caminho = `${uid}/forum/${crypto.randomUUID()}.${extensao}`;
        const { error } = await comTempo(
          supabase.storage.from('anexos_do_forum').upload(caminho, pedido.arquivo, { contentType: mime, upsert: false }),
          TEMPO_DA_ESCRITA_MS,
          'enviar_anexo_do_forum',
        );
        if (error) {
          console.error('Falha ao enviar anexo do fórum', error);
          return { ok: false, motivo: 'falhou' };
        }
        return {
          ok: true,
          valor: pedido.tipo === 'audio'
            ? { tipo: 'audio', caminho, mime, tamanhoBytes: pedido.arquivo.size, duracaoMs: duracao! }
            : { tipo: 'imagem', caminho, mime, tamanhoBytes: pedido.arquivo.size },
        };
      } catch (erro) {
        console.error('Falha ao enviar anexo do fórum', erro);
        return { ok: false, motivo: 'semConfirmacao' };
      }
    },

    editarTopico(pedido) {
      return escrever(
        'editar_topico',
        { p_topico_id: pedido.topicoId, p_titulo: pedido.titulo ?? null, p_corpo: pedido.corpo ?? null },
        (dados): TopicoEditado => {
          const l = linhaDe(dados);
          return {
            id: texto(l, 'id'),
            titulo: texto(l, 'titulo'),
            corpo: textoLivre(l, 'corpo'),
            editadoEm: texto(l, 'editado_em'),
          };
        },
      );
    },

    editarResposta(pedido) {
      return escrever(
        'editar_resposta',
        { p_resposta_id: pedido.respostaId, p_corpo: pedido.corpo },
        (dados): RespostaEditada => {
          const l = linhaDe(dados);
          return { id: texto(l, 'id'), corpo: texto(l, 'corpo'), editadoEm: texto(l, 'editado_em') };
        },
      );
    },

    apagarTopico(topicoId) {
      return escrever('apagar_topico', { p_topico_id: topicoId }, exigirVerdadeiro);
    },

    apagarResposta(respostaId) {
      return escrever('apagar_resposta', { p_resposta_id: respostaId }, exigirVerdadeiro);
    },

    denunciarTopico(topicoId, motivo) {
      return escrever('denunciar_topico', { p_topico_id: topicoId, p_motivo: motivo }, exigirVerdadeiro);
    },

    denunciarResposta(respostaId, motivo) {
      return escrever('denunciar_resposta', { p_resposta_id: respostaId, p_motivo: motivo }, exigirVerdadeiro);
    },
  };
}

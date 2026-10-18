/**
 * Os tipos do elenco da casa (Burpzilla).
 *
 * Núcleo puro: sem rede, sem arquivo, sem navegador. Quem lê disco e fala com
 * o Supabase são os scripts de `scripts/elenco-burpzilla/`.
 */

/** Marca do dado: a cena pede áudio e ninguém escolheu o arquivo ainda. */
export const AUDIO_PENDENTE = 'AUDIO_PENDENTE' as const;

/**
 * O áudio de um post:
 * - `AUDIO_PENDENTE`: o cronograma marca `[áudio]` e a escolha não foi feita;
 * - `null`: o post é só texto;
 * - `{ arquivo }`: nome do arquivo em `audios/solo-eructos/`, já escolhido.
 */
export type AudioDoPost = typeof AUDIO_PENDENTE | null | { readonly arquivo: string };

export type AutorDoPost = 'giam' | 'lima';

/** Os comentadores do cronograma aparecem como "agente A..E". */
export type RotuloDeAgente = 'A' | 'B' | 'C' | 'D' | 'E';

export interface PostDeRoteiro {
  /** Chave estável (p01...). Dela sai o id determinístico do post. */
  readonly chave: string;
  readonly autor: AutorDoPost;
  /** Horário de Brasília (-03:00), `AAAA-MM-DDTHH:MM`. */
  readonly quando: string;
  /** Exatamente o texto do cronograma. */
  readonly texto: string;
  readonly audio: AudioDoPost;
  /** O que a cena pede do arroto, para quem for escolher o arquivo. */
  readonly descricaoDoAudio?: string;
}

export interface ComentarioDeRoteiro {
  readonly chave: string;
  readonly postChave: string;
  readonly agente: RotuloDeAgente;
  readonly texto: string;
  /**
   * O cronograma pedia um arroto e o comentário da casa é só texto. A
   * onomatopeia aqui é provisória e só vale com o aval do autor.
   */
  readonly pendenteAvalAutor?: boolean;
}

export interface ContaFixa {
  readonly handle: string;
  readonly apelido: string;
  readonly bio: string;
}

export interface Roteiro {
  readonly comunidadeSlug: string;
  readonly contasFixas: readonly ContaFixa[];
  readonly poolDeAgentes: readonly string[];
  readonly bioDosAgentes: string;
  readonly posts: readonly PostDeRoteiro[];
  readonly comentarios: readonly ComentarioDeRoteiro[];
}

export type StatusDoSorteio = 'PENDENTE_REVISAO' | 'APROVADO';

export interface Sorteio {
  readonly semente: number;
  readonly status: StatusDoSorteio;
  /** Quem é cada rótulo do cronograma. Distintos entre si. */
  readonly agentes: Readonly<Record<RotuloDeAgente, string>>;
  /** Minutos entre o post pai e o comentário, por chave de comentário. */
  readonly atrasosEmMinutos: Readonly<Record<string, number>>;
}

export type PapelDaConta = 'personagem' | 'agente';

export interface ContaMontada {
  readonly handle: string;
  readonly apelido: string;
  readonly bio: string;
  readonly papel: PapelDaConta;
  /** E-mail interno, nunca de domínio que o projeto não controla. */
  readonly email: string;
  readonly id: string;
  /** UTC, ISO. */
  readonly criadoEm: string;
}

export interface PostMontado {
  readonly chave: string;
  readonly id: string;
  readonly autorId: string;
  readonly autorHandle: string;
  readonly topico: string;
  readonly texto: string;
  readonly criadoEm: string;
  readonly audio: AudioDoPost;
  /** Caminho no bucket `audio_da_casa`, ou `null` sem áudio. */
  readonly caminhoDoAudio: string | null;
}

export interface ComentarioMontado {
  readonly chave: string;
  readonly id: string;
  readonly postId: string;
  readonly autorId: string;
  readonly autorHandle: string;
  readonly texto: string;
  readonly criadoEm: string;
  readonly pendenteAvalAutor: boolean;
}

export interface ElencoMontado {
  readonly contas: readonly ContaMontada[];
  readonly posts: readonly PostMontado[];
  readonly comentarios: readonly ComentarioMontado[];
}

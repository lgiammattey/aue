/** Contagens e o que a conta atual marcou. Vem do servidor, nunca é inventado na tela. */
export interface EngajamentoDoPost {
  readonly like: number;
  readonly fogo: number;
  readonly nojo: number;
  readonly trofeu: number;
  readonly minhas: readonly ('like' | 'fogo' | 'nojo' | 'trofeu')[];
}

export interface ItemDoFeed {
  readonly id: string;
  readonly tipo: 'topico' | 'causo';
  readonly comunidadeSlug: string;
  readonly titulo: string;
  readonly corpo: string;
  readonly autorNome: string;
  readonly autorHandle?: string;
  readonly autorAvatarUrl?: string;
  readonly criadoEm: string;
  readonly respostasTotal: number;
  readonly temAudio?: boolean;
  readonly enderecoDoAudio?: string | (() => Promise<string | null>);
  readonly nota?: number;
  /** Duração real do áudio, quando a porta informa; o player nunca inventa uma. */
  readonly duracaoSegundos?: number;
  readonly videoUrl?: string;
  /** Só causos trazem isso junto; tópico é preenchido por `contarReacoesDosTopicos`. */
  readonly engajamento?: EngajamentoDoPost;
  /** Mídia livre da conversa. A URL de Storage só existe depois de assinada pela plataforma. */
  readonly anexo?: {
    readonly tipo: 'imagem' | 'audio' | 'videoExterno';
    readonly url?: string;
    readonly duracaoMs?: number | null;
  };
}


export interface ItemComentario {
  readonly id: string;
  readonly autorNome: string;
  readonly autorHandle?: string;
  readonly autorAvatarUrl?: string;
  readonly conteudo: string;
  readonly criadoEm: string;
  readonly paiId?: string | null;
  readonly nivel?: 0 | 1 | 2;
  readonly anexo?: {
    readonly tipo: 'imagem' | 'audio' | 'videoExterno';
    readonly url?: string;
    readonly duracaoMs?: number | null;
  };
}

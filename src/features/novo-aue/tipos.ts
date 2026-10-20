export interface ItemDoFeed {
  readonly id: string;
  readonly tipo: 'topico' | 'causo';
  readonly comunidadeSlug: string;
  readonly titulo: string;
  readonly corpo: string;
  readonly autorNome: string;
  readonly autorHandle?: string;
  readonly criadoEm: string;
  readonly votos: number;
  readonly respostasTotal: number;
  readonly temAudio?: boolean;
  readonly enderecoDoAudio?: string | (() => Promise<string | null>);
  readonly nota?: number;
  readonly videoUrl?: string;
}

export interface DetalhesDaComunidade {
  readonly title: string;
  readonly description: string;
  readonly members: string;
  readonly rules: readonly string[];
  readonly moderators: readonly (readonly [string, string])[];
}

export interface ItemComentario {
  readonly id: string;
  readonly autorNome: string;
  readonly autorHandle?: string;
  readonly conteudo: string;
  readonly criadoEm: string;
}

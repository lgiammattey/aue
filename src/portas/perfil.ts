/**
 * A porta do perfil público.
 *
 * Contrato puro (ADR 0001 §2): sem React, sem Supabase, sem DOM. Quem fala com
 * o servidor é `plataforma/web/perfilRemoto.ts`.
 */

export interface PerfilPublico {
  readonly id: string;
  readonly handle: string;
  readonly apelido: string;
  readonly avatarUrl?: string;
  readonly bio?: string;
  readonly cidade?: string;
  readonly titulo?: string;
  readonly fundador: boolean;
  readonly criadoEm: string;
  /** @ nas redes, sem o arroba e sem link. */
  readonly instagram?: string;
  readonly tiktok?: string;
  readonly youtube?: string;
  readonly twitter?: string;
  readonly totalCausos: number;
  /** Maior nota entre os causos PUBLICADOS. Jogo privado não entra. */
  readonly melhorNota?: number;
  readonly totalSeguidores: number;
  readonly totalSeguindo: number;
  readonly euSigo: boolean;
  readonly souEu: boolean;
}

export interface DadosDoPerfil {
  readonly apelido?: string;
  readonly handle?: string;
  readonly bio?: string;
  readonly cidade?: string;
  /** `''` limpa; ausente não muda. */
  readonly instagram?: string;
  readonly tiktok?: string;
  readonly youtube?: string;
  readonly twitter?: string;
}

/** Uma pessoa na lista de seguidores ou de quem se segue. */
export interface Conexao {
  readonly id: string;
  readonly handle: string;
  readonly apelido: string;
  readonly avatarUrl?: string;
  readonly euSigo: boolean;
}

export type ResultadoDaFoto =
  | { readonly ok: true; readonly perfil: PerfilPublico }
  | { readonly ok: false; readonly motivo: 'formatoInvalido' }
  | { readonly ok: false; readonly motivo: 'grandeDemais' }
  | { readonly ok: false; readonly motivo: 'semConta' }
  | { readonly ok: false; readonly motivo: 'falhou' };

export type ResultadoDaEdicao =
  | { readonly ok: true; readonly perfil: PerfilPublico }
  | { readonly ok: false; readonly motivo: 'handleEmUso' }
  | { readonly ok: false; readonly motivo: 'invalido'; readonly detalhe: string }
  | { readonly ok: false; readonly motivo: 'semConta' }
  | { readonly ok: false; readonly motivo: 'semRede' };

export interface PortaDePerfil {
  /** Perfil pelo handle, ou `null` se não existe (ou se não há servidor). */
  obterPerfil(handle: string): Promise<PerfilPublico | null>;
  /** O perfil de quem está jogando agora. */
  obterMeuPerfil(): Promise<PerfilPublico | null>;
  /** Segue ou deixa de seguir. `ok: false` quando o servidor não aceitou. */
  alternarSeguir(perfilId: string): Promise<{ readonly ok: boolean; readonly seguindo: boolean }>;
  atualizarMeuPerfil(dados: DadosDoPerfil): Promise<ResultadoDaEdicao>;
  /** Troca a foto. A imagem é reduzida antes de subir. */
  enviarFoto(imagem: Blob): Promise<ResultadoDaFoto>;
  removerFoto(): Promise<ResultadoDaFoto>;
  listarConexoes(handle: string, tipo: 'seguidores' | 'seguindo'): Promise<readonly Conexao[]>;
}

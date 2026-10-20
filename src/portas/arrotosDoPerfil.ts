/**
 * Arrotos entregues no perfil.
 *
 * Este domínio é deliberadamente separado de Arena, resultado, comunidade e
 * feed. Um áudio aqui é uma gravação direta: não tem nota e, quando publicado,
 * fica visível a contas autenticadas que acessam o perfil de destino.
 */

export interface RascunhoDeArrotoDoPerfil {
  readonly id: string;
  /** Caminho privado e imutável autorizado pelo servidor para este rascunho. */
  readonly caminhoDoAudio: string;
  readonly perfilDestinoId: string;
  readonly perfilDestinoHandle: string;
  readonly perfilDestinoApelido: string;
}

export interface ArrotoDoPerfil {
  readonly id: string;
  readonly perfilId: string;
  readonly autorId: string;
  readonly autorHandle: string;
  readonly autorApelido: string;
  readonly duracaoSegundos: number;
  readonly criadoEm: string;
  /** URL curta; quem toca pede no instante em que vai dar play. */
  readonly enderecoDoAudio: () => Promise<string | null>;
  readonly meu: boolean;
  /** Quem recebeu no próprio perfil também pode ocultar a entrega. */
  readonly possoOcultar: boolean;
}

export type ResultadoDoPreparoDeArroto =
  | { readonly ok: true; readonly rascunho: RascunhoDeArrotoDoPerfil }
  | { readonly ok: false; readonly motivo: 'destinoInexistente' | 'semConta' | 'semRede' };

export type ResultadoDaPublicacaoDeArroto =
  | { readonly ok: true; readonly arroto: ArrotoDoPerfil }
  | { readonly ok: false; readonly motivo: 'formatoInvalido' | 'grandeDemais' | 'duracaoInvalida' | 'semConta' | 'semRede' | 'falhou' };

/** Contrato puro. Upload e URL assinada pertencem ao adaptador web. */
export interface PortaDeArrotosDoPerfil {
  /** Resolve o @ no servidor e cria o rascunho privado antes de qualquer upload. */
  prepararArroto(destinoHandle?: string): Promise<ResultadoDoPreparoDeArroto>;
  /** Sobe o Blob para o caminho imutável do rascunho e só então o publica. */
  publicarArroto(
    rascunho: RascunhoDeArrotoDoPerfil,
    audio: Blob,
    duracaoSegundos: number,
  ): Promise<ResultadoDaPublicacaoDeArroto>;
  /** Só retorna áudios que podem aparecer naquele perfil para quem consulta. */
  listarArrotos(handle: string): Promise<readonly ArrotoDoPerfil[]>;
  /** Autor ou dono do perfil de destino podem ocultar; o áudio deixa de ser assinável. */
  ocultarArroto(id: string): Promise<boolean>;
}

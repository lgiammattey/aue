/**
 * Porta do diretório de grupos externos (WhatsApp, Telegram, TikTok).
 *
 * São grupos que moram FORA do Auê. O Auê guarda nome, descrição, link do
 * convite e uma imagem opcional. Não guarda membros e não conta ninguém.
 *
 * Não confundir com `Comunidade` (os temas do app, como Bonde Geral).
 */

export type PlataformaDeGrupo = 'whatsapp' | 'telegram' | 'tiktok';

export interface GrupoExterno {
  readonly id: string;
  readonly slug: string;
  readonly nome: string;
  readonly descricao: string;
  readonly plataforma: PlataformaDeGrupo;
  readonly linkDoConvite: string;
  /** Endereço público da imagem, ou `null` quando o grupo não tem. */
  readonly imagemUrl: string | null;
  readonly oficial: boolean;
}

export interface PedidoDeCadastroDeGrupo {
  readonly nome: string;
  readonly descricao: string;
  readonly plataforma: PlataformaDeGrupo;
  readonly link: string;
  readonly imagem?: File | null;
}

export type ResultadoDoCadastroDeGrupo =
  | {
      readonly ok: true;
      readonly slug: string;
      /** `null` quando não mandou imagem; `false` quando mandou e não subiu. */
      readonly imagemSalva: boolean | null;
    }
  | {
      readonly ok: false;
      readonly motivo: 'invalido' | 'repetido' | 'limite' | 'semServidor' | 'falhou';
      readonly mensagem: string;
      readonly campo?: 'nome' | 'descricao' | 'plataforma' | 'link' | 'imagem';
    };

export type ResultadoDaLista =
  | { readonly ok: true; readonly grupos: readonly GrupoExterno[] }
  | { readonly ok: false; readonly motivo: 'semServidor' | 'falhou' };

export type ResultadoDaDenuncia = 'registrada' | 'semServidor' | 'falhou';

export interface PortaDeGrupos {
  /** Os grupos visíveis, mais recentes primeiro, oficiais no topo. */
  listarGrupos(): Promise<ResultadoDaLista>;

  /** Cadastra um grupo. Quem fala com o servidor é a plataforma, não a tela. */
  cadastrarGrupo(pedido: PedidoDeCadastroDeGrupo): Promise<ResultadoDoCadastroDeGrupo>;

  /** Denuncia um grupo. Três pessoas distintas escondem o grupo (menos os oficiais). */
  denunciarGrupo(grupoId: string, motivo: string): Promise<ResultadoDaDenuncia>;
}

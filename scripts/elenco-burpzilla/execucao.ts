/**
 * A sequência do backfill e do desfazer, sem rede e sem disco.
 *
 * Tudo que fala com o mundo entra por `PortaDoServidor` (rede) e `lerAudio`
 * (disco). Em produção quem entrega as duas é `aplicar.ts`; nos testes, um
 * servidor falso em memória. Falha de qualquer passo para a carga na hora: nada
 * vira "ok" por engano, e rodar de novo é seguro porque os ids são fixos.
 */
import type { ComentarioMontado, ContaMontada, ElencoMontado, PostMontado } from '../../src/nucleo/elenco/tipos.ts';

export interface PortaDoServidor {
  /** Cria o usuário em auth.users com o id fixo, ou diz que já existia. */
  garantirUsuario(conta: ContaMontada): Promise<'criado' | 'existia'>;
  registrarConta(conta: ContaMontada): Promise<void>;
  enviarAudio(caminho: string, bytes: Uint8Array): Promise<void>;
  /** `true` se inseriu, `false` se o id já estava lá. */
  publicarPost(post: PostMontado): Promise<boolean>;
  comentar(comentario: ComentarioMontado): Promise<boolean>;
}

export interface PortaDoDesfazer {
  removerComentarios(ids: readonly string[]): Promise<void>;
  removerPosts(ids: readonly string[]): Promise<void>;
  removerAudios(caminhos: readonly string[]): Promise<void>;
  removerUsuarios(ids: readonly string[]): Promise<void>;
}

export interface RelatorioDoBackfill {
  usuariosCriados: number;
  usuariosQueJaExistiam: number;
  audiosEnviados: number;
  postsInseridos: number;
  postsQueJaExistiam: number;
  comentariosInseridos: number;
  comentariosQueJaExistiam: number;
}

export type LerAudio = (post: PostMontado) => Uint8Array;

export async function executarBackfill(
  elenco: ElencoMontado,
  servidor: PortaDoServidor,
  lerAudio: LerAudio,
  avisar: (linha: string) => void = () => {},
): Promise<RelatorioDoBackfill> {
  const r: RelatorioDoBackfill = {
    usuariosCriados: 0,
    usuariosQueJaExistiam: 0,
    audiosEnviados: 0,
    postsInseridos: 0,
    postsQueJaExistiam: 0,
    comentariosInseridos: 0,
    comentariosQueJaExistiam: 0,
  };

  for (const conta of elenco.contas) {
    const estado = await servidor.garantirUsuario(conta);
    if (estado === 'criado') r.usuariosCriados++;
    else r.usuariosQueJaExistiam++;
    await servidor.registrarConta(conta);
    avisar(`conta ${conta.handle}: ${estado}`);
  }

  // Posts em ordem de data. O áudio sobe ANTES do post: nunca existe post
  // apontando para arquivo que não subiu.
  const posts = [...elenco.posts].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  for (const post of posts) {
    if (post.caminhoDoAudio) {
      await servidor.enviarAudio(post.caminhoDoAudio, lerAudio(post));
      r.audiosEnviados++;
    }
    if (await servidor.publicarPost(post)) r.postsInseridos++;
    else r.postsQueJaExistiam++;
    avisar(`post ${post.chave}: ok`);
  }

  // Comentários só depois de todos os posts.
  const comentarios = [...elenco.comentarios].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  for (const c of comentarios) {
    if (await servidor.comentar(c)) r.comentariosInseridos++;
    else r.comentariosQueJaExistiam++;
    avisar(`comentário ${c.chave}: ok`);
  }

  return r;
}

/**
 * Apaga só o que a carga criou, pelos ids fixos: comentários, posts, áudios e
 * as contas (o perfil e a marca da casa caem junto, por cascata).
 */
export async function executarDesfazer(elenco: ElencoMontado, servidor: PortaDoDesfazer): Promise<void> {
  await servidor.removerComentarios(elenco.comentarios.map((c) => c.id));
  await servidor.removerPosts(elenco.posts.map((p) => p.id));
  await servidor.removerAudios(elenco.posts.flatMap((p) => (p.caminhoDoAudio ? [p.caminhoDoAudio] : [])));
  await servidor.removerUsuarios(elenco.contas.map((c) => c.id));
}

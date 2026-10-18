import { postsComAudioPendente, validarElenco } from './validacao.ts';
import type { Roteiro, Sorteio } from './tipos.ts';

export interface EntradaDoPodeAplicar {
  readonly roteiro: Roteiro;
  readonly sorteio: Sorteio;
  /** Texto de `autorizacao-dos-audios.md`, ou `null` se o arquivo não existe. */
  readonly autorizacao: string | null;
}

export interface VeredictoDoPodeAplicar {
  readonly pode: boolean;
  readonly bloqueios: readonly string[];
}

/**
 * O portão do backfill. Só abre quando:
 * - roteiro e sorteio passam na validação;
 * - o sorteio foi revisado (`APROVADO`);
 * - todo post que pede áudio tem arquivo escolhido;
 * - nenhum comentário está esperando o aval do autor;
 * - o registro da autorização dos áudios existe e não tem campo em aberto.
 *
 * Nada aqui inventa prova: o que falta aparece como bloqueio.
 */
export function podeAplicar(entrada: EntradaDoPodeAplicar): VeredictoDoPodeAplicar {
  const bloqueios: string[] = [];

  for (const erro of validarElenco(entrada.roteiro, entrada.sorteio)) bloqueios.push(`validação: ${erro}`);

  if (entrada.sorteio.status !== 'APROVADO') {
    bloqueios.push(`sorteio em ${entrada.sorteio.status}: falta a revisão que muda para APROVADO`);
  }

  const semAudio = postsComAudioPendente(entrada.roteiro);
  if (semAudio.length > 0) bloqueios.push(`áudio sem escolha em ${semAudio.length} post(s): ${semAudio.join(', ')}`);

  const semAval = entrada.roteiro.comentarios.filter((c) => c.pendenteAvalAutor).map((c) => c.chave);
  if (semAval.length > 0) bloqueios.push(`comentário(s) esperando aval do autor: ${semAval.join(', ')}`);

  if (entrada.autorizacao === null) {
    bloqueios.push('docs/historias/burpzilla/autorizacao-dos-audios.md não existe');
  } else if (entrada.autorizacao.includes('PENDENTE')) {
    bloqueios.push('autorizacao-dos-audios.md ainda tem campo PENDENTE');
  }

  return { pode: bloqueios.length === 0, bloqueios };
}

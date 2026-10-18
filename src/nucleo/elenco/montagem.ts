import { obterComunidadePorSlug } from '../comunidade/comunidadesPadrao.ts';
import { caminhoDoAudioDaCasa } from './formatoAudio.ts';
import { brasiliaParaUtc, JANELA_DA_CASA, somarMinutos } from './horario.ts';
import type {
  ComentarioMontado,
  ContaMontada,
  ElencoMontado,
  Roteiro,
  RotuloDeAgente,
  Sorteio,
} from './tipos.ts';
import { uuidV5 } from './uuid.ts';

/** Espaço de nomes dos ids determinísticos. Não muda nunca: mudar duplica tudo. */
export const ESPACO_DE_NOMES_DA_CASA = '3f653215-d6ca-4821-93ce-9c1caa73d856';

/** Domínio reservado (RFC 2606): ninguém recebe e-mail nele. */
export const DOMINIO_INTERNO = 'contas-da-casa.invalid';

const UMA_HORA_EM_MINUTOS = 60;

function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function idDaConta(handle: string): string {
  return uuidV5(`conta:${handle}`, ESPACO_DE_NOMES_DA_CASA);
}

/**
 * Junta o roteiro com o sorteio e devolve tudo pronto para gravar: ids,
 * horários em UTC, quem comenta e a conta de cada um.
 *
 * Presume roteiro e sorteio já validados (`validarElenco`); dado quebrado
 * aqui lança erro em vez de seguir.
 */
export function montarElenco(roteiro: Roteiro, sorteio: Sorteio): ElencoMontado {
  const comunidade = obterComunidadePorSlug(roteiro.comunidadeSlug);
  if (!comunidade) throw new Error(`Comunidade "${roteiro.comunidadeSlug}" não existe.`);

  const posts = roteiro.posts.map((p) => {
    const id = uuidV5(`post:${p.chave}`, ESPACO_DE_NOMES_DA_CASA);
    return {
      chave: p.chave,
      id,
      autorHandle: p.autor,
      autorId: idDaConta(p.autor),
      topico: comunidade.nome,
      texto: p.texto,
      criadoEm: brasiliaParaUtc(p.quando),
      audio: p.audio,
      caminhoDoAudio: p.audio === null ? null : caminhoDoAudioDaCasa(id),
    };
  });

  const comentarios: ComentarioMontado[] = roteiro.comentarios.map((c) => {
    const pai = posts.find((p) => p.chave === c.postChave);
    if (!pai) throw new Error(`Comentário ${c.chave} aponta para o post ${c.postChave}, que não existe.`);
    const atraso = sorteio.atrasosEmMinutos[c.chave];
    if (atraso === undefined) throw new Error(`O sorteio não tem atraso para o comentário ${c.chave}.`);
    const nome = sorteio.agentes[c.agente as RotuloDeAgente];
    if (!nome) throw new Error(`O sorteio não tem agente para o rótulo ${c.agente}.`);
    const handle = handleDoAgente(nome);
    return {
      chave: c.chave,
      id: uuidV5(`comentario:${c.chave}`, ESPACO_DE_NOMES_DA_CASA),
      postId: pai.id,
      autorHandle: handle,
      autorId: idDaConta(handle),
      texto: c.texto,
      criadoEm: somarMinutos(pai.criadoEm, atraso),
      pendenteAvalAutor: c.pendenteAvalAutor === true,
    };
  });

  const primeiraAtividade = (handle: string): string => {
    const datas = [
      ...posts.filter((p) => p.autorHandle === handle).map((p) => p.criadoEm),
      ...comentarios.filter((c) => c.autorHandle === handle).map((c) => c.criadoEm),
    ].sort();
    return datas[0];
  };
  // A conta nasce uma hora antes da primeira coisa que fez, e nunca antes do
  // primeiro deploy de produção.
  const criadaEm = (handle: string): string => {
    const t = Date.parse(somarMinutos(primeiraAtividade(handle), -UMA_HORA_EM_MINUTOS));
    return new Date(Math.max(t, Date.parse(JANELA_DA_CASA.inicioUtc))).toISOString();
  };

  const contas: ContaMontada[] = [
    ...roteiro.contasFixas.map((f) => ({
      handle: f.handle,
      apelido: f.apelido,
      bio: f.bio,
      papel: 'personagem' as const,
    })),
    ...[...new Set(comentarios.map((c) => c.autorHandle))].map((handle) => ({
      handle,
      apelido: maiuscula(handle.replace(/_aue$/, '')),
      bio: roteiro.bioDosAgentes,
      papel: 'agente' as const,
    })),
  ].map((c) => ({
    ...c,
    email: `${c.handle}@${DOMINIO_INTERNO}`,
    id: idDaConta(c.handle),
    criadoEm: criadaEm(c.handle),
  }));

  return { contas, posts, comentarios };
}

/** Handle da conta de um agente da squad: `tiago` vira `tiago_aue`. */
export function handleDoAgente(nome: string): string {
  return `${nome.toLowerCase()}_aue`;
}

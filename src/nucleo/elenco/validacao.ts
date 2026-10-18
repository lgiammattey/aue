import { obterComunidadePorSlug } from '../comunidade/comunidadesPadrao.ts';
import { brasiliaParaUtc, dentroDaJanela } from './horario.ts';
import { montarElenco } from './montagem.ts';
import { AUDIO_PENDENTE } from './tipos.ts';
import type { Roteiro, RotuloDeAgente, Sorteio } from './tipos.ts';

const FORMATO_DE_HANDLE = /^[a-z0-9_]{3,20}$/;
const ARQUIVO_DE_AUDIO = /^[A-Za-z0-9._-]+\.(ogg|m4a)$/;
const LIMITE_DO_POST = 2000;
const LIMITE_DO_COMENTARIO = 500;
const LIMITE_DA_BIO = 160;

/** O nome da squad que não pode aparecer em conta da casa. */
const NOME_PROIBIDO = 'lucas';

/**
 * Confere o roteiro e o sorteio. Devolve a lista de problemas, vazia quando
 * está tudo certo. Não decide nada sozinha: quem decide se aplica é
 * `podeAplicar`.
 */
export function validarElenco(roteiro: Roteiro, sorteio: Sorteio): string[] {
  const erros: string[] = [];

  if (!obterComunidadePorSlug(roteiro.comunidadeSlug)) {
    erros.push(`A comunidade "${roteiro.comunidadeSlug}" não existe em COMUNIDADES_PADRAO.`);
  }

  const semRepeticao = (rotulo: string, chaves: readonly string[]) => {
    const vistas = new Set<string>();
    for (const k of chaves) {
      if (vistas.has(k)) erros.push(`${rotulo} repetida: ${k}.`);
      vistas.add(k);
    }
  };
  semRepeticao('Chave de post', roteiro.posts.map((p) => p.chave));
  semRepeticao('Chave de comentário', roteiro.comentarios.map((c) => c.chave));
  semRepeticao('Handle de conta fixa', roteiro.contasFixas.map((c) => c.handle));

  if (roteiro.poolDeAgentes.some((a) => a.toLowerCase().includes(NOME_PROIBIDO))) {
    erros.push(`O pool de agentes não pode ter "${NOME_PROIBIDO}".`);
  }

  for (const c of roteiro.contasFixas) {
    if (!FORMATO_DE_HANDLE.test(c.handle)) erros.push(`Handle fora do formato: ${c.handle}.`);
    if (c.bio.length > LIMITE_DA_BIO) erros.push(`Bio de ${c.handle} passa de ${LIMITE_DA_BIO} caracteres.`);
  }
  if (roteiro.bioDosAgentes.length > LIMITE_DA_BIO) erros.push('A bio dos agentes passa de 160 caracteres.');

  for (const p of roteiro.posts) {
    if (!roteiro.contasFixas.some((c) => c.handle === p.autor)) {
      erros.push(`Post ${p.chave}: o autor "${p.autor}" não tem conta fixa.`);
    }
    if (!p.texto.trim()) erros.push(`Post ${p.chave} sem texto.`);
    if (p.texto.length > LIMITE_DO_POST) erros.push(`Post ${p.chave} passa de ${LIMITE_DO_POST} caracteres.`);
    if (typeof p.audio === 'object' && p.audio !== null && !ARQUIVO_DE_AUDIO.test(p.audio.arquivo)) {
      erros.push(`Post ${p.chave}: arquivo de áudio inválido ("${p.audio.arquivo}").`);
    }
    try {
      if (!dentroDaJanela(brasiliaParaUtc(p.quando))) erros.push(`Post ${p.chave} fora da janela da casa.`);
    } catch (e) {
      erros.push(`Post ${p.chave}: ${(e as Error).message}`);
    }
  }

  for (const c of roteiro.comentarios) {
    if (!roteiro.posts.some((p) => p.chave === c.postChave)) {
      erros.push(`Comentário ${c.chave} aponta para o post ${c.postChave}, que não existe.`);
    }
    if (!c.texto.trim()) erros.push(`Comentário ${c.chave} sem texto.`);
    if (c.texto.length > LIMITE_DO_COMENTARIO) erros.push(`Comentário ${c.chave} passa de 500 caracteres.`);
    if (!sorteio.agentes[c.agente as RotuloDeAgente]) erros.push(`O sorteio não define o agente ${c.agente}.`);
    const atraso = sorteio.atrasosEmMinutos[c.chave];
    if (!Number.isInteger(atraso) || atraso < 1) erros.push(`Comentário ${c.chave}: atraso inválido no sorteio.`);
  }

  const sorteados = Object.values(sorteio.agentes).filter(Boolean);
  if (new Set(sorteados).size !== sorteados.length) erros.push('O sorteio repetiu um agente em rótulos diferentes.');
  for (const nome of sorteados) {
    if (!roteiro.poolDeAgentes.includes(nome)) erros.push(`O agente sorteado "${nome}" não está no pool.`);
  }

  if (erros.length > 0) return erros;

  // Estrutura sã: monta e confere o que só dá para conferir montado.
  const elenco = montarElenco(roteiro, sorteio);
  const postPorId = new Map(elenco.posts.map((p) => [p.id, p]));
  for (const c of elenco.comentarios) {
    if (!dentroDaJanela(c.criadoEm)) erros.push(`Comentário ${c.chave} cai fora da janela da casa.`);
    const pai = postPorId.get(c.postId);
    if (pai && Date.parse(c.criadoEm) <= Date.parse(pai.criadoEm)) {
      erros.push(`Comentário ${c.chave} sai antes do post pai.`);
    }
  }
  for (const conta of elenco.contas) {
    if (!FORMATO_DE_HANDLE.test(conta.handle)) erros.push(`Handle fora do formato: ${conta.handle}.`);
    for (const campo of [conta.handle, conta.apelido, conta.email, conta.bio]) {
      if (campo.toLowerCase().includes(NOME_PROIBIDO)) {
        erros.push(`Conta ${conta.handle} tem "${NOME_PROIBIDO}" em ${campo}.`);
      }
    }
    if (!dentroDaJanela(conta.criadoEm)) erros.push(`Conta ${conta.handle} criada fora da janela da casa.`);
  }
  semRepeticao('Id de conta', elenco.contas.map((c) => c.id));
  semRepeticao('Id de post', elenco.posts.map((p) => p.id));
  semRepeticao('Id de comentário', elenco.comentarios.map((c) => c.id));

  return erros;
}

/** Posts que pedem áudio e ainda não têm arquivo escolhido. */
export function postsComAudioPendente(roteiro: Roteiro): string[] {
  return roteiro.posts.filter((p) => p.audio === AUDIO_PENDENTE).map((p) => p.chave);
}

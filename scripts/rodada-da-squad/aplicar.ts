/**
 * Publica a rodada histórica da squad no Bonde.
 *
 * Usa áudios reais em audios/solo-eructos, convertidos para o formato público
 * da casa. As datas são deliberadamente espaçadas entre setembro e outubro de
 * 2026; rodar de novo não duplica post, comentário nem arquivo.
 */
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { validarM4a } from '../../src/nucleo/elenco/formatoAudio.ts';
import { ESPACO_DE_NOMES_DA_CASA, idDaConta } from '../../src/nucleo/elenco/montagem.ts';
import { uuidV5 } from '../../src/nucleo/elenco/uuid.ts';
import { confirmarProjeto } from '../elenco-burpzilla/confirmacao.ts';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const LIMITE_DO_BUCKET = 1_048_576;

type Post = {
  readonly chave: string;
  readonly autor: string;
  readonly audio: string;
  readonly texto: string;
  readonly quando: string;
};

type Comentario = {
  readonly chave: string;
  readonly post: string;
  readonly autor: string;
  readonly texto: string;
  readonly quando: string;
};

const POSTS: readonly Post[] = [
  {
    chave: 'audio-cru-do-lucas', autor: 'lucas_aue', audio: '869_file_869_0.ogg',
    texto: 'Peguei um da pasta e deixei cru: sem motor, sem placar. Só o som. Escuta até o fim e diz se segura a pressão.',
    quando: '2026-09-18T18:42:00-03:00',
  },
  {
    chave: 'rodada-curta-do-iury', autor: 'iury_aue', audio: '5040_file_5040_0.ogg',
    texto: 'Rodada da casa: curto, seco e sem firula. Quem ouviu até o fim, entra na resenha.',
    quando: '2026-09-29T20:16:00-03:00',
  },
  {
    chave: 'trinca-do-tiago', autor: 'tiago_aue', audio: '4566_file_4566_0.ogg',
    texto: 'Fechei a trinca da semana. Sem nota de mentirinha: são três sons pra turma ouvir e comentar sem cerimônia.',
    quando: '2026-10-10T19:08:00-03:00',
  },
];

const COMENTARIOS: readonly Comentario[] = [
  { chave: 'marcelo-confere-audio', post: 'audio-cru-do-lucas', autor: 'marcelo_aue', texto: 'Ouvi inteiro. Toca sem travar e sem se vender como nota. Assim dá pra testar de verdade.', quando: '2026-09-19T09:37:00-03:00' },
  { chave: 'rian-olha-tela', post: 'audio-cru-do-lucas', autor: 'rian_aue', texto: 'Ficou bom de ouvir. Dá play, entende a parada e a tela não vira carnaval.', quando: '2026-09-22T18:11:00-03:00' },
  { chave: 'kayky-player', post: 'rodada-curta-do-iury', autor: 'kayky_aue', texto: 'O tempo corre sem te jogar pro começo. Parece pouco até o player resolver te sacanear.', quando: '2026-09-30T11:24:00-03:00' },
  { chave: 'camillo-fronteira', post: 'rodada-curta-do-iury', autor: 'camillo_aue', texto: 'Áudio público no Bonde, gravação direta no perfil. Cada coisa no seu canto, sem gambiarra.', quando: '2026-10-02T16:48:00-03:00' },
  { chave: 'rodrigo-descoberta', post: 'trinca-do-tiago', autor: 'rodrigo_aue', texto: 'É isso que puxa roda: título curto, áudio na cara e conversa andando.', quando: '2026-10-11T14:06:00-03:00' },
  { chave: 'lucas-diferenca-arena', post: 'trinca-do-tiago', autor: 'lucas_aue', texto: 'Quer placar? Abre a Arena. Aqui é som cru e resenha.', quando: '2026-10-13T21:19:00-03:00' },
];

interface Conexao { readonly url: string; readonly chave: string; }

function argumento(argv: readonly string[], nome: string): string | undefined {
  const i = argv.indexOf(nome);
  return i < 0 ? undefined : argv[i + 1];
}

function idDoPost(chave: string): string { return uuidV5(`rodada-squad:post:${chave}`, ESPACO_DE_NOMES_DA_CASA); }
function idDoComentario(chave: string): string { return uuidV5(`rodada-squad:comentario:${chave}`, ESPACO_DE_NOMES_DA_CASA); }

async function chamar(c: Conexao, caminho: string, init: RequestInit): Promise<Response> {
  const resposta = await fetch(`${c.url}${caminho}`, {
    ...init,
    headers: { apikey: c.chave, Authorization: `Bearer ${c.chave}`, ...init.headers },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resposta.ok) throw new Error(`${init.method ?? 'GET'} ${caminho}: ${resposta.status} ${(await resposta.text()).slice(0, 300)}`);
  return resposta;
}

function prepararAudio(post: Post): { readonly temporario: string; readonly caminho: string } {
  const origem = `${RAIZ}/audios/solo-eructos/${post.audio}`;
  if (!existsSync(origem)) throw new Error(`Áudio ausente: ${origem}`);
  const id = idDoPost(post.chave);
  const temporario = `/tmp/aue-rodada-squad-${id}.m4a`;
  const conversao = spawnSync('ffmpeg', ['-y', '-i', origem, '-vn', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', temporario], { encoding: 'utf8' });
  if (conversao.status !== 0) throw new Error(`Não deu para preparar ${post.audio}: ${conversao.stderr.slice(-300)}`);
  const bytes = new Uint8Array(readFileSync(temporario));
  const formato = validarM4a(bytes);
  if (!formato.ok) throw new Error(`${post.audio} convertido inválido: ${formato.motivo}`);
  if (statSync(temporario).size > LIMITE_DO_BUCKET) throw new Error(`${post.audio} passou de 1 MB depois da conversão.`);
  return { temporario, caminho: `burpzilla/${id}.m4a` };
}

async function enviarAudio(c: Conexao, caminho: string, temporario: string): Promise<void> {
  await chamar(c, `/storage/v1/object/audio_da_casa/${caminho}`, {
    method: 'POST', headers: { 'Content-Type': 'audio/mp4', 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' },
    body: new Blob([new Uint8Array(readFileSync(temporario))], { type: 'audio/mp4' }),
  });
}

async function rpc(c: Conexao, nome: string, args: Record<string, unknown>): Promise<void> {
  const resposta = await chamar(c, `/rest/v1/rpc/${nome}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  await resposta.text();
}

async function aplicar(c: Conexao): Promise<void> {
  for (const post of POSTS) {
    const audio = prepararAudio(post);
    try {
      await enviarAudio(c, audio.caminho, audio.temporario);
      await rpc(c, 'publicar_da_casa', {
        p_id: idDoPost(post.chave), p_usuario_id: idDaConta(post.autor), p_topico: 'Bonde Geral',
        p_conteudo: post.texto, p_criado_em: post.quando, p_caminho_do_audio: audio.caminho,
      });
    } finally {
      rmSync(audio.temporario, { force: true });
    }
  }
  for (const comentario of COMENTARIOS) {
    await rpc(c, 'comentar_da_casa', {
      p_id: idDoComentario(comentario.chave), p_post_id: idDoPost(comentario.post),
      p_usuario_id: idDaConta(comentario.autor), p_conteudo: comentario.texto, p_criado_em: comentario.quando,
    });
  }
}

async function validar(c: Conexao): Promise<void> {
  const idsDosPosts = POSTS.map((p) => idDoPost(p.chave));
  const idsDosComentarios = COMENTARIOS.map((c) => idDoComentario(c.chave));
  const [postsResposta, comentariosResposta] = await Promise.all([
    chamar(c, `/rest/v1/posts_comunidade?select=id,user_id,content,created_at,caminho_do_audio_da_casa&id=in.(${idsDosPosts.join(',')})`, { method: 'GET' }),
    chamar(c, `/rest/v1/comentarios?select=id,post_id,user_id,content,created_at&id=in.(${idsDosComentarios.join(',')})`, { method: 'GET' }),
  ]);
  const posts = await postsResposta.json() as Array<{ id: string; user_id: string; content: string; created_at: string; caminho_do_audio_da_casa: string | null }>;
  const comentarios = await comentariosResposta.json() as Array<{ id: string; post_id: string; user_id: string; content: string; created_at: string }>;
  if (posts.length !== POSTS.length || comentarios.length !== COMENTARIOS.length) throw new Error('A conversa não voltou completa na conferência.');
  for (const post of POSTS) {
    const salvo = posts.find((p) => p.id === idDoPost(post.chave));
    if (!salvo || salvo.user_id !== idDaConta(post.autor) || salvo.content !== post.texto || salvo.caminho_do_audio_da_casa !== `burpzilla/${idDoPost(post.chave)}.m4a`) {
      throw new Error(`O post ${post.chave} não ficou como planejado.`);
    }
  }
  for (const comentario of COMENTARIOS) {
    const salvo = comentarios.find((c) => c.id === idDoComentario(comentario.chave));
    if (!salvo || salvo.post_id !== idDoPost(comentario.post) || salvo.user_id !== idDaConta(comentario.autor) || salvo.content !== comentario.texto) {
      throw new Error(`O comentário ${comentario.chave} não ficou como planejado.`);
    }
  }
}

async function principal(): Promise<void> {
  const argv = process.argv.slice(2);
  if (!argv.includes('--aplicar')) {
    console.log(`DRY-RUN: ${POSTS.length} posts com áudio e ${COMENTARIOS.length} comentários, de 18/09 a 13/10/2026.`);
    return;
  }
  const confirmado = confirmarProjeto({ projeto: argumento(argv, '--projeto'), confirma: process.env.AUE_CONFIRMA_PROJETO, url: process.env.AUE_SUPABASE_URL, chave: process.env.AUE_SERVICE_ROLE_KEY });
  if (!confirmado.ok) throw new Error(`Recusado: ${confirmado.motivo}.`);
  const conexao = { url: confirmado.url, chave: confirmado.chave };
  await aplicar(conexao);
  await validar(conexao);
  console.log('Rodada da squad publicada e conferida pelo banco.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  principal().catch((erro: unknown) => { console.error(erro instanceof Error ? erro.message : 'Falha na rodada da squad.'); process.exit(1); });
}

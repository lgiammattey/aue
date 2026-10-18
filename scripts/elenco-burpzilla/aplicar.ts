/**
 * Backfill do elenco da casa (Burpzilla) no Supabase.
 *
 *   npm run elenco:backfill                       # dry-run: só mostra o plano, offline
 *   npm run elenco:backfill -- --aplicar --projeto <ref>
 *   npm run elenco:backfill -- --desfazer --projeto <ref>
 *
 * O PADRÃO É DRY-RUN. Sem `--aplicar` (ou `--desfazer`) o script não lê chave,
 * não abre conexão e não escreve nada. Roda sem credencial nenhuma.
 *
 * Para escrever de verdade são exigidos, todos:
 *   --projeto <ref>               o ref do projeto, na linha de comando;
 *   AUE_CONFIRMA_PROJETO=<ref>    o mesmo ref, na variável de ambiente;
 *   AUE_SUPABASE_URL              https://<ref>.supabase.co (tem de bater com o ref);
 *   AUE_SERVICE_ROLE_KEY          a chave de serviço. Fica só no ambiente do
 *                                 terminal: nunca em arquivo versionado e nunca
 *                                 com prefixo VITE_ (o Vite a levaria ao navegador).
 *
 * E o `--aplicar` ainda precisa passar por `podeAplicar`: sorteio APROVADO,
 * áudios escolhidos e preparados, comentários com aval do autor e o registro
 * da autorização preenchido. Enquanto faltar qualquer um, ele se recusa a rodar.
 *
 * As migrações 20261018000008 e 000009 precisam estar aplicadas antes, e o ADR
 * 0007 aceito. Este script não aplica migração.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { validarM4a } from '../../src/nucleo/elenco/formatoAudio.ts';
import { montarElenco } from '../../src/nucleo/elenco/montagem.ts';
import { podeAplicar } from '../../src/nucleo/elenco/podeAplicar.ts';
import type { ElencoMontado, PostMontado } from '../../src/nucleo/elenco/tipos.ts';
import { AUDIO_PENDENTE } from '../../src/nucleo/elenco/tipos.ts';
import { confirmarProjeto } from './confirmacao.ts';
import { ROTEIRO } from './dados.ts';
import { executarBackfill, executarDesfazer } from './execucao.ts';
import { criarPortaDoServidor } from './rest.ts';
import { SORTEIO } from './sorteio.gerado.ts';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
export const PASTA_DOS_AUDIOS_PREPARADOS = `${RAIZ}/.cache/elenco-burpzilla`;
const ARQUIVO_DA_AUTORIZACAO = `${RAIZ}/docs/historias/burpzilla/autorizacao-dos-audios.md`;

export function caminhoDoAudioPreparado(post: PostMontado): string {
  return `${PASTA_DOS_AUDIOS_PREPARADOS}/${post.id}.m4a`;
}

function lerArgumento(argv: readonly string[], nome: string): string | undefined {
  const i = argv.indexOf(nome);
  return i >= 0 ? argv[i + 1] : undefined;
}

function resumo(elenco: ElencoMontado): string[] {
  const posts = [...elenco.posts].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  const comAudio = elenco.posts.filter((p) => p.caminhoDoAudio);
  return [
    `contas: ${elenco.contas.length} (${elenco.contas.map((c) => c.handle).join(', ')})`,
    `posts: ${elenco.posts.length}, de ${posts[0].criadoEm} a ${posts.at(-1)?.criadoEm}`,
    `posts com áudio: ${comAudio.length}`,
    `comentários: ${elenco.comentarios.length}`,
  ];
}

/** Posts com áudio escolhido cujo m4a preparado não existe ou não vale. */
export function audiosComProblema(elenco: ElencoMontado): string[] {
  const problemas: string[] = [];
  for (const p of elenco.posts) {
    if (!p.caminhoDoAudio || p.audio === AUDIO_PENDENTE) continue;
    const arquivo = caminhoDoAudioPreparado(p);
    if (!existsSync(arquivo)) {
      problemas.push(`${p.chave}: falta ${arquivo} (rode npm run elenco:preparar)`);
      continue;
    }
    const v = validarM4a(new Uint8Array(readFileSync(arquivo)));
    if (!v.ok) problemas.push(`${p.chave}: ${v.motivo}`);
  }
  return problemas;
}

async function principal(): Promise<number> {
  const argv = process.argv.slice(2);
  const aplicar = argv.includes('--aplicar');
  const desfazer = argv.includes('--desfazer');

  if (aplicar && desfazer) {
    console.error('Escolha --aplicar ou --desfazer, não os dois.');
    return 1;
  }

  const elenco = montarElenco(ROTEIRO, SORTEIO);
  const autorizacao = existsSync(ARQUIVO_DA_AUTORIZACAO) ? readFileSync(ARQUIVO_DA_AUTORIZACAO, 'utf8') : null;
  const veredito = podeAplicar({ roteiro: ROTEIRO, sorteio: SORTEIO, autorizacao });

  if (!aplicar && !desfazer) {
    console.log('DRY-RUN: nada foi lido da rede e nada foi escrito.\n');
    for (const l of resumo(elenco)) console.log(`  ${l}`);
    if (veredito.pode) {
      console.log('\npodeAplicar: LIBERADO');
      for (const p of audiosComProblema(elenco)) console.log(`  áudio: ${p}`);
    } else {
      console.log('\npodeAplicar: BLOQUEADO');
      for (const b of veredito.bloqueios) console.log(`  - ${b}`);
    }
    return 0;
  }

  const confirmacao = confirmarProjeto({
    projeto: lerArgumento(argv, '--projeto'),
    confirma: process.env.AUE_CONFIRMA_PROJETO,
    url: process.env.AUE_SUPABASE_URL,
    chave: process.env.AUE_SERVICE_ROLE_KEY,
  });
  if (!confirmacao.ok) {
    console.error(`Recusado: ${confirmacao.motivo}.`);
    return 1;
  }

  if (aplicar) {
    if (!veredito.pode) {
      console.error('Recusado: podeAplicar está BLOQUEADO.');
      for (const b of veredito.bloqueios) console.error(`  - ${b}`);
      return 1;
    }
    const problemas = audiosComProblema(elenco);
    if (problemas.length > 0) {
      console.error('Recusado: áudio preparado com problema.');
      for (const p of problemas) console.error(`  - ${p}`);
      return 1;
    }
  }

  const servidor = criarPortaDoServidor({ url: confirmacao.url, chave: confirmacao.chave });
  console.log(`${aplicar ? 'Aplicando' : 'Desfazendo'} no projeto ${confirmacao.projeto}...`);

  if (aplicar) {
    const r = await executarBackfill(
      elenco,
      servidor,
      (post) => new Uint8Array(readFileSync(caminhoDoAudioPreparado(post))),
      (linha) => console.log(`  ${linha}`),
    );
    console.log('\nRelatório:', JSON.stringify(r, null, 2));
  } else {
    await executarDesfazer(elenco, servidor);
    console.log('Removido o que a carga tinha criado (pelos ids fixos).');
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  principal().then(
    (codigo) => process.exit(codigo),
    (erro: unknown) => {
      // A mensagem do erro nunca leva a chave: `rest.ts` só inclui método, caminho e corpo da resposta.
      console.error('Falhou, e a carga parou aqui. Rodar de novo é seguro (ids fixos).');
      console.error(erro instanceof Error ? erro.message : erro);
      process.exit(1);
    },
  );
}

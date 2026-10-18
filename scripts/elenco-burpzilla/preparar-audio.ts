/**
 * Converte os áudios escolhidos para o formato do bucket `audio_da_casa`.
 *
 *   npm run elenco:preparar
 *
 * Lê `audios/solo-eructos/<arquivo>` de cada post com áudio escolhido em
 * `dados.ts` e grava `.cache/elenco-burpzilla/<id-do-post>.m4a` (AAC mono, 64 kbps,
 * sem metadado, até 1 MB). Precisa do `ffmpeg` instalado. Não toca na rede.
 * A pasta `.cache/` não é versionada.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { validarM4a } from '../../src/nucleo/elenco/formatoAudio.ts';
import { montarElenco } from '../../src/nucleo/elenco/montagem.ts';
import { AUDIO_PENDENTE } from '../../src/nucleo/elenco/tipos.ts';
import { caminhoDoAudioPreparado, PASTA_DOS_AUDIOS_PREPARADOS } from './aplicar.ts';
import { ROTEIRO } from './dados.ts';
import { SORTEIO } from './sorteio.gerado.ts';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));

/** Os argumentos do ffmpeg. Separado para o teste conferir sem rodar o programa. */
export function argumentosDoFfmpeg(entrada: string, saida: string): string[] {
  return [
    '-y', '-v', 'error', '-i', entrada,
    '-vn', '-map_metadata', '-1',
    '-c:a', 'aac', '-b:a', '64k', '-ac', '1',
    '-movflags', '+faststart',
    saida,
  ];
}

function principal(): number {
  const elenco = montarElenco(ROTEIRO, SORTEIO);
  const escolhidos = ROTEIRO.posts.filter((p) => typeof p.audio === 'object' && p.audio !== null);
  const pendentes = ROTEIRO.posts.filter((p) => p.audio === AUDIO_PENDENTE);

  if (pendentes.length > 0) {
    console.log(`Ainda sem áudio escolhido: ${pendentes.map((p) => p.chave).join(', ')}.`);
  }
  if (escolhidos.length === 0) {
    console.log('Nenhum áudio escolhido em dados.ts. Nada a preparar.');
    return 0;
  }

  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  } catch {
    console.error('ffmpeg não encontrado. Instale (brew install ffmpeg) e rode de novo.');
    return 1;
  }

  mkdirSync(PASTA_DOS_AUDIOS_PREPARADOS, { recursive: true });
  let falhas = 0;
  for (const roteiro of escolhidos) {
    const post = elenco.posts.find((p) => p.chave === roteiro.chave);
    if (!post || typeof roteiro.audio !== 'object' || roteiro.audio === null) continue;
    const entrada = `${RAIZ}/audios/solo-eructos/${roteiro.audio.arquivo}`;
    const saida = caminhoDoAudioPreparado(post);
    if (!existsSync(entrada)) {
      console.error(`${roteiro.chave}: não achei ${entrada}`);
      falhas++;
      continue;
    }
    try {
      execFileSync('ffmpeg', argumentosDoFfmpeg(entrada, saida), { stdio: 'inherit' });
    } catch {
      console.error(`${roteiro.chave}: o ffmpeg falhou`);
      falhas++;
      continue;
    }
    const v = validarM4a(new Uint8Array(readFileSync(saida)));
    if (v.ok) console.log(`${roteiro.chave}: ok (${saida})`);
    else {
      console.error(`${roteiro.chave}: ${v.motivo}`);
      falhas++;
    }
  }
  return falhas === 0 ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(principal());

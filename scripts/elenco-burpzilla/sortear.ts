/**
 * Gera `sorteio.gerado.ts`: quem comenta (agentes A..E) e com que atraso.
 *
 *   npm run elenco:sortear
 *
 * Roda offline. A semente é fixa (20261018), então o arquivo sai sempre igual.
 * O resultado nasce `PENDENTE_REVISAO`; quem revisou muda à mão para
 * `APROVADO`. Se o arquivo já está `APROVADO`, o script se recusa a sobrescrever
 * (use `--forcar` para refazer o sorteio e perder a aprovação).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { sortear } from '../../src/nucleo/elenco/sorteio.ts';
import type { Sorteio } from '../../src/nucleo/elenco/tipos.ts';
import { ROTEIRO } from './dados.ts';

export const SEMENTE_DO_SORTEIO = 20261018;

const ARQUIVO = fileURLToPath(new URL('./sorteio.gerado.ts', import.meta.url));

/** O texto exato do arquivo gerado, para o teste de paridade comparar. */
export function textoDoSorteio(sorteio: Sorteio): string {
  return [
    '/*',
    '  Gerado por `npm run elenco:sortear` (scripts/elenco-burpzilla/sortear.ts).',
    '  Não edite o sorteio à mão: a única edição permitida é trocar `status` de',
    "  'PENDENTE_REVISAO' para 'APROVADO' depois da revisão.",
    '*/',
    "import type { Sorteio } from '../../src/nucleo/elenco/tipos.ts';",
    '',
    `export const SORTEIO: Sorteio = ${JSON.stringify(sorteio, null, 2)};`,
    '',
  ].join('\n');
}

function principal(): void {
  const forcar = process.argv.includes('--forcar');
  if (existsSync(ARQUIVO) && !forcar && /"status":\s*"APROVADO"/.test(readFileSync(ARQUIVO, 'utf8'))) {
    console.error('sorteio.gerado.ts já está APROVADO. Use --forcar para refazer e perder a aprovação.');
    process.exit(1);
  }
  const sorteio = sortear(ROTEIRO, SEMENTE_DO_SORTEIO);
  writeFileSync(ARQUIVO, textoDoSorteio(sorteio));
  console.log(`sorteio gerado com a semente ${SEMENTE_DO_SORTEIO} (${sorteio.status})`);
  for (const [rotulo, nome] of Object.entries(sorteio.agentes)) {
    if (nome) console.log(`  agente ${rotulo}: ${nome}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) principal();

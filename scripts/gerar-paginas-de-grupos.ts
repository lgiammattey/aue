/**
 * Roda depois do `vite build` (ADR 0004). Escreve em `dist/`:
 *   g/<slug>/index.html   uma página por grupo visível
 *   g/lista.json          a identidade da lista (o agendamento compara com ela)
 *   sitemap.xml           ganha as páginas dos grupos
 *   grupos.html           ganha a lista dentro do <noscript>
 *
 * SEM CREDENCIAL DE VERDADE (CI de validação, máquina de quem não tem .env):
 * pula e avisa. Não é falha.
 *
 * LEITURA FALHOU COM CREDENCIAL DE VERDADE: avisa e segue, para um problema do
 * Supabase não travar a publicação do app. A exceção é `EXIGIR_GRUPOS=1`, que o
 * agendamento liga: ali o único motivo de publicar é a lista de grupos, e
 * publicar sem as páginas apagaria do Google o que já estava lá.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ORIGEM_CANONICA } from '../src/shared/enderecoPublico.ts';
import {
  acrescentarAoSitemap,
  hashDaLista,
  MARCADOR_DA_LISTA,
  montarListaEstatica,
  montarPaginaDoGrupo,
} from '../src/nucleo/grupos/paginaEstatica.ts';
import { credenciaisDoBuild, lerGruposVisiveis } from './grupos-do-supabase.ts';

const DIST = join(import.meta.dirname, '..', 'dist');

const credenciais = credenciaisDoBuild();
if (!credenciais) {
  console.log('grupos: sem credencial do Supabase neste build, páginas de grupos puladas.');
  process.exit(0);
}

const grupos = await lerGruposVisiveis(credenciais.url, credenciais.chave);
if (!grupos) {
  if (process.env.EXIGIR_GRUPOS === '1') {
    console.error('grupos: leitura falhou e o agendamento exige a lista. Nada foi publicado.');
    process.exit(1);
  }
  console.warn('grupos: leitura falhou, o site sai sem as páginas de grupos desta vez.');
  process.exit(0);
}

for (const grupo of grupos) {
  const pasta = join(DIST, 'g', grupo.slug);
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, 'index.html'), montarPaginaDoGrupo(grupo, ORIGEM_CANONICA));
}

mkdirSync(join(DIST, 'g'), { recursive: true });
writeFileSync(
  join(DIST, 'g', 'lista.json'),
  JSON.stringify({ hash: await hashDaLista(grupos), total: grupos.length, geradoEm: new Date().toISOString() }),
);

const caminhoDoSitemap = join(DIST, 'sitemap.xml');
writeFileSync(caminhoDoSitemap, acrescentarAoSitemap(readFileSync(caminhoDoSitemap, 'utf8'), grupos, ORIGEM_CANONICA));

const caminhoDaPagina = join(DIST, 'grupos.html');
const pagina = readFileSync(caminhoDaPagina, 'utf8');
if (!pagina.includes(MARCADOR_DA_LISTA)) {
  console.error('grupos: grupos.html perdeu o marcador da lista estática.');
  process.exit(1);
}
writeFileSync(caminhoDaPagina, pagina.replace(MARCADOR_DA_LISTA, montarListaEstatica(grupos)));

console.log(`grupos: ${grupos.length} página(s) gerada(s) em dist/g/.`);

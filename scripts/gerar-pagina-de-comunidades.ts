/**
 * Roda depois do Vite e injeta a lista pública real no HTML de
 * `/comunidades`. Sem credencial verdadeira, preserva o conteúdo editorial
 * estático; com credencial, uma falha de leitura interrompe o build para não
 * publicar um diretório declarado como atualizado, mas sem suas comunidades.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  MARCADOR_DAS_COMUNIDADES,
  montarListaEstaticaDasComunidades,
} from '../src/nucleo/comunidades/paginaEstatica.ts';
import { credenciaisDoBuild } from './grupos-do-supabase.ts';
import { lerComunidadesPublicas } from './comunidades-do-supabase.ts';

const DIST = join(import.meta.dirname, '..', 'dist');
const caminho = join(DIST, 'comunidades.html');
const pagina = readFileSync(caminho, 'utf8');

if (!pagina.includes(MARCADOR_DAS_COMUNIDADES)) {
  console.error('comunidades: comunidades.html perdeu o marcador da lista estática.');
  process.exit(1);
}

const credenciais = credenciaisDoBuild();
if (!credenciais) {
  console.log('comunidades: sem credencial do Supabase neste build, lista estática não foi preenchida.');
  process.exit(0);
}

const comunidades = await lerComunidadesPublicas(credenciais.url, credenciais.chave);
if (!comunidades) {
  console.error('comunidades: não publique o diretório indexável sem a lista real.');
  process.exit(1);
}

writeFileSync(caminho, pagina.replace(MARCADOR_DAS_COMUNIDADES, montarListaEstaticaDasComunidades(comunidades)));
console.log(`comunidades: ${comunidades.length} comunidade(s) inserida(s) em dist/comunidades.html.`);

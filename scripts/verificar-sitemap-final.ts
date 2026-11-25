/** Trava o deploy contra perda de páginas estáticas e grupos sem artefato. */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

import { ORIGEM_CANONICA } from '../src/shared/enderecoPublico.ts';

const DIST = join(import.meta.dirname, '..', 'dist');
const SITEMAP_OFICIAL = `${ORIGEM_CANONICA}/sitemap.xml`;
// jsdom já é transitivo no repositório, mas não expõe tipagens aqui. O parser
// continua sendo o dele; createRequire evita acrescentar uma dependência só de tipos.
const { JSDOM } = createRequire(import.meta.url)('jsdom');

export class ErroDoSitemap extends Error {}
const falhar = (mensagem: string): never => { throw new ErroDoSitemap(mensagem); };

/** Parser XML real: regex não detecta tag desbalanceada nem entidade inválida. */
export function locsDoSitemap(xml: string, origem: string): string[] {
  let documento: any;
  try {
    documento = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
  } catch {
    return falhar(`${origem} não respondeu XML bem formado.`);
  }
  if (documento.querySelector('parsererror') || documento.documentElement?.localName !== 'urlset') {
    return falhar(`${origem} não respondeu um sitemap XML válido.`);
  }

  const urls = [...documento.getElementsByTagName('url')];
  if (urls.length === 0) return falhar(`${origem} não contém URLs.`);
  const locs = urls.map((url) => {
    const filhos = [...url.children].filter((filho) => filho.localName === 'loc');
    if (filhos.length !== 1) return falhar(`${origem} tem <url> sem um único <loc>.`);
    const loc = filhos[0].textContent?.trim() ?? '';
    if (!loc) return falhar(`${origem} tem <loc> vazio.`);
    return loc;
  });
  if (documento.getElementsByTagName('loc').length !== locs.length) return falhar(`${origem} tem <loc> fora de <url>.`);

  const vistos = new Set<string>();
  for (const loc of locs) {
    let url: URL;
    try { url = new URL(loc); } catch { return falhar(`${origem} tem URL inválida: ${loc}`); }
    if (url.protocol !== 'https:' || url.origin !== ORIGEM_CANONICA || url.search || url.hash) {
      return falhar(`${origem} tem URL não canônica: ${loc}`);
    }
    if (vistos.has(loc)) return falhar(`${origem} repete a URL ${loc}.`);
    vistos.add(loc);
  }
  return locs;
}

function lerListaDeGrupos(dist: string): { total: number } {
  const caminho = join(dist, 'g', 'lista.json');
  if (!existsSync(caminho)) return falhar('dist/g/lista.json não existe: o gerador de grupos não concluiu.');
  try {
    const lista = JSON.parse(readFileSync(caminho, 'utf8')) as { hash?: unknown; total?: unknown; geradoEm?: unknown };
    if (typeof lista.hash !== 'string' || !/^[a-f0-9]{64}$/.test(lista.hash)) throw new Error('hash');
    if (!Number.isInteger(lista.total) || (lista.total as number) < 0) throw new Error('total');
    if (typeof lista.geradoEm !== 'string' || Number.isNaN(Date.parse(lista.geradoEm))) throw new Error('geradoEm');
    return { total: lista.total as number };
  } catch { return falhar('dist/g/lista.json é inválido.'); }
}

const ehGrupo = (loc: string) => new URL(loc).pathname.startsWith('/g/');

function conferirGrupos(dist: string, locs: readonly string[], total: number): void {
  const grupos = locs.filter(ehGrupo);
  if (grupos.length !== total) falhar(`o sitemap final tem ${grupos.length} grupo(s), mas g/lista.json declara ${total}.`);
  for (const grupo of grupos) {
    const urlDoGrupo = new URL(grupo);
    if (!urlDoGrupo.pathname.endsWith('/')) falhar(`a URL de grupo no sitemap precisa terminar com barra: ${grupo}`);
    const caminho = urlDoGrupo.pathname.replace(/^\//, '');
    const pagina = join(dist, caminho, 'index.html');
    if (!existsSync(pagina)) falhar(`a página estática de ${grupo} não foi gerada.`);
    const documento = new JSDOM(readFileSync(pagina, 'utf8')).window.document;
    const canonical = documento.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (canonical !== grupo) falhar(`a página estática de ${grupo} não declara canonical exato, com barra final.`);
  }
}

/** Permite fixture local: não depende de rede nem de credenciais. */
export function verificarSitemapFinal(dist: string, xmlOficial: string): { final: number; oficial: number; grupos: number; gruposRemovidos: string[] } {
  const caminhoFinal = join(dist, 'sitemap.xml');
  if (!existsSync(caminhoFinal)) falhar('dist/sitemap.xml não existe.');
  const final = locsDoSitemap(readFileSync(caminhoFinal, 'utf8'), 'dist/sitemap.xml');
  const lista = lerListaDeGrupos(dist);
  conferirGrupos(dist, final, lista.total);

  const oficial = locsDoSitemap(xmlOficial, SITEMAP_OFICIAL);
  const candidatas = new Set(final);
  // Grupo pode ter sido ocultado por moderação. Só as URLs estáticas precisam
  // sobreviver obrigatoriamente ao deploy; grupos removidos ficam registrados.
  const estaticasAusentes = oficial.filter((loc) => !ehGrupo(loc) && !candidatas.has(loc));
  if (estaticasAusentes.length > 0) {
    falhar(`o build retirou ${estaticasAusentes.length} URL(s) estática(s) publicada(s):\n${estaticasAusentes.map((loc) => `- ${loc}`).join('\n')}`);
  }
  return { final: final.length, oficial: oficial.length, grupos: lista.total, gruposRemovidos: oficial.filter((loc) => ehGrupo(loc) && !candidatas.has(loc)) };
}

async function principal(): Promise<void> {
  if (process.env.EXIGIR_GRUPOS !== '1') falhar('EXIGIR_GRUPOS precisa ser 1 antes de publicar.');
  let resposta: Response;
  try {
    resposta = await fetch(SITEMAP_OFICIAL, { headers: { Accept: 'application/xml,text/xml;q=0.9' }, cache: 'no-store', signal: AbortSignal.timeout(15_000) });
  } catch (erro) {
    return falhar(`não foi possível ler o sitemap oficial: ${erro instanceof Error ? erro.message : String(erro)}`);
  }
  if (!resposta.ok) return falhar(`o sitemap oficial respondeu HTTP ${resposta.status}.`);
  const tipo = resposta.headers.get('content-type') ?? '';
  if (!/\b(?:application|text)\/xml\b/i.test(tipo)) return falhar(`o sitemap oficial respondeu Content-Type inesperado: ${tipo || '(ausente)'}.`);

  const resultado = verificarSitemapFinal(DIST, await resposta.text());
  for (const grupo of resultado.gruposRemovidos) console.warn(`sitemap final: grupo removido da lista atual: ${grupo}`);
  console.log(`sitemap final: ${resultado.final} URL(s), incluindo ${resultado.grupos} grupo(s); preserva ${resultado.oficial - resultado.gruposRemovidos.length} URL(s) obrigatória(s).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  principal().catch((erro) => { console.error(`sitemap final: ${erro instanceof Error ? erro.message : String(erro)}`); process.exit(1); });
}

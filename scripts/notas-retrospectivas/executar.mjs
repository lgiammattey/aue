/** Uso: node scripts/notas-retrospectivas/executar.mjs arquivo1 arquivo2 ... */
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { resolve } from 'node:path';

const caminhos = process.argv.slice(2).map((p) => resolve(p));
if (!caminhos.length) {
  console.error('Informe um ou mais arquivos de áudio locais.');
  process.exit(1);
}
const servidor = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: false } });
let navegador;
try {
  await servidor.listen();
  const endereco = servidor.resolvedUrls.local[0];
  navegador = await chromium.launch({ headless: true });
  const pagina = await navegador.newPage();
  await pagina.goto(`${endereco}scripts/notas-retrospectivas/index.html`);
  await pagina.locator('#arquivos').setInputFiles(caminhos);
  await pagina.locator('#iniciar').click();
  await pagina.locator('#baixar:not([disabled])').waitFor({ timeout: 180_000 });
  console.log(await pagina.locator('#resultado').textContent());
} finally {
  await navegador?.close();
  await servidor.close();
}

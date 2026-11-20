/** Piloto de leitura: o inventário precisa ter tipo, id, bucket e caminho. */
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

const [projeto, inventarioPath, saida] = process.argv.slice(2);
if (!projeto || !inventarioPath || !saida || !/^[a-z0-9]+$/.test(projeto)) {
  throw new Error('Uso: node piloto-producao.mjs <ref-do-projeto> <inventario.json> <relatorio.json>');
}
const inventario = JSON.parse(await readFile(inventarioPath, 'utf8'));
const buckets = new Set(['audio_da_casa', 'anexos_do_forum', 'arrotos_de_perfil']);
if (!Array.isArray(inventario) || inventario.some((i) => !buckets.has(i.bucket) || !i.id || typeof i.caminho !== 'string')) {
  throw new Error('Inventário inválido.');
}
const chaves = JSON.parse(execFileSync('supabase', ['projects', 'api-keys', '--project-ref', projeto, '--reveal', '--output', 'json'], { encoding: 'utf8' }));
const chave = chaves.find((c) => c.name === 'service_role')?.api_key;
if (!chave) throw new Error('Chave de serviço indisponível.');
const servidor = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let navegador;
const resultados = [];
try {
  await servidor.listen();
  navegador = await chromium.launch({ headless: true });
  const pagina = await navegador.newPage();
  await pagina.goto(`${servidor.resolvedUrls.local[0]}scripts/notas-retrospectivas/index.html`);
  for (const [indice, item] of inventario.entries()) {
    try {
      const caminho = item.caminho.split('/').map(encodeURIComponent).join('/');
      const resposta = await fetch(`https://${projeto}.supabase.co/storage/v1/object/authenticated/${item.bucket}/${caminho}`, {
        headers: { apikey: chave, Authorization: `Bearer ${chave}` },
      });
      if (!resposta.ok) throw new Error(`Storage HTTP ${resposta.status}`);
      // Guardar o identificador da resposta que forneceu os bytes, não uma
      // consulta posterior que poderia apontar para outra versão do objeto.
      const etag = resposta.headers.get('etag');
      if (!etag || etag.startsWith('W/')) throw new Error('Storage não forneceu ETag forte.');
      const buffer = Buffer.from(await resposta.arrayBuffer());
      const nome = `${item.id}${extname(item.caminho) || '.bin'}`;
      await pagina.locator('#arquivos').setInputFiles({ name: nome, mimeType: resposta.headers.get('content-type') || 'application/octet-stream', buffer });
      await pagina.locator('#iniciar').click();
      await pagina.locator('#baixar:not([disabled])').waitFor({ timeout: 180_000 });
      const [resultado] = JSON.parse(await pagina.locator('#resultado').textContent());
      resultados.push({ ...item, etag, resultado });
    } catch (erro) {
      resultados.push({ ...item, resultado: { estado: 'erro', motivo: erro instanceof Error ? erro.message : 'Falha desconhecida' } });
    }
    console.error(`Analisados ${indice + 1}/${inventario.length}`);
  }
  await writeFile(saida, JSON.stringify({ projeto, criado_em: new Date().toISOString(), resultados }, null, 2), { mode: 0o600, flag: 'wx' });
} finally {
  await navegador?.close();
  await servidor.close();
}

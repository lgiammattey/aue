import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { criarAnalisador } from './navegador.mjs';

// Exercita codecs das gravações iOS/Android e o YAMNet no mesmo Chromium do
// job, sem usar conteúdo de usuários ou depender do banco.
test('Chromium decodifica MP4 e WebM e executa o modelo', { timeout: 180_000 }, async () => {
  const servidor = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await servidor.listen();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const pagina = await browser.newPage();
    await pagina.goto(`${servidor.resolvedUrls.local[0]}scripts/notas-retrospectivas/index.html`);
    const analisar = criarAnalisador(pagina);
    for (const [codec, formato, mime, parametros] of [
      ['aac', 'mp4', 'audio/mp4', ['-movflags', 'frag_keyframe+empty_moov']],
      ['libopus', 'webm', 'audio/webm', []],
    ]) {
      const bytes = execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2',
        '-ac', '1', '-c:a', codec, ...parametros, '-f', formato, 'pipe:1'], { maxBuffer: 1024 * 1024 });
      const resultado = await analisar({ bytes, mime });
      assert.ok(['analisado', 'nao-e-arroto'].includes(resultado.estado), `${formato}: ${resultado.estado}`);
    }
  } finally {
    await browser?.close();
    await servidor.close();
  }
});

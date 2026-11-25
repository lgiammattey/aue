import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const workerDeMigracao = readFileSync(resolve(import.meta.dirname, '../scripts/sw-legado-migracao.js'), 'utf8');
const workerAntigo = `self.addEventListener('fetch', (event) => {
  const caminho = new URL(event.request.url).pathname;
  if (event.request.mode === 'navigate' && caminho !== '/instalar') event.respondWith(new Response('<title>casca antiga</title><h1>home antiga</h1>', { headers: { 'content-type': 'text/html' } }));
});`;

async function abrir(servidor: Server): Promise<{ origem: string; fechar: () => Promise<void> }> {
  await new Promise<void>((pronto) => servidor.listen(0, '127.0.0.1', pronto));
  const endereco = servidor.address();
  if (!endereco || typeof endereco === 'string') throw new Error('porta de teste indisponível');
  return {
    origem: `http://127.0.0.1:${endereco.port}`,
    fechar: () => new Promise<void>((pronto, falhou) => servidor.close((erro) => erro ? falhou(erro) : pronto())),
  };
}

test('atualiza PWA legado, preserva os dados e devolve a navegação ao redirect de rede', async ({ page }) => {
  let fase: 'antigo' | 'migrar' = 'antigo';
  const destino = await abrir(createServer((_requisicao, resposta) => {
    resposta.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    resposta.end('<title>404 novo</title><h1>não encontrado novo</h1>');
  }));
  const legado = await abrir(createServer((requisicao, resposta) => {
    const url = new URL(requisicao.url ?? '/', 'http://legado.local');
    if (url.pathname === '/sw.js') {
      resposta.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-cache' });
      resposta.end(fase === 'antigo' ? workerAntigo : workerDeMigracao);
      return;
    }
    if (fase === 'antigo' && url.pathname === '/instalar') {
      resposta.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      resposta.end(`<!doctype html><script>
        window.migrado = false;
        navigator.serviceWorker.addEventListener('message', (evento) => { if (evento.data?.tipo === 'aue-legado-sw-migrado') window.migrado = true; });
        localStorage.setItem('sessao-legada', 'preservar');
        caches.open('cache-legado').then((cache) => cache.put('/pista', new Response('preservar')));
        if (!sessionStorage.getItem('worker-antigo-instalado')) {
          sessionStorage.setItem('worker-antigo-instalado', '1');
          navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(() => { window.workerAntigoPronto = true; });
        }
      </script><title>instalar antigo</title>`);
      return;
    }
    resposta.writeHead(301, { location: `${destino.origem}${url.pathname}${url.search}` });
    resposta.end();
  }));

  try {
    await page.goto(`${legado.origem}/instalar`);
    await expect.poll(() => page.evaluate(() => (window as Window & { workerAntigoPronto?: boolean }).workerAntigoPronto)).toBe(true);
    await page.reload();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('sessao-legada'))).toBe('preservar');
    expect(await page.evaluate(() => caches.has('cache-legado'))).toBe(true);
    await page.evaluate(async () => {
      sessionStorage.setItem('pista-legada', 'preservar');
      await new Promise<void>((pronto, falhou) => {
        const abertura = indexedDB.open('dados-legados', 1);
        abertura.onupgradeneeded = () => abertura.result.createObjectStore('itens');
        abertura.onerror = () => falhou(abertura.error);
        abertura.onsuccess = () => {
          const banco = abertura.result;
          const transacao = banco.transaction('itens', 'readwrite');
          transacao.objectStore('itens').put('preservar', 'pista');
          transacao.oncomplete = () => { banco.close(); pronto(); };
          transacao.onerror = () => falhou(transacao.error);
        };
      });
    });

    fase = 'migrar';
    // Forçamos update() para provar compatibilidade; isto não promete quando
    // um navegador real decidirá checar automaticamente o worker instalado.
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
    await expect.poll(() => page.evaluate(() => (window as Window & { migrado?: boolean }).migrado)).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('sessao-legada'))).toBe('preservar');
    expect(await page.evaluate(() => caches.has('cache-legado'))).toBe(true);
    expect(await page.evaluate(async () => {
      const indice = await new Promise<string | undefined>((pronto, falhou) => {
        const abertura = indexedDB.open('dados-legados');
        abertura.onerror = () => falhou(abertura.error);
        abertura.onsuccess = () => {
          const banco = abertura.result;
          const leitura = banco.transaction('itens').objectStore('itens').get('pista');
          leitura.onerror = () => falhou(leitura.error);
          leitura.onsuccess = () => { banco.close(); pronto(leitura.result); };
        };
      });
      return { sessao: sessionStorage.getItem('pista-legada'), indice };
    })).toEqual({ sessao: 'preservar', indice: 'preservar' });
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.getRegistration().then(Boolean))).toBe(false);
    // Mesmo já desregistrado, o worker ativo ainda controla esta aba até ela
    // navegar. A próxima linha prova que o fetch abaixo passa por ele.
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

    await page.goto(`${legado.origem}/rota-inexistente?origem=zap`);
    await expect(page).toHaveURL(`${destino.origem}/rota-inexistente?origem=zap`);
    await expect(page.getByRole('heading', { name: 'não encontrado novo' })).toBeVisible();
  } finally {
    await legado.fechar();
    await destino.fechar();
  }
});

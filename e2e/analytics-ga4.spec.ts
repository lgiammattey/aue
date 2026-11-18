import { expect, test } from '@playwright/test';

/** Carrega a tag real, mas intercepta e aborta toda coleta antes de sair. */
test('tag real processa a fila e solicita coleta sem enviá-la ao Google', async ({ page }) => {
  let coletas = 0;
  await page.route('**/g/collect**', async (rota) => { coletas++; await rota.abort(); });
  await page.route('https://aue.web.app/**', async (rota) => {
    const url = new URL(rota.request().url());
    if (url.pathname === '/') {
      await rota.fulfill({ contentType: 'text/html', body: `<!doctype html><script type="module">
        import { analyticsArenaV2, registrarPaginaAnalytics } from '/src/plataforma/web/analyticsArenaV2.ts';
        registrarPaginaAnalytics('arena');
        analyticsArenaV2.registrar('abriu_arena_v2');
      </script>` });
      return;
    }
    const resposta = await rota.fetch({ url: `http://127.0.0.1:${process.env.E2E_HARNESS_PORT ?? '4199'}${url.pathname}${url.search}` });
    await rota.fulfill({ response: resposta });
  });
  const tag = page.waitForResponse(resposta => resposta.url().startsWith('https://www.googletagmanager.com/gtag/js?') && resposta.status() === 200);
  await page.goto('https://aue.web.app/');
  await tag;
  await expect.poll(() => coletas, { timeout: 15000 }).toBeGreaterThan(0);
});

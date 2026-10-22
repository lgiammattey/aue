import { expect, test, type Page } from '@playwright/test';

const harness = `http://127.0.0.1:${process.env.E2E_HARNESS_PORT ?? 4199}/e2e/harness.html?microfone=1`;

test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
});

async function atrasarPermissaoDoMicrofone(page: Page) {
  await page.addInitScript(() => {
    const dispositivo = navigator.mediaDevices;
    const original = dispositivo.getUserMedia.bind(dispositivo);
    let liberar: (() => void) | null = null;
    const espera = new Promise<void>((resolve) => { liberar = resolve; });
    Object.assign(window, {
      __e2eLiberarMicrofone: () => liberar?.(),
      __e2eMicrofoneFoiPedido: false,
    });
    dispositivo.getUserMedia = async (restricoes) => {
      Object.assign(window, { __e2eMicrofoneFoiPedido: true });
      await espera;
      return original(restricoes);
    };
  });
}

for (const viewport of [
  { nome: 'mobile', width: 390, height: 844 },
  { nome: 'desktop', width: 1440, height: 900 },
] as const) {
  test(`compositor aguarda o microfone e publica somente Blob pronto em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await atrasarPermissaoDoMicrofone(page);
    await page.goto(harness);

    const texto = page.getByRole('textbox', { name: 'Texto da publicação' });
    const publicar = page.getByRole('button', { name: 'Publicar' });
    const resultado = page.getByRole('status', { name: 'Resultado da persistência simulada' });
    await texto.fill('Meu áudio precisa entrar junto');
    await page.getByRole('button', { name: 'Gravar áudio' }).click();

    await expect(page.getByText('Preparando microfone…', { exact: true })).toBeVisible();
    await expect(publicar).toBeDisabled();
    await expect.poll(() => page.evaluate(() => (window as Window & { __e2eMicrofoneFoiPedido?: boolean }).__e2eMicrofoneFoiPedido)).toBe(true);

    // O submit programático simula Enter/reentrada e deve ser barrado pelo
    // handler, além do botão visualmente desabilitado.
    await page.locator('form.composer-clean-form').evaluate((formulario) => formulario.requestSubmit());
    await expect(resultado).toHaveText('fixture ainda não recebeu publicação');

    await page.evaluate(() => (window as Window & { __e2eLiberarMicrofone?: () => void }).__e2eLiberarMicrofone?.());
    const parar = page.getByRole('button', { name: 'Parar e revisar gravação' });
    await expect(parar).toBeVisible();
    // Um segundo real gera dados suficientes para que o elemento de áudio
    // possa avançar tempo; não tratamos só a presença de metadados como toque.
    await expect(page.locator('.composer-audio-time')).toHaveText('0:01');
    await parar.click();

    const ouvir = page.getByRole('button', { name: 'Ouvir áudio gravado' });
    await expect(ouvir).toBeVisible();
    await page.screenshot({ path: `test-results/microfone-compositor-preview-${viewport.nome}.png`, fullPage: true });

    await ouvir.click();
    await expect.poll(() => page.locator('audio').evaluate((audio) => audio.currentTime > 0)).toBe(true);
    await page.locator('audio').evaluate((audio) => audio.pause());

    if (viewport.nome === 'mobile') {
      const geometria = await page.locator('.modal-comentarios-sheet').evaluate((modal) => {
        const caixa = modal.getBoundingClientRect();
        return {
          dentroDaTela: caixa.left >= -1 && caixa.right <= window.innerWidth + 1,
          semOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
        };
      });
      const tamanhoDoPublicar = await publicar.boundingBox();
      expect(geometria.dentroDaTela).toBe(true);
      expect(geometria.semOverflow).toBe(true);
      expect(tamanhoDoPublicar?.width).toBeGreaterThanOrEqual(44);
      expect(tamanhoDoPublicar?.height).toBeGreaterThanOrEqual(44);
    }

    // Descartar não publica um texto isolado: a pessoa regrava e só então envia.
    await page.getByRole('button', { name: 'Descartar áudio gravado' }).click();
    await expect(ouvir).toHaveCount(0);
    await page.getByRole('button', { name: 'Gravar áudio' }).click();
    await expect(parar).toBeVisible();
    await parar.click();
    await expect(ouvir).toBeVisible();

    await publicar.click();
    await expect(resultado).toHaveText(/fixture recebeu audio com [1-9]\d* bytes/);
    await page.screenshot({ path: `test-results/microfone-compositor-publicado-${viewport.nome}.png`, fullPage: true });
  });
}

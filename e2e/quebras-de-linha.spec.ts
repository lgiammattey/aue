import { expect, test } from '@playwright/test';

const harness = `http://127.0.0.1:${process.env.E2E_HARNESS_PORT ?? 4199}/e2e/harness.html`;
for (const width of [390, 1440]) {
  for (const modo of ['thread', 'modal']) {
    test(`quebras e parágrafos em ${modo}, ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${harness}?quebras=${modo}`);
      const seletores = modo === 'thread'
        ? ['.post-body', '.thread-reply-text']
        : ['.thread-parent-text', '.comment-text'];
      for (const seletor of seletores) {
        const texto = page.locator(seletor).first();
        await expect(texto).toHaveCSS('white-space', 'pre-wrap');
        expect(await texto.textContent()).toBe('Primeira linha\nSegunda linha\n\nOutro parágrafo');
        const medida = await texto.evaluate((el) => ({ altura: el.getBoundingClientRect().height, linha: parseFloat(getComputedStyle(el).lineHeight) }));
        expect(medida.altura).toBeGreaterThanOrEqual(medida.linha * 4 - 1);
      }
      const campo = page.getByRole('textbox', { name: 'Escrever resposta' });
      await expect(campo).toHaveAttribute('maxlength', '1000');
      await campo.fill('Primeira linha');
      await campo.press('End');
      await campo.press('Enter');
      await campo.pressSequentially('Segunda linha');
      await expect(campo).toHaveValue('Primeira linha\nSegunda linha');
      await page.screenshot({ path: `test-results/quebras-${modo}-${width}.png`, fullPage: true });
    });
  }
}

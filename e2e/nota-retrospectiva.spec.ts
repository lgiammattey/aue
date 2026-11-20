import { expect, test } from '@playwright/test';

const base = process.env.E2E_HARNESS_URL ?? `http://127.0.0.1:${process.env.E2E_HARNESS_PORT ?? 4199}/e2e/harness.html`;

for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
  test(`nota retrospectiva no mural ${viewport.name}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.goto(`${base}?nota-retrospectiva`);
    await page.evaluate(() => document.fonts.ready);
    const badge = page.getByTitle('Avaliado depois: 73/100');
    await expect(badge).toBeVisible();
    const caixa = await badge.boundingBox();
    expect(caixa && caixa.x >= 0 && caixa.x + caixa.width <= viewport.width).toBeTruthy();
    await page.screenshot({ path: info.outputPath(`${viewport.name}.png`), fullPage: true });
  });
}

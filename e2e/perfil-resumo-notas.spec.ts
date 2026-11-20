import { expect, test } from '@playwright/test';
const base = process.env.E2E_HARNESS_URL ?? `http://127.0.0.1:${process.env.E2E_HARNESS_PORT ?? 4199}/e2e/harness.html`;
for (const view of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
  test(`perfil exibe melhor nota e média em ${view.name}`, async ({ page }, info) => {
    await page.setViewportSize(view);
    await page.goto(`${base}?perfil-resumo`);
    await page.evaluate(() => document.fonts.ready);
    const dashboard = page.locator('.od-profile__dashboard');
    await expect(dashboard.getByRole('heading', { name: 'Melhor nota publicada' })).toBeVisible();
    await expect(dashboard.getByRole('heading', { name: 'Média' })).toBeVisible();
    await expect(dashboard).toContainText('87');
    await expect(dashboard).toContainText('72,5');
    const bounds = await dashboard.boundingBox();
    expect(bounds && bounds.x >= 0 && bounds.x + bounds.width <= view.width).toBeTruthy();
    await page.screenshot({ path: info.outputPath(`${view.name}.png`), fullPage: true });
  });
}

import { expect, test } from '@playwright/test';

const harness = `http://127.0.0.1:${process.env.E2E_HARNESS_PORT ?? 4199}/e2e/harness.html`;
for (const width of [390, 1440]) {
  test(`tópico agrupa os cards originais sem corte em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${harness}?pauta=1`);
    await expect(page.getByRole('heading', { name: 'Mural da vergonha' })).toBeVisible();
    await expect(page.locator('#post-original-1')).toContainText('Primeira publicação');
    await expect(page.locator('#post-original-2')).toContainText('Segunda publicação preservada.');
    await expect(page.locator('#post-original-1 .post-body')).toHaveCSS('white-space', 'pre-wrap');
    await expect(page.locator('.card-do-post')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/pauta-${width}.png`, fullPage: true });
  });
}

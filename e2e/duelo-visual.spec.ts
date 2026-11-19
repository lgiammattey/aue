import { expect, test } from '@playwright/test';
const origem = `http://127.0.0.1:${process.env.E2E_HARNESS_PORT ?? 4199}/e2e/duelo-visual.html`;
for (const viewport of [{ width: 320, height: 720 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`convite e placar preservam contraste e cabem em ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${origem}?estado=criar`);
    await expect(page.locator('.duelo-v2__pagina')).toHaveCSS('background-color', 'rgb(245, 241, 233)');
    const autorizar = page.getByRole('checkbox', { name: /Autorizo enviar/ });
    await expect(autorizar).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar desafio' })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await autorizar.check();
    await page.getByRole('button', { name: 'Criar desafio' }).click();
    await expect(page.getByText('Convite pronto.', { exact: false })).toBeVisible();
    await page.goto(`${origem}?estado=responder`);
    await expect(page.getByRole('button', { name: 'Aceitar e gravar' })).toBeVisible();
    await expect(page.getByText('1,20 s')).toHaveCount(0);
    await page.goto(`${origem}?estado=placar`);
    await expect(page.getByRole('heading', { name: 'RESULTADO PROVISÓRIO' })).toBeVisible();
    await expect(page.getByText('1,20 s')).toBeVisible();
    await expect(page.getByText('1,83 s')).toBeVisible();
    await page.getByRole('button', { name: 'Abrir áudio do adversário' }).click();
    await expect(page.getByRole('region', { name: 'Reprodutor: Áudio do adversário' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reproduzir gravação' })).toBeVisible();
    await page.getByRole('button', { name: 'Reproduzir gravação' }).click();
    await expect(page.getByRole('button', { name: 'Pausar gravação' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pedir revanche' })).toBeVisible();
    await page.getByRole('button', { name: 'Compartilhar resultado' }).click();
    await expect(page.getByText(/Resultado provisório no Auê:/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto(`${origem}?estado=meus`);
    await expect(page.getByText('Nenhum desafio encontrado nesta sessão.')).toBeVisible();
  });
}

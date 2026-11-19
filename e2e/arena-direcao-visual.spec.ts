import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] } });

for (const viewport of [{ width: 320, height: 720 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`Arena mostra entrada, gravação e revisão em ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/arena');
    const arena = page.locator('.arena-v2');
    await expect(arena).toHaveCSS('background-color', 'rgb(245, 241, 233)');
    await expect(page.getByRole('heading', { name: 'PRONTO PRA SOLTAR O AUÊ?' })).toBeVisible();
    const iniciar = page.getByRole('button', { name: 'Gravar meu arroto' });
    await expect(iniciar).toBeVisible();
    const caixa = await iniciar.boundingBox();
    expect(caixa?.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await iniciar.click();
    const finalizar = page.getByRole('button', { name: 'Finalizar gravação' });
    await expect(finalizar).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('GRAVANDO', { exact: true })).toBeVisible();
    await page.waitForTimeout(1200);
    await finalizar.click();
    await expect(page.getByRole('heading', { name: 'SUA GRAVAÇÃO' })).toBeVisible();
    await expect(page.getByText(/ela não foi publicada no Auê/)).toBeVisible();
    await expect(page.getByText('NOVO RECORDE')).toHaveCount(0);
    const tocar = page.getByRole('button', { name: 'Reproduzir gravação' });
    await expect(tocar).toBeVisible();
    const posicao = page.getByRole('slider', { name: 'Posição da gravação' });
    await posicao.focus();
    await expect(posicao).toBeFocused();
    await posicao.press('ArrowRight');
    await tocar.click();
    await expect(page.getByRole('button', { name: 'Pausar gravação' })).toBeVisible();
    await page.getByRole('button', { name: 'Pausar gravação' }).click();
    await expect(tocar).toBeVisible();
    await page.getByRole('button', { name: 'Descartar e gravar outra' }).click();
    await expect(iniciar).toBeVisible();
  });
}

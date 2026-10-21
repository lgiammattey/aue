import { expect, test } from '@playwright/test';
test.use({ trace: 'on', screenshot: 'on' });

const HARNESS_URL = 'http://127.0.0.1:4189/e2e/harness.html';

const VIEWPORTS = [
  { nome: '390px', width: 390, height: 844 },
  { nome: '768px', width: 768, height: 1024 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`modais preservam leitura, foco e rascunho em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(HARNESS_URL);
    await page.waitForFunction(() => document.documentElement.scrollHeight > window.innerHeight + 640);
    await page.evaluate(() => window.scrollTo(0, 640));
    await page.waitForFunction(() => window.scrollY === 640);
    const rolagem = await page.evaluate(() => window.scrollY);

    // O botão do harness fica no topo. Disparar seu handler pelo DOM evita que
    // o próprio Playwright role a página até ele e mascare a rolagem testada.
    await page.getByRole('button', { name: 'Abrir compositor' }).evaluate((botao) => (botao as HTMLButtonElement).click());
    await expect(page.locator('body')).toHaveCSS('position', 'fixed');
    const compositor = page.getByRole('textbox', { name: 'Texto da publicação' });
    await compositor.fill('rascunho que não pode sumir');
    await compositor.focus();
    await expect(compositor).toBeFocused();
    await expect(compositor).toHaveValue('rascunho que não pode sumir');
    await page.getByRole('button', { name: 'Fechar modal' }).click();
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
    expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(rolagem, -1);

    await page.getByRole('button', { name: 'Abrir comentários' }).evaluate((botao) => (botao as HTMLButtonElement).click());
    const resposta = page.getByRole('textbox', { name: 'Escrever resposta' });
    await resposta.fill('rascunho da resposta');
    await page.getByRole('button', { name: 'Responder a Gui' }).click();
    await expect(resposta).toBeFocused();
    await expect(resposta).toHaveValue('rascunho da resposta');
    await page.getByRole('button', { name: 'Fechar comentários' }).click();
    expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(rolagem, -1);

    await page.getByRole('button', { name: 'Abrir gravador' }).evaluate((botao) => (botao as HTMLButtonElement).click());
    await expect(page.getByRole('button', { name: '● Gravar agora' })).toBeFocused();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(rolagem, -1);
  });

  test(`CardDoPost reserva mídia e Arena abre em IDLE em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(HARNESS_URL);
    const caixa = await page.locator('.post-media-image').boundingBox();
    expect(caixa).not.toBeNull();
    expect(caixa!.width / caixa!.height).toBeCloseTo(4 / 3, 1);

    await page.goto('/arena');
    await expect(page.getByRole('button', { name: 'Toque para começar' })).toBeVisible();
    await expect(page.locator('.feed-causos, .causo-card')).toHaveCount(0);
  });
}

import { expect, test } from '@playwright/test';
test.use({ trace: 'on', screenshot: 'on' });

const HARNESS_URL = process.env.E2E_HARNESS_URL ?? `http://127.0.0.1:${process.env.E2E_HARNESS_PORT ?? 4199}/e2e/harness.html`;

const VIEWPORTS = [
  { nome: '390px', width: 390, height: 844 },
  { nome: '768px', width: 768, height: 1024 },
  { nome: 'desktop', width: 1440, height: 900 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`modais preservam leitura, foco e rascunho em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(HARNESS_URL);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
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

  test(`CardDoPost reserva mídia 16:9 e Arena informa o estado em breve em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(HARNESS_URL);
    const caixa = await page.locator('#post-post-e2e-midia .post-media-image').boundingBox();
    expect(caixa).not.toBeNull();
    expect(caixa!.width / caixa!.height).toBeCloseTo(16 / 9, 1);

    await page.goto('/arena');
    await expect(page.getByTestId('arena-em-breve')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aqui o arroto vira jogo.' })).toBeVisible();
    await expect(page.getByText('A Arena ainda está sendo preparada.').first()).toBeVisible();
    await expect(page.locator('.feed-causos, .causo-card')).toHaveCount(0);
  });

  test(`CardDoPost mostra só a mídia de perfil e mantém @ abaixo do nome em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(HARNESS_URL);

    const card = page.locator('#post-post-e2e-midia');
    await page.evaluate(async () => { await document.fonts.ready; });
    const linhasDeTexto = await card.evaluate((elemento) => {
      const medirTexto = (seletor: string) => {
        const no = elemento.querySelector(seletor);
        if (!no) return null;
        const faixa = document.createRange();
        faixa.selectNodeContents(no);
        const caixa = faixa.getBoundingClientRect();
        return { top: caixa.top, bottom: caixa.bottom, left: caixa.left, right: caixa.right };
      };
      return {
        nome: medirTexto('.author-profile-link'),
        handle: medirTexto('.post-meta-handle'),
        tempo: medirTexto('.post-meta-time'),
      };
    });
    const midia = await card.locator('.post-media-image').boundingBox();

    expect(linhasDeTexto.nome).not.toBeNull();
    expect(linhasDeTexto.handle).not.toBeNull();
    expect(linhasDeTexto.tempo).not.toBeNull();
    expect(midia).not.toBeNull();
    await expect(card).not.toContainText('Mídia no perfil');
    await expect(page.locator('#post-post-e2e-autoral')).toContainText('O gás virou história');
    const { nome, handle, tempo } = linhasDeTexto;
    if (!nome || !handle || !tempo) throw new Error('As linhas de metadados do post não foram renderizadas.');
    expect(handle.top).toBeGreaterThan(nome.bottom);
    expect(handle.left).toBeCloseTo(nome.left, 0);
    expect(handle.top).toBeLessThan(tempo.bottom);
    expect(tempo.top).toBeLessThan(handle.bottom);
    expect(midia!.y).toBeGreaterThanOrEqual(Math.max(handle.bottom, tempo.bottom));

    const alvoNome = await card.locator('.author-profile-link').boundingBox();
    const alvoHandle = await card.locator('.post-meta-handle').boundingBox();
    expect(alvoNome).not.toBeNull();
    expect(alvoHandle).not.toBeNull();
    expect(alvoNome!.width).toBeGreaterThanOrEqual(44);
    expect(alvoNome!.height).toBeGreaterThanOrEqual(44);
    expect(alvoHandle!.height).toBeGreaterThanOrEqual(44);

    await card.screenshot({ path: `test-results/card-do-post-meta-${viewport.nome}.png` });
  });
}

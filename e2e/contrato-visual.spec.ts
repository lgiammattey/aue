import { expect, test, type Page } from '@playwright/test';

const VIEWPORTS = [
  { nome: 'mobile', width: 390, height: 844 },
  { nome: 'desktop', width: 1440, height: 900 },
] as const;

async function aguardarPinturaFinal(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

async function corDoToken(page: Page, token: string) {
  return page.evaluate((nomeDoToken) => {
    const amostra = document.createElement('i');
    amostra.style.backgroundColor = `var(${nomeDoToken})`;
    document.body.append(amostra);
    const cor = getComputedStyle(amostra).backgroundColor;
    amostra.remove();
    return cor;
  }, token);
}

async function coresDaCasca(page: Page, seletor: string) {
  return page.locator(seletor).evaluate((elemento) => {
    const estilo = getComputedStyle(elemento);
    return { fundo: estilo.backgroundColor, texto: estilo.color };
  });
}

for (const viewport of VIEWPORTS) {
  test(`login e guia preservam a família OpenDesign em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);

    // Sem preferência gravada, a entrada não pode impor a antiga paleta clara.
    await page.goto('/login');
    await aguardarPinturaFinal(page);
    const login = page.locator('.app.app--auth');
    await expect(login).toBeVisible();
    await expect(login.getByRole('heading', { name: 'Entra na roda' })).toBeVisible();
    expect(await login.getByRole('heading', { name: 'Entra na roda' }).evaluate((titulo) => getComputedStyle(titulo).fontFamily)).toContain('Anton');
    expect(await login.locator('.auth-brand').evaluate((marca) => getComputedStyle(marca).fontFamily)).toContain('Anton');
    expect((await coresDaCasca(page, '.app.app--auth')).fundo).toBe(await corDoToken(page, '--aue-bg'));
    expect((await coresDaCasca(page, '.app--auth .dialog')).fundo).toBe(await corDoToken(page, '--aue-surface'));
    expect(await page.locator('html').getAttribute('data-theme')).not.toBe('light');

    await page.goto('/como-jogar');
    await aguardarPinturaFinal(page);
    const informativo = page.locator('.app.od-informativo');
    await expect(informativo).toBeVisible();
    await expect(informativo.locator('.sidebar')).toHaveCount(1);
    await expect(informativo.locator('.topbar')).toHaveCount(1);
    await expect(informativo.locator('.rightbar')).toHaveCount(1);
    await expect(informativo.locator('.publico-cabecalho')).toHaveCount(0);
    expect((await coresDaCasca(page, '.app.od-informativo')).fundo).toBe(await corDoToken(page, '--aue-bg'));
    expect((await coresDaCasca(page, '.od-informativo__content')).fundo).toBe(await corDoToken(page, '--aue-bg'));
    expect((await coresDaCasca(page, '.od-informativo__content')).texto).toBe(await corDoToken(page, '--aue-text'));
    expect(await informativo.locator('.publico-hero h1').evaluate((titulo) => getComputedStyle(titulo).fontFamily)).toContain('Anton');

    // A navegação entre as duas cascas e o feed não pode trocar o tema global.
    await page.getByRole('button', { name: 'Fazer login' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.app.app--auth')).toBeVisible();
    await page.getByRole('link', { name: 'Auê, página inicial' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.app:not(.app--auth)')).toBeVisible();
    expect(await page.locator('html').getAttribute('data-theme')).not.toBe('light');
  });

  test(`login e guia herdam o tema global claro em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/como-jogar');
    await aguardarPinturaFinal(page);
    // O seletor global é aplicado depois da montagem para validar a herança
    // CSS da casca. Persistir a preferência no bootstrap não é requisito
    // desta página nem autorização para criar uma regra de produto nova.
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect((await coresDaCasca(page, '.app.od-informativo')).fundo).toBe(await corDoToken(page, '--aue-bg'));
    expect((await coresDaCasca(page, '.od-informativo__content')).fundo).toBe(await corDoToken(page, '--aue-bg'));
    expect((await coresDaCasca(page, '.od-informativo__content')).texto).toBe(await corDoToken(page, '--aue-text'));

    await page.getByRole('button', { name: 'Fazer login' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect((await coresDaCasca(page, '.app.app--auth')).fundo).toBe(await corDoToken(page, '--aue-bg'));
    expect((await coresDaCasca(page, '.app--auth .dialog')).fundo).toBe(await corDoToken(page, '--aue-surface'));

    await page.getByRole('link', { name: 'Auê, página inicial' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test(`landing mantém a superfície clara de apoio e títulos Archivo em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/landing');
    await aguardarPinturaFinal(page);

    const landing = page.locator('.publico-site.landing');
    await expect(landing).toBeVisible();
    await expect(landing.locator('.landing-texto h1')).toBeVisible();
    expect(await landing.locator('.landing-texto h1').evaluate((titulo) => getComputedStyle(titulo).fontFamily)).toContain('Archivo');
    expect(await landing.evaluate((elemento) => getComputedStyle(elemento).colorScheme)).toBe('light');
    expect(await landing.evaluate((elemento) => getComputedStyle(elemento).backgroundColor)).toBe('rgb(247, 248, 245)');
  });
}

for (const viewport of [{ width: 320, height: 740 }, ...VIEWPORTS]) {
  test(`entradas sociais não duplicam a marca nem cortam o aviso em ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/login');
    await aguardarPinturaFinal(page);

    const x = page.getByRole('button', { name: 'X: em breve', exact: true });
    const tiktok = page.getByRole('button', { name: 'TikTok: em breve', exact: true });
    await expect(x).toBeDisabled();
    await expect(tiktok).toBeDisabled();
    // O próprio logotipo já escreve X; não repetir o nome ao lado dele.
    await expect(x.locator('svg')).toHaveCount(1);
    await expect(x).toHaveText('Em breve');
    await expect(tiktok).toHaveText(/TikTok\s*Em breve/);

    for (const botao of [x, tiktok]) {
      const geometria = await botao.evaluate((elemento) => {
        const aviso = elemento.querySelector('small');
        if (!aviso) throw new Error('Aviso de indisponibilidade ausente');
        const faixa = document.createRange();
        faixa.selectNodeContents(aviso);
        const texto = faixa.getBoundingClientRect();
        const caixa = elemento.getBoundingClientRect();
        return {
          largura: caixa.width, altura: caixa.height,
          textoCabe: aviso.scrollWidth <= aviso.clientWidth + 1,
          textoDentro: texto.left >= caixa.left && texto.right <= caixa.right
            && texto.top >= caixa.top && texto.bottom <= caixa.bottom,
        };
      });
      expect(geometria.largura).toBeGreaterThanOrEqual(44);
      expect(geometria.altura).toBeGreaterThanOrEqual(44);
      expect(geometria.textoCabe).toBe(true);
      expect(geometria.textoDentro).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}

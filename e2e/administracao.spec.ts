import { expect, test } from '@playwright/test';

const harness = `http://127.0.0.1:${process.env.E2E_HARNESS_PORT ?? 4199}/e2e/harness.html`;

for (const viewport of [
  { nome: 'mobile', width: 390, height: 844 },
  { nome: 'desktop', width: 1440, height: 900 },
] as const) {
  test(`painel administrativo preserva dados agregados e a grade em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${harness}?admin=1`);

    const painel = page.locator('.admin');
    await expect(painel.getByRole('heading', { name: 'O pulso do Auê' })).toBeVisible();
    await expect(painel.getByRole('heading', { name: 'Páginas acessadas' })).toBeVisible();
    await expect(painel.getByText('Concluídos no período')).toBeVisible();
    await expect(painel.getByText('Receita estimada')).toBeVisible();

    const grafico = painel.getByRole('img', { name: 'Atividade no período: Arena, acessos de página, tópicos e respostas' });
    await expect(grafico).toBeVisible();
    // Trinta dias são somados em faixas; a visualização não some com dias nem
    // cria uma coluna por dia em telas estreitas.
    await expect(grafico.locator('.admin-grafico__dia')).toHaveCount(10);
    await expect(grafico.locator('.admin-grafico__dia').first()).toHaveAttribute('title', /15 Arena.*27 acessos.*6 tópicos.*9 respostas/);

    const geometria = await page.evaluate(() => {
      const caixas = [...document.querySelectorAll<HTMLElement>('.admin, .admin__bloco, .admin-metrica')]
        .map((elemento) => elemento.getBoundingClientRect());
      return {
        semOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
        caixasDentroDaTela: caixas.every((caixa) => caixa.left >= -1 && caixa.right <= window.innerWidth + 1),
        fundoDaPagina: getComputedStyle(document.body).backgroundColor,
        texto: getComputedStyle(document.querySelector('.admin')!).color,
      };
    });
    expect(geometria.semOverflow).toBe(true);
    expect(geometria.caixasDentroDaTela).toBe(true);
    expect(geometria.fundoDaPagina).not.toBe('rgba(0, 0, 0, 0)');
    expect(geometria.texto).not.toBe('rgba(0, 0, 0, 0)');

    if (viewport.nome === 'mobile') {
      const metricas = painel.locator('.admin-metrica');
      const primeira = await metricas.nth(0).boundingBox();
      const segunda = await metricas.nth(1).boundingBox();
      expect(primeira?.y).toBeDefined();
      expect(segunda?.y).toBeGreaterThan((primeira?.y ?? 0) + 100);
    } else {
      const metricas = painel.locator('.admin-metrica');
      const primeira = await metricas.nth(0).boundingBox();
      const quarta = await metricas.nth(3).boundingBox();
      expect(Math.abs((primeira?.y ?? 0) - (quarta?.y ?? 0))).toBeLessThan(1);
    }

    await page.screenshot({ path: `test-results/administracao-${viewport.width}.png`, fullPage: true });
  });
}

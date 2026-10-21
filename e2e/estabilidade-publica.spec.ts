import { expect, test } from '@playwright/test';

import {
  aguardarQuadroEstavel,
  caixaDo,
  esperarCaixaEstavel,
  esperarSemOverflowHorizontal,
  instalarSondaDeLayoutShift,
  lerLayoutShift,
} from './apoio/estabilidade';

const VIEWPORTS = [
  { nome: '320px', width: 320, height: 740 },
  { nome: '375px', width: 375, height: 812 },
  { nome: '390px', width: 390, height: 844 },
  { nome: '430px', width: 430, height: 932 },
  { nome: '768px', width: 768, height: 1024 },
  { nome: '1440px', width: 1440, height: 1000 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`mantém a casca pública estável em ${viewport.nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await instalarSondaDeLayoutShift(page);
    await page.goto('/como-jogar');
    await aguardarQuadroEstavel(page);

    await esperarSemOverflowHorizontal(page);

    if (viewport.width < 700) {
      const topo = page.locator('.publico-topo');
      const navegacao = page.locator('.publico-navegacao-mobile');
      const antesDoTopo = await caixaDo(topo);
      const antesDaNavegacao = await caixaDo(navegacao);

      await page.evaluate(() => window.scrollTo(0, 420));
      await aguardarQuadroEstavel(page);
      esperarCaixaEstavel(antesDoTopo, await caixaDo(topo));
      esperarCaixaEstavel(antesDaNavegacao, await caixaDo(navegacao));

      await page.getByRole('button', { name: 'Abrir menu' }).click();
      await expect(page.locator('#menu-publico')).toBeVisible();
      esperarCaixaEstavel(antesDoTopo, await caixaDo(topo));
      esperarCaixaEstavel(antesDaNavegacao, await caixaDo(navegacao));

      await page.locator('#menu-publico a[href="/tipos-de-arroto"]').click();
      await expect(page).toHaveURL(/\/tipos-de-arroto$/);
      await aguardarQuadroEstavel(page);
      esperarCaixaEstavel(antesDoTopo, await caixaDo(topo));
      esperarCaixaEstavel(antesDaNavegacao, await caixaDo(navegacao));
    } else {
      const lateral = page.locator('.publico-lateral');
      const antesDaLateral = await caixaDo(lateral);

      await page.evaluate(() => window.scrollTo(0, 420));
      await aguardarQuadroEstavel(page);
      esperarCaixaEstavel(antesDaLateral, await caixaDo(lateral));

      // No tablet, o índice de páginas públicas fica oculto para caber no menu
      // compacto de ícones. A troca de rota continua exercitando a mesma casca,
      // mas não inventamos um controle que a pessoa não enxerga nessa largura.
      if (viewport.width < 1060) {
        await page.goto('/tipos-de-arroto');
      } else {
        await page.locator('.publico-lateral-inferior a[href="/tipos-de-arroto"]').click();
      }
      await expect(page).toHaveURL(/\/tipos-de-arroto$/);
      await aguardarQuadroEstavel(page);
      esperarCaixaEstavel(antesDaLateral, await caixaDo(lateral));
    }

    await esperarSemOverflowHorizontal(page);
    const layoutShift = await lerLayoutShift(page);
    expect(layoutShift.total, `Entradas de layout shift: ${JSON.stringify(layoutShift.entradas)}`).toBeLessThanOrEqual(0.05);
  });
}

import { expect, type Locator, type Page } from '@playwright/test';

export type Caixa = { x: number; y: number; width: number; height: number };

export async function aguardarQuadroEstavel(page: Page) {
  await page.waitForFunction(async () => {
    await document.fonts.ready;
    return document.readyState === 'complete';
  });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

export async function caixaDo(locator: Locator): Promise<Caixa> {
  await expect(locator).toBeVisible();
  const caixa = await locator.boundingBox();
  if (!caixa) throw new Error('O elemento visível não expôs uma caixa de layout.');
  return caixa;
}

export function esperarCaixaEstavel(anterior: Caixa, atual: Caixa) {
  expect(atual.x).toBeCloseTo(anterior.x, 1);
  expect(atual.y).toBeCloseTo(anterior.y, 1);
  expect(atual.width).toBeCloseTo(anterior.width, 1);
  expect(atual.height).toBeCloseTo(anterior.height, 1);
}

export async function esperarSemOverflowHorizontal(page: Page) {
  const medidas = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documento: document.documentElement.scrollWidth,
    corpo: document.body.scrollWidth,
  }));

  expect(medidas.documento, `documento com ${medidas.documento}px numa viewport de ${medidas.viewport}px`).toBeLessThanOrEqual(medidas.viewport);
  expect(medidas.corpo, `corpo com ${medidas.corpo}px numa viewport de ${medidas.viewport}px`).toBeLessThanOrEqual(medidas.viewport);
}

export async function instalarSondaDeLayoutShift(page: Page) {
  await page.addInitScript(() => {
    const chave = '__aueE2eLayoutShift';
    const chaveEntradas = '__aueE2eLayoutShiftEntradas';
    type EntradaDeShift = { value: number; hadRecentInput: boolean; startTime: number; sources: string[] };
    const janela = window as Window & { [chave: string]: number | EntradaDeShift[] };
    janela[chave] = 0;
    janela[chaveEntradas] = [];

    if (!('PerformanceObserver' in window)) return;

    const observador = new PerformanceObserver((lista) => {
      for (const entrada of lista.getEntries() as Array<PerformanceEntry & {
        value?: number;
        hadRecentInput?: boolean;
        sources?: Array<{ node?: Node | null }>;
      }>) {
        const value = entrada.value ?? 0;
        janela[chave] = Number(janela[chave] ?? 0) + value;
        (janela[chaveEntradas] as EntradaDeShift[]).push({
          value,
          hadRecentInput: entrada.hadRecentInput ?? false,
          startTime: entrada.startTime,
          sources: (entrada.sources ?? []).map(({ node }) => {
            if (!(node instanceof Element)) return node?.nodeName ?? 'nó não identificado';
            return `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}${node.classList.length ? `.${[...node.classList].join('.')}` : ''}`;
          }),
        });
      }
    });

    try {
      observador.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Chromium antigo pode não expor esta entrada; as medições geométricas seguem ativas.
    }
  });
}

export async function lerLayoutShift(page: Page) {
  return page.evaluate(() => {
    const janela = window as Window & {
      __aueE2eLayoutShift?: number;
      __aueE2eLayoutShiftEntradas?: Array<{ value: number; hadRecentInput: boolean; startTime: number; sources: string[] }>;
    };
    return {
      total: janela.__aueE2eLayoutShift ?? 0,
      entradas: janela.__aueE2eLayoutShiftEntradas ?? [],
    };
  });
}

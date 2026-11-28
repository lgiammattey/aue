// Arquivo .e2e.ts para não entrar na descoberta padrão da suíte legada.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { aguardarQuadroEstavel, esperarSemOverflowHorizontal } from './apoio/estabilidade';

const tamanhos = [
  { width: 1440, height: 900, nome: 'desktop' },
  { width: 390, height: 844, nome: 'mobile-390' },
  { width: 320, height: 720, nome: 'mobile-320' },
] as const;
const diretorioDeFixtures = process.env.M05_E2E_FIXTURES_DIR;

for (const tamanho of tamanhos) {
  test(`M05 preserva a moldura e não estoura horizontalmente em ${tamanho.nome}`, async ({ page }) => {
    await page.setViewportSize(tamanho);
    const externos: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') externos.push(url.hostname);
    });

    await page.goto('/');
    await aguardarQuadroEstavel(page);
    await expect(page.getByRole('heading', { name: /SOLTA O.*ARROTO/i })).toBeVisible();
    await expect(page.locator('.m05-home__quadrinho img')).toHaveAttribute('src', '/ilustracoes/hero-churrasco.webp');
    await expect(page.locator('#arena')).toBeVisible();
    await esperarSemOverflowHorizontal(page);
    expect(externos, `a simulação de anúncio não pode carregar rede externa: ${externos.join(', ')}`).toEqual([]);

    if (tamanho.width <= 760) {
      const navegacao = page.getByRole('navigation', { name: 'Navegação principal' });
      await expect(navegacao).toBeVisible();
      await expect(navegacao.getByRole('link', { name: 'Arrotar' })).toBeVisible();
      const caixa = await navegacao.getByRole('link', { name: 'Arrotar' }).boundingBox();
      expect(caixa?.height).toBeGreaterThanOrEqual(44);
    } else {
      await expect(page.locator('.m05-moldura__lateral')).toBeVisible();
    }
  });
}

test('M05 usa anúncio apenas simulado, sem sobrepor a gravação', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-placement="inicio"]')).toHaveCount(1);
  await expect(page.getByLabel('Publicidade simulada')).toBeVisible();
  await page.getByRole('link', { name: 'Arrotar' }).first().click();
  await expect(page.getByRole('button', { name: 'Gravar agora' })).toBeVisible();
  await expect(page.locator('[data-placement="resultado"]')).toHaveCount(0);
  await esperarSemOverflowHorizontal(page);
});

test('M05 mostra as cinco publicações locais elegíveis sem interromper o player', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByText('Passa o mic aí')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.m05-home__resenha .card-do-post')).toHaveCount(5);
  const postComAudio = page.locator('article').filter({ hasText: 'Passa o mic aí' });
  await expect(postComAudio.getByRole('button', { name: 'Ouvir áudio' })).toBeVisible();
  await postComAudio.getByRole('button', { name: 'Ouvir áudio' }).click();
  await expect(postComAudio.getByRole('button', { name: 'Pausar áudio' })).toBeVisible();
});

test('M05 abre o X1 local respondido sem declarar vencedor oficial', async ({ page }) => {
  test.skip(!diretorioDeFixtures, 'O X1 local exige fixtures descartáveis apontadas explicitamente por M05_E2E_FIXTURES_DIR.');
  const { token } = JSON.parse(readFileSync(join(diretorioDeFixtures!, 'duelo-qa.json'), 'utf8')) as { token: string };
  const { contas } = JSON.parse(readFileSync(join(diretorioDeFixtures!, 'fixtures.json'), 'utf8')) as { contas: { rafaronco: { email: string; password: string } } };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  const avisoMaioridade = page.getByRole('button', { name: 'Tenho 18+' });
  if (await avisoMaioridade.isVisible()) await avisoMaioridade.click();
  await page.getByLabel('E-mail').fill(contas.rafaronco.email);
  if (await page.getByRole('button', { name: 'Avançar' }).count()) {
    await page.getByRole('button', { name: 'Avançar' }).click();
  }
  await page.getByLabel('Senha').fill(contas.rafaronco.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/(?:feed)?$/);
  await page.goto(`/duelo#t=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /MEDIÇÕES DO DESAFIO/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('small', { hasText: 'Medição experimental' }).first()).toBeVisible();
  await expect(page.getByText(/vencedor oficial/i)).toHaveCount(0);
  await esperarSemOverflowHorizontal(page);
});

test('M05 mantém gravação local, player e publicação sob ação explícita', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit não expõe o dispositivo sintético necessário para validar captura no navegador.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/arena');
  const iniciar = page.getByRole('button', { name: 'Gravar agora' });
  await expect(iniciar).toBeVisible();
  await iniciar.click();
  await expect(page.getByRole('button', { name: 'Finalizar gravação' })).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(750);
  await page.getByRole('button', { name: 'Finalizar gravação' }).click();
  await expect(page.getByText(/ela não foi publicada no Auê/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reproduzir gravação' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Publicar no Mural/i })).toBeVisible();
  await esperarSemOverflowHorizontal(page);
});

import { defineConfig, devices } from '@playwright/test';

const portaApp = Number(process.env.E2E_APP_PORT ?? 4197);
const portaHarness = Number(process.env.E2E_HARNESS_PORT ?? 4199);
const enderecoApp = `http://127.0.0.1:${portaApp}`;
const enderecoHarness = `http://127.0.0.1:${portaHarness}`;

/**
 * E2E da casca pública. O Supabase não é simulado aqui: as variáveis só
 * permitem que a aplicação monte, e os cenários ficam em rotas que não leem
 * conteúdo remoto. Assim a cobertura não vende feed, sessão ou PWA como reais.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: enderecoApp,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `node scripts/servidor-e2e.mjs app ${portaApp}`,
      url: enderecoApp,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // O harness de componentes é insumo de teste, não entrada pública do
      // build. Ele sobe à parte para nunca entrar no artefato de produção.
      command: `node scripts/servidor-e2e.mjs harness ${portaHarness}`,
      url: `${enderecoHarness}/e2e/harness.html`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});

import { defineConfig, devices } from '@playwright/test';

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
    baseURL: 'http://127.0.0.1:4187',
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
      command: 'VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=chave-e2e npm run build && npm run preview -- --host 127.0.0.1 --port 4187',
      url: 'http://127.0.0.1:4187',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // O harness de componentes é insumo de teste, não entrada pública do
      // build. Ele sobe à parte para nunca entrar no artefato de produção.
      command: 'VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=chave-e2e npm run dev -- --host 127.0.0.1 --port 4189',
      url: 'http://127.0.0.1:4189/e2e/harness.html',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});

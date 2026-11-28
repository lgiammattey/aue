import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.M05_E2E_URL ?? 'http://127.0.0.1:4205';
const destino = new URL(baseURL);
if (!['127.0.0.1', 'localhost', '::1'].includes(destino.hostname)) {
  throw new Error('A Prova de Fogo M05 só aceita um destino loopback local.');
}

/**
 * Prova de Fogo M05. Usa somente a aplicação e o Supabase descartáveis que
 * já foram iniciados pelo responsável da missão; não constrói, nem aponta para
 * qualquer ambiente hospedado.
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'm05-experience.e2e.ts',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-m05', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] } } },
    { name: 'webkit-m05', use: { ...devices['Desktop Safari'] } },
  ],
});

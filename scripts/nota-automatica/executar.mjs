import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { criarGateway, loteTemFalha, processarLote } from './processar.mjs';
import { criarAnalisador } from './navegador.mjs';

const { AUE_WORKER_SECRET, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env;
const gateway = criarGateway({ url: VITE_SUPABASE_URL, chave: AUE_WORKER_SECRET, anonKey: VITE_SUPABASE_ANON_KEY });
const servidor = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let navegador;
try {
  await servidor.listen();
  navegador = await chromium.launch({ headless: true });
  const pagina = await navegador.newPage();
  await pagina.goto(`${servidor.resolvedUrls.local[0]}scripts/notas-retrospectivas/index.html`);
  const analisar = criarAnalisador(pagina);
  // Uma concessão por vez: o tempo de inferência de uma gravação não pode
  // esgotar a concessão das seguintes antes de começarem a ser analisadas.
  const totais = { recebidos: 0, medidos: 0, rejeitados: 0, erros: 0, alterados: 0 };
  for (let i = 0; i < 10; i++) {
    const parcial = await processarLote({ gateway, analisar, limite: 1 });
    for (const campo of Object.keys(totais)) totais[campo] += parcial[campo];
    if (parcial.recebidos === 0) break;
  }
  console.log('Lote:', JSON.stringify(totais));
  // O processamento continua para todos os itens do lote. Ao final, sinaliza
  // a falha para o Actions; o banco conserva as pendências para retentativa.
  if (loteTemFalha(totais)) process.exitCode = 1;
} catch {
  // Nunca registrar URLs, corpos de requisição, caminhos privados ou segredos.
  console.error('Não foi possível concluir o processamento de notas.');
  process.exitCode = 1;
} finally {
  await navegador?.close();
  await servidor.close();
}

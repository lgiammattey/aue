import { spawn, spawnSync } from 'node:child_process';

const [modo, porta] = process.argv.slice(2);

if (!['app', 'harness'].includes(modo) || !/^\d+$/.test(porta ?? '')) {
  console.error('Uso: node scripts/servidor-e2e.mjs <app|harness> <porta>');
  process.exit(1);
}

const ambiente = {
  ...process.env,
};
delete ambiente.VITE_SUPABASE_URL;
delete ambiente.VITE_SUPABASE_ANON_KEY;
const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error('O servidor E2E deve ser iniciado por npm para localizar o npm-cli.js.');
  process.exit(1);
}

function rodarNpm(args, opcoes = {}) {
  return spawn(process.execPath, [npmCli, ...args], { env: ambiente, stdio: 'inherit', ...opcoes });
}

if (modo === 'app') {
  const build = spawnSync(process.execPath, [npmCli, 'run', 'build'], { env: ambiente, stdio: 'inherit' });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const args = modo === 'app'
  ? ['run', 'preview', '--', '--host', '127.0.0.1', '--port', porta]
  : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', porta];
const servidor = rodarNpm(args);

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => servidor.kill(sinal));
}
servidor.on('exit', (codigo) => process.exit(codigo ?? 1));

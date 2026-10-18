import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { argumentosDoFfmpeg } from '../../../scripts/elenco-burpzilla/preparar-audio';

/**
 * Fronteira e segredos do backfill.
 *
 * A chave de serviço dá acesso total ao banco. Estas travas garantem que ela só
 * existe no ambiente do terminal de quem roda o script: nunca no navegador,
 * nunca em arquivo versionado, nunca encadeada em build/test/lint.
 */

const RAIZ = fileURLToPath(new URL('../../..', import.meta.url));
const PASTA_DOS_SCRIPTS = `${RAIZ}/scripts/elenco-burpzilla`;

const scripts = readdirSync(PASTA_DOS_SCRIPTS).filter((n) => n.endsWith('.ts'));
const lerScript = (nome: string) => readFileSync(`${PASTA_DOS_SCRIPTS}/${nome}`, 'utf8');
const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

function arquivosDeProducao(pasta: string): string[] {
  return readdirSync(pasta).flatMap((n) => {
    const caminho = `${pasta}/${n}`;
    if (statSync(caminho).isDirectory()) return arquivosDeProducao(caminho);
    return /\.tsx?$/.test(n) && !/\.(test|spec)\.tsx?$/.test(n) ? [caminho] : [];
  });
}

describe('segredos', () => {
  it('a chave de serviço nunca tem prefixo VITE_ e o nome dela não aparece em src/', () => {
    for (const nome of scripts) {
      const codigo = semComentarios(lerScript(nome));
      expect(codigo, nome).not.toMatch(/VITE_/);
      expect(codigo, nome).not.toMatch(/VITE_\w*SERVICE/i);
    }
    for (const arquivo of arquivosDeProducao(`${RAIZ}/src`)) {
      const codigo = readFileSync(arquivo, 'utf8');
      expect(codigo, arquivo).not.toContain('AUE_SERVICE_ROLE_KEY');
      expect(codigo, arquivo).not.toMatch(/service_role_key/i);
    }
  });

  it('só o aplicar.ts lê a chave do ambiente', () => {
    for (const nome of scripts) {
      const le = /process\.env\.AUE_SERVICE_ROLE_KEY/.test(semComentarios(lerScript(nome)));
      expect(le, nome).toBe(nome === 'aplicar.ts');
    }
  });

  it('nenhum arquivo de ambiente versionado ou de exemplo cita a chave', () => {
    const exemplo = readFileSync(`${RAIZ}/.env.example`, 'utf8');
    expect(exemplo).not.toMatch(/SERVICE_ROLE|service_role/i);
    const gitignore = readFileSync(`${RAIZ}/.gitignore`, 'utf8');
    expect(gitignore).toMatch(/^\.env$/m);
    expect(gitignore).toMatch(/^\.cache\/$/m);
  });

  it('o código dos scripts não imprime a chave', () => {
    for (const nome of scripts) {
      const codigo = semComentarios(lerScript(nome));
      expect(codigo, nome).not.toMatch(/console\.\w+\([^)]*(confirmacao\.chave|\bc\.chave|SERVICE_ROLE_KEY)/);
    }
  });
});

describe('fronteira', () => {
  it('os scripts falam por fetch: sem supabase-js, sem o cliente do navegador', () => {
    for (const nome of scripts) {
      const codigo = semComentarios(lerScript(nome));
      expect(codigo, nome).not.toMatch(/@supabase\/supabase-js/);
      expect(codigo, nome).not.toMatch(/db\/supabase/);
      expect(codigo, nome).not.toMatch(/plataforma\//);
    }
    expect(semComentarios(lerScript('rest.ts'))).toContain('fetch(');
  });

  it('nenhum arquivo do app (src/) importa os scripts do backfill', () => {
    for (const arquivo of arquivosDeProducao(`${RAIZ}/src`)) {
      expect(semComentarios(readFileSync(arquivo, 'utf8')), arquivo).not.toMatch(/scripts\/elenco-burpzilla/);
    }
  });

  it('o núcleo do elenco não importa rede nem disco', () => {
    for (const arquivo of arquivosDeProducao(`${RAIZ}/src/nucleo/elenco`)) {
      const codigo = semComentarios(readFileSync(arquivo, 'utf8'));
      expect(codigo, arquivo).not.toMatch(/from\s+['"]node:/);
      expect(codigo, arquivo).not.toMatch(/\bfetch\s*\(/);
    }
  });
});

describe('npm scripts', () => {
  const pacote = JSON.parse(readFileSync(`${RAIZ}/package.json`, 'utf8')) as { scripts: Record<string, string> };

  it('existem os três comandos do elenco', () => {
    expect(pacote.scripts['elenco:preparar']).toContain('preparar-audio.ts');
    expect(pacote.scripts['elenco:sortear']).toContain('sortear.ts');
    expect(pacote.scripts['elenco:backfill']).toContain('aplicar.ts');
  });

  it('build, test, lint, typecheck e o resto não encadeiam nada do elenco', () => {
    for (const [nome, comando] of Object.entries(pacote.scripts)) {
      if (nome.startsWith('elenco:')) continue;
      expect(comando, nome).not.toMatch(/elenco/);
    }
  });
});

describe('o comando de ffmpeg', () => {
  it('tira metadado, vira mono AAC de 64 kbps e não passa por shell', () => {
    const args = argumentosDoFfmpeg('entrada.ogg', 'saida.m4a');
    expect(args).toEqual(expect.arrayContaining(['-map_metadata', '-1', '-c:a', 'aac', '-b:a', '64k', '-ac', '1']));
    expect(args.at(-1)).toBe('saida.m4a');
    expect(semComentarios(lerScript('preparar-audio.ts'))).toContain('execFileSync(');
    expect(semComentarios(lerScript('preparar-audio.ts'))).not.toMatch(/\bexecSync\(/);
  });
});

describe('o comando de verdade (offline, sem credencial)', () => {
  function rodar(args: string[], env: Record<string, string> = {}) {
    return spawnSync(process.execPath, [`${PASTA_DOS_SCRIPTS}/aplicar.ts`, ...args], {
      cwd: RAIZ,
      encoding: 'utf8',
      env: { PATH: process.env.PATH ?? '', ...env },
    });
  }

  it('sem flag é dry-run: mostra o plano, o status liberado e sai com 0 sem credencial nenhuma', () => {
    const r = rodar([]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('DRY-RUN');
    expect(r.stdout).toContain('podeAplicar: LIBERADO');
    expect(r.stdout).toContain('posts: 22');
  });

  it('--aplicar sem --projeto recusa antes de qualquer rede', () => {
    const r = rodar(['--aplicar'], { AUE_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co', AUE_SERVICE_ROLE_KEY: 'k' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('--projeto');
  });

  it('--aplicar sem confirmação no ambiente recusa', () => {
    const r = rodar(['--aplicar', '--projeto', 'abcdefghijklmnop'], {
      AUE_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
      AUE_SERVICE_ROLE_KEY: 'k',
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('AUE_CONFIRMA_PROJETO');
  });

  it('--aplicar com tudo confirmado ainda recusa enquanto podeAplicar estiver bloqueado', () => {
    const r = rodar(['--aplicar', '--projeto', 'abcdefghijklmnop'], {
      AUE_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
      AUE_SERVICE_ROLE_KEY: 'chave-que-nao-deve-aparecer',
      AUE_CONFIRMA_PROJETO: 'abcdefghijklmnop',
      AUE_ARQUIVO_AUTORIZACAO: `${RAIZ}/arquivo-que-nao-existe.md`,
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('BLOQUEADO');
    expect(r.stdout + r.stderr).not.toContain('chave-que-nao-deve-aparecer');
  });

  it('--aplicar e --desfazer juntos são recusados', () => {
    expect(rodar(['--aplicar', '--desfazer']).status).toBe(1);
  });
});

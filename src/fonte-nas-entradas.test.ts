import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * O contrato do carregamento de fonte entre as entradas HTML e o CSS.
 *
 * POR QUE ISTO EXISTE
 * -------------------
 * A fonte saiu de dentro do CSS. Antes era um `@import` na primeira linha de
 * `src/index.css`: um lugar só para mexer, e o pior lugar possível — o
 * navegador só descobre a fonte depois de baixar o CSS inteiro, então o
 * primeiro texto da Arena espera duas viagens de rede em vez de uma.
 *
 * O preço de consertar isso é que agora a mesma declaração vive nas entradas
 * arquivos `.html`, e nenhum deles falha quando diverge. Uma entrada sem o
 * `<link>` não quebra build, não quebra teste e não dá erro no console: ela
 * simplesmente serve a página no fallback do sistema, com outra cara, e
 * ninguém descobre até alguém abrir aquela URL específica e achar estranho.
 *
 * Já tem entrada nova esperando na fila (a landing de desktop cria mais duas).
 * Este arquivo é o que faz ela nascer gritando em vez de nascer sem fonte.
 *
 * A REGRA TRAVADA AQUI: **toda entrada de build declarada em `vite.config.ts`
 * carrega os MESMOS preloads locais.**
 *
 * A lista de entradas é lida do `vite.config.ts`, não escrita à mão — quem
 * acrescentar uma entrada lá já entra neste teste sem perceber, que é o ponto.
 */

function ler(caminhoRelativo: string): string {
  return readFileSync(fileURLToPath(new URL(caminhoRelativo, import.meta.url)), 'utf8');
}

/** As entradas HTML do build, direto de `vite.config.ts`. */
function entradasDoBuild(): string[] {
  const config = ler('../vite.config.ts');
  const achados = [...config.matchAll(/entrada\('([^']+\.html)'\)/g)].map((m) => m[1]);
  return [...new Set(achados)];
}

const PRELOADS_DE_FONTE = [
  '<link rel="preload" href="/fonts/anton-latin.woff2" as="font" type="font/woff2" crossorigin />',
  '<link rel="preload" href="/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin />',
] as const;

const CSS_RAIZ = ler('./index.css');

describe('a fonte chega igual em toda entrada HTML', () => {
  it('o build tem as entradas conhecidas — se mudou, o resto deste arquivo cobre as novas', () => {
    // Não é a lista que importa, é a leitura funcionar. Se o regex parar de
    // achar as entradas, os testes abaixo passariam varrendo array vazio.
    const entradas = entradasDoBuild();
    expect(entradas).toContain('index.html');
    expect(entradas).toContain('como-jogar.html');
    expect(entradas).toContain('como-arrotar.html');
    expect(entradas).toContain('privacidade.html');
    expect(entradas).toContain('termos.html');
  });

  it('toda entrada pré-carrega as duas fontes locais, e nenhuma fica para trás', () => {
    for (const arquivo of entradasDoBuild()) {
      const html = ler(`../${arquivo}`);
      for (const preload of PRELOADS_DE_FONTE) {
        expect(html, `${arquivo} ficou sem ${preload}`).toContain(preload);
      }
    }
  });

  it('toda entrada declara viewport-fit=cover para respeitar a safe area', () => {
    for (const arquivo of entradasDoBuild()) {
      expect(ler(`../${arquivo}`), `${arquivo} ficou sem viewport-fit=cover`).toContain(
        '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />',
      );
    }
  });

  it('nenhuma entrada ainda depende do Google Fonts', () => {
    for (const arquivo of entradasDoBuild()) {
      expect(ler(`../${arquivo}`), `${arquivo} ainda aponta para fonte externa`).not.toMatch(
        /https:\/\/fonts\.(?:googleapis|gstatic)\.com/,
      );
    }
  });

  it('as faces locais preservam Anton, Archivo, pesos e display swap', () => {
    expect(existsSync(fileURLToPath(new URL('../public/fonts/anton-latin.woff2', import.meta.url)))).toBe(true);
    expect(existsSync(fileURLToPath(new URL('../public/fonts/archivo-latin.woff2', import.meta.url)))).toBe(true);
    expect(CSS_RAIZ).toMatch(/font-family: 'Anton';[\s\S]*font-display: swap;[\s\S]*\/fonts\/anton-latin\.woff2/);
    expect(CSS_RAIZ).toMatch(/font-family: 'Archivo';[\s\S]*font-weight: 400 900;[\s\S]*font-display: swap;[\s\S]*\/fonts\/archivo-latin\.woff2/);
    expect(CSS_RAIZ, 'o CSS não pode voltar a depender do Google Fonts').not.toMatch(
      /fonts\.(?:googleapis|gstatic)\.com/,
    );
  });
});

describe('os tokens de tipografia batem com o protótipo canônico', () => {
  function token(nome: string): string {
    const achado = new RegExp(`--${nome}:\\s*([^;]+);`).exec(CSS_RAIZ);
    expect(achado, `--${nome} sumiu de src/index.css`).toBeTruthy();
    return (achado as RegExpExecArray)[1].replace(/\s+/g, ' ').trim();
  }

  it('o display continua sendo Anton, intocado', () => {
    // A troca era da fonte de INTERFACE. Se o display mudou junto, alguém
    // mexeu no que não devia.
    expect(token('font-display')).toBe("'Anton', 'Archivo Black', Impact, system-ui, sans-serif");
  });

  it('a interface é Archivo, e a Inter só sobra como fallback tardio', () => {
    const body = token('font-body');
    expect(body.startsWith("'Archivo'"), `--font-body não começa em Archivo: ${body}`).toBe(true);

    // Inter continua no stack de propósito: quem já tem ela instalada cai num
    // lugar razoável. O que não pode é ela voltar para a frente da fila.
    const posicaoNarrow = body.indexOf("'Archivo Narrow'");
    const posicaoInter = body.indexOf("'Inter'");
    expect(posicaoNarrow, "sumiu 'Archivo Narrow' do fallback").toBeGreaterThan(-1);
    expect(posicaoInter, "sumiu 'Inter' do fallback").toBeGreaterThan(-1);
    expect(posicaoInter, 'Inter voltou para a frente da Archivo Narrow').toBeGreaterThan(
      posicaoNarrow,
    );
  });

  it('o mono não foi tocado', () => {
    expect(token('font-mono')).toBe("ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace");
  });

  it('nenhum token de fonte diverge do protótipo canônico', () => {
    /*
      O design system é quem decide os tokens canônicos (AGENTS.md §2). Estes três tokens
      foram COPIADOS de lá; este teste é o que impede o app de sair andando
      sozinho de novo.
    */
    const prototipo = ler('../docs/design/design-system/tokens/typography.css');
    const normalizar = (valor: string) => valor.replace(/['\s]/g, '').toLowerCase();

    for (const nome of ['font-display', 'font-body', 'font-mono']) {
      const achado = new RegExp(`--${nome}:([^;]+);`).exec(prototipo);
      expect(achado, `--${nome} sumiu do protótipo`).toBeTruthy();
      expect(normalizar(token(nome)), `--${nome} divergiu do protótipo`).toBe(
        normalizar((achado as RegExpExecArray)[1]),
      );
    }
  });
});

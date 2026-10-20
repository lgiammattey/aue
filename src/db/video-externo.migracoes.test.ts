import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { detectarLinkDeVideo } from '../nucleo/midia/embeds';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(
  `${raiz}/supabase/migrations/20261020200000_corrige_regex_do_video_externo.sql`,
  'utf8',
)
  .split('\n')
  .filter((linha) => !linha.trimStart().startsWith('--'))
  .join('\n');

/** Regex do SQL (ARE) -> JS: só `[:space:]` precisa de tradução. */
function regexesDaFuncao(): Array<{ re: RegExp; saida: (m: RegExpMatchArray) => string }> {
  const literais = [...sql.matchAll(/regexp_match\(v, '([^']+)', 'i'\)/g)].map((m) => m[1] as string);
  return literais.map((literal) => ({
    re: new RegExp(literal.replaceAll('[:space:]', '\\s'), 'i'),
    saida: (m) =>
      literal.includes('tiktok')
        ? `https://www.tiktok.com/${m[1]}/video/${m[2]}`
        : `https://www.youtube.com/watch?v=${m[1]}`,
  }));
}

function canonicaNoSql(url: string): string | null {
  for (const { re, saida } of regexesDaFuncao()) {
    const m = url.trim().match(re);
    if (m) return saida(m);
  }
  return null;
}

describe('aue_url_video_externo_canonica (migration 20261020200000)', () => {
  it('não escapa o ponto duas vezes (era a causa de toda URL ser recusada)', () => {
    expect(sql).not.toContain('\\\\');
    expect(regexesDaFuncao()).toHaveLength(4);
  });

  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?si=abc',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.tiktok.com/@arrotador/video/7123456789012345678',
    'https://m.tiktok.com/@a.b_c/video/7123456789012345678?lang=pt',
  ])('aceita %s', (url) => {
    expect(canonicaNoSql(url)).not.toBeNull();
  });

  it.each([
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://evil.com/?u=https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=curto',
    'https://www.tiktok.com/@arrotador',
  ])('recusa %s', (url) => {
    expect(canonicaNoSql(url)).toBeNull();
  });

  it('o que o cliente envia é sempre aceito e idêntico no SQL', () => {
    const entradas = [
      'youtube.com/watch?v=dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ?si=abc',
      'https://www.youtube.com/live/dQw4w9WgXcQ',
      'tiktok.com/@arrotador/video/7123456789012345678',
    ];
    for (const entrada of entradas) {
      const cliente = detectarLinkDeVideo(entrada);
      expect(cliente, entrada).not.toBeNull();
      expect(canonicaNoSql(cliente!.urlOriginal), entrada).toBe(cliente!.urlOriginal);
    }
  });
});

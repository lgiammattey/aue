import { describe, expect, it } from 'vitest';
import { linkDaRede, normalizarRede } from './redesSociais';

describe('normalizarRede', () => {
  it.each([
    ['tiktok', '@giamzinn', 'giamzinn'],
    ['tiktok', 'giamzinn', 'giamzinn'],
    ['tiktok', 'https://www.tiktok.com/@giamzinn', 'giamzinn'],
    ['tiktok', 'tiktok.com/@giamzinn?lang=pt', 'giamzinn'],
    ['tiktok', 'https://m.tiktok.com/@giam.zinn/video/123', 'giam.zinn'],
    ['instagram', 'https://instagram.com/leosam77/', 'leosam77'],
    ['instagram', '@leosam77', 'leosam77'],
    ['youtube', 'https://www.youtube.com/@canal-legal', 'canal-legal'],
    ['twitter', 'https://x.com/arrotador', 'arrotador'],
    ['twitter', 'https://twitter.com/arrotador', 'arrotador'],
  ] as const)('%s: %s vira %s', (rede, entrada, esperado) => {
    expect(normalizarRede(rede, entrada)).toEqual({ ok: true, valor: esperado });
  });

  it('vazio apaga (valor nulo)', () => {
    expect(normalizarRede('tiktok', '   ')).toEqual({ ok: true, valor: null });
    expect(normalizarRede('instagram', '')).toEqual({ ok: true, valor: null });
  });

  it.each([
    ['tiktok', 'https://www.instagram.com/giamzinn'],
    ['instagram', 'https://tiktok.com/@giamzinn'],
    ['tiktok', 'com espaço'],
    ['tiktok', 'a'.repeat(25)],
    ['twitter', 'a'.repeat(16)],
    ['instagram', 'javascript:alert(1)'],
    ['youtube', 'https://evil.com/@canal'],
    ['tiktok', 'https://tiktok.com/'],
  ] as const)('%s recusa "%s" com mensagem clara', (rede, entrada) => {
    const r = normalizarRede(rede, entrada);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.mensagem).toMatch(/use só o @ ou o link do seu perfil/);
  });
});

describe('linkDaRede', () => {
  it('monta o link só de @ válido', () => {
    expect(linkDaRede('tiktok', 'giamzinn')).toBe('https://www.tiktok.com/@giamzinn');
    expect(linkDaRede('instagram', 'leosam77')).toBe('https://instagram.com/leosam77');
    expect(linkDaRede('youtube', 'canal')).toBe('https://www.youtube.com/@canal');
    expect(linkDaRede('twitter', 'arrotador')).toBe('https://x.com/arrotador');
  });

  it('valor antigo com link não vira link quebrado: é consertado ao montar', () => {
    expect(linkDaRede('tiktok', 'https://www.tiktok.com/@giamzinn')).toBe('https://www.tiktok.com/@giamzinn');
  });

  it('vazio ou lixo não vira link', () => {
    expect(linkDaRede('tiktok', null)).toBeNull();
    expect(linkDaRede('tiktok', '')).toBeNull();
    expect(linkDaRede('tiktok', 'https://evil.com/x')).toBeNull();
  });
});

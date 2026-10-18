import { describe, expect, it } from 'vitest';
import { sha1, uuidV5 } from './uuid';

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('uuid v5 feito à mão', () => {
  it('SHA-1 bate com os vetores conhecidos', () => {
    expect(hex(sha1(new TextEncoder().encode('abc')))).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(hex(sha1(new TextEncoder().encode('')))).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
    // 56 bytes: força o preenchimento a abrir um segundo bloco.
    expect(hex(sha1(new TextEncoder().encode('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')))).toBe(
      '84983e441c3bd26ebaae4aa1f95129e5e54670f1',
    );
  });

  it('bate com o vetor do namespace DNS (python.org)', () => {
    expect(uuidV5('python.org', DNS)).toBe('886313e1-3b8a-5372-9b90-0c9aee199e5d');
  });

  it('é determinístico e muda com o nome', () => {
    expect(uuidV5('post:p01', DNS)).toBe(uuidV5('post:p01', DNS));
    expect(uuidV5('post:p01', DNS)).not.toBe(uuidV5('post:p02', DNS));
  });

  it('recusa namespace que não é uuid', () => {
    expect(() => uuidV5('x', 'nao-e-uuid')).toThrow(/UUID inválido/);
  });
});

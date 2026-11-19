// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { lerTokenConviteDueloV2 } from './tokenConviteDueloV2';

afterEach(() => { window.history.replaceState(null, '', '/'); });
describe('leitura do convite privado', () => {
  it('lê somente o token do fragmento', () => {
    window.history.replaceState(null, '', `/?t=${'b'.repeat(64)}#t=${'a'.repeat(64)}`);
    expect(lerTokenConviteDueloV2()).toBe('a'.repeat(64));
  });
  it('recusa ausência, duplicidade e formato inválido', () => {
    for (const fragmento of ['', '#t=abc', `#t=${'a'.repeat(64)}&t=${'b'.repeat(64)}`, `#t=${'A'.repeat(64)}`]) {
      window.history.replaceState(null, '', `/${fragmento}`);
      expect(lerTokenConviteDueloV2()).toBeNull();
    }
  });
});

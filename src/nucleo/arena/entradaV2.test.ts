import { describe, expect, it } from 'vitest';
import { abreArenaV2 } from './entradaV2';

describe('seleção da Arena v2 local', () => {
  it.each([['/', '', true], ['/', '?utm=teste', true], ['/', '?gravar=1', false], ['/arena', '', true], ['/feed', '', false], ['/duelo', '', false], ['/login', '', false]])('%s %s', (caminho, busca, esperado) => {
    expect(abreArenaV2(caminho, busca)).toBe(esperado);
  });
});

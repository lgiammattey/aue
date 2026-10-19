import { describe, expect, it } from 'vitest';
import { caminhoDeVoltaSeguro, enderecoDoLoginComVolta } from './caminhoDeVolta';

describe('caminhoDeVoltaSeguro', () => {
  it('aceita caminho interno com consulta e âncora', () => {
    expect(caminhoDeVoltaSeguro('/historia/abc')).toBe('/historia/abc');
    expect(caminhoDeVoltaSeguro('/c/eu-arroto-e-dai?q=x#topo')).toBe('/c/eu-arroto-e-dai?q=x#topo');
  });

  it.each([
    ['https://evil.com'],
    ['//evil.com'],
    ['/\\evil.com'],
    ['/\\/evil.com'],
    ['javascript:alert(1)'],
    ['/%0d%0a' + '\r\nx'],
    ['historia/abc'],
    [''],
    ['/login?volta=/historia/1'],
    ['/' + 'a'.repeat(600)],
  ])('recusa %j', (entrada) => {
    expect(caminhoDeVoltaSeguro(entrada)).toBeNull();
  });

  it('recusa nulo e indefinido', () => {
    expect(caminhoDeVoltaSeguro(null)).toBeNull();
    expect(caminhoDeVoltaSeguro(undefined)).toBeNull();
  });
});

describe('enderecoDoLoginComVolta', () => {
  it('leva o caminho atual junto, codificado', () => {
    expect(enderecoDoLoginComVolta('/historia/abc?x=1')).toBe(
      '/login?modo=cadastro&volta=%2Fhistoria%2Fabc%3Fx%3D1',
    );
  });

  it('sem caminho seguro cai no login puro', () => {
    expect(enderecoDoLoginComVolta('//evil.com', 'entrar')).toBe('/login');
  });
});

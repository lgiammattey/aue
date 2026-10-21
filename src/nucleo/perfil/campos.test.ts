import { describe, expect, it } from 'vitest';
import { HANDLES_RESERVADOS, primeiroErroDoPerfil, validarApelido, validarBio, validarCidade, validarHandle } from './campos';

describe('validarApelido', () => {
  it.each(['ab', 'Betão', 'a'.repeat(30), '  Ana  '])('aceita "%s"', (v) => expect(validarApelido(v).ok).toBe(true));
  it.each(['', ' ', 'a', ' a ', 'a'.repeat(31)])('recusa "%s" com o intervalo certo', (v) => {
    const r = validarApelido(v);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.mensagem).toBe('O nome de exibição precisa ter de 2 a 30 caracteres.');
  });
});

describe('validarHandle', () => {
  it.each(['abc', '@giamzinn_aue', 'GIAM', 'a_1', 'a'.repeat(20)])('aceita "%s"', (v) => expect(validarHandle(v).ok).toBe(true));
  it.each(['ab', 'a'.repeat(21), 'com espaço', 'açúcar', 'a-b', 'a.b', '@@abc', ''])('recusa "%s"', (v) => {
    const r = validarHandle(v);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.mensagem).toMatch(/3 a 20 letras minúsculas/);
  });
  it.each(HANDLES_RESERVADOS)('%s é reservado', (v) => {
    const r = validarHandle(v);
    expect(!r.ok && r.mensagem).toBe('Esse @ é reservado. Escolhe outro.');
  });
});

describe('bio e cidade', () => {
  it('bio: até 280, contando depois de aparar', () => {
    expect(validarBio('x'.repeat(280)).ok).toBe(true);
    expect(validarBio(`  ${'x'.repeat(280)}  `).ok).toBe(true);
    const r = validarBio('x'.repeat(281));
    expect(!r.ok && r.mensagem).toBe('A bio tem até 280 caracteres.');
  });
  it('cidade: até 60', () => {
    expect(validarCidade('Rio de Janeiro').ok).toBe(true);
    expect(validarCidade('x'.repeat(61)).ok).toBe(false);
  });
});

describe('primeiroErroDoPerfil', () => {
  it('devolve o primeiro erro na ordem da tela, ou null', () => {
    expect(primeiroErroDoPerfil({ apelido: 'Ana', handle: 'ana_1', bio: '', cidade: '' })).toBeNull();
    expect(primeiroErroDoPerfil({ apelido: 'A', handle: 'x' })).toMatch(/nome de exibição/);
    expect(primeiroErroDoPerfil({ apelido: 'Ana', handle: 'x' })).toMatch(/O @ precisa/);
    expect(primeiroErroDoPerfil({ apelido: 'Ana', bio: 'x'.repeat(300) })).toMatch(/bio/);
  });
});

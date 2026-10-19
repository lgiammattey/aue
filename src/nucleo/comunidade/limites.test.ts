import { describe, expect, it } from 'vitest';
import {
  cabeNoLimite,
  caracteresRestantes,
  contarCaracteres,
  LIMITE_CAUSO,
  LIMITE_COMENTARIO,
  LIMITE_MOTIVO_DE_DENUNCIA,
  LIMITE_RESPOSTA,
  LIMITE_TEXTO_TOPICO,
  LIMITE_TITULO_TOPICO,
} from './limites';

describe('limites de texto', () => {
  it('bate com os limites das RPCs', () => {
    expect(LIMITE_CAUSO).toBe(1000);
    expect(LIMITE_COMENTARIO).toBe(500);
  });

  it('limites do fórum batem com as RPCs de tópico (título 120, texto 1000, resposta 500, motivo 500)', () => {
    expect(LIMITE_TITULO_TOPICO).toBe(120);
    expect(LIMITE_TEXTO_TOPICO).toBe(1000);
    expect(LIMITE_RESPOSTA).toBe(500);
    expect(LIMITE_MOTIVO_DE_DENUNCIA).toBe(500);
  });

  it('conta por caractere, como o char_length do Postgres: emoji vale 1', () => {
    expect('💨'.length).toBe(2);
    expect(contarCaracteres('💨')).toBe(1);
    expect(contarCaracteres('arroto 💨💨')).toBe(9);
  });

  it('500 emojis cabem no comentário; 501 não', () => {
    expect(cabeNoLimite('💨'.repeat(500), LIMITE_COMENTARIO)).toBe(true);
    expect(cabeNoLimite('💨'.repeat(501), LIMITE_COMENTARIO)).toBe(false);
  });

  it('espaço nas pontas não conta (o servidor faz btrim)', () => {
    expect(caracteresRestantes('  oi  ', 10)).toBe(8);
    expect(cabeNoLimite(' '.repeat(2000) + 'a', LIMITE_CAUSO)).toBe(true);
  });

  it('passou do limite dá restante negativo', () => {
    expect(caracteresRestantes('a'.repeat(1003), LIMITE_CAUSO)).toBe(-3);
  });
});

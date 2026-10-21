import { describe, expect, it } from 'vitest';
import { formatarTempoRelativo } from './tempoRelativo';

const AGORA = Date.parse('2026-10-21T12:00:00Z');
const atras = (ms: number) => new Date(AGORA - ms).toISOString();
const MIN = 60_000, H = 60 * MIN, D = 24 * H;

describe('formatarTempoRelativo', () => {
  it('minutos, horas e dias até 6', () => {
    expect(formatarTempoRelativo(atras(10_000), AGORA)).toBe('agora');
    expect(formatarTempoRelativo(atras(5 * MIN), AGORA)).toBe('5m');
    expect(formatarTempoRelativo(atras(3 * H), AGORA)).toBe('3h');
    expect(formatarTempoRelativo(atras(1 * D + H), AGORA)).toBe('ontem');
    expect(formatarTempoRelativo(atras(2 * D), AGORA)).toBe('2d');
    expect(formatarTempoRelativo(atras(6 * D + 23 * H), AGORA)).toBe('6d');
  });

  it('de 7 a 29 dias vira semanas, como no print ("1sem")', () => {
    expect(formatarTempoRelativo(atras(7 * D), AGORA)).toBe('1sem');
    expect(formatarTempoRelativo(atras(13 * D), AGORA)).toBe('1sem');
    expect(formatarTempoRelativo(atras(14 * D), AGORA)).toBe('2sem');
    expect(formatarTempoRelativo(atras(29 * D), AGORA)).toBe('4sem');
  });

  it('data absoluta só a partir de 30 dias', () => {
    expect(formatarTempoRelativo(atras(30 * D), AGORA)).toMatch(/\d{2} de set/);
  });

  it('sem data válida não inventa: devolve null', () => {
    expect(formatarTempoRelativo('', AGORA)).toBeNull();
    expect(formatarTempoRelativo('lixo', AGORA)).toBeNull();
  });
});

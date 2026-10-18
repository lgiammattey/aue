import { describe, expect, it } from 'vitest';
import { brasiliaParaUtc, dentroDaJanela, diaDaSemana, JANELA_DA_CASA, somarMinutos } from './horario';

describe('horário de Brasília para UTC', () => {
  it('soma três horas, sem depender do fuso da máquina', () => {
    expect(brasiliaParaUtc('2026-09-01T23:12')).toBe('2026-09-02T02:12:00.000Z');
    expect(brasiliaParaUtc('2026-09-26T18:22')).toBe('2026-09-26T21:22:00.000Z');
  });

  it('vira o mês e o ano quando precisa', () => {
    expect(brasiliaParaUtc('2026-09-30T23:30')).toBe('2026-10-01T02:30:00.000Z');
    expect(brasiliaParaUtc('2026-12-31T22:00')).toBe('2027-01-01T01:00:00.000Z');
  });

  it('recusa formato errado e data que não existe', () => {
    expect(() => brasiliaParaUtc('2026-09-01 23:12')).toThrow(/formato/);
    expect(() => brasiliaParaUtc('2026-02-30T10:00')).toThrow(/não existe/);
    expect(() => brasiliaParaUtc('2026-09-01T25:00')).toThrow(/não existe/);
  });

  it('a janela vai de 28/08 00:00 a 15/10 23:59:59 em Brasília', () => {
    expect(JANELA_DA_CASA.inicioUtc).toBe(brasiliaParaUtc('2026-08-28T00:00'));
    expect(JANELA_DA_CASA.fimUtc).toBe('2026-10-16T02:59:59.000Z');
    expect(somarMinutos(JANELA_DA_CASA.inicioUtc, 60)).toBe('2026-08-28T04:00:00.000Z');
    expect(dentroDaJanela(brasiliaParaUtc('2026-08-28T00:00'))).toBe(true);
    expect(dentroDaJanela(brasiliaParaUtc('2026-08-27T23:59'))).toBe(false);
    expect(dentroDaJanela(brasiliaParaUtc('2026-10-15T23:59'))).toBe(true);
    expect(dentroDaJanela(brasiliaParaUtc('2026-10-16T00:00'))).toBe(false);
  });

  it('dia da semana: 01/09/2026 é terça e 10/10/2026 é sábado', () => {
    expect(diaDaSemana('2026-09-01T23:12')).toBe(2);
    expect(diaDaSemana('2026-10-10T15:20')).toBe(6);
    expect(diaDaSemana('2026-10-11T10:15')).toBe(0);
  });
});

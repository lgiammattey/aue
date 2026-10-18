/**
 * Horário de Brasília para UTC.
 *
 * O cronograma é escrito em Brasília. O Brasil não tem horário de verão desde
 * 2019, então o deslocamento é fixo (-03:00) e a conta não depende do fuso da
 * máquina que roda o script.
 */

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const DESLOCAMENTO_MS = 3 * 60 * 60 * 1000;

/** `2026-09-01T23:12` (Brasília) vira `2026-09-02T02:12:00.000Z`. */
export function brasiliaParaUtc(quando: string): string {
  const m = FORMATO.exec(quando);
  if (!m) throw new Error(`Horário fora do formato AAAA-MM-DDTHH:MM: "${quando}"`);
  const [ano, mes, dia, hora, minuto] = m.slice(1).map(Number);
  const ms = Date.UTC(ano, mes - 1, dia, hora, minuto) + DESLOCAMENTO_MS;
  const data = new Date(ms);
  // Date.UTC aceita mês 13 e dia 32 e rola para frente. Aqui isso é erro.
  const volta = new Date(ms - DESLOCAMENTO_MS);
  if (
    volta.getUTCFullYear() !== ano ||
    volta.getUTCMonth() !== mes - 1 ||
    volta.getUTCDate() !== dia ||
    volta.getUTCHours() !== hora ||
    volta.getUTCMinutes() !== minuto
  ) {
    throw new Error(`Data ou hora que não existe: "${quando}"`);
  }
  return data.toISOString();
}

/** A janela do conteúdo da casa: 28/08 00:00 a 15/10 23:59:59, em Brasília. */
export const JANELA_DA_CASA = {
  inicioUtc: '2026-08-28T03:00:00.000Z',
  fimUtc: '2026-10-16T02:59:59.000Z',
} as const;

export function dentroDaJanela(utc: string): boolean {
  const t = Date.parse(utc);
  return t >= Date.parse(JANELA_DA_CASA.inicioUtc) && t <= Date.parse(JANELA_DA_CASA.fimUtc);
}

export function somarMinutos(utc: string, minutos: number): string {
  return new Date(Date.parse(utc) + minutos * 60_000).toISOString();
}

/** Dia da semana (0 = domingo) de uma data de Brasília `AAAA-MM-DD...`. */
export function diaDaSemana(quando: string): number {
  return new Date(Date.parse(brasiliaParaUtc(quando)) - DESLOCAMENTO_MS).getUTCDay();
}

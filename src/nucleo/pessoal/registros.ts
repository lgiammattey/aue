import type { Nota } from '../../portas/pontuacao';

export interface RegistroPessoal {
  readonly id: string;
  readonly instante: number;
  readonly nota: number;
  readonly origem: string;
  readonly medidas: Nota['medidas'];
}

export const CHAVE_DOS_REGISTROS = 'aue.registros-pessoais.v1';

export function lerRegistros(bruto: string | null): readonly RegistroPessoal[] {
  if (!bruto) return [];
  try {
    const valor: unknown = JSON.parse(bruto);
    if (!Array.isArray(valor)) return [];
    return valor.filter(ehRegistro);
  } catch {
    return [];
  }
}

export function guardarRegistro(registros: readonly RegistroPessoal[], registro: RegistroPessoal): readonly RegistroPessoal[] {
  if (registros.some((item) => item.id === registro.id)) return registros;
  return [registro, ...registros].slice(0, 100);
}

export function meusNumeros(registros: readonly RegistroPessoal[]) {
  if (registros.length === 0) return null;
  const notas = registros.map((registro) => registro.nota);
  const origemMaisUsada = registros.reduce<Record<string, number>>((contagem, registro) => ({ ...contagem, [registro.origem]: (contagem[registro.origem] ?? 0) + 1 }), {});
  return { total: registros.length, melhor: Math.max(...notas), maiorFolego: Math.max(...registros.map((r) => r.medidas.folego)), maisGrave: Math.max(...registros.map((r) => r.medidas.grave)), origemMaisUsada: Object.entries(origemMaisUsada).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null };
}

function ehRegistro(valor: unknown): valor is RegistroPessoal {
  if (!valor || typeof valor !== 'object') return false;
  const registro = valor as Partial<RegistroPessoal>;
  return typeof registro.id === 'string' && typeof registro.instante === 'number' && typeof registro.nota === 'number' && typeof registro.origem === 'string' && !!registro.medidas;
}

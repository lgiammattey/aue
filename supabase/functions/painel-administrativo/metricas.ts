export interface MetricasDeMonetizacao {
  readonly totalImpressoes: number;
  readonly totalCliques: number;
  readonly receitaTotal: number;
  readonly cpmMedio: number;
}

type ItemDaAdsterra = Record<string, unknown>;

function numero(valor: unknown, campo: string): number {
  if (typeof valor !== "number" && (typeof valor !== "string" || valor.trim() === "")) {
    throw new Error(`Métrica Adsterra inválida: ${campo}`);
  }
  const convertido = Number(valor);
  if (!Number.isFinite(convertido) || convertido < 0) {
    throw new Error(`Métrica Adsterra inválida: ${campo}`);
  }
  return convertido;
}

function itensDaResposta(bruto: unknown): readonly ItemDaAdsterra[] {
  if (!bruto || typeof bruto !== "object" || !Array.isArray((bruto as { items?: unknown }).items)) {
    throw new Error("Resposta Adsterra sem items");
  }
  return (bruto as { items: unknown[] }).items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Item de métrica Adsterra inválido");
    }
    return item as ItemDaAdsterra;
  });
}

/**
 * A Publishers API v3 devolve `impression` (singular) em cada item de stats.
 * Um payload incompleto é erro do fornecedor, nunca métrica zero inventada.
 */
export function normalizarMetricasDaAdsterra(bruto: unknown): MetricasDeMonetizacao {
  let totalImpressoes = 0;
  let totalCliques = 0;
  let receitaTotal = 0;
  for (const item of itensDaResposta(bruto)) {
    totalImpressoes += numero(item.impression, "impression");
    totalCliques += numero(item.clicks, "clicks");
    receitaTotal += numero(item.revenue, "revenue");
  }

  return {
    totalImpressoes,
    totalCliques,
    receitaTotal: Number(receitaTotal.toFixed(2)),
    cpmMedio: totalImpressoes > 0 ? Number(((receitaTotal * 1000) / totalImpressoes).toFixed(2)) : 0,
  };
}

export function urlDasEstatisticasDaAdsterra(inicio: string, fim: string): string {
  const consulta = new URLSearchParams({ start_date: inicio, finish_date: fim, group_by: "date" });
  return `https://api3.adsterratools.com/publisher/stats.json?${consulta.toString()}`;
}

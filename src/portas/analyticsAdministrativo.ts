/**
 * Contrato do painel administrativo para ler dados agregados do GA4.
 *
 * STATUS: PENDENTE. Só o contrato e um adaptador que declara "pendente" existem.
 * Nenhum dado do GA4 chega ao painel hoje, e o painel nunca estima nem inventa
 * esses números. Plano e requisitos em `docs/technical/ga4-no-admin.md`.
 *
 * Os dados nunca atravessam o navegador com credencial: a leitura real vai
 * passar por uma função no servidor (segredo fica lá). Esta porta só recebe o
 * agregado já pronto.
 */

export interface FatiaDoAnalytics {
  readonly nome: string;
  readonly sessoes: number;
}

export interface ResumoDoAnalytics {
  readonly inicio: string;
  readonly fim: string;
  /** Origem do tráfego agrupada (zap, busca, direto, outros). */
  readonly origens: readonly FatiaDoAnalytics[];
  /** Categoria de dispositivo (mobile, desktop, tablet). */
  readonly dispositivos: readonly FatiaDoAnalytics[];
  /** Retorno em 1 e 7 dias, 0 a 1. `null` enquanto o GA4 não tiver base suficiente. */
  readonly retornoEmUmDia: number | null;
  readonly retornoEmSeteDias: number | null;
}

/** Lançado quando a conexão com o GA4 ainda não foi feita. Não é falha de rede. */
export class ConexaoComOAnalyticsPendente extends Error {
  constructor() {
    super('A conexão com o GA4 ainda não foi feita.');
    this.name = 'ConexaoComOAnalyticsPendente';
  }
}

export interface PortaDeAnalyticsAdministrativo {
  /** Lê o resumo agregado. Pendente lança `ConexaoComOAnalyticsPendente`; falha real lança outro erro. */
  obterResumo(inicio: string, fim: string): Promise<ResumoDoAnalytics>;
}

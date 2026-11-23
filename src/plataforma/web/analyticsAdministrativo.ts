import {
  ConexaoComOAnalyticsPendente,
  type PortaDeAnalyticsAdministrativo,
} from '../../portas/analyticsAdministrativo';

/**
 * Adaptador PENDENTE. Troca por um adaptador real (função no servidor que lê a
 * Data API do GA4) quando a conexão for aprovada. Até lá, declara pendência em
 * vez de devolver zero, para o painel não fingir medição.
 */
export function criarAnalyticsAdministrativoWeb(): PortaDeAnalyticsAdministrativo {
  return {
    async obterResumo() {
      throw new ConexaoComOAnalyticsPendente();
    },
  };
}

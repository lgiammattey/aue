import { analyzeAudio } from '../../features/audio/engine';
import { calculateScore } from '../../features/audio/rules';
import { julgarSeEhArroto } from '../../features/audio/juiz/julgarSeEhArroto';

/**
 * Diagnóstico local, separado de resultado, ranking e gamificação. A origem
 * não é inferida: os extremos são cenários possíveis da mesma fórmula antiga.
 */
export async function analisarArquivo(arquivo: File) {
  try {
    const veredito = await julgarSeEhArroto(arquivo);
    if (veredito.status !== 'arroto') {
      return { arquivo: arquivo.name, estado: veredito.status, veredito };
    }
    const metricas = await analyzeAudio(arquivo);
    const minimo = calculateScore(metricas, 'Puxei ar').score;
    const maximo = calculateScore(metricas, 'Espontâneo').score;
    // Reescala somente os 90% acústicos para 0–100; é outra régua, não é a
    // nota oficial que a pessoa teria recebido na Arena.
    const notaAcustica = minimo / 0.9;
    return {
      arquivo: arquivo.name,
      estado: 'analisado' as const,
      regua: 'aue-score-v2-legado',
      origem: 'desconhecida',
      nota_acustica_retrospectiva: notaAcustica,
      nota_possivel: { minimo, maximo },
      veredito,
      medidas: { duracao_ativa_s: metricas.activeDuration, forca_rms: metricas.activeRms, proporcao_grave: metricas.bassRatio },
    };
  } catch (erro) {
    return { arquivo: arquivo.name, estado: 'erro' as const, motivo: erro instanceof Error ? erro.message : 'Falha desconhecida.' };
  }
}

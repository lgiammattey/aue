import {
  JANELA_S,
  PASSO_S,
  percentile,
  preencherBuracosCurtos,
  rmsPorQuadro,
} from './trechoAtivo';

/**
 * Régua experimental, ainda sem validação entre aparelhos. Não é dB SPL nem
 * comprovação de que o som foi produzido ao vivo. A mudança de qualquer
 * limiar exige nova versão para não misturar resultados de réguas diferentes.
 */
export const VERSAO_DO_LAUDO_EXPERIMENTAL = 'experimental-2' as const;

const MINIMO_DE_AMBIENTE_S = 0.25;
const MINIMO_DE_EMISSAO_S = 0.1;
const RMS_MINIMO_DE_AMBIENTE = 0.0001; // -80 dBFS: abaixo disso não há referência útil.
const RMS_MAXIMO_DE_AMBIENTE = 0.1; // -20 dBFS: ambiente alto demais para esta régua.
// Limiares provisórios: comparação por janelas de 25 ms / passo de 10 ms.
// Não identificam fala nem garantem ausência de transientes; exigem teste real.
const RAZAO_P90_PARA_MEDIANA_DO_AMBIENTE = 2;
const RAZAO_PICO_PARA_MEDIANA_DO_AMBIENTE = 4;
const RMS_MINIMO_DE_EMISSAO = 0.005;
const DIFERENCA_MINIMA_DB = 6;
const AMPLITUDE_DE_CLIPPING = 0.995;
const FRACAO_DE_CLIPPING_MAXIMA = 0.01;
const DELTA_PARA_SCORE_MAXIMO_DB = 30;
const DURACAO_PARA_SCORE_MAXIMO_S = 2.5;

export type MotivoDeLaudoInconclusivo =
  | 'amostras_invalidas'
  | 'ambiente_insuficiente'
  | 'ambiente_inaudivel'
  | 'ambiente_alto'
  | 'ambiente_instavel'
  | 'emissao_insuficiente'
  | 'clipping';

export type LaudoExperimental =
  | {
      readonly versao: typeof VERSAO_DO_LAUDO_EXPERIMENTAL;
      readonly estado: 'inconclusivo';
      readonly motivo: MotivoDeLaudoInconclusivo;
    }
  | {
      readonly versao: typeof VERSAO_DO_LAUDO_EXPERIMENTAL;
      readonly estado: 'medido';
      /** Maior trecho detectado, em segundos; depende do limiar e das janelas. */
      readonly duracaoAtivaSegundos: number;
      /** Diferença entre energia do trecho ativo e ruído, em dBFS. */
      readonly deltaRmsDb: number;
      /** Régua provisória de 0 a 100, não volume físico nem comparação entre celulares. */
      readonly potenciaRelativa: number;
      /** Nota consolidada de 0 a 100 combinando fôlego e potência do trecho ativo. */
      readonly nota: number;
    };

function inconclusivo(motivo: MotivoDeLaudoInconclusivo): LaudoExperimental {
  return { versao: VERSAO_DO_LAUDO_EXPERIMENTAL, estado: 'inconclusivo', motivo };
}

function rms(amostras: Float32Array): number {
  let soma = 0;
  for (const amostra of amostras) soma += amostra * amostra;
  return Math.sqrt(soma / amostras.length);
}

/**
 * `ambiente` deve ser captado antes da emissão. Os arrays são sinais PCM
 * amostrados na mesma frequência; a decodificação pode produzir valores finitos
 * fora de [-1, 1]. Toda régua é provisória; sinal ruim não vira nota válida.
 */
export function calcularLaudoExperimental(
  ambiente: Float32Array,
  emissao: Float32Array,
  sampleRate: number,
): LaudoExperimental {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 ||
      !ambiente.every(Number.isFinite) ||
      !emissao.every(Number.isFinite)) {
    return inconclusivo('amostras_invalidas');
  }
  if (ambiente.length < MINIMO_DE_AMBIENTE_S * sampleRate) return inconclusivo('ambiente_insuficiente');
  if (emissao.length < MINIMO_DE_EMISSAO_S * sampleRate) return inconclusivo('emissao_insuficiente');

  // Sinal da linha de base também pode estar saturado; não usá-lo como referência.
  const saturadasNoAmbiente = ambiente.reduce((total, valor) => total + (Math.abs(valor) >= AMPLITUDE_DE_CLIPPING ? 1 : 0), 0);
  if (saturadasNoAmbiente / ambiente.length >= FRACAO_DE_CLIPPING_MAXIMA) return inconclusivo('clipping');

  const ruido = rms(ambiente);
  if (ruido < RMS_MINIMO_DE_AMBIENTE) return inconclusivo('ambiente_inaudivel');
  if (ruido > RMS_MAXIMO_DE_AMBIENTE) return inconclusivo('ambiente_alto');

  // Uma fala ou pancada pode caber no RMS médio, contaminando a referência.
  // Percentil 90 pega mudanças sustentadas; pico por janela pega transientes
  // curtos. Nenhum dos dois diz qual foi a fonte ou prova que o ambiente é bom.
  const quadrosAmbiente = rmsPorQuadro(ambiente, sampleRate);
  const medianaAmbiente = percentile(quadrosAmbiente, 0.5);
  const referencia = Math.max(medianaAmbiente, RMS_MINIMO_DE_AMBIENTE);
  const percentil90 = percentile(quadrosAmbiente, 0.9);
  const picoDaJanela = Math.max(...quadrosAmbiente);
  if (percentil90 > referencia * RAZAO_P90_PARA_MEDIANA_DO_AMBIENTE ||
      picoDaJanela > referencia * RAZAO_PICO_PARA_MEDIANA_DO_AMBIENTE) {
    return inconclusivo('ambiente_instavel');
  }

  const quadros = rmsPorQuadro(emissao, sampleRate);
  const limiar = Math.max(RMS_MINIMO_DE_EMISSAO, ruido * 10 ** (DIFERENCA_MINIMA_DB / 20));
  const ativos = quadros.map((valor) => valor >= limiar);
  const unidos = preencherBuracosCurtos(ativos);

  let inicio = 0;
  let melhorInicio = 0;
  let melhorFim = 0;
  while (inicio < unidos.length) {
    if (!unidos[inicio]) {
      inicio++;
      continue;
    }
    let fim = inicio + 1;
    while (fim < unidos.length && unidos[fim]) fim++;
    if (fim - inicio > melhorFim - melhorInicio) {
      melhorInicio = inicio;
      melhorFim = fim;
    }
    inicio = fim;
  }
  if (melhorFim === melhorInicio) return inconclusivo('emissao_insuficiente');

  // Contar apenas o trecho detectado impede silêncio nas bordas de diluir a
  // proporção de amostras saturadas.
  const inicioEmAmostras = Math.round(melhorInicio * PASSO_S * sampleRate);
  const fimEmAmostras = Math.min(emissao.length, Math.round(((melhorFim - 1) * PASSO_S + JANELA_S) * sampleRate));
  let saturadas = 0;
  for (let i = inicioEmAmostras; i < fimEmAmostras; i++) {
    if (Math.abs(emissao[i]) >= AMPLITUDE_DE_CLIPPING) saturadas++;
  }
  if (saturadas / (fimEmAmostras - inicioEmAmostras) >= FRACAO_DE_CLIPPING_MAXIMA) return inconclusivo('clipping');

  const duracao = Math.min(emissao.length / sampleRate, JANELA_S + (melhorFim - melhorInicio - 1) * PASSO_S);
  if (duracao < MINIMO_DE_EMISSAO_S) return inconclusivo('emissao_insuficiente');
  const quadrosAtivos = quadros.slice(melhorInicio, melhorFim).filter((_, i) => ativos[melhorInicio + i]);
  const sinal = percentile(quadrosAtivos, 0.75);
  const deltaRmsDb = 20 * Math.log10(sinal / ruido);
  const potenciaRelativa = Math.round(Math.min(100, Math.max(0, deltaRmsDb / DELTA_PARA_SCORE_MAXIMO_DB * 100)));
  const folegoRelativo = Math.min(100, Math.max(0, ((duracao - MINIMO_DE_EMISSAO_S) / (DURACAO_PARA_SCORE_MAXIMO_S - MINIMO_DE_EMISSAO_S)) * 100));
  const nota = Math.round(Math.min(100, Math.max(0, folegoRelativo * 0.45 + potenciaRelativa * 0.55)));
  return {
    versao: VERSAO_DO_LAUDO_EXPERIMENTAL,
    estado: 'medido',
    duracaoAtivaSegundos: duracao,
    deltaRmsDb,
    potenciaRelativa,
    nota,
  };
}

import { describe, expect, it } from 'vitest';
import { calcularLaudoExperimental } from './laudoExperimental';

const TAXA = 1000;
function tom(segundos: number, amplitude: number): Float32Array {
  return Float32Array.from({ length: segundos * TAXA }, (_, i) => amplitude * Math.sin(2 * Math.PI * 50 * i / TAXA));
}
function juntar(...partes: Float32Array[]): Float32Array {
  const resultado = new Float32Array(partes.reduce((soma, p) => soma + p.length, 0));
  let posicao = 0;
  for (const parte of partes) { resultado.set(parte, posicao); posicao += parte.length; }
  return resultado;
}

const ambiente = () => tom(0.5, 0.01);

describe('laudo experimental', () => {
  it('mede o trecho ativo e diferença de energia sem contar silêncio das bordas', () => {
    const emissao = juntar(new Float32Array(500), tom(1, 0.1), new Float32Array(500));
    const laudo = calcularLaudoExperimental(ambiente(), emissao, TAXA);
    expect(laudo.estado).toBe('medido');
    if (laudo.estado !== 'medido') return;
    expect(laudo.versao).toBe('experimental-2');
    expect(laudo.duracaoAtivaSegundos).toBeCloseTo(1, 1);
    expect(laudo.deltaRmsDb).toBeCloseTo(20, 0);
    expect(laudo.potenciaRelativa).toBeGreaterThanOrEqual(65);
    expect(laudo.potenciaRelativa).toBeLessThanOrEqual(68);
    expect(laudo.nota).toBeGreaterThanOrEqual(0);
    expect(laudo.nota).toBeLessThanOrEqual(100);
    expect(laudo.nota).toBeGreaterThan(40);
  });

  it('descarta silêncio e emissão sem diferença suficiente sobre o ambiente', () => {
    expect(calcularLaudoExperimental(ambiente(), new Float32Array(TAXA), TAXA)).toMatchObject({ estado: 'inconclusivo', motivo: 'emissao_insuficiente' });
    expect(calcularLaudoExperimental(ambiente(), tom(1, 0.015), TAXA)).toMatchObject({ estado: 'inconclusivo', motivo: 'emissao_insuficiente' });
  });

  it('não inventa delta para ambiente mudo nem mede em ambiente alto', () => {
    expect(calcularLaudoExperimental(new Float32Array(500), tom(1, 0.1), TAXA)).toMatchObject({ estado: 'inconclusivo', motivo: 'ambiente_inaudivel' });
    expect(calcularLaudoExperimental(tom(0.5, 0.2), tom(1, 0.4), TAXA)).toMatchObject({ estado: 'inconclusivo', motivo: 'ambiente_alto' });
  });

  it('recusa referência ambiental com transiente curto ou som sustentado', () => {
    const comPancada = ambiente();
    for (let i = 200; i < 210; i++) comPancada[i] += 0.15;
    const comSomSustentado = ambiente();
    for (let i = 180; i < 300; i++) comSomSustentado[i] += 0.06 * Math.sin(2 * Math.PI * 50 * i / TAXA);
    for (const sinal of [comPancada, comSomSustentado]) {
      expect(calcularLaudoExperimental(sinal, tom(1, 0.1), TAXA)).toMatchObject({ estado: 'inconclusivo', motivo: 'ambiente_instavel' });
    }
  });

  it('permite ruído sintético aproximadamente constante como referência', () => {
    let semente = 42;
    const ruido = Float32Array.from({ length: 500 }, () => {
      semente = (1664525 * semente + 1013904223) >>> 0;
      return ((semente / 0xffffffff) * 2 - 1) * 0.01;
    });
    expect(calcularLaudoExperimental(ruido, tom(1, 0.1), TAXA)).toMatchObject({ estado: 'medido' });
  });

  it('não pontua sinal saturado', () => {
    expect(calcularLaudoExperimental(ambiente(), new Float32Array(TAXA).fill(1), TAXA)).toMatchObject({ estado: 'inconclusivo', motivo: 'clipping' });
    const comSilencio = juntar(new Float32Array(5000), new Float32Array(200).fill(1), new Float32Array(5000));
    expect(calcularLaudoExperimental(ambiente(), comSilencio, TAXA)).toMatchObject({ estado: 'inconclusivo', motivo: 'clipping' });
  });

  it('aceita overshoot isolado finito, sem confundi-lo com PCM inválido', () => {
    const emissao = tom(1, 0.1);
    emissao[500] = 1.02;
    expect(calcularLaudoExperimental(ambiente(), emissao, TAXA)).toMatchObject({ estado: 'medido' });
  });

  it('mantém resultado inconclusivo quando o teto se repete, mesmo com overshoot', () => {
    const emissao = new Float32Array(TAXA).fill(1.02);
    expect(calcularLaudoExperimental(ambiente(), emissao, TAXA)).toMatchObject({ estado: 'inconclusivo', motivo: 'clipping' });
    const ruidoSaturado = new Float32Array(500).fill(1.02);
    expect(calcularLaudoExperimental(ruidoSaturado, tom(1, 0.1), TAXA)).toMatchObject({ estado: 'inconclusivo', motivo: 'clipping' });
  });

  it('rejeita amostras inválidas e trechos curtos', () => {
    expect(calcularLaudoExperimental(new Float32Array([NaN]), tom(1, 0.1), TAXA)).toMatchObject({ motivo: 'amostras_invalidas' });
    expect(calcularLaudoExperimental(ambiente(), tom(1, 0.1), 0)).toMatchObject({ motivo: 'amostras_invalidas' });
    expect(calcularLaudoExperimental(tom(0.1, 0.01), tom(1, 0.1), TAXA)).toMatchObject({ motivo: 'ambiente_insuficiente' });
    expect(calcularLaudoExperimental(ambiente(), tom(0.05, 0.1), TAXA)).toMatchObject({ motivo: 'emissao_insuficiente' });
  });

  it('compara com o ambiente da própria captura e limita o índice', () => {
    const baixo = calcularLaudoExperimental(tom(0.5, 0.002), tom(1, 0.1), TAXA);
    const alto = calcularLaudoExperimental(tom(0.5, 0.02), tom(1, 0.1), TAXA);
    if (baixo.estado !== 'medido' || alto.estado !== 'medido') throw new Error('deveria medir');
    expect(baixo.potenciaRelativa).toBe(100);
    expect(alto.potenciaRelativa).toBeLessThan(baixo.potenciaRelativa);
    expect(baixo.nota).toBeLessThanOrEqual(100);
    expect(alto.nota).toBeLessThan(baixo.nota);
  });
});

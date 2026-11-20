import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../features/audio/engine', () => ({ analyzeAudio: vi.fn() }));
vi.mock('../features/audio/juiz/julgarSeEhArroto', () => ({ julgarSeEhArroto: vi.fn() }));
import { analyzeAudio } from '../features/audio/engine';
import { julgarSeEhArroto } from '../features/audio/juiz/julgarSeEhArroto';
import { analisarArquivo } from '../ferramentas/notasRetrospectivas/analise';

describe('análise retrospectiva', () => {
  const arquivo = new File(['som'], 'a.wav', { type: 'audio/wav' });
  beforeEach(() => vi.resetAllMocks());

  it('usa as parciais reais da fórmula antiga e não atribui origem', async () => {
    vi.mocked(julgarSeEhArroto).mockResolvedValue({ status: 'arroto', confianca: 0.9, limiar: 0.2 });
    vi.mocked(analyzeAudio).mockResolvedValue({
      duration: 2, rms: 0.1, bassEnergy: 0.1, texture: 0,
      activeDuration: 1.45, activeRms: 0.115, bassRatio: 0.2,
    });
    const resultado = await analisarArquivo(arquivo);
    expect(resultado.estado).toBe('analisado');
    if (resultado.estado !== 'analisado') throw new Error('Arquivo não analisado');
    expect(resultado.origem).toBe('desconhecida');
    expect(resultado.nota_acustica_retrospectiva).toBeCloseTo(50);
    expect(resultado.nota_possivel.minimo).toBeCloseTo(45);
    expect(resultado.nota_possivel.maximo).toBeCloseTo(55);
  });

  it('não fornece nota quando o detector está indisponível', async () => {
    vi.mocked(julgarSeEhArroto).mockResolvedValue({ status: 'indisponivel', motivo: 'falhou' });
    const resultado = await analisarArquivo(arquivo);
    expect(resultado.estado).toBe('indisponivel');
    expect(resultado).not.toHaveProperty('nota_acustica_retrospectiva');
    expect(analyzeAudio).not.toHaveBeenCalled();
  });
});

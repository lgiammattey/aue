import { describe, expect, it } from 'vitest';
import { normalizarMetricasDaAdsterra, urlDasEstatisticasDaAdsterra } from '../../supabase/functions/painel-administrativo/metricas';

describe('métricas da Publishers API v3 da Adsterra', () => {
  it('soma o campo impression singular documentado pela API', () => {
    expect(normalizarMetricasDaAdsterra({
      items: [
        { impression: 3014, clicks: 175, revenue: 1.154 },
        { impression: '3485', clicks: '155', revenue: '1.379' },
      ],
    })).toEqual({
      totalImpressoes: 6499,
      totalCliques: 330,
      receitaTotal: 2.53,
      cpmMedio: 0.39,
    });
  });

  it('aceita uma coleção vazia, pois ela representa zero legítimo', () => {
    expect(normalizarMetricasDaAdsterra({ items: [] })).toEqual({
      totalImpressoes: 0,
      totalCliques: 0,
      receitaTotal: 0,
      cpmMedio: 0,
    });
  });

  it('rejeita payload ausente e itens ou campos inválidos', () => {
    expect(() => normalizarMetricasDaAdsterra(undefined)).toThrow('items');
    expect(() => normalizarMetricasDaAdsterra({ items: [null] })).toThrow('Item');
    expect(() => normalizarMetricasDaAdsterra({ items: [{}] })).toThrow('impression');
    expect(() => normalizarMetricasDaAdsterra({ items: [{ impression: -1, clicks: 1, revenue: 1 }] })).toThrow('impression');
    expect(() => normalizarMetricasDaAdsterra({ items: [{ impression: null, clicks: 1, revenue: 1 }] })).toThrow('impression');
    expect(() => normalizarMetricasDaAdsterra({ items: [{ impression: '', clicks: 1, revenue: 1 }] })).toThrow('impression');
    expect(() => normalizarMetricasDaAdsterra({ items: [{ impression: false, clicks: 1, revenue: 1 }] })).toThrow('impression');
  });

  it('pede agrupamento por data, exigido pela Publishers API', () => {
    expect(urlDasEstatisticasDaAdsterra('2026-10-01', '2026-10-22')).toBe(
      'https://api3.adsterratools.com/publisher/stats.json?start_date=2026-10-01&finish_date=2026-10-22&group_by=date',
    );
  });
});

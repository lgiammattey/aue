import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const invoke = vi.fn();

vi.mock('../../db/supabase', () => ({
  configuracaoAusente: null,
  supabase: { rpc: (...args: unknown[]) => rpc(...args), functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

const { criarAdministracaoWeb } = await import('./administracao');

beforeEach(() => { rpc.mockReset(); invoke.mockReset(); });

describe('administração web', () => {
  it('consulta somente a RPC agregada, com o período pedido', async () => {
    rpc.mockResolvedValue({
      data: {
        periodo: { inicio: '2026-10-01', fim: '2026-10-20' },
        resumo: { total_contas_de_email_atual: 12, cadastros_acompanhados_no_periodo: 2, acompanhamento_de_cadastros_iniciado_em: '2026-10-20T16:39:54Z', perfis_concluidos_no_periodo: 1, perfis_pendentes_atuais: 1, eventos: { abriu_arena: 9 } },
        eventos_por_dia: [{ data: '2026-10-20', abriu_arena: 2 }],
        pessoas: [{ apelido: 'Luiz', handle: 'luiz', criado_em: '2026-10-20T10:00:00Z', perfil_social_concluido_em: null, estado: 'ficha_pendente' }],
      },
      error: null,
    });

    await expect(criarAdministracaoWeb().obterResumo('2026-10-01', '2026-10-20')).resolves.toMatchObject({
      totalContasDeEmailAtual: 12,
      cadastrosNoPeriodo: 2,
      eventos: { abriu_arena: 9 },
      pessoas: [{ apelido: 'Luiz', handle: 'luiz', estado: 'ficha_pendente' }],
    });
    expect(rpc).toHaveBeenCalledWith('painel_administrativo_resumo', {
      p_inicio: '2026-10-01',
      p_fim: '2026-10-20',
    });
  });

  it('recusa resposta sem o contrato mínimo e preserva erro de autorização do servidor', async () => {
    rpc.mockResolvedValueOnce({ data: {}, error: null });
    await expect(criarAdministracaoWeb().obterResumo()).rejects.toThrow('Resposta administrativa inválida.');

    const negado = new Error('Acesso administrativo negado');
    rpc.mockResolvedValueOnce({ data: null, error: negado });
    await expect(criarAdministracaoWeb().obterResumo()).rejects.toBe(negado);
  });

  it('não aceita pessoas ou dias malformados como dados do painel', async () => {
    rpc.mockResolvedValue({
      data: {
        periodo: { inicio: '2026-10-20', fim: '2026-10-20' },
        resumo: {},
        eventos_por_dia: [{ abriu_arena: 99 }],
        pessoas: [{ apelido: 'vaza', handle: 'nao', estado: 'perfil_pronto' }],
      },
      error: null,
    });

    await expect(criarAdministracaoWeb().obterResumo()).resolves.toMatchObject({
      eventosPorDia: [],
      pessoas: [],
    });
  });

  it('lê monetização apenas pela função administrativa e recusa contrato incompleto', async () => {
    invoke.mockResolvedValueOnce({ data: { ok: true, monetizacao: { inicio: '2026-10-01', fim: '2026-10-20', total_impressoes: 100, total_cliques: 3, receita_total: 0.2, cpm_medio: 2 } }, error: null });
    await expect(criarAdministracaoWeb().obterMonetizacao()).resolves.toMatchObject({ totalImpressoes: 100, receitaTotal: 0.2 });
    expect(invoke).toHaveBeenCalledWith('painel-administrativo');

    invoke.mockResolvedValueOnce({ data: { ok: false }, error: null });
    await expect(criarAdministracaoWeb().obterMonetizacao()).rejects.toThrow('Métricas de monetização indisponíveis.');
  });
});

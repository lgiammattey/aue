// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortaDeAdministracao } from '../../portas/administracao';
import { TelaAdministracao } from './TelaAdministracao';

describe('TelaAdministracao', () => {
  afterEach(cleanup);

  it('mostra apenas os dados agregados e a lista mínima entregue pela porta', async () => {
    const porta: PortaDeAdministracao = {
      obterResumo: vi.fn(async () => ({
        inicio: '2026-10-01', fim: '2026-10-20', totalContasDeEmailAtual: 18, acompanhamentoDeCadastrosIniciadoEm: '2026-10-01', cadastrosNoPeriodo: 12,
        perfisConcluidosNoPeriodo: 8, perfisPendentesAtuais: 2,
        eventos: { abriu_arena: 10, recebeu_nota: 5 },
        eventosPorDia: [{ data: '2026-10-20', abriuArena: 4, iniciouArroto: 3, recebeuNota: 2, compartilhou: 1, criouX1: 0, respondeuX1: 0, pediuRevanche: 0 }],
        pessoas: [{ apelido: 'Luiz', handle: 'luiz', criadoEm: '2026-10-20T12:00:00Z', perfilSocialConcluidoEm: null, estado: 'ficha_pendente' as const }],
      })),
      obterMonetizacao: vi.fn(async () => ({ inicio: '2026-10-01', fim: '2026-10-20', totalImpressoes: 123, totalCliques: 4, receitaTotal: 1.2, cpmMedio: 0.8 })),
    };
    render(<TelaAdministracao porta={porta} />);
    expect(await screen.findByRole('heading', { name: 'Como está a roda' })).toBeTruthy();
    expect(screen.getByText('Contas de e-mail')).toBeTruthy();
    expect(screen.getByText('Cadastros acompanhados')).toBeTruthy();
    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    expect(screen.getByText('@luiz')).toBeTruthy();
    expect(screen.getAllByText('0', { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getByText(/sessões, não pessoas únicas/)).toBeTruthy();
    expect(screen.getByText('Monetização')).toBeTruthy();
    expect(await screen.findByText('Receita estimada')).toBeTruthy();
  });

  it('não diferencia acesso negado de falha e não exibe dados anteriores', async () => {
    const porta: PortaDeAdministracao = { obterResumo: vi.fn(async () => { throw new Error('negado'); }), obterMonetizacao: vi.fn() };
    render(<TelaAdministracao porta={porta} />);
    expect(await screen.findByRole('heading', { name: 'Esta página não está disponível agora.' })).toBeTruthy();
    expect(screen.queryByText('Cadastros')).toBeNull();
    await waitFor(() => expect(porta.obterResumo).toHaveBeenCalledOnce());
  });
});

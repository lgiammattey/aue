// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortaDeAdministracao, ResumoAdministrativo } from '../../portas/administracao';
import { TelaAdministracao } from './TelaAdministracao';

function portaComResumo(alteracoes: Partial<ResumoAdministrativo> = {}): PortaDeAdministracao {
  return {
    obterResumo: vi.fn(async () => ({
      inicio: '2026-10-01', fim: '2026-10-22', totalContasDeEmailAtual: 0, contasAnonimasAtuais: 0,
      contasAtivasNoPeriodo: 0, cadastrosNoPeriodo: 0, acompanhamentoDeCadastrosIniciadoEm: null,
      perfisConcluidosNoPeriodo: 0, perfisPendentesAtuais: 0, topicosPublicadosNoPeriodo: 0,
      respostasPublicadasNoPeriodo: 0, comunidadesAtivasNoPeriodo: 0, acessosDePaginasNoPeriodo: 0,
      acompanhamentoDeAcessosIniciadoEm: '2026-10-22T12:00:00Z', eventos: {}, eventosPorDia: [],
      acessosPorPagina: [], pessoas: [], ...alteracoes,
    })),
    obterMonetizacao: vi.fn(async () => { throw new Error('indisponível'); }),
  };
}

describe('TelaAdministracao', () => {
  afterEach(cleanup);

  it('distingue período sem acessos de coleta indisponível, sem alegar publicação pendente', async () => {
    const tela = render(<TelaAdministracao porta={portaComResumo()} />);
    expect(await screen.findByText('Nenhum acesso registrado neste período.')).toBeTruthy();
    expect(screen.queryByText(/quando esta versão estiver publicada/)).toBeNull();
    tela.unmount();
    render(<TelaAdministracao porta={portaComResumo({ acompanhamentoDeAcessosIniciadoEm: null })} />);
    expect(await screen.findByText('A coleta de acessos ainda não está disponível.')).toBeTruthy();
  });

  it.each([30, 90])('preserva a atividade de todos os %i dias ao agrupar barras', async (quantidade) => {
    const dias = Array.from({ length: quantidade }, (_, indice) => ({
      data: new Date(Date.UTC(2026, 7, indice + 1)).toISOString().slice(0, 10),
      acessosDePaginas: 1, abriuArena: 2, iniciouArroto: 0, recebeuNota: 0, compartilhou: 0,
      criouX1: 0, respondeuX1: 0, pediuRevanche: 0, topicosPublicados: 3, respostasPublicadas: 4,
    }));
    render(<TelaAdministracao porta={portaComResumo({ eventosPorDia: dias })} />);
    const grafico = await screen.findByRole('img', { name: 'Atividade no período: Arena, acessos de página, tópicos e respostas' });
    const barras = [...grafico.querySelectorAll('.admin-grafico__dia')];
    expect(barras.length).toBeLessThanOrEqual(14);
    const totais = barras.reduce((soma, barra) => {
      const numeros = [...barra.getAttribute('title')!.matchAll(/· ([\d.]+) /g)].map((numero) => Number(numero[1].replaceAll('.', '')));
      return soma.map((valor, indice) => valor + numeros[indice]);
    }, [0, 0, 0, 0]);
    expect(totais).toEqual([quantidade * 2, quantidade, quantidade * 3, quantidade * 4]);
  });

  it('limita a barra do funil sem esconder contagens acima da base', async () => {
    render(<TelaAdministracao porta={portaComResumo({ eventos: { abriu_arena: 1, recebeu_nota: 3 } })} />);
    const funil = await screen.findByRole('img', { name: 'Funil da Arena: 1 aberturas, 3 notas e 0 movimentos em X1' });
    expect(funil.querySelectorAll<HTMLElement>('.admin-funil__barra')[1].style.width).toBe('100%');
    expect(screen.getByText('300% da abertura')).toBeTruthy();
    expect(screen.getByText('Concluídos no período')).toBeTruthy();
  });

  it('mantém o período mais recente quando uma consulta antiga responde por último', async () => {
    const porta = portaComResumo();
    const base = await porta.obterResumo();
    let concluirConsultaAntiga!: (resumo: ResumoAdministrativo) => void;
    porta.obterResumo = vi.fn().mockResolvedValueOnce(base)
      .mockImplementationOnce(() => new Promise<ResumoAdministrativo>((resolve) => { concluirConsultaAntiga = resolve; }))
      .mockResolvedValueOnce({ ...base, inicio: '2026-07-25', fim: '2026-10-22', acessosDePaginasNoPeriodo: 42 });
    render(<TelaAdministracao porta={porta} />);
    await screen.findByRole('heading', { name: 'O pulso do Auê' });
    fireEvent.click(screen.getByRole('button', { name: '7d' }));
    fireEvent.click(screen.getByRole('button', { name: '90d' }));
    await screen.findByText('42');
    await act(async () => { concluirConsultaAntiga({ ...base, acessosDePaginasNoPeriodo: 99 }); });
    await waitFor(() => expect(screen.queryByText('99')).toBeNull());
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('mostra apenas os dados agregados e a lista mínima entregue pela porta', async () => {
    const porta: PortaDeAdministracao = {
      obterResumo: vi.fn(async () => ({
        inicio: '2026-10-01', fim: '2026-10-20', totalContasDeEmailAtual: 18, contasAnonimasAtuais: 3, contasAtivasNoPeriodo: 10, acompanhamentoDeCadastrosIniciadoEm: '2026-10-01', cadastrosNoPeriodo: 12,
        perfisConcluidosNoPeriodo: 8, perfisPendentesAtuais: 2,
        topicosPublicadosNoPeriodo: 6, respostasPublicadasNoPeriodo: 9, comunidadesAtivasNoPeriodo: 2,
        acessosDePaginasNoPeriodo: 19, acompanhamentoDeAcessosIniciadoEm: '2026-10-22T12:00:00Z',
        acessosPorPagina: [{ pagina: 'comunidade', acessos: 7 }],
        eventos: { abriu_arena: 10, recebeu_nota: 5 },
        eventosPorDia: [{ data: '2026-10-20', acessosDePaginas: 2, abriuArena: 4, iniciouArroto: 3, recebeuNota: 2, compartilhou: 1, criouX1: 0, respondeuX1: 0, pediuRevanche: 0, topicosPublicados: 1, respostasPublicadas: 2 }],
        pessoas: [{ apelido: 'Luiz', handle: 'luiz', criadoEm: '2026-10-20T12:00:00Z', perfilSocialConcluidoEm: null, estado: 'ficha_pendente' as const }],
      })),
      obterMonetizacao: vi.fn(async () => ({ inicio: '2026-10-01', fim: '2026-10-20', totalImpressoes: 123, totalCliques: 4, receitaTotal: 1.2, cpmMedio: 0.8 })),
    };
    render(<TelaAdministracao porta={porta} />);
    expect(await screen.findByRole('heading', { name: 'O pulso do Auê' })).toBeTruthy();
    expect(screen.getByText('Acessos de página')).toBeTruthy();
    expect(screen.getByText('Tópicos publicados')).toBeTruthy();
    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    expect(screen.getByText('@luiz')).toBeTruthy();
    expect(screen.getAllByText('0', { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Não mede pessoas únicas nem retenção/)).toBeTruthy();
    expect(screen.getByText('Anúncios')).toBeTruthy();
    expect(await screen.findByText('Receita estimada')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '7d' }));
    await waitFor(() => expect(porta.obterResumo).toHaveBeenCalledTimes(2));
  });

  it('não diferencia acesso negado de falha e não exibe dados anteriores', async () => {
    const porta: PortaDeAdministracao = { obterResumo: vi.fn(async () => { throw new Error('negado'); }), obterMonetizacao: vi.fn() };
    render(<TelaAdministracao porta={porta} />);
    expect(await screen.findByRole('heading', { name: 'Este painel não está disponível agora.' })).toBeTruthy();
    expect(screen.queryByText('Cadastros')).toBeNull();
    await waitFor(() => expect(porta.obterResumo).toHaveBeenCalledOnce());
  });
});

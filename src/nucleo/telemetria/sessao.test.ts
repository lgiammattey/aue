import { describe, expect, it } from 'vitest';

import { DURACAO_DA_SESSAO_MS, comAbriuArenaRegistrada, comPaginaVisitada, decidirSessao, jaVisitouPagina } from './sessao';
import type { SessaoDeTelemetria } from './sessao';

const AQUISICAO_TIKTOK = { origem: 'tiktok', campanha: 'duvido_bater_01', conteudo: null };
const AQUISICAO_DIRETA = { origem: 'direct', campanha: null, conteudo: null };

function gerarId() {
  let n = 0;
  return () => `sessao-${++n}`;
}

describe('decidirSessao', () => {
  it('sem sessão guardada, cria uma nova com a aquisição atual', () => {
    const sessao = decidirSessao({
      guardada: null,
      agora: 1000,
      aquisicaoAtual: AQUISICAO_TIKTOK,
      gerarId: gerarId(),
    });

    expect(sessao).toEqual({
      id: 'sessao-1',
      origem: 'tiktok',
      campanha: 'duvido_bater_01',
      conteudo: null,
      expiraEm: 1000 + DURACAO_DA_SESSAO_MS,
      abriuArenaRegistrada: false,
      paginasVisitadas: [],
      paginasConfirmadas: [],
    });
  });

  it('reaproveita id e origem enquanto a sessão guardada não expirou', () => {
    const guardada: SessaoDeTelemetria = {
      id: 'sessao-original',
      origem: 'tiktok',
      campanha: 'duvido_bater_01',
      conteudo: null,
      expiraEm: 5000,
      abriuArenaRegistrada: true,
      paginasVisitadas: [],
    };

    // Aquisição atual É DIFERENTE — simula abrir um link interno com outro ?src=.
    const sessao = decidirSessao({
      guardada,
      agora: 4000,
      aquisicaoAtual: AQUISICAO_DIRETA,
      gerarId: gerarId(),
    });

    expect(sessao.id).toBe('sessao-original');
  });

  it('NÃO sobrescreve a origem original por causa de navegação dentro do jogo', () => {
    const guardada: SessaoDeTelemetria = {
      id: 'sessao-original',
      origem: 'tiktok',
      campanha: 'duvido_bater_01',
      conteudo: 'video_03',
      expiraEm: 5000,
      abriuArenaRegistrada: false,
      paginasVisitadas: [],
    };

    const sessao = decidirSessao({
      guardada,
      agora: 4000,
      aquisicaoAtual: AQUISICAO_DIRETA,
      gerarId: gerarId(),
    });

    expect(sessao.origem).toBe('tiktok');
    expect(sessao.campanha).toBe('duvido_bater_01');
    expect(sessao.conteudo).toBe('video_03');
  });

  it('desliza o prazo da sessão reaproveitada', () => {
    const guardada: SessaoDeTelemetria = {
      id: 'sessao-original',
      origem: 'direct',
      campanha: null,
      conteudo: null,
      expiraEm: 5000,
      abriuArenaRegistrada: false,
      paginasVisitadas: [],
    };

    const sessao = decidirSessao({
      guardada,
      agora: 4000,
      aquisicaoAtual: AQUISICAO_DIRETA,
      gerarId: gerarId(),
    });

    expect(sessao.expiraEm).toBe(4000 + DURACAO_DA_SESSAO_MS);
  });

  it('sessão vencida abre outra, com id novo e a aquisição de agora', () => {
    const vencida: SessaoDeTelemetria = {
      id: 'sessao-velha',
      origem: 'tiktok',
      campanha: null,
      conteudo: null,
      expiraEm: 999,
      abriuArenaRegistrada: true,
      paginasVisitadas: [],
    };

    const sessao = decidirSessao({
      guardada: vencida,
      agora: 1000,
      aquisicaoAtual: AQUISICAO_DIRETA,
      gerarId: gerarId(),
    });

    expect(sessao.id).toBe('sessao-1');
    expect(sessao.origem).toBe('direct');
    expect(sessao.abriuArenaRegistrada).toBe(false);
  });

  it('sessão exatamente no limite (expiraEm === agora) conta como vencida', () => {
    const noLimite: SessaoDeTelemetria = {
      id: 'sessao-velha',
      origem: 'tiktok',
      campanha: null,
      conteudo: null,
      expiraEm: 1000,
      abriuArenaRegistrada: false,
      paginasVisitadas: [],
    };

    const sessao = decidirSessao({
      guardada: noLimite,
      agora: 1000,
      aquisicaoAtual: AQUISICAO_DIRETA,
      gerarId: gerarId(),
    });

    expect(sessao.id).toBe('sessao-1');
  });
});

describe('comAbriuArenaRegistrada', () => {
  it('marca a sessão sem mexer em mais nada', () => {
    const sessao: SessaoDeTelemetria = {
      id: 'sessao-1',
      origem: 'direct',
      campanha: null,
      conteudo: null,
      expiraEm: 1000,
      abriuArenaRegistrada: false,
      paginasVisitadas: [],
    };

    expect(comAbriuArenaRegistrada(sessao)).toEqual({ ...sessao, abriuArenaRegistrada: true });
  });
});

describe('páginas visitadas', () => {
  const sessao: SessaoDeTelemetria = {
    id: 'sessao-1', origem: 'direct', campanha: null, conteudo: null,
    expiraEm: 1000, abriuArenaRegistrada: false, paginasVisitadas: [],
  };

  it('marca uma categoria sem guardar caminho e não a duplica', () => {
    const marcada = comPaginaVisitada(sessao, 'comunidade');
    expect(marcada.paginasVisitadas).toEqual(['comunidade']);
    expect(jaVisitouPagina(marcada, 'comunidade')).toBe(true);
    expect(comPaginaVisitada(marcada, 'comunidade')).toBe(marcada);
  });
});

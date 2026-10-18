import { describe, expect, it } from 'vitest';
import { ROTEIRO } from '../../../scripts/elenco-burpzilla/dados';
import { SORTEIO } from '../../../scripts/elenco-burpzilla/sorteio.gerado';
import { podeAplicar } from './podeAplicar';
import { validarElenco } from './validacao';
import type { Roteiro } from './tipos';

const AUTORIZACAO_COMPLETA = '# Autorização\n\nquem: fulano\ndata: 18/10/2026\n';

/** O roteiro como ficaria no dia em que tudo estivesse resolvido. */
const ROTEIRO_RESOLVIDO: Roteiro = {
  ...ROTEIRO,
  posts: ROTEIRO.posts.map((p, i) => (p.audio === 'AUDIO_PENDENTE' ? { ...p, audio: { arquivo: `${i}_file.ogg` } } : p)),
  comentarios: ROTEIRO.comentarios.map((c) => ({ ...c, pendenteAvalAutor: false })),
};
const SORTEIO_APROVADO = { ...SORTEIO, status: 'APROVADO' } as const;

describe('validação do elenco', () => {
  it('o roteiro e o sorteio do repositório passam', () => {
    expect(validarElenco(ROTEIRO, SORTEIO)).toEqual([]);
  });

  it('pega post fora da janela, autor sem conta e comentário órfão', () => {
    const quebrado: Roteiro = {
      ...ROTEIRO,
      posts: [
        { ...ROTEIRO.posts[0], quando: '2026-08-27T23:59' },
        { ...ROTEIRO.posts[1], autor: 'giam' },
        { ...ROTEIRO.posts[2], autor: 'lucas' as 'giam' },
      ],
      comentarios: [{ ...ROTEIRO.comentarios[0], postChave: 'p99' }],
    };
    const erros = validarElenco(quebrado, SORTEIO).join('\n');
    expect(erros).toContain('fora da janela');
    expect(erros).toContain('"lucas" não tem conta fixa');
    expect(erros).toContain('p99');
  });

  it('o pool não aceita o nome da squad que é do rival', () => {
    const erros = validarElenco({ ...ROTEIRO, poolDeAgentes: [...ROTEIRO.poolDeAgentes, 'Lucas'] }, SORTEIO);
    expect(erros.join('\n')).toContain('"lucas"');
  });

  it('pega agente repetido no sorteio e agente fora do pool', () => {
    const repetido = { ...SORTEIO, agentes: { ...SORTEIO.agentes, B: SORTEIO.agentes.A } };
    expect(validarElenco(ROTEIRO, repetido).join('\n')).toContain('repetiu');
    const fora = { ...SORTEIO, agentes: { ...SORTEIO.agentes, B: 'fulano' } };
    expect(validarElenco(ROTEIRO, fora).join('\n')).toContain('não está no pool');
  });

  it('pega comentário sem atraso no sorteio', () => {
    const { c01: _c01, ...resto } = SORTEIO.atrasosEmMinutos;
    expect(validarElenco(ROTEIRO, { ...SORTEIO, atrasosEmMinutos: resto }).join('\n')).toContain('c01');
  });

  it('arquivo de áudio com caminho ou extensão errada não passa', () => {
    const p = { ...ROTEIRO.posts[0], audio: { arquivo: '../fora.ogg' } };
    expect(validarElenco({ ...ROTEIRO, posts: [p, ...ROTEIRO.posts.slice(1)] }, SORTEIO).join('\n')).toContain('inválido');
  });
});

describe('podeAplicar', () => {
  it('hoje está travado, e diz por quê', () => {
    const v = podeAplicar({ roteiro: ROTEIRO, sorteio: SORTEIO, autorizacao: null });
    expect(v.pode).toBe(false);
    const texto = v.bloqueios.join('\n');
    expect(texto).not.toContain('PENDENTE_REVISAO');
    expect(texto).not.toContain('áudio sem escolha');
    expect(texto).toContain('aval do autor: c02, c04');
    expect(texto).toContain('autorizacao-dos-audios.md não existe');
  });

  it('abre quando tudo está resolvido', () => {
    const v = podeAplicar({ roteiro: ROTEIRO_RESOLVIDO, sorteio: SORTEIO_APROVADO, autorizacao: AUTORIZACAO_COMPLETA });
    expect(v).toEqual({ pode: true, bloqueios: [] });
  });

  it.each([
    ['sorteio sem revisão', { sorteio: { ...SORTEIO, status: 'PENDENTE_REVISAO' } as const }],
    ['autorização com campo PENDENTE', { autorizacao: 'quem autorizou: PENDENTE' }],
    ['autorização ausente', { autorizacao: null }],
    ['áudio sem escolha', { roteiro: ROTEIRO }],
  ])('uma coisa só basta para travar: %s', (_nome, troca) => {
    const base = { roteiro: ROTEIRO_RESOLVIDO, sorteio: SORTEIO_APROVADO, autorizacao: AUTORIZACAO_COMPLETA };
    expect(podeAplicar({ ...base, ...troca }).pode).toBe(false);
  });

  it('comentário esperando aval do autor trava', () => {
    const r: Roteiro = { ...ROTEIRO_RESOLVIDO, comentarios: ROTEIRO.comentarios };
    expect(podeAplicar({ roteiro: r, sorteio: SORTEIO_APROVADO, autorizacao: AUTORIZACAO_COMPLETA }).pode).toBe(false);
  });

  it('a autorização que está no repositório não tem mais campo PENDENTE', async () => {
    const { readFileSync } = await import('node:fs');
    const registro = readFileSync(
      new URL('../../../docs/historias/burpzilla/autorizacao-dos-audios.md', import.meta.url),
      'utf8',
    );
    expect(podeAplicar({ roteiro: ROTEIRO_RESOLVIDO, sorteio: SORTEIO_APROVADO, autorizacao: registro }).pode).toBe(true);
  });
});

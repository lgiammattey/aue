import { describe, expect, it } from 'vitest';
import { mulberry32, sortear } from './sorteio';
import { montarElenco } from './montagem';
import { dentroDaJanela } from './horario';
import type { Roteiro } from './tipos';

const ROTEIRO_DE_TESTE: Roteiro = {
  comunidadeSlug: 'eu-arroto-e-dai',
  contasFixas: [{ handle: 'giam', apelido: 'Giam', bio: 'x' }],
  poolDeAgentes: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'],
  bioDosAgentes: 'y',
  posts: [
    { chave: 'p1', autor: 'giam', quando: '2026-09-01T10:00', texto: 'um', audio: null },
    { chave: 'p2', autor: 'giam', quando: '2026-10-15T23:30', texto: 'dois', audio: null },
  ],
  comentarios: [
    { chave: 'c1', postChave: 'p1', agente: 'A', texto: 'a' },
    { chave: 'c2', postChave: 'p1', agente: 'B', texto: 'b' },
    { chave: 'c3', postChave: 'p2', agente: 'C', texto: 'c' },
    { chave: 'c4', postChave: 'p2', agente: 'A', texto: 'd' },
  ],
};

describe('mulberry32', () => {
  it('é determinístico e fica em [0, 1)', () => {
    const a = mulberry32(20261018);
    const b = mulberry32(20261018);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('sementes diferentes dão sequências diferentes', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('sorteio do elenco', () => {
  it('a mesma semente dá o mesmo sorteio', () => {
    expect(sortear(ROTEIRO_DE_TESTE, 20261018)).toEqual(sortear(ROTEIRO_DE_TESTE, 20261018));
  });

  it('nasce pendente de revisão e com a semente registrada', () => {
    const s = sortear(ROTEIRO_DE_TESTE, 7);
    expect(s.status).toBe('PENDENTE_REVISAO');
    expect(s.semente).toBe(7);
  });

  it('rótulos usados viram agentes distintos do pool; os não usados ficam vazios', () => {
    for (let semente = 1; semente <= 200; semente++) {
      const s = sortear(ROTEIRO_DE_TESTE, semente);
      const usados = [s.agentes.A, s.agentes.B, s.agentes.C];
      expect(new Set(usados).size).toBe(3);
      for (const nome of usados) expect(ROTEIRO_DE_TESTE.poolDeAgentes).toContain(nome);
      expect(s.agentes.D).toBe('');
      expect(s.agentes.E).toBe('');
    }
  });

  it('todo comentário tem atraso inteiro e positivo, e nunca passa do fim da janela', () => {
    for (let semente = 1; semente <= 300; semente++) {
      const s = sortear(ROTEIRO_DE_TESTE, semente);
      const montado = montarElenco(ROTEIRO_DE_TESTE, s);
      for (const c of ROTEIRO_DE_TESTE.comentarios) {
        const atraso = s.atrasosEmMinutos[c.chave];
        expect(Number.isInteger(atraso)).toBe(true);
        expect(atraso).toBeGreaterThanOrEqual(1);
      }
      for (const c of montado.comentarios) expect(dentroDaJanela(c.criadoEm)).toBe(true);
    }
  });

  it('o pool original não é embaralhado no lugar', () => {
    const antes = [...ROTEIRO_DE_TESTE.poolDeAgentes];
    sortear(ROTEIRO_DE_TESTE, 3);
    expect(ROTEIRO_DE_TESTE.poolDeAgentes).toEqual(antes);
  });

  it('pool menor que os rótulos usados é erro, não sorteio pela metade', () => {
    expect(() => sortear({ ...ROTEIRO_DE_TESTE, poolDeAgentes: ['a1', 'a2'] }, 1)).toThrow(/pool/);
  });
});

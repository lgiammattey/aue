import { describe, expect, it } from 'vitest';
import { ROTEIRO } from '../../../scripts/elenco-burpzilla/dados';
import { SORTEIO } from '../../../scripts/elenco-burpzilla/sorteio.gerado';
import { brasiliaParaUtc, dentroDaJanela, JANELA_DA_CASA } from './horario';
import { DOMINIO_INTERNO, idDaConta, montarElenco } from './montagem';

const elenco = montarElenco(ROTEIRO, SORTEIO);

describe('montagem do elenco', () => {
  it('é idempotente: montar de novo dá os mesmos ids e as mesmas datas', () => {
    expect(montarElenco(ROTEIRO, SORTEIO)).toEqual(elenco);
  });

  it('ids de conta, post e comentário são únicos e estáveis', () => {
    const ids = [...elenco.contas, ...elenco.posts, ...elenco.comentarios].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(idDaConta('giam')).toBe(elenco.contas.find((c) => c.handle === 'giam')?.id);
    // Fixa um id de verdade: se o espaço de nomes ou o esquema de nomes mudar, tudo duplica no banco.
    expect(idDaConta('giam')).toBe('aa51d822-1796-5b51-835b-45c6a3fcf8b5');
  });

  it('cada post carrega o horário do cronograma convertido para UTC', () => {
    const p01 = elenco.posts.find((p) => p.chave === 'p01');
    expect(p01?.criadoEm).toBe('2026-09-02T02:12:00.000Z');
    expect(elenco.posts).toHaveLength(22);
  });

  it('não existe um horário único para o lote', () => {
    expect(new Set(elenco.posts.map((p) => p.criadoEm)).size).toBe(elenco.posts.length);
  });

  it('todos os posts e comentários caem dentro da janela', () => {
    for (const x of [...elenco.posts, ...elenco.comentarios]) expect(dentroDaJanela(x.criadoEm), x.chave).toBe(true);
  });

  it('comentário sai depois do post pai', () => {
    for (const c of elenco.comentarios) {
      const pai = elenco.posts.find((p) => p.id === c.postId);
      expect(Date.parse(c.criadoEm)).toBeGreaterThan(Date.parse(pai?.criadoEm ?? ''));
    }
  });

  it('o feed ordena como o cronograma: por data, e o id desempata', () => {
    const ordenado = [...elenco.posts].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm) || a.id.localeCompare(b.id));
    expect(ordenado[0].chave).toBe('p22');
    expect(ordenado.at(-1)?.chave).toBe('p01');
  });

  it('as contas: giam, lima e os 5 agentes sorteados, nenhuma com o nome da squad que é do rival', () => {
    expect(elenco.contas).toHaveLength(7);
    expect(elenco.contas.filter((c) => c.papel === 'personagem').map((c) => c.handle)).toEqual(['giam', 'lima']);
    expect(elenco.contas.filter((c) => c.papel === 'agente')).toHaveLength(5);
    for (const c of elenco.contas) {
      for (const campo of [c.handle, c.apelido, c.email, c.bio]) expect(campo.toLowerCase()).not.toContain('lucas');
      expect(c.email.endsWith(`@${DOMINIO_INTERNO}`)).toBe(true);
    }
  });

  it('a bio dos personagens é a combinada', () => {
    for (const handle of ['giam', 'lima']) {
      expect(elenco.contas.find((c) => c.handle === handle)?.bio).toBe('personagem da casa, Burpzilla');
    }
  });

  it('a conta nasce depois do primeiro deploy e antes da primeira atividade', () => {
    for (const c of elenco.contas) {
      expect(Date.parse(c.criadoEm)).toBeGreaterThanOrEqual(Date.parse(JANELA_DA_CASA.inicioUtc));
      const atividades = [
        ...elenco.posts.filter((p) => p.autorId === c.id).map((p) => p.criadoEm),
        ...elenco.comentarios.filter((x) => x.autorId === c.id).map((x) => x.criadoEm),
      ];
      expect(atividades.length).toBeGreaterThan(0);
      expect(Date.parse(c.criadoEm)).toBeLessThan(Math.min(...atividades.map((a) => Date.parse(a))));
    }
    expect(elenco.contas.find((c) => c.handle === 'lima')?.criadoEm).toBe(
      new Date(Date.parse(brasiliaParaUtc('2026-09-01T23:12')) - 3_600_000).toISOString(),
    );
  });

  it('só os 6 comentários do cronograma existem: nem todo post ganha comentário', () => {
    expect(elenco.comentarios).toHaveLength(6);
    const comentados = new Set(elenco.comentarios.map((c) => c.postId));
    expect(comentados.size).toBeLessThan(elenco.posts.length / 2);
  });

  it('post sem áudio não ganha caminho; post com áudio ganha o caminho do bucket', () => {
    for (const p of elenco.posts) {
      if (p.audio === null) expect(p.caminhoDoAudio).toBeNull();
      else expect(p.caminhoDoAudio).toBe(`burpzilla/${p.id}.m4a`);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { semEspelhosDeCausos } from './semEspelhos';
import type { ItemDoFeed } from './tipos';

const item = (id: string, tipo: 'topico' | 'causo', autorHandle: string | undefined, criadoEm: string): ItemDoFeed => ({
  id, tipo, comunidadeSlug: 'eu-arroto-e-dai', titulo: id, corpo: '', autorNome: 'A', autorHandle, criadoEm, respostasTotal: 0,
});

describe('semEspelhosDeCausos', () => {
  it('fica a cópia de causo e sai o tópico espelho (mesmo autor e mesmo instante)', () => {
    const r = semEspelhosDeCausos([
      item('topico-1', 'topico', 'giam', '2026-10-11T12:00:00.123456+00:00'),
      item('causo-1', 'causo', 'giam', '2026-10-11T12:00:00.123Z'),
    ]);
    expect(r.map((i) => i.id)).toEqual(['causo-1']);
  });

  it('tópico de verdade (sem causo por trás) nunca é tocado', () => {
    const r = semEspelhosDeCausos([
      item('topico-nativo', 'topico', 'giam', '2026-10-20T10:00:00Z'),
      item('causo-1', 'causo', 'giam', '2026-10-11T12:00:00Z'),
    ]);
    expect(r.map((i) => i.id)).toEqual(['topico-nativo', 'causo-1']);
  });

  it('mesmo instante com autor diferente não casa; handle compara sem caixa', () => {
    const r = semEspelhosDeCausos([
      item('topico-a', 'topico', 'ana', '2026-10-11T12:00:00Z'),
      item('topico-b', 'topico', 'GIAM', '2026-10-11T12:00:00Z'),
      item('causo-1', 'causo', 'giam', '2026-10-11T12:00:00Z'),
    ]);
    expect(r.map((i) => i.id)).toEqual(['topico-a', 'causo-1']);
  });

  it('sem handle ou com data inválida, não arrisca: mantém os dois', () => {
    const r = semEspelhosDeCausos([
      item('topico-1', 'topico', undefined, '2026-10-11T12:00:00Z'),
      item('causo-1', 'causo', undefined, '2026-10-11T12:00:00Z'),
      item('topico-2', 'topico', 'giam', 'data ruim'),
      item('causo-2', 'causo', 'giam', 'data ruim'),
    ]);
    expect(r).toHaveLength(4);
  });

  it('lista sem causos volta igual, e a ordem se mantém', () => {
    const lista = [item('topico-1', 'topico', 'giam', '2026-10-11T12:00:00Z'), item('topico-2', 'topico', 'ana', '2026-10-12T12:00:00Z')];
    expect(semEspelhosDeCausos(lista)).toEqual(lista);
  });
});

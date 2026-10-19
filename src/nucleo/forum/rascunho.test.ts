import { beforeEach, describe, expect, it } from 'vitest';
import type { ArmazenamentoLocal } from '../../portas/armazenamento';
import { chaveDoRascunhoDeResposta, chaveDoRascunhoDeTopico } from '../../portas/armazenamento';
import {
  apagarRascunho,
  esquecerRascunhosDaSessao,
  guardarRascunhoDeResposta,
  guardarRascunhoDeTopico,
  lerRascunhoDeResposta,
  lerRascunhoDeTopico,
} from './rascunho';

function disco(barrado = false) {
  const dados = new Map<string, string>();
  const a: ArmazenamentoLocal & { dados: Map<string, string> } = {
    dados,
    ler: (c) => (barrado ? null : (dados.get(c) ?? null)),
    gravar: (c, v) => {
      if (barrado) return false;
      dados.set(c, v);
      return true;
    },
    apagar: (c) => {
      if (!barrado) dados.delete(c);
    },
  };
  return a;
}

beforeEach(esquecerRascunhosDaSessao);

describe('chaves', () => {
  it('uma por comunidade, uma por tópico e pai, versionadas', () => {
    expect(chaveDoRascunhoDeTopico('u1', 'bonde-geral')).toBe('aue.forum.rascunho-topico.u1.bonde-geral.v1');
    expect(chaveDoRascunhoDeResposta('u1', 't1', null)).toBe('aue.forum.rascunho-resposta.u1.t1.topo.v1');
    expect(chaveDoRascunhoDeResposta('u1', 't1', 'r9')).toBe('aue.forum.rascunho-resposta.u1.t1.r9.v1')
    expect(chaveDoRascunhoDeTopico('u1', 'x')).not.toBe(chaveDoRascunhoDeTopico('u2', 'x'));
    expect(chaveDoRascunhoDeResposta('u1', 't', null)).not.toBe(chaveDoRascunhoDeResposta('u2', 't', null));
    expect(chaveDoRascunhoDeTopico('u', 'a')).not.toBe(chaveDoRascunhoDeTopico('u', 'b'));
  });
});

describe('rascunho de tópico', () => {
  it('guarda e lê de volta pela porta de armazenamento', () => {
    const a = disco();
    const c = chaveDoRascunhoDeTopico('u1', 'x');
    guardarRascunhoDeTopico(a, c, { titulo: 'oi', corpo: 'texto' });
    expect(a.dados.has(c)).toBe(true);
    esquecerRascunhosDaSessao(); // recarregou a página: só o disco sobrou
    expect(lerRascunhoDeTopico(a, c)).toEqual({ titulo: 'oi', corpo: 'texto' });
  });

  it('vazio não guarda lixo: apaga a chave', () => {
    const a = disco();
    const c = chaveDoRascunhoDeTopico('u1', 'x');
    guardarRascunhoDeTopico(a, c, { titulo: 'oi', corpo: '' });
    guardarRascunhoDeTopico(a, c, { titulo: '', corpo: '' });
    expect(a.dados.has(c)).toBe(false);
    expect(lerRascunhoDeTopico(a, c)).toBeNull();
  });

  it('armazenamento barrado (aba privada do Safari): nunca lança e o texto vive na memória da sessão', () => {
    const a = disco(true);
    const c = chaveDoRascunhoDeTopico('u1', 'x');
    expect(() => guardarRascunhoDeTopico(a, c, { titulo: 'a', corpo: 'b' })).not.toThrow();
    expect(lerRascunhoDeTopico(a, c)).toEqual({ titulo: 'a', corpo: 'b' });
  });

  it('apagar de verdade: a memória não ressuscita o texto', () => {
    const a = disco();
    const c = chaveDoRascunhoDeTopico('u1', 'x');
    guardarRascunhoDeTopico(a, c, { titulo: 'a', corpo: 'b' });
    apagarRascunho(a, c);
    expect(lerRascunhoDeTopico(a, c)).toBeNull();
    esquecerRascunhosDaSessao();
    expect(lerRascunhoDeTopico(a, c)).toBeNull();
  });

  it('valor corrompido, de outro formato ou enorme é ignorado, não quebra', () => {
    const a = disco();
    const c = chaveDoRascunhoDeTopico('u1', 'x');
    for (const lixo of ['{', 'null', '"texto"', '{"titulo":1,"corpo":2}', JSON.stringify({ titulo: 'a', corpo: 'x'.repeat(7000) })]) {
      a.dados.set(c, lixo);
      expect(lerRascunhoDeTopico(a, c)).toBeNull();
    }
  });
});

describe('rascunho de resposta', () => {
  it('é por tópico e por pai: não mistura o texto de um com o de outro', () => {
    const a = disco();
    guardarRascunhoDeResposta(a, chaveDoRascunhoDeResposta('u1', 't1', null), 'no tópico');
    guardarRascunhoDeResposta(a, chaveDoRascunhoDeResposta('u1', 't1', 'r1'), 'na resposta');
    expect(lerRascunhoDeResposta(a, chaveDoRascunhoDeResposta('u1', 't1', null))).toBe('no tópico');
    expect(lerRascunhoDeResposta(a, chaveDoRascunhoDeResposta('u1', 't1', 'r1'))).toBe('na resposta');
    expect(lerRascunhoDeResposta(a, chaveDoRascunhoDeResposta('u1', 't2', null))).toBe('');
  });

  it('texto vazio apaga; lixo vira vazio', () => {
    const a = disco();
    const c = chaveDoRascunhoDeResposta('u1', 't1', null);
    guardarRascunhoDeResposta(a, c, 'abc');
    guardarRascunhoDeResposta(a, c, '');
    expect(a.dados.has(c)).toBe(false);
    a.dados.set(c, 'não é json');
    esquecerRascunhosDaSessao();
    expect(lerRascunhoDeResposta(a, c)).toBe('');
  });
});

// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { guardarRascunhoDeResposta, guardarRascunhoDeTopico, lerRascunhoDeTopico } from '../../nucleo/forum/rascunho';
import { chaveDoRascunhoDeResposta, chaveDoRascunhoDeTopico } from '../../portas/armazenamento';
import { criarArmazenamentoWeb } from './armazenamento';
import { limparDadosLocaisDaConta } from './perfil';

beforeEach(() => localStorage.clear());

describe('sair() esquece os rascunhos do fórum', () => {
  it('apaga do armazenamento tudo que começa com aue.forum. (de qualquer conta) e a memória da sessão, e deixa o resto', () => {
    const arm = criarArmazenamentoWeb();
    const ct = chaveDoRascunhoDeTopico('conta-a', 'bonde-geral');
    guardarRascunhoDeTopico(arm, ct, { titulo: 'Segredo', corpo: 'texto' });
    guardarRascunhoDeResposta(arm, chaveDoRascunhoDeResposta('conta-a', 't1', null), 'resposta');
    localStorage.setItem('bda-theme', 'dark');
    expect(localStorage.getItem(ct)).not.toBeNull();

    limparDadosLocaisDaConta();

    expect(Object.keys(localStorage).filter((k) => k.startsWith('aue.forum.'))).toEqual([]);
    expect(lerRascunhoDeTopico(arm, ct)).toBeNull(); // nem pela memória
    expect(localStorage.getItem('bda-theme')).toBe('dark');
  });
});

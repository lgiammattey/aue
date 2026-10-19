import { describe, expect, it } from 'vitest';
import {
  horarioCompleto,
  juntarPorId,
  metaDeComunidade,
  metaDeTopico,
  monograma,
  montarArvoreDeRespostas,
  nomeDoAutor,
  normalizarQuebras,
  numeroPtBr,
  ordenarComunidades,
  tempoRelativo,
  textoDeMembros,
  textoDeRespostas,
  textoDeTopicos,
  urlDeImagemSegura,
} from './apresentacao';

const AGORA = new Date(2026, 9, 19, 15, 0, 0).getTime();
const atras = (ms: number) => new Date(AGORA - ms).toISOString();
const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;

describe('tempoRelativo', () => {
  it('segue a tabela da spec', () => {
    expect(tempoRelativo(atras(20_000), AGORA)).toBe('agora');
    expect(tempoRelativo(atras(5 * MIN), AGORA)).toBe('há 5 min');
    expect(tempoRelativo(atras(3 * H), AGORA)).toBe('há 3 h');
    expect(tempoRelativo(atras(2 * D), AGORA)).toBe('há 2 d');
    expect(tempoRelativo(new Date(2026, 9, 5, 12).toISOString(), AGORA)).toBe('5 out');
    expect(tempoRelativo(new Date(2025, 9, 12, 12).toISOString(), AGORA)).toBe('12 out 2025');
  });

  it('data ilegível não inventa tempo', () => {
    expect(tempoRelativo('ontem', AGORA)).toBe('');
  });
});

describe('horarioCompleto', () => {
  it('escreve dia/mês/ano hora:minuto', () => {
    expect(horarioCompleto(new Date(2026, 9, 19, 14, 32).toISOString())).toBe('19/10/2026 14:32');
  });
});

describe('números e plurais', () => {
  it('zero, um e N, com milhar por ponto e sem abreviar', () => {
    expect(textoDeTopicos(0)).toBe('Nenhum tópico ainda');
    expect(textoDeTopicos(1)).toBe('1 tópico');
    expect(textoDeTopicos(1234)).toBe('1.234 tópicos');
    expect(textoDeMembros(0)).toBe('Nenhum membro ainda');
    expect(textoDeMembros(1)).toBe('1 membro');
    expect(textoDeMembros(48200)).toBe('48.200 membros');
    expect(textoDeRespostas(0)).toBe('Sem respostas');
    expect(textoDeRespostas(1)).toBe('1 resposta');
    expect(textoDeRespostas(8)).toBe('8 respostas');
    expect(numeroPtBr(0)).toBe('0');
  });
});

describe('monograma', () => {
  it('ignora artigos e sinais', () => {
    expect(monograma('Refri & Cia')).toBe('RC');
    expect(monograma('Na reunião da firma')).toBe('RF');
    expect(monograma('Eu arroto, e daí?')).toBe('EA');
    expect(monograma('Bonde')).toBe('BO');
    expect(monograma('')).toBe('?');
  });
});

describe('meta', () => {
  it('tópico com respostas usa a atividade; sem respostas usa a criação', () => {
    const base = { autorNome: 'Ana Souza', criadoEm: atras(3 * D), ultimaAtividadeEm: atras(3 * H) };
    expect(metaDeTopico({ ...base, respostasTotal: 8 }, AGORA)).toBe('Ana Souza · 8 respostas · atividade há 3 h');
    expect(metaDeTopico({ ...base, respostasTotal: 0 }, AGORA)).toBe('Ana Souza · Sem respostas · há 3 d');
  });

  it('comunidade sem tópico não fala em atividade', () => {
    expect(metaDeComunidade({ topicosTotal: 0, membrosTotal: 3, ultimaAtividadeEm: null }, AGORA)).toBe(
      'Nenhum tópico ainda · 3 membros',
    );
    expect(metaDeComunidade({ topicosTotal: 12, membrosTotal: 34, ultimaAtividadeEm: atras(2 * H) }, AGORA)).toBe(
      '12 tópicos · 34 membros · atividade há 2 h',
    );
  });
});

describe('ordenarComunidades', () => {
  it('mais viva primeiro, sem tópico por último, empate por nome', () => {
    const lista = [
      { nome: 'Zeta', ultimaAtividadeEm: null },
      { nome: 'Beta', ultimaAtividadeEm: atras(5 * H) },
      { nome: 'Alfa', ultimaAtividadeEm: null },
      { nome: 'Gama', ultimaAtividadeEm: atras(1 * H) },
    ];
    expect(ordenarComunidades(lista).map((c) => c.nome)).toEqual(['Gama', 'Beta', 'Alfa', 'Zeta']);
  });
});

describe('texto', () => {
  it('normaliza quebras só na exibição', () => {
    expect(normalizarQuebras('a\n\n\n\nb\r\n\r\n\r\nc')).toBe('a\n\nb\n\nc');
  });
});

describe('juntarPorId', () => {
  it('não duplica nem reordena o que já estava', () => {
    const { itens, adicionados } = juntarPorId([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }, { id: 'c' }]);
    expect(itens.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(adicionados.map((i) => i.id)).toEqual(['c']);
  });
});

describe('montarArvoreDeRespostas', () => {
  it('encadeia por pai e sobe órfã para a raiz', () => {
    const arvore = montarArvoreDeRespostas([
      { id: '1', paiId: null },
      { id: '2', paiId: '1' },
      { id: '3', paiId: '2' },
      { id: '4', paiId: 'sumiu' },
    ]);
    expect(arvore.map((n) => n.resposta.id)).toEqual(['1', '4']);
    expect(arvore[0].filhas[0].resposta.id).toBe('2');
    expect(arvore[0].filhas[0].filhas[0].resposta.id).toBe('3');
  });
});

describe('urlDeImagemSegura', () => {
  it('só deixa passar http e https', () => {
    expect(urlDeImagemSegura('https://exemplo.com/a.png')).toBe('https://exemplo.com/a.png');
    expect(urlDeImagemSegura('javascript:alert(1)')).toBeNull();
    expect(urlDeImagemSegura('data:image/png;base64,AAAA')).toBeNull();
    expect(urlDeImagemSegura('não é url')).toBeNull();
    expect(urlDeImagemSegura(null)).toBeNull();
  });
});

describe('nomeDoAutor', () => {
  it('apelido, depois @, depois nada', () => {
    expect(nomeDoAutor({ apelido: ' Ana ', handle: 'ana' })).toBe('Ana');
    expect(nomeDoAutor({ apelido: null, handle: 'ana' })).toBe('@ana');
    expect(nomeDoAutor({ apelido: null, handle: null })).toBe('');
    expect(nomeDoAutor(null)).toBe('');
  });
});

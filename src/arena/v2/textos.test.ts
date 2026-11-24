import { describe, expect, it } from 'vitest';
import { TEXTOS_DA_ARENA, idiomaDoCaminho, type Idioma } from './textos';

/** Junta todo texto do dicionário, chamando as funções com argumentos de exemplo. */
function todosOsTextos(idioma: Idioma): string[] {
  const achados: string[] = [];
  const visitar = (valor: unknown): void => {
    if (typeof valor === 'string') achados.push(valor);
    else if (typeof valor === 'function') {
      const f = valor as (...args: unknown[]) => unknown;
      // Cada função espera um tipo de argumento (texto, número ou booleano). Tenta os três.
      for (const argumentos of [['exemplo', 'outro'], [7], [1.5], [true], [false]]) {
        try {
          const texto = f(...argumentos);
          if (typeof texto === 'string') achados.push(texto);
        } catch { /* esse tipo de argumento não serve para esta função */ }
      }
    } else if (Array.isArray(valor)) valor.forEach(visitar);
    else if (valor && typeof valor === 'object') Object.values(valor).forEach(visitar);
  };
  visitar(TEXTOS_DA_ARENA[idioma]);
  return achados;
}

/** As chaves, em ordem, com `.` entre os níveis. As funções contam como uma chave. */
function chaves(valor: unknown, prefixo = ''): string[] {
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    return Object.entries(valor).flatMap(([k, v]) => chaves(v, prefixo ? `${prefixo}.${k}` : k));
  }
  return [prefixo];
}

describe('textos da Arena v2', () => {
  it('português e inglês têm exatamente as mesmas chaves', () => {
    expect(chaves(TEXTOS_DA_ARENA.en)).toEqual(chaves(TEXTOS_DA_ARENA.pt));
  });

  it('nenhum texto em inglês fica vazio, e o inglês não repete o português por esquecimento', () => {
    const pt = TEXTOS_DA_ARENA.pt as unknown as Record<string, unknown>;
    const en = TEXTOS_DA_ARENA.en as unknown as Record<string, unknown>;
    const iguais = (a: unknown, b: unknown, caminho: string): string[] => {
      if (typeof a === 'string' && typeof b === 'string') {
        // Estas três são iguais nos dois idiomas de propósito.
        if (['beta', 'cabecalho.itens'].includes(caminho)) return [];
        return a === b && a.trim().length > 0 ? [caminho] : [];
      }
      if (a && b && typeof a === 'object' && typeof b === 'object') {
        return Object.keys(a).flatMap((k) =>
          iguais((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], caminho ? `${caminho}.${k}` : k));
      }
      return [];
    };
    expect(iguais(pt, en, '')).toEqual([]);
    for (const texto of todosOsTextos('en')) expect(texto.trim().length).toBeGreaterThan(0);
  });

  it('o inglês não deixa passar palavra em português', () => {
    const portugues = /\b(não|você|para|com|arroto|gravação|tentar|nota do|aparelho|navegador|microfone|ouve|solta|grava)\b/i;
    for (const texto of todosOsTextos('en')) {
      expect(texto, `texto em inglês parece português: ${texto}`).not.toMatch(portugues);
    }
  });

  it('nenhum texto, em nenhum idioma, promete medidor, ciência ou decibel como medida', () => {
    for (const idioma of ['pt', 'en'] as const) {
      for (const texto of todosOsTextos(idioma)) {
        expect(texto, texto).not.toMatch(/\b(burp meter|medidor|scientific|cient[ií]fic|official score|accurate)\b/i);
        // "decibel" só aparece para dizer que a nota NÃO é decibel.
        if (/decibel/i.test(texto)) expect(texto, texto).toMatch(/(not decibels|não é decibel)/i);
      }
    }
  });

  it('o inglês não tem travessão nem emoji, como manda a VOZ', () => {
    for (const texto of todosOsTextos('en')) {
      expect(texto, texto).not.toMatch(/[—–]/);
      expect(texto, texto).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('em inglês não há atalho para telas que só existem em português', () => {
    expect(TEXTOS_DA_ARENA.en.telaCheia).toBeNull();
    expect(TEXTOS_DA_ARENA.en.cabecalho.itens).toEqual([]);
    for (const item of TEXTOS_DA_ARENA.en.rodape) expect(item.rotulo).toMatch(/in Portuguese/);
  });

  it('o idioma segue a rota', () => {
    expect(idiomaDoCaminho('/')).toBe('pt');
    expect(idiomaDoCaminho('/en')).toBe('en');
    expect(idiomaDoCaminho('/en/')).toBe('en');
    expect(idiomaDoCaminho('/en/how-to-burp')).toBe('en');
    expect(idiomaDoCaminho('/entrar')).toBe('pt');
    expect(idiomaDoCaminho('/ranking-de-arrotos')).toBe('pt');
  });

  it('o formato de número segue o idioma: vírgula em português, ponto em inglês', () => {
    expect(TEXTOS_DA_ARENA.pt.laudo.duracaoValor(2.5)).toBe('2,50 s');
    expect(TEXTOS_DA_ARENA.en.laudo.duracaoValor(2.5)).toBe('2.50 s');
  });
});

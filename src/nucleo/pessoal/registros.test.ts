import { describe, expect, it } from 'vitest';
import { guardarRegistro, lerRegistros, meusNumeros } from './registros';

const registro = { id: '1', instante: 1, nota: 80, origem: 'Casa', medidas: { forca: 80, folego: 70, grave: 60, sujeira: 0, estouro: 0 } };

describe('registros pessoais', () => {
  it('ignora armazenamento corrompido', () => expect(lerRegistros('{não é json')).toEqual([]));
  it('não duplica a mesma nota concluída', () => expect(guardarRegistro([registro], registro)).toEqual([registro]));
  it('agrega só o que foi salvo neste aparelho', () => expect(meusNumeros([registro, { ...registro, id: '2', nota: 100 }])).toMatchObject({ total: 2, melhor: 100, maiorFolego: 70, maisGrave: 60, origemMaisUsada: 'Casa' }));
});

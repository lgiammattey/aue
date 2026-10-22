import { describe, expect, it } from 'vitest';
import { extrairHandlesMencionados } from './mencoes';

describe('extrairHandlesMencionados', () => {
  it('normaliza e não repete handles válidos', () => {
    expect(extrairHandlesMencionados('Chama @Giam e @giam. Depois @ze_do_eco!')).toEqual(['giam', 'ze_do_eco']);
  });

  it('não trata e-mail nem handle curto como marcação', () => {
    expect(extrairHandlesMencionados('oi@teste.com @ab @valido_')).toEqual(['valido_']);
  });
});

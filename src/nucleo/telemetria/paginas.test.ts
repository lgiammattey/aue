import { describe, expect, it } from 'vitest';

import { paginaMonitoradaDoCaminho } from './paginas';

describe('paginaMonitoradaDoCaminho', () => {
  it.each([
    ['/', 'feed'],
    ['/seguindo', 'feed'],
    ['/comunidades', 'comunidades'],
    ['/c/eu-arroto-e-dai', 'comunidade'],
    ['/c/eu-arroto-e-dai/novo', 'comunidade'],
    ['/c/eu-arroto-e-dai/t/00000000-0000-0000-0000-000000000001', 'topico'],
    ['/explorar', 'explorar'],
    ['/arena', 'arena'],
    ['/b/ABCDEFGHJK', 'arena'],
    ['/u/giammz', 'perfil'],
    ['/login', 'entrada'],
    ['/como-jogar', 'publica'],
  ] as const)('resume %s em %s', (caminho, esperado) => {
    expect(paginaMonitoradaDoCaminho(caminho)).toBe(esperado);
  });

  it('não acompanha o painel, caminhos desconhecidos, ids ou parâmetros', () => {
    expect(paginaMonitoradaDoCaminho('/admin')).toBeNull();
    expect(paginaMonitoradaDoCaminho('/nao-existe')).toBeNull();
    expect(paginaMonitoradaDoCaminho('/c/eu-arroto-e-dai/t/')).toBeNull();
  });
});

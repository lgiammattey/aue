import { describe, expect, it } from 'vitest';

import { COMUNIDADES_PADRAO, obterComunidadePorSlug } from './comunidadesPadrao';

describe('Comunidades padrão do Auê 3.0', () => {
  it('contém a comunidade raiz "Eu arroto, e daí?"', () => {
    const raiz = obterComunidadePorSlug('eu-arroto-e-dai');
    expect(raiz).toBeDefined();
    expect(raiz?.nome).toBe('Eu arroto, e daí?');
    expect(raiz?.icone).toBe('🦍');
  });

  it('encontra a comunidade de vídeos pelo slug usado no feed', () => {
    expect(obterComunidadePorSlug('arrotos-youtube')?.nome).toBe('Arrotos no YouTube');
  });

  it('todas as comunidades têm slug, nome e ícone válidos', () => {
    expect(COMUNIDADES_PADRAO.length).toBeGreaterThanOrEqual(4);
    for (const comu of COMUNIDADES_PADRAO) {
      expect(comu.id).toBeTruthy();
      expect(comu.slug).toMatch(/^[a-z0-9-]+$/);
      expect(comu.nome.length).toBeGreaterThan(3);
      expect(comu.descricao.length).toBeGreaterThan(10);
      expect(comu.icone).toBeTruthy();
    }
  });

  it('retorna undefined para slug inexistente', () => {
    expect(obterComunidadePorSlug('slug-inexistente')).toBeUndefined();
  });
});

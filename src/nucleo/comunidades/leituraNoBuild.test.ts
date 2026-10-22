import { afterEach, describe, expect, it, vi } from 'vitest';

import { lerComunidadesPublicas } from '../../../scripts/comunidades-do-supabase.js';

describe('leitura estática das comunidades', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa a RPC pública, sem furar a RLS da tabela de comunidades', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          { slug: 'grupos-whatsapp', nome: 'Grupos WhatsApp', descricao: 'Links oficiais.' },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(lerComunidadesPublicas('https://aue.test', 'chave-publica')).resolves.toEqual([
      { slug: 'grupos-whatsapp', nome: 'Grupos WhatsApp', descricao: 'Links oficiais.' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://aue.test/rest/v1/rpc/listar_comunidades_do_forum',
      expect.objectContaining({ method: 'POST', body: '{}' }),
    );
  });

  it('não transforma uma falha de leitura em diretório vazio', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));

    await expect(lerComunidadesPublicas('https://aue.test', 'chave-publica')).resolves.toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('../../db/supabase', () => ({
  configuracaoAusente: null,
  supabase: { rpc: (...a: unknown[]) => rpc(...a) },
}));
vi.mock('../../shared/auth/sessaoAnonima', () => ({
  garantirSessao: vi.fn(async () => ({ user: { id: 'eu' } })),
}));

import { criarPerfilRemoto } from './perfilRemoto';

describe('obterPerfil: inexistente não é falha', () => {
  beforeEach(() => {
    rpc.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('servidor respondeu vazio: devolve null (perfil não existe)', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await expect(criarPerfilRemoto().obterPerfil('fantasma')).resolves.toBeNull();
  });

  it('servidor devolveu erro: lança, para a tela não dizer que não existe', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('timeout') });
    await expect(criarPerfilRemoto().obterPerfil('betao')).rejects.toThrow('timeout');
  });
});

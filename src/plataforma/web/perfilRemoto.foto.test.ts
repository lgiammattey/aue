import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const upload = vi.fn();
const remove = vi.fn();
vi.mock('../../db/supabase', () => ({
  configuracaoAusente: null,
  supabase: {
    rpc: (...a: unknown[]) => rpc(...a),
    storage: {
      from: () => ({
        upload: (...a: unknown[]) => upload(...a),
        remove: (...a: unknown[]) => remove(...a),
        getPublicUrl: (c: string) => ({ data: { publicUrl: `https://x.supabase.co/storage/v1/object/public/avatars/${c}` } }),
      }),
    },
  },
}));
vi.mock('../../shared/auth/sessaoAnonima', () => ({
  garantirSessao: vi.fn(async () => ({ user: { id: 'eu' } })),
}));
vi.mock('./imagem', () => ({
  prepararImagemDePerfil: vi.fn(async () => ({ ok: true, imagem: new Blob(['jpg']), dimensoes: { largura: 512, altura: 512 } })),
}));

import { criarPerfilRemoto } from './perfilRemoto';

const foto = new Blob(['x'], { type: 'image/jpeg' });

describe('enviarFoto: recusa por permissão vira motivo honesto', () => {
  beforeEach(() => {
    rpc.mockReset(); upload.mockReset(); remove.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('Storage recusa (conta não promovida): semConta, sem chamar o RPC', async () => {
    upload.mockResolvedValue({ error: { statusCode: '403', message: 'new row violates row-level security policy' } });
    await expect(criarPerfilRemoto().enviarFoto(foto)).resolves.toEqual({ ok: false, motivo: 'semConta' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('RPC recusa com 42501: semConta, não "falhou"', async () => {
    upload.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'Ação social exige conta promovida' } });
    await expect(criarPerfilRemoto().enviarFoto(foto)).resolves.toEqual({ ok: false, motivo: 'semConta' });
  });

  it('falha de rede continua sendo falhou', async () => {
    upload.mockResolvedValue({ error: new Error('Failed to fetch') });
    await expect(criarPerfilRemoto().enviarFoto(foto)).resolves.toEqual({ ok: false, motivo: 'falhou' });
  });

  it('caminho feliz: sobe na pasta do usuário e grava a URL com ?v=', async () => {
    upload.mockResolvedValue({ error: null });
    rpc.mockImplementation(async (nome: string) =>
      nome === 'atualizar_meu_perfil' ? { data: {}, error: null } : { data: null, error: null });
    await criarPerfilRemoto().enviarFoto(foto);
    expect(upload.mock.calls[0]?.[0]).toBe('eu/avatar.jpg');
    const args = rpc.mock.calls.find((c) => c[0] === 'atualizar_meu_perfil')?.[1] as { p_url_do_avatar: string };
    expect(args.p_url_do_avatar).toMatch(/\/avatars\/eu\/avatar\.jpg\?v=\d+$/);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
const updateUser = vi.fn();
const signUp = vi.fn();
const signInWithPassword = vi.fn();
const rpc = vi.fn();

vi.mock('../../db/supabase', () => ({
  configuracaoAusente: null,
  supabase: {
    auth: {
      getSession: (...a: unknown[]) => getSession(...a),
      updateUser: (...a: unknown[]) => updateUser(...a),
      signUp: (...a: unknown[]) => signUp(...a),
      signInWithPassword: (...a: unknown[]) => signInWithPassword(...a),
      resetPasswordForEmail: vi.fn(async () => ({ error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    rpc: (...a: unknown[]) => rpc(...a),
  },
  updateProfile: vi.fn(async () => ({})),
}));

import { criarContaWeb } from './conta';

beforeEach(() => {
  [getSession, updateUser, signUp, signInWithPassword, rpc].forEach((f) => f.mockReset());
  rpc.mockResolvedValue({ error: null });
});

describe('conta: cadastro por e-mail e senha', () => {
  it('sessão anônima é PROMOVIDA (updateUser), nunca duplicada com signUp', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'anon-1', is_anonymous: true } } } });
    updateUser.mockResolvedValue({ error: null });

    const r = await criarContaWeb().cadastrar({ email: ' a@b.com ', senha: 'senhaboa123', apelido: 'Betão' });

    expect(updateUser).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'senhaboa123',
      data: { apelido: 'Betão' },
    });
    expect(signUp).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith('atualizar_meu_perfil', { p_apelido: 'Betão' });
    expect(r).toEqual({ ok: true, aviso: 'confirmeNoEmail' });
  });

  it('sem sessão anônima usa signUp', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    signUp.mockResolvedValue({ data: { user: { id: 'u' }, session: null }, error: null });
    const r = await criarContaWeb().cadastrar({ email: 'a@b.com', senha: 'senhaboa123', apelido: 'Zé' });
    expect(signUp).toHaveBeenCalled();
    expect(r).toEqual({ ok: true, aviso: 'confirmeNoEmail' });
  });

  it('valida antes de ir ao servidor', async () => {
    expect(await criarContaWeb().cadastrar({ email: 'ruim', senha: 'senhaboa123', apelido: 'Zé' })).toEqual({ ok: false, motivo: 'emailInvalido' });
    expect(await criarContaWeb().cadastrar({ email: 'a@b.com', senha: '1234567', apelido: 'Zé' })).toEqual({ ok: false, motivo: 'senhaFraca' });
    expect(getSession).not.toHaveBeenCalled();
  });

  it('traduz e-mail já cadastrado e senha errada', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'a', is_anonymous: true } } } });
    updateUser.mockResolvedValue({ error: { message: 'A user with this email address has already been registered' } });
    expect(await criarContaWeb().cadastrar({ email: 'a@b.com', senha: 'senhaboa123', apelido: 'Zé' })).toEqual({ ok: false, motivo: 'emailEmUso' });

    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    expect(await criarContaWeb().entrar('a@b.com', 'errada123')).toEqual({ ok: false, motivo: 'credenciaisInvalidas' });
  });
});

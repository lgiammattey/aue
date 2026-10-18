// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
const updateUser = vi.fn();
const signUp = vi.fn();
const signInWithPassword = vi.fn();
const rpc = vi.fn();
const signOut = vi.fn();

vi.mock('../../db/supabase', () => ({
  configuracaoAusente: null,
  supabase: {
    auth: {
      getSession: (...a: unknown[]) => getSession(...a),
      updateUser: (...a: unknown[]) => updateUser(...a),
      signUp: (...a: unknown[]) => signUp(...a),
      signInWithPassword: (...a: unknown[]) => signInWithPassword(...a),
      resetPasswordForEmail: vi.fn(async () => ({ error: null })),
      signOut: (...a: unknown[]) => signOut(...a),
    },
    rpc: (...a: unknown[]) => rpc(...a),
  },
  updateProfile: vi.fn(async () => ({})),
}));

import { criarContaWeb } from './conta';

beforeEach(() => {
  [getSession, updateUser, signUp, signInWithPassword, rpc, signOut].forEach((f) => f.mockReset());
  rpc.mockResolvedValue({ error: null });
});

describe('conta: cadastro por e-mail e senha', () => {
  it('sessão anônima é PROMOVIDA (updateUser), nunca duplicada com signUp', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'anon-1', is_anonymous: true } } } });
    updateUser.mockResolvedValue({ error: null });

    const r = await criarContaWeb().cadastrar({
      email: ' a@b.com ',
      senha: 'senhaboa123',
      apelido: 'Betão',
      handle: '@Betao_TI',
    });

    expect(updateUser).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'senhaboa123',
      data: { apelido: 'Betão' },
    });
    expect(signUp).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith('atualizar_meu_perfil', { p_apelido: 'Betão', p_handle: 'betao_ti' });
    expect(r).toEqual({ ok: true, aviso: 'confirmeNoEmail' });
  });

  it('@ que já é de outra pessoa: nada muda na conta e a tela pede outro', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'anon-1', is_anonymous: true } } } });
    rpc.mockResolvedValue({ error: { code: '23505', message: 'Esse handle já é de outra pessoa' } });
    const r = await criarContaWeb().cadastrar({ email: 'a@b.com', senha: 'senhaboa123', apelido: 'Zé', handle: 'ze_ti' });
    expect(r).toEqual({ ok: false, motivo: 'handleEmUso' });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('@ fora da regra do banco nem chega ao servidor', async () => {
    const r = await criarContaWeb().cadastrar({ email: 'a@b.com', senha: 'senhaboa123', apelido: 'Zé', handle: 'Z!' });
    expect(r).toEqual({ ok: false, motivo: 'handleInvalido' });
    expect(getSession).not.toHaveBeenCalled();
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

describe('conta: sair', () => {
  it('sair apaga o perfil e os causos locais para o próximo a entrar não ver', async () => {
    localStorage.setItem('aue.perfil.v1', '{"nome":"Zé"}');
    localStorage.setItem('aue.causos.v3', '[]');
    signOut.mockResolvedValue({ error: null });
    expect(await criarContaWeb().sair()).toBe(true);
    expect(localStorage.getItem('aue.perfil.v1')).toBeNull();
    expect(localStorage.getItem('aue.causos.v3')).toBeNull();
  });

  it('se o servidor falha, não apaga nada e devolve false', async () => {
    localStorage.setItem('aue.perfil.v1', '{"nome":"Zé"}');
    signOut.mockResolvedValue({ error: { message: 'x' } });
    expect(await criarContaWeb().sair()).toBe(false);
    expect(localStorage.getItem('aue.perfil.v1')).not.toBeNull();
  });
});

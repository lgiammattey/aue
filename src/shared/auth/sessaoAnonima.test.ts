import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('../../db/supabase', () => ({ supabase: { auth } }));

const sessao = (id: string) => ({ user: { id }, access_token: `token-${id}` });

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('garantirSessao', () => {
  it('aproveita sessão existente e consulta novamente depois de troca de conta', async () => {
    auth.getSession
      .mockResolvedValueOnce({ data: { session: sessao('anterior') }, error: null })
      .mockResolvedValueOnce({ data: { session: sessao('atual') }, error: null });
    const { garantirSessao } = await import('./sessaoAnonima');
    expect((await garantirSessao())?.user.id).toBe('anterior');
    expect((await garantirSessao())?.user.id).toBe('atual');
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('divide tentativa concorrente e cria só uma sessão anônima', async () => {
    let liberar!: (valor: unknown) => void;
    auth.getSession.mockReturnValue(new Promise((resolve) => { liberar = resolve; }));
    auth.signInAnonymously.mockResolvedValue({ data: { session: sessao('nova') }, error: null });
    const { garantirSessao } = await import('./sessaoAnonima');
    const a = garantirSessao();
    const b = garantirSessao();
    expect(auth.getSession).toHaveBeenCalledTimes(1);
    liberar({ data: { session: null }, error: null });
    expect((await a)?.user.id).toBe('nova');
    expect((await b)?.user.id).toBe('nova');
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('não cria conta quando a leitura falha e permite tentar novamente sem logout', async () => {
    auth.getSession
      .mockResolvedValueOnce({ data: { session: null }, error: new Error('rede') })
      .mockResolvedValueOnce({ data: { session: sessao('recuperada') }, error: null });
    const modulo = await import('./sessaoAnonima');
    expect(await modulo.garantirSessao()).toBeNull();
    expect(modulo.motivoSemSessao).toBe('rede');
    expect((await modulo.garantirSessao())?.user.id).toBe('recuperada');
    expect(modulo.motivoSemSessao).toBeNull();
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('reconsulta a sessão após falha da criação antes de tentar criar outra', async () => {
    auth.getSession
      .mockResolvedValueOnce({ data: { session: null }, error: null })
      .mockResolvedValueOnce({ data: { session: sessao('existente') }, error: null });
    auth.signInAnonymously.mockResolvedValueOnce({ data: { session: null }, error: new Error('sem rede') });
    const modulo = await import('./sessaoAnonima');
    expect(await modulo.garantirSessao()).toBeNull();
    expect((await modulo.garantirSessao())?.user.id).toBe('existente');
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('termina a criação pendente antes de esquecer, sem começar outra durante a saída', async () => {
    let liberar!: (valor: unknown) => void;
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.signInAnonymously.mockReturnValue(new Promise((resolve) => { liberar = resolve; }));
    auth.signOut.mockResolvedValue({ error: null });
    const modulo = await import('./sessaoAnonima');
    const primeira = modulo.garantirSessao();
    await vi.waitFor(() => expect(auth.signInAnonymously).toHaveBeenCalledOnce());
    const saida = modulo.esquecerSessao();
    expect(await modulo.garantirSessao()).toBeNull();
    expect(auth.signOut).not.toHaveBeenCalled();
    liberar({ data: { session: sessao('provisoria') }, error: null });
    await primeira;
    await saida;
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(auth.signInAnonymously).toHaveBeenCalledOnce();
  });

  it('não trata resposta sem erro e sem sessão como sucesso', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.signInAnonymously.mockResolvedValue({ data: { session: null }, error: null });
    const modulo = await import('./sessaoAnonima');
    expect(await modulo.garantirSessao()).toBeNull();
    expect(modulo.motivoSemSessao).toContain('não retornou');
  });
});

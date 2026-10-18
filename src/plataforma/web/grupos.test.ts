import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();
const insert = vi.fn();

vi.mock('../../db/supabase', () => ({
  configuracaoAusente: null,
  supabase: {
    functions: { invoke: (...a: unknown[]) => invoke(...a) },
    from: () => ({ insert: (...a: unknown[]) => insert(...a) }),
    storage: { from: () => ({ getPublicUrl: (c: string) => ({ data: { publicUrl: `https://cdn/${c}` } }) }) },
  },
}));
vi.mock('../../shared/auth/sessaoAnonima', () => ({
  garantirSessao: vi.fn().mockResolvedValue({ user: { id: 'u1' } }),
}));

import { criarGruposWeb } from './grupos';

// O adaptador só fala com o servidor quando as variáveis não são as fictícias.
vi.stubEnv('VITE_SUPABASE_URL', 'https://projeto-real.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'chave-real-de-teste');

const PEDIDO = {
  nome: 'Arroto Trovão',
  descricao: 'Grupo de quem arrota alto.',
  plataforma: 'whatsapp' as const,
  link: 'https://chat.whatsapp.com/JaC2ggM5mG12pioXJnOgHc',
};

const erroHttp = (status: number, corpo: unknown) => ({
  data: null,
  error: { context: new Response(JSON.stringify(corpo), { status }) },
});

describe('criarGruposWeb', () => {
  beforeEach(() => {
    invoke.mockReset();
    insert.mockReset();
  });

  it('offline, não finge: lista e cadastro dizem que falta servidor', async () => {
    const porta = criarGruposWeb({ forcarOffline: true });
    expect(await porta.listarGrupos()).toEqual({ ok: false, motivo: 'semServidor' });
    const r = await porta.cadastrarGrupo(PEDIDO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('semServidor');
    expect(await porta.denunciarGrupo('g1', 'x')).toBe('semServidor');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('cadastro bem-sucedido devolve o slug e se a imagem subiu', async () => {
    invoke.mockResolvedValue({ data: { ok: true, grupo: { slug: 'arroto-trovao' }, imagemSalva: false }, error: null });
    const r = await criarGruposWeb().cadastrarGrupo(PEDIDO);
    expect(r).toEqual({ ok: true, slug: 'arroto-trovao', imagemSalva: false });
    const corpo = invoke.mock.calls[0][1].body as FormData;
    expect(corpo.get('link')).toBe(PEDIDO.link);
  });

  it.each([
    [409, 'repetido', 'link'],
    [429, 'limite', undefined],
    [422, 'invalido', 'nome'],
    [413, 'invalido', 'imagem'],
    [500, 'falhou', undefined],
  ])('traduz o status %i da função em %s', async (status, motivo, campo) => {
    invoke.mockResolvedValue(erroHttp(status, { ok: false, mensagem: 'm', campo }));
    const r = await criarGruposWeb().cadastrarGrupo(PEDIDO);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe(motivo);
      expect(r.mensagem).toBe('m');
      expect(r.campo).toBe(campo);
    }
  });

  it('erro sem corpo legível não vira sucesso', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('rede') });
    const r = await criarGruposWeb().cadastrarGrupo(PEDIDO);
    expect(r.ok).toBe(false);
  });

  it('denúncia repetida (23505) conta como registrada; outro erro, não', async () => {
    insert.mockResolvedValueOnce({ error: { code: '23505' } });
    expect(await criarGruposWeb().denunciarGrupo('g1', 'golpe')).toBe('registrada');
    insert.mockResolvedValueOnce({ error: { code: '42501' } });
    expect(await criarGruposWeb().denunciarGrupo('g1', 'golpe')).toBe('falhou');
  });
});

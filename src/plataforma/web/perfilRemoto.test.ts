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

describe('concluirMeuPerfilSocial', () => {
  beforeEach(() => rpc.mockReset());

  it('não tenta concluir sem apelido e @', async () => {
    await expect(criarPerfilRemoto().concluirMeuPerfilSocial({ apelido: 'Betão' })).resolves.toEqual({
      ok: false,
      motivo: 'invalido',
      detalhe: 'Apelido e @ são obrigatórios.',
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('manda a conclusão explícita para a RPC, sem inferir pelo login', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'Esse handle já é de outra pessoa' } });
    await expect(criarPerfilRemoto().concluirMeuPerfilSocial({ apelido: 'Betão', handle: '@betao' })).resolves.toEqual({
      ok: false,
      motivo: 'handleEmUso',
    });
    expect(rpc).toHaveBeenCalledWith('concluir_meu_perfil_social', expect.objectContaining({
      p_apelido: 'Betão',
      p_handle: 'betao',
    }));
  });
});

describe('obterMeuPerfilParaEdicao', () => {
  beforeEach(() => rpc.mockReset());

  it('lê apenas o rascunho da própria ficha, inclusive antes de ela ficar pública', async () => {
    rpc.mockResolvedValue({
      data: [{ apelido: 'Betão', handle: 'betao', bio: null, cidade: 'São Paulo', instagram: null, tiktok: null, youtube: null, twitter: null }],
      error: null,
    });

    await expect(criarPerfilRemoto().obterMeuPerfilParaEdicao()).resolves.toEqual({
      apelido: 'Betão',
      handle: 'betao',
      bio: undefined,
      cidade: 'São Paulo',
      instagram: undefined,
      tiktok: undefined,
      youtube: undefined,
      twitter: undefined,
    });
    expect(rpc).toHaveBeenCalledWith('meu_perfil_social_para_edicao');
  });
});

describe('enviarCapa', () => {
  beforeEach(() => rpc.mockReset());

  it('barra tipo inválido antes de tocar no storage ou anunciar sucesso', async () => {
    const arquivo = new Blob(['não é imagem'], { type: 'text/plain' });
    await expect(criarPerfilRemoto().enviarCapa(arquivo)).resolves.toEqual({ ok: false, motivo: 'formatoInvalido' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('barra arquivo grande antes de tocar no storage ou anunciar sucesso', async () => {
    const arquivo = new Blob([new Uint8Array(15 * 1024 * 1024 + 1)], { type: 'image/jpeg' });
    await expect(criarPerfilRemoto().enviarCapa(arquivo)).resolves.toEqual({ ok: false, motivo: 'grandeDemais' });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('redes sociais: normaliza antes de ir ao servidor', () => {
  beforeEach(() => rpc.mockReset());

  it('aceita o link, manda só o @ e mantém "vazio apaga" e "ausente não mexe"', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await criarPerfilRemoto().atualizarMeuPerfil({
      tiktok: 'https://www.tiktok.com/@giamzinn',
      instagram: '',
    });
    expect(rpc).toHaveBeenNthCalledWith(1, 'atualizar_meu_perfil', expect.objectContaining({
      p_tiktok: 'giamzinn',
      p_instagram: '',
      p_youtube: null,
      p_twitter: null,
    }));
  });

  it('valor inválido volta com mensagem e NÃO chama o servidor', async () => {
    const r = await criarPerfilRemoto().atualizarMeuPerfil({ tiktok: 'https://instagram.com/x' });
    expect(r).toEqual({ ok: false, motivo: 'invalido', detalhe: 'TikTok: use só o @ ou o link do seu perfil.' });
    const c = await criarPerfilRemoto().concluirMeuPerfilSocial({ apelido: 'Betão', handle: 'betao', youtube: 'com espaço' });
    expect(c).toEqual({ ok: false, motivo: 'invalido', detalhe: 'YouTube: use só o @ ou o link do seu perfil.' });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('listarConexoes', () => {
  beforeEach(() => {
    rpc.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('traduz as linhas do servidor', async () => {
    rpc.mockResolvedValue({ data: [{ id: 'u1', handle: 'lima', apelido: ' Lima ', url_do_avatar: null, eu_sigo: true }, { id: 'u2', handle: 'x', apelido: null, url_do_avatar: 'https://a/b.jpg', eu_sigo: false }], error: null });
    expect(await criarPerfilRemoto().listarConexoes('giam', 'seguidores')).toEqual([
      { id: 'u1', handle: 'lima', apelido: 'Lima', avatarUrl: undefined, euSigo: true },
      { id: 'u2', handle: 'x', apelido: 'Arrotador', avatarUrl: 'https://a/b.jpg', euSigo: false },
    ]);
    expect(rpc).toHaveBeenCalledWith('listar_conexoes_do_perfil', { p_handle: 'giam', p_tipo: 'seguidores', p_limite: 100 });
  });

  it('falha do servidor lança: nunca vira lista vazia ("ninguém")', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('timeout') });
    await expect(criarPerfilRemoto().listarConexoes('giam', 'seguindo')).rejects.toThrow('timeout');
  });
});

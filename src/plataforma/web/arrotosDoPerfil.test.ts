import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const upload = vi.fn();
const createSignedUrl = vi.fn();
const from = vi.fn((_bucket: string) => ({ upload, createSignedUrl }));

vi.mock('../../db/supabase', () => ({
  configuracaoAusente: null,
  supabase: {
    rpc: (nome: string, parametros?: object) => rpc(nome, parametros),
    storage: { from: (bucket: string) => from(bucket) },
  },
}));
vi.mock('../../shared/auth/sessaoAnonima', () => ({
  garantirSessao: vi.fn(async () => ({ user: { id: 'eu' } })),
}));

import { criarArrotosDoPerfilRemoto } from './arrotosDoPerfil';

const RASCUNHO = {
  id: '9e1c2ca2-35b1-4e15-99f7-221cb5f12120',
  caminhoDoAudio: 'eu/9e1c2ca2-35b1-4e15-99f7-221cb5f12120',
  perfilDestinoId: 'destino',
  perfilDestinoHandle: 'betao',
  perfilDestinoApelido: 'Betão',
};

describe('adaptador de Arrotos do Perfil', () => {
  beforeEach(() => {
    rpc.mockReset(); upload.mockReset(); createSignedUrl.mockReset(); from.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('resolve o @ no servidor antes de criar o rascunho', async () => {
    rpc.mockResolvedValue({ data: [{ id: RASCUNHO.id, caminho_do_audio: RASCUNHO.caminhoDoAudio, perfil_destino_id: 'destino', perfil_destino_handle: 'betao', perfil_destino_apelido: 'Betão' }], error: null });
    await expect(criarArrotosDoPerfilRemoto().prepararArroto('@betao')).resolves.toEqual({ ok: true, rascunho: RASCUNHO });
    expect(rpc).toHaveBeenCalledWith('preparar_arroto_do_perfil', { p_handle_destino: 'betao' });
  });

  it('não toca no storage se o Blob não for áudio aceito', async () => {
    await expect(criarArrotosDoPerfilRemoto().publicarArroto(RASCUNHO, new Blob(['x'], { type: 'text/plain' }), 3)).resolves.toEqual({ ok: false, motivo: 'formatoInvalido' });
    expect(from).not.toHaveBeenCalled();
  });

  it('sobe uma única vez no caminho autorizado e só depois publica', async () => {
    upload.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: [{ id: RASCUNHO.id, perfil_id: 'destino', autor_id: 'eu', autor_handle: 'giam', autor_apelido: 'Giam', caminho_do_audio: RASCUNHO.caminhoDoAudio, duracao_segundos: 3, criado_em: '2026-10-20T12:00:00Z', meu: true, posso_ocultar: true }], error: null });
    const resultado = await criarArrotosDoPerfilRemoto().publicarArroto(RASCUNHO, new Blob(['audio'], { type: 'audio/webm' }), 3);
    expect(resultado.ok).toBe(true);
    expect(from).toHaveBeenCalledWith('arrotos_de_perfil');
    expect(upload).toHaveBeenCalledWith(RASCUNHO.caminhoDoAudio, expect.any(Blob), { upsert: false, contentType: 'audio/webm' });
    expect(rpc).toHaveBeenCalledWith('publicar_arroto_do_perfil', { p_arroto_id: RASCUNHO.id, p_duracao_segundos: 3 });
  });

  it('pede URL assinada curta só quando o player precisar tocar', async () => {
    rpc.mockResolvedValue({ data: [{ id: 'a1', perfil_id: 'destino', autor_id: 'eu', autor_handle: 'giam', autor_apelido: 'Giam', caminho_do_audio: 'eu/a1', duracao_segundos: 2.4, criado_em: '2026-10-20T12:00:00Z', meu: true, posso_ocultar: true }], error: null });
    const [arroto] = await criarArrotosDoPerfilRemoto().listarArrotos('betao');
    expect(createSignedUrl).not.toHaveBeenCalled();
    createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://audio-assinado' }, error: null });
    await expect(arroto.enderecoDoAudio()).resolves.toBe('https://audio-assinado');
    expect(createSignedUrl).toHaveBeenCalledWith('eu/a1', 60);
  });
});

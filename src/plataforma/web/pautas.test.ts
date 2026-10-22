import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();

vi.mock('../../db/supabase', () => ({
  configuracaoAusente: false,
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

import { criarPautasWeb } from './pautas';

vi.stubEnv('VITE_SUPABASE_URL', 'https://projeto-real.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'chave-real-de-teste');

const PAUTA = '11111111-1111-4111-8111-111111111111';
const ENTRADA = '22222222-2222-4222-8222-222222222222';

function topico(id: string, titulo: string) {
  return {
    id,
    comunidade_id: '33333333-3333-4333-8333-333333333333',
    comunidade_slug: 'eu-arroto-e-dai',
    comunidade_nome: 'Eu arroto, e daí?',
    autor_id: '44444444-4444-4444-8444-444444444444',
    apelido: 'Giam', handle: 'giamzinn_aue', url_do_avatar: null,
    titulo, corpo: 'texto', status: 'aberto', fixado: false,
    criado_em: '2026-10-22T12:00:00+00:00', editado_em: null,
    ultima_atividade_em: '2026-10-22T12:00:00+00:00', respostas_total: 2,
    resultado_id: null, nota: null, duracao: null, subtipo_de_origem: null,
    caminho_do_audio: null, caminho_do_audio_da_casa: null, sou_autor: false,
  };
}

beforeEach(() => {
  rpc.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('pautas web', () => {
  it('não inventa pauta quando não há associação e preserva falha sem servidor', async () => {
    expect(await criarPautasWeb().obterPautaPorTopico('fora-do-formato')).toEqual({ ok: true, valor: null });
    expect(await criarPautasWeb({ forcarOffline: true }).obterPautaPorTopico(ENTRADA)).toEqual({ ok: false, motivo: 'semServidor' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('traz a pauta e todas as entradas em uma RPC, com áudio original intacto', async () => {
    const original = { ...topico(ENTRADA, 'O post original'), resultado_id: '55555555-5555-4555-8555-555555555555', nota: 76, caminho_do_audio: 'audio/original.m4a' };
    rpc.mockResolvedValue({ data: [{ pauta: topico(PAUTA, 'Mural da vergonha'), entrada: original, entrada_em_foco_id: ENTRADA, posicao: 1 }], error: null });

    const resultado = await criarPautasWeb().obterPautaPorTopico(ENTRADA);

    expect(rpc).toHaveBeenCalledWith('obter_pauta_por_topico', { p_topico_id: ENTRADA });
    expect(resultado).toMatchObject({
      ok: true,
      valor: { pauta: { id: PAUTA }, entradaEmFocoId: ENTRADA, entradas: [{ id: ENTRADA, titulo: 'O post original', audio: { nota: 76, caminhoDoAudio: 'audio/original.m4a' } }] },
    });
  });

  it('não aceita uma resposta malformada como conversa válida', async () => {
    rpc.mockResolvedValue({ data: [{ pauta: topico(PAUTA, 'Mural'), entrada: topico(ENTRADA, 'Post'), entrada_em_foco_id: ENTRADA, posicao: 0 }], error: null });
    expect(await criarPautasWeb().obterPautaPorTopico(ENTRADA)).toEqual({ ok: false, motivo: 'falhou' });
  });
});

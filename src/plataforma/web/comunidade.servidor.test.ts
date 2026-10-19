// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * O caminho do SERVIDOR do adaptador da comunidade.
 *
 * Os outros testes rodam com `forcarOffline: true` e por isso nunca pegaram o
 * defeito que a auditoria de 18/10/2026 achou: o adaptador falava com colunas
 * que o banco não tem, o `catch` engolia o erro e o feed caía calado no
 * aparelho. Aqui o Supabase é um dublê que RECUSA o que o banco recusaria.
 */

const rpc = vi.fn();
const insert = vi.fn();
const from = vi.fn();
const enviarResultado = vi.fn();
const enviarAudioDoResultado = vi.fn();

vi.mock('../../db/supabase', () => ({
  configuracaoAusente: false,
  supabase: { rpc: (...a: unknown[]) => rpc(...a), from: (...a: unknown[]) => from(...a) },
  assinarUrlDoAudio: vi.fn(async (c: string) => `https://audio.exemplo/${c}`),
  enviarResultado: (...a: unknown[]) => enviarResultado(...a),
  enviarAudioDoResultado: (...a: unknown[]) => enviarAudioDoResultado(...a),
}));

vi.mock('../../shared/auth/sessaoAnonima', () => ({
  garantirSessao: vi.fn(async () => ({ user: { id: 'usuario-1' } })),
}));

import { criarComunidadeWeb } from './comunidade';

const ARROTO = {
  nota: { nota: 91, medidas: { folego: 70, estouro: 60, grave: 80, sujeira: 40 } },
  origem: 'Bebida',
  audio: { dados: new Blob(['x'], { type: 'audio/webm' }), formato: 'audio/webm', duracaoMs: 1500 },
} as unknown as NonNullable<Parameters<ReturnType<typeof criarComunidadeWeb>['postarCauso']>[0]['arroto']>;

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://projeto-real.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'chave-real');
  rpc.mockReset();
  insert.mockReset();
  from.mockReset();
  enviarResultado.mockReset();
  enviarAudioDoResultado.mockReset();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('feed pelo servidor', () => {
  it('lê pela RPC do feed e traduz nota, áudio e contagens que o servidor mandou', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 'p1',
          user_id: 'outro',
          apelido: 'Betão da TI',
          topico: 'Eu arroto, e daí?',
          conteudo: 'Na reunião.',
          resultado_id: 'r1',
          nota: 88,
          duracao: 70,
          subtipo_de_origem: null,
          caminho_do_audio: 'outro/r1.webm',
          criado_em: '2026-10-18T10:00:00Z',
          total_comentarios: 3,
          curtidas: 4,
          reposts: 1,
          fogo: 2,
          nojo: 0,
          trofeu: 1,
          minhas: ['like', 'fogo'],
        },
      ],
      error: null,
    });

    const porta = criarComunidadeWeb();
    const feed = await porta.listarFeed({ comunidadeSlug: 'eu-arroto-e-dai' });

    expect(rpc).toHaveBeenCalledWith('listar_feed_de_causos', {
      p_topico: 'Eu arroto, e daí?',
      p_limite: 30,
      p_autor_id: null,
      p_curtidos_por: null,
      p_seguindo: false,
    });
    expect(feed).toHaveLength(1);
    expect(feed[0]).toMatchObject({
      autorNome: 'Betão da TI',
      comunidadeSlug: 'eu-arroto-e-dai',
      nota: 88,
      temAudio: true,
      curtidas: 4,
      curtidoPorMim: true,
      totalComentarios: 3,
      minhaReacao: 'fogo',
      reacoes: { fogo: 2, nojo: 0, trofeu: 1 },
      meu: false,
    });
    // URL assinada vence: é pedida na hora de tocar, não guardada.
    expect(await feed[0].enderecoDoAudio?.()).toBe('https://audio.exemplo/outro/r1.webm');
  });

  it('nunca lê a tabela resultados direto (a leitura é fechada desde a 034)', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await criarComunidadeWeb().listarFeed();
    expect(from).not.toHaveBeenCalled();
  });
});

describe('postar causo pelo servidor', () => {
  it('só guarda o resultado e sobe o áudio depois do consentimento', async () => {
    const porta = criarComunidadeWeb();
    const recusado = await porta.postarCauso({
      comunidadeSlug: 'feed',
      conteudo: 'Meu arroto',
      autorNome: 'Zé',
      arroto: ARROTO,
      consentimentoAudioPublico: false,
    });
    expect(recusado).toEqual({ ok: false, motivo: 'consentimentoObrigatorio' });
    expect(enviarResultado).not.toHaveBeenCalled();
    expect(enviarAudioDoResultado).not.toHaveBeenCalled();
  });

  it('com aceite: sobe o arroto, grava o consentimento e usa a nota do servidor', async () => {
    enviarResultado.mockResolvedValue({ id: 'r9' });
    enviarAudioDoResultado.mockResolvedValue({ id: 'r9', nota: 90.5, duracao: 70, caminho_do_audio: 'usuario-1/r9.webm' });
    rpc.mockResolvedValue({ data: { id: 'p9', content: 'Meu arroto', created_at: '2026-10-18T11:00:00Z' }, error: null });

    const res = await criarComunidadeWeb().postarCauso({
      comunidadeSlug: 'feed',
      conteudo: 'Meu arroto',
      autorNome: 'Zé',
      arroto: ARROTO,
      consentimentoAudioPublico: true,
    });

    expect(rpc).toHaveBeenCalledWith('publicar_causo', expect.objectContaining({
      p_resultado_id: 'r9', p_consentimento_audio_publico: true,
    }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.causo.nota).toBe(90.5); // a do servidor, não a que o cliente trouxe (91)
      expect(res.causo.somenteNesteAparelho).toBeUndefined();
    }
  });

  it('servidor recusou: a porta devolve falha, não um causo "postado" só no aparelho', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'new row violates row-level security policy' } });
    insert.mockReturnValue({ select: () => ({ single }) });
    from.mockReturnValue({ insert });

    const res = await criarComunidadeWeb().postarCauso({
      comunidadeSlug: 'feed',
      conteudo: 'Texto',
      autorNome: 'Zé',
      consentimentoAudioPublico: false,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.motivo).toBe('falhou');
    expect(JSON.parse(localStorage.getItem('aue.causos.v3') ?? '[]')).toEqual([]);
  });
});

describe('comentário em níveis', () => {
  it('responder um comentário manda o pai e volta com o nível que o servidor calculou', async () => {
    rpc.mockResolvedValueOnce({
      data: { id: 'c2', content: 'tmj', created_at: '2026-10-18T12:05:00Z', nivel: 1 },
      error: null,
    });
    const r = await criarComunidadeWeb().adicionarResposta('p1', 'tmj', 'Zé', 'ze', 'c1');
    expect(rpc).toHaveBeenCalledWith('criar_comentario', {
      p_conteudo: 'tmj',
      p_post_id: 'p1',
      p_resposta_a_id: 'c1',
    });
    expect(r).toMatchObject({ respostaAId: 'c1', nivel: 1 });
  });

  it('lista traz pai e nível, e nível fora da faixa não passa de 2', async () => {
    rpc.mockResolvedValueOnce({
      data: [
        { id: 'c1', content: 'a', created_at: 'x', apelido: 'Ana', handle: 'ana', resposta_a_id: null, nivel: 0 },
        { id: 'c2', content: 'b', created_at: 'y', apelido: 'Bia', handle: 'bia', resposta_a_id: 'c1', nivel: 9 },
      ],
      error: null,
    });
    const lista = await criarComunidadeWeb().listarRespostas('p1');
    expect(lista[0]).toMatchObject({ autorHandle: 'ana', nivel: 0 });
    expect(lista[1]).toMatchObject({ respostaAId: 'c1', nivel: 2 });
  });
});

describe('reação, comentário e denúncia pelo servidor', () => {
  it('reação emoji vai ao banco e a contagem volta do servidor', async () => {
    rpc.mockResolvedValue({ data: { like: 0, repost: 0, fogo: 5, nojo: 0, trofeu: 0, minhas: ['fogo'] }, error: null });
    const res = await criarComunidadeWeb().alternarReacao('p1', 'fogo');
    expect(rpc).toHaveBeenCalledWith('alternar_reacao_do_causo', { p_post_id: 'p1', p_tipo: 'fogo' });
    expect(res).toEqual({ ok: true, reacoes: { fogo: 5, nojo: 0, trofeu: 0 } });
  });

  it('repost usa o tipo aceito pelo CHECK, e erro do servidor não vira sucesso', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const res = await criarComunidadeWeb().alternarRepost('p1');
    expect(rpc).toHaveBeenCalledWith('alternar_reacao_do_causo', { p_post_id: 'p1', p_tipo: 'repost' });
    expect(res.ok).toBe(false);
  });

  it('comentário passa pela RPC e recusa não vira resposta na tela', async () => {
    rpc.mockResolvedValueOnce({ data: { id: 'c1', content: 'kkk', created_at: '2026-10-18T12:00:00Z' }, error: null });
    const ok = await criarComunidadeWeb().adicionarResposta('p1', 'kkk', 'Zé');
    expect(rpc).toHaveBeenCalledWith('criar_comentario', {
      p_conteudo: 'kkk',
      p_post_id: 'p1',
      p_resposta_a_id: null,
    });
    expect(ok?.id).toBe('c1');

    rpc.mockResolvedValueOnce({ data: null, error: { message: 'negado' } });
    expect(await criarComunidadeWeb().adicionarResposta('p1', 'kkk', 'Zé')).toBeNull();
  });

  it('denúncia passa pela RPC fechada', async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    const feito = await criarComunidadeWeb().denunciarCauso('p1', 'Spam pesado');

    expect(rpc).toHaveBeenCalledWith('denunciar_causo', { p_post_id: 'p1', p_motivo: 'Spam pesado' });
    expect(feito).toBe(true);
  });

  it('denúncia que o servidor recusa devolve false: a tela não pode dizer que denunciou', async () => {
    from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: { code: '42703', message: 'column does not exist' } }) });
    expect(await criarComunidadeWeb().denunciarCauso('p1', 'Spam')).toBe(false);
  });

  it('denúncia recusada não vira sucesso', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'conta promovida' } });
    expect(await criarComunidadeWeb().denunciarCauso('p1', 'Spam')).toBe(false);
  });
});

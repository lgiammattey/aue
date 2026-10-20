import { describe, expect, it } from 'vitest';
import { traduzirLinha } from './comunidade';
import type { LinhaDoFeed } from './comunidade';
import { traduzirPerfil } from './perfilRemoto';
import type { LinhaDePerfil } from './perfilRemoto';

const POST_ID = '11111111-2222-5333-8444-555555555555';

function linha(extra: Partial<LinhaDoFeed> = {}): LinhaDoFeed {
  return {
    id: POST_ID,
    user_id: 'u1',
    apelido: 'Lima',
    handle: 'lima',
    url_do_avatar: null,
    topico: 'Eu arroto, e daí?',
    conteudo: 'quase meia noite',
    resultado_id: null,
    nota: null,
    duracao: null,
    subtipo_de_origem: null,
    caminho_do_audio: null,
    criado_em: '2026-09-02T02:12:00.000Z',
    total_comentarios: 0,
    curtidas: 0,
    reposts: 0,
    fogo: 0,
    nojo: 0,
    trofeu: 0,
    minhas: null,
    caminho_do_audio_da_casa: null,
    ...extra,
  };
}

describe('feed: áudio da casa', () => {
  it('vira URL pública direta, sem nota, com áudio', async () => {
    const causo = traduzirLinha(linha({ caminho_do_audio_da_casa: `burpzilla/${POST_ID}.m4a` }), null);
    expect(causo.temAudio).toBe(true);
    expect(causo.nota).toBeUndefined();
    expect(causo.resultadoId).toBeUndefined();
    const url = await causo.enderecoDoAudio?.();
    expect(url).toContain('/storage/v1/object/public/audio_da_casa/');
    expect(url).toContain(`burpzilla/${POST_ID}.m4a`);
    // Mesma URL a cada pedido: é o que deixa o navegador guardar em cache.
    expect(await causo.enderecoDoAudio?.()).toBe(url);
  });

  it('post da casa só de texto não tem áudio nem nota', () => {
    const causo = traduzirLinha(linha(), null);
    expect(causo.temAudio).toBe(false);
    expect(causo.enderecoDoAudio).toBeUndefined();
    expect(causo.nota).toBeUndefined();
  });

  it('o feed não carrega marca de conta da casa', () => {
    const causo = traduzirLinha(linha({ caminho_do_audio_da_casa: `burpzilla/${POST_ID}.m4a` }), null);
    expect(JSON.stringify(Object.keys(causo))).not.toMatch(/casa/i);
  });

  it('causo de jogo continua assinando o áudio privado e mostrando a nota do servidor', () => {
    const causo = traduzirLinha(linha({ caminho_do_audio: 'u1/r1.webm', nota: 87, resultado_id: 'r1' }), null);
    expect(causo.nota).toBe(87);
    expect(causo.temAudio).toBe(true);
    expect(typeof causo.enderecoDoAudio).toBe('function');
  });
});

describe('perfil: conta da casa', () => {
  const base: LinhaDePerfil = {
    id: 'u1',
    handle: 'giam',
    apelido: 'Giam',
    url_do_avatar: null,
    caminho_da_capa: null,
    revisao_da_capa: 0,
    bio: 'personagem da casa, Burpzilla',
    cidade: null,
    titulo: null,
    e_fundador: false,
    criado_em: '2026-09-22T11:00:00.000Z',
    instagram: null,
    tiktok: null,
    youtube: null,
    twitter: null,
    total_causos: 6,
    melhor_nota: null,
    total_seguidores: 0,
    total_seguindo: 0,
    eu_sigo: false,
    sou_eu: false,
    conta_da_casa: true,
  };

  it('traduz conta_da_casa para daCasa', () => {
    expect(traduzirPerfil(base).daCasa).toBe(true);
    expect(traduzirPerfil({ ...base, conta_da_casa: false }).daCasa).toBe(false);
  });

  it('perfil da casa não ganha nota nem fundador inventados', () => {
    const p = traduzirPerfil(base);
    expect(p.melhorNota).toBeUndefined();
    expect(p.fundador).toBe(false);
  });
});

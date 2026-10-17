import { describe, expect, it } from 'vitest';
import { criarComunidadeWeb } from './comunidade';
import type { CausoPostado } from '../../portas/comunidade';

describe('Adaptador Web da Comunidade (Auê 3.0)', () => {
  it('retorna a lista de comunidades padrão com as comunidades canônicas', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    const comunidades = await adapter.listarComunidades();

    expect(comunidades.length).toBeGreaterThanOrEqual(5);
    expect(comunidades.some((c) => c.slug === 'eu-arroto-e-dai')).toBe(true);
    expect(comunidades.some((c) => c.slug === 'reuniao-da-firma')).toBe(true);
  });

  it('lista feed com causos iniciais e suporta filtro por comunidade', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    const feedCompleto = await adapter.listarFeed();
    expect(feedCompleto.length).toBeGreaterThan(0);

    const feedFiltrado = await adapter.listarFeed({ comunidadeSlug: 'eu-arroto-e-dai' });
    expect(feedFiltrado.every((c) => c.comunidadeSlug === 'eu-arroto-e-dai')).toBe(true);
  });

  it('TRAVA LGPD: rejeita publicação de áudio na comunidade sem consentimento explícito', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    const resultado = await adapter.postarCauso({
      comunidadeSlug: 'eu-arroto-e-dai',
      conteudo: 'Mandei esse arroto violento!',
      autorNome: 'Pedrão',
      resultadoId: 'res-1234',
      consentimentoAudioPublico: false, // Negou consentimento
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.motivo).toBe('consentimentoObrigatorio');
    }
  });

  it('rejeita publicação com conteúdo vazio', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    const resultado = await adapter.postarCauso({
      comunidadeSlug: 'eu-arroto-e-dai',
      conteudo: '   ',
      autorNome: 'Pedrão',
      consentimentoAudioPublico: false,
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.motivo).toBe('conteudoVazio');
    }
  });

  it('publica causo com sucesso quando o consentimento é fornecido', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    const resultado = await adapter.postarCauso({
      comunidadeSlug: 'eu-arroto-e-dai',
      conteudo: 'Arrotei no meio da chamada do Teams e o chefe aplaudiu.',
      autorNome: 'Pedrão',
      resultadoId: 'res-1234',
      consentimentoAudioPublico: true,
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.causo.conteudo).toContain('Teams');
      expect(resultado.causo.comunidadeSlug).toBe('eu-arroto-e-dai');

      // Aparece no topo do feed
      const feed = await adapter.listarFeed();
      expect(feed[0].id).toBe(resultado.causo.id);
    }
  });

  it('alterna reações no causo (adiciona e remove ao tocar de novo)', async () => {
    const causoTeste: CausoPostado = {
      id: 'causo-teste',
      comunidadeId: 'comu-1',
      comunidadeSlug: 'eu-arroto-e-dai',
      autorNome: 'Zé',
      conteudo: 'Teste de reacao',
      reacoes: { fogo: 2, nojo: 0, trofeu: 1 },
      minhaReacao: null,
      curtidas: 5,
      reposts: 2,
      totalComentarios: 0,
      criadoEm: new Date().toISOString(),
    };

    const adapter = criarComunidadeWeb({
      causosIniciais: [causoTeste],
      forcarOffline: true,
    });

    // Reage com fogo
    const r1 = await adapter.alternarReacao('causo-teste', 'fogo');
    expect(r1.ok).toBe(true);
    expect(r1.reacoes.fogo).toBe(3);

    // Toca fogo de novo -> remove
    const r2 = await adapter.alternarReacao('causo-teste', 'fogo');
    expect(r2.ok).toBe(true);
    expect(r2.reacoes.fogo).toBe(2);
  });

  it('denunciar causo oculta o post do feed', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    const feedAntes = await adapter.listarFeed();
    const idParaOcultar = feedAntes[0].id;

    const denunciou = await adapter.denunciarCauso(idParaOcultar, 'Spam');
    expect(denunciou).toBe(true);

    const feedDepois = await adapter.listarFeed();
    expect(feedDepois.some((c) => c.id === idParaOcultar)).toBe(false);
  });

  it('alterna curtidas estilo twitter (incrementa e decrementa)', async () => {
    const causoTeste: CausoPostado = {
      id: 'causo-curtida',
      comunidadeId: 'comu-1',
      comunidadeSlug: 'bonde-geral',
      autorNome: 'Tiago',
      conteudo: 'Bora arrotar',
      reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
      minhaReacao: null,
      curtidas: 10,
      curtidoPorMim: false,
      reposts: 0,
      totalComentarios: 0,
      criadoEm: new Date().toISOString(),
    };

    const adapter = criarComunidadeWeb({
      causosIniciais: [causoTeste],
      forcarOffline: true,
    });

    const c1 = await adapter.alternarCurtida('causo-curtida');
    expect(c1.ok).toBe(true);
    expect(c1.curtidas).toBe(11);
    expect(c1.curtido).toBe(true);

    const c2 = await adapter.alternarCurtida('causo-curtida');
    expect(c2.ok).toBe(true);
    expect(c2.curtidas).toBe(10);
    expect(c2.curtido).toBe(false);
  });

  it('permite adicionar e listar respostas reais a um causo', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    const feed = await adapter.listarFeed();
    const causoId = feed[0].id;

    const resp = await adapter.adicionarResposta(causoId, 'Isso foi absurdo!', 'Luiz', 'luiz_prod');
    expect(resp).not.toBeNull();
    expect(resp?.conteudo).toBe('Isso foi absurdo!');
    expect(resp?.autorHandle).toBe('luiz_prod');

    const respostas = await adapter.listarRespostas(causoId);
    expect(respostas.some((r) => r.conteudo === 'Isso foi absurdo!')).toBe(true);
  });

  it('permite entrar e sair de comunidades com persistência', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    await adapter.entrarComunidade('churrasco-raiz');
    let minhas = await adapter.listarMinhasComunidades();
    expect(minhas.includes('churrasco-raiz')).toBe(true);

    await adapter.sairComunidade('churrasco-raiz');
    minhas = await adapter.listarMinhasComunidades();
    expect(minhas.includes('churrasco-raiz')).toBe(false);
  });
});

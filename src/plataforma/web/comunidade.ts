import {
  assinarUrlDoAudio,
  configuracaoAusente,
  enviarAudioDoResultado,
  enviarResultado,
  supabase,
} from '../../db/supabase';
import { garantirSessao } from '../../shared/auth/sessaoAnonima';
import { criarDesafiosWeb } from './desafios';
import { COMUNIDADES_PADRAO, obterComunidadePorSlug } from '../../nucleo/comunidade/comunidadesPadrao';
import { CAUSOS_PADRAO } from '../../nucleo/comunidade/causosPadrao';
import type {
  CausoPostado,
  Comunidade,
  FiltrosDoFeed,
  PedidoDePostagemDeCauso,
  PortaDeComunidade,
  RespostaDeCauso,
  ResultadoDaPostagem,
  TipoDeReacao,
} from '../../portas/comunidade';

const CHAVE_CAUSOS = 'aue.causos.v3';
const CHAVE_MINHAS_COMUNIDADES = 'aue.minhas_comunidades.v2';
const PADRAO_MINHAS_COMUNIDADES = ['bonde-geral', 'eu-arroto-e-dai'];

const TEMPO_DA_LEITURA_MS = 6000;
const TEMPO_DA_ESCRITA_MS = 15000;

const COMUNIDADE_FEED: Comunidade = {
  id: 'comu-feed',
  slug: 'feed',
  nome: 'Feed',
  descricao: 'Feed geral.',
  icone: '📢',
};

function lerCausosLocais(): CausoPostado[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    // Purga a chave legada v2 que continha os posts autorais cacheados
    localStorage.removeItem('aue.causos.v2');
    const bruto = localStorage.getItem(CHAVE_CAUSOS);
    if (!bruto) return [];
    const parsed = JSON.parse(bruto);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c: CausoPostado) => !c.id?.startsWith('causo-seed-'));
  } catch {
    return [];
  }
}

function salvarCausosLocais(causos: readonly CausoPostado[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    // Só o que é meu: o resto vem do servidor a cada abertura. Função
    // (`enderecoDoAudio`) não serializa e some sozinha.
    localStorage.setItem(CHAVE_CAUSOS, JSON.stringify(causos.filter((c) => c.meu)));
  } catch {
    // ignora erro no safari privado
  }
}

function lerMinhasComunidadesLocais(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [...PADRAO_MINHAS_COMUNIDADES];
    const bruto = localStorage.getItem(CHAVE_MINHAS_COMUNIDADES);
    if (!bruto) return [...PADRAO_MINHAS_COMUNIDADES];
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? parsed : [...PADRAO_MINHAS_COMUNIDADES];
  } catch {
    return [...PADRAO_MINHAS_COMUNIDADES];
  }
}

function salvarMinhasComunidadesLocais(slugs: readonly string[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CHAVE_MINHAS_COMUNIDADES, JSON.stringify(slugs));
  } catch {
    // ignora erro no safari privado
  }
}

function supabaseRealConfigurado(): boolean {
  if (configuracaoAusente) return false;
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (url.includes('aue-dev.supabase.co') || url.includes('exemplo.supabase.co')) return false;
  if (key.includes('chave-ficticia') || key.includes('chave-ausente')) return false;
  return true;
}

function comTempo<T>(promessa: PromiseLike<T>, ms: number, rotulo: string): Promise<T> {
  let relogio: ReturnType<typeof setTimeout>;
  const limite = new Promise<never>((_, rejeitar) => {
    relogio = setTimeout(() => rejeitar(new Error(`Tempo esgotado: ${rotulo}`)), ms);
  });
  return Promise.race([Promise.resolve(promessa), limite]).finally(() => clearTimeout(relogio));
}

function handleDoApelido(apelido: string): string {
  return apelido.toLowerCase().replace(/\s+/g, '_');
}

function comunidadePorNome(nome: string): Comunidade {
  return COMUNIDADES_PADRAO.find((c) => c.nome === nome) ?? COMUNIDADE_FEED;
}

/** Linha devolvida por `listar_feed_de_causos` (20261018000009). */
export interface LinhaDoFeed {
  id: string;
  user_id: string | null;
  apelido: string | null;
  handle: string | null;
  url_do_avatar: string | null;
  topico: string | null;
  conteudo: string | null;
  resultado_id: string | null;
  nota: number | null;
  duracao: number | null;
  subtipo_de_origem: string | null;
  caminho_do_audio: string | null;
  criado_em: string;
  total_comentarios: number;
  curtidas: number;
  reposts: number;
  fogo: number;
  nojo: number;
  trofeu: number;
  minhas: string[] | null;
  /** Áudio de post da casa (sem jogo, sem nota), dentro do bucket público. */
  caminho_do_audio_da_casa: string | null;
}

/** Resposta de `alternar_reacao_do_causo`. */
interface ContagemDeReacoes {
  like: number;
  repost: number;
  fogo: number;
  nojo: number;
  trofeu: number;
  minhas: string[];
}

function enderecoPorCaminho(caminho: string | null | undefined): (() => Promise<string | null>) | undefined {
  if (!caminho) return undefined;
  return () => assinarUrlDoAudio(caminho);
}

/** Bucket público só com conteúdo da casa (ADR 0007). */
const BUCKET_AUDIO_DA_CASA = 'audio_da_casa';

/**
 * Áudio da casa: URL pública direta, sem assinar. O bucket é público de
 * propósito e só guarda conteúdo da casa, então o endereço é estável e o
 * navegador e a borda guardam em cache.
 */
function enderecoDoAudioDaCasa(caminho: string): () => Promise<string | null> {
  const { data } = supabase.storage.from(BUCKET_AUDIO_DA_CASA).getPublicUrl(caminho);
  const url = data.publicUrl || null;
  return () => Promise.resolve(url);
}

export function traduzirLinha(l: LinhaDoFeed, meuId: string | null): CausoPostado {
  const audioDaCasa = l.caminho_do_audio_da_casa;
  const comu = comunidadePorNome(l.topico ?? '');
  const apelido = l.apelido?.trim() || 'Arrotador Anônimo';
  const minhas = l.minhas ?? [];
  const minhaReacao = (['fogo', 'nojo', 'trofeu'] as const).find((t) => minhas.includes(t)) ?? null;
  return {
    id: l.id,
    comunidadeId: comu.id,
    comunidadeSlug: comu.slug,
    autorNome: apelido,
    autorHandle: l.handle ?? handleDoApelido(apelido),
    autorHandleDoServidor: Boolean(l.handle),
    autorAvatarUrl: l.url_do_avatar ?? undefined,
    conteudo: l.conteudo ?? '',
    resultadoId: l.resultado_id ?? undefined,
    // Post da casa não tem resultado: o servidor manda nota nula e ela fica sem nota.
    nota: l.nota ?? undefined,
    enderecoDoAudio: audioDaCasa ? enderecoDoAudioDaCasa(audioDaCasa) : enderecoPorCaminho(l.caminho_do_audio),
    temAudio: Boolean(audioDaCasa || l.caminho_do_audio),
    duracaoSegundos: l.duracao ?? undefined,
    origem: l.subtipo_de_origem ?? undefined,
    reacoes: { fogo: Number(l.fogo), nojo: Number(l.nojo), trofeu: Number(l.trofeu) },
    minhaReacao,
    curtidas: Number(l.curtidas),
    curtidoPorMim: minhas.includes('like'),
    reposts: Number(l.reposts),
    repostadoPorMim: minhas.includes('repost'),
    totalComentarios: Number(l.total_comentarios),
    criadoEm: l.criado_em,
    meu: Boolean(meuId && l.user_id === meuId),
  };
}

/**
 * Adaptador Web da Porta de Comunidade e Feed do Auê 3.0.
 *
 * Com Supabase configurado, o SERVIDOR é a fonte de verdade: o feed vem de
 * `listar_feed_de_causos`, a reação de `alternar_reacao_do_causo`, o comentário
 * de `criar_comentario`. Escrita que o servidor recusa **não vira sucesso**:
 * a porta devolve falha e a tela diz que não deu.
 *
 * Só sem Supabase configurado (dev, preview sem chaves) o causo fica no
 * aparelho, e então ele vem marcado `somenteNesteAparelho`.
 */
export function criarComunidadeWeb(
  opcoes: {
    causosIniciais?: readonly CausoPostado[];
    forcarOffline?: boolean;
  } = {},
): PortaDeComunidade {
  const causosSalvos = lerCausosLocais();
  const idsSalvos = new Set(causosSalvos.map((c) => c.id));
  const padraoSemDuplicata = (opcoes.causosIniciais ?? CAUSOS_PADRAO).filter((c) => !idsSalvos.has(c.id));
  const causosMemoria: CausoPostado[] = [...causosSalvos, ...padraoSemDuplicata];
  const denunciasLocais = new Set<string>();
  const minhasComunidadesMemoria = new Set<string>(lerMinhasComunidadesLocais());

  const usaServidor = (): boolean => !opcoes.forcarOffline && supabaseRealConfigurado();
  const ehLocal = (causoId: string): boolean => causoId.startsWith('causo-local-');

  function atualizarMemoria(causoId: string, alteracao: Partial<CausoPostado>): CausoPostado | null {
    const idx = causosMemoria.findIndex((c) => c.id === causoId);
    if (idx < 0) return null;
    causosMemoria[idx] = { ...causosMemoria[idx], ...alteracao };
    salvarCausosLocais(causosMemoria);
    return causosMemoria[idx];
  }

  /** Alterna uma reação no servidor. `null` quando o servidor não aceitou. */
  async function alternarNoServidor(causoId: string, tipo: string): Promise<ContagemDeReacoes | null> {
    try {
      const sessao = await garantirSessao();
      if (!sessao?.user?.id) return null;
      const { data, error } = await comTempo(
        supabase.rpc('alternar_reacao_do_causo', { p_post_id: causoId, p_tipo: tipo }),
        TEMPO_DA_ESCRITA_MS,
        'reação',
      );
      if (error || !data) {
        console.error('Falha ao registrar a reação', error);
        return null;
      }
      return data as unknown as ContagemDeReacoes;
    } catch (erro) {
      console.error('Falha ao registrar a reação', erro);
      return null;
    }
  }

  return {
    async listarComunidades(): Promise<readonly Comunidade[]> {
      return COMUNIDADES_PADRAO;
    },

    async listarFeed(filtros?: FiltrosDoFeed): Promise<readonly CausoPostado[]> {
      const slug = filtros?.comunidadeSlug;
      const limite = filtros?.limite ?? 30;

      if (usaServidor()) {
        try {
          const comu = slug && slug !== 'todos' ? obterComunidadePorSlug(slug) : undefined;
          const meuId = (await garantirSessao())?.user?.id ?? null;
          const { data, error } = await comTempo(
            supabase.rpc('listar_feed_de_causos', {
              p_topico: comu ? comu.nome : null,
              p_limite: limite,
              p_autor_id: filtros?.autorId ?? null,
              p_curtidos_por: filtros?.curtidosPor ?? null,
            }),
            TEMPO_DA_LEITURA_MS,
            'feed',
          );

          if (error) throw error;

          const remotos = ((data ?? []) as LinhaDoFeed[])
            .filter((l) => !denunciasLocais.has(l.id))
            .map((l) => traduzirLinha(l, meuId));

          // Causo meu que ainda não subiu (falhou antes) fica no topo, marcado.
          const idsRemotos = new Set(remotos.map((r) => r.id));
          const pendentes = causosMemoria.filter(
            (c) => c.meu && ehLocal(c.id) && !idsRemotos.has(c.id) && (!comu || c.comunidadeSlug === comu.slug),
          );
          return [...pendentes, ...remotos].slice(0, limite);
        } catch (erro) {
          console.error('Falha ao ler o feed; mostrando o que está neste aparelho', erro);
        }
      }

      let filtrados = causosMemoria.filter((c) => !denunciasLocais.has(c.id));
      if (slug && slug !== 'todos') {
        filtrados = filtrados.filter((c) => c.comunidadeSlug === slug);
      }
      return filtrados.slice(0, limite);
    },

    async obterCauso(id: string): Promise<CausoPostado | null> {
      if (usaServidor() && !ehLocal(id)) {
        try {
          const meuId = (await garantirSessao())?.user?.id ?? null;
          const { data, error } = await comTempo(
            supabase.rpc('listar_feed_de_causos', { p_post_id: id, p_limite: 1 }),
            TEMPO_DA_LEITURA_MS,
            'causo',
          );
          if (error) throw error;
          const linha = ((data ?? []) as LinhaDoFeed[])[0];
          return linha ? traduzirLinha(linha, meuId) : null;
        } catch (erro) {
          console.error('Falha ao ler o causo', erro);
          return null;
        }
      }
      return causosMemoria.find((c) => c.id === id) ?? null;
    },

    async postarCauso(pedido: PedidoDePostagemDeCauso): Promise<ResultadoDaPostagem> {
      if (!pedido.conteudo || !pedido.conteudo.trim()) {
        return { ok: false, motivo: 'conteudoVazio' };
      }

      // Trava LGPD: arroto atrelado exige consentimento explícito.
      if (pedido.arroto && !pedido.consentimentoAudioPublico) {
        return { ok: false, motivo: 'consentimentoObrigatorio' };
      }

      const comu =
        pedido.comunidadeSlug && pedido.comunidadeSlug.toLowerCase() !== 'feed'
          ? (obterComunidadePorSlug(pedido.comunidadeSlug) ?? COMUNIDADES_PADRAO[0])
          : COMUNIDADE_FEED;
      const autorNome = pedido.autorNome || 'Você';
      const autorHandle = pedido.autorHandle || handleDoApelido(pedido.autorNome || 'arrotador');
      const conteudo = pedido.conteudo.trim();

      if (usaServidor()) {
        try {
          const sessao = await garantirSessao();
          if (!sessao?.user?.id) return { ok: false, motivo: 'semRede' };

          let resultadoId: string | null = null;
          let caminhoDoAudio: string | null = null;
          let notaOficial: number | undefined;
          let duracao: number | undefined;

          if (pedido.arroto) {
            // O arroto sobe AGORA, depois do aceite, e não na hora de jogar.
            const salvo = await enviarResultado({
              duracao: pedido.arroto.nota.medidas.folego,
              potencia: pedido.arroto.nota.medidas.estouro,
              profundidade: pedido.arroto.nota.medidas.grave,
              textura: pedido.arroto.nota.medidas.sujeira,
              tipoDeOrigem: pedido.arroto.origem,
            });
            const comAudio = await enviarAudioDoResultado(salvo, pedido.arroto.audio.dados);
            resultadoId = comAudio.id;
            caminhoDoAudio = comAudio.caminho_do_audio;
            notaOficial = comAudio.nota;
            duracao = comAudio.duracao;
          }

          const { data, error } = await comTempo(
            supabase
              .from('posts_comunidade')
              .insert({
                group_id: null,
                user_id: sessao.user.id,
                post_type: resultadoId ? 'audio_result' : 'text_announcement',
                result_id: resultadoId,
                consentimento_audio_publico: Boolean(resultadoId && pedido.consentimentoAudioPublico),
                topic: comu.nome,
                content: conteudo,
              })
              .select()
              .single(),
            TEMPO_DA_ESCRITA_MS,
            'postar causo',
          );

          if (error || !data) {
            console.error('O servidor recusou o causo', error);
            return { ok: false, motivo: 'falhou', detalhe: error?.message ?? 'sem resposta' };
          }

          const novoCauso: CausoPostado = {
            id: data.id,
            comunidadeId: comu.id,
            comunidadeSlug: comu.slug,
            autorNome,
            autorHandle,
            autorHandleDoServidor: Boolean(pedido.autorHandle),
            conteudo: data.content,
            resultadoId: resultadoId ?? undefined,
            nota: notaOficial,
            enderecoDoAudio: enderecoPorCaminho(caminhoDoAudio),
            temAudio: Boolean(caminhoDoAudio),
            duracaoSegundos: duracao,
            origem: pedido.arroto?.origem,
            reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
            minhaReacao: null,
            curtidas: 0,
            curtidoPorMim: false,
            reposts: 0,
            repostadoPorMim: false,
            totalComentarios: 0,
            criadoEm: data.created_at,
            meu: true,
          };
          return { ok: true, causo: novoCauso };
        } catch (erro) {
          console.error('Falha ao postar o causo', erro);
          const semRede = typeof navigator !== 'undefined' && navigator.onLine === false;
          return semRede
            ? { ok: false, motivo: 'semRede' }
            : { ok: false, motivo: 'falhou', detalhe: erro instanceof Error ? erro.message : String(erro) };
        }
      }

      // Sem servidor configurado: fica neste aparelho, e a porta diz isso. Arroto
      // não é guardado aqui — sem servidor não existe nota oficial nem áudio.
      const novoCauso: CausoPostado = {
        id: `causo-local-${Date.now()}`,
        comunidadeId: comu.id,
        comunidadeSlug: comu.slug,
        autorNome,
        autorHandle,
        conteudo,
        reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
        minhaReacao: null,
        curtidas: 0,
        curtidoPorMim: false,
        reposts: 0,
        repostadoPorMim: false,
        totalComentarios: 0,
        criadoEm: new Date().toISOString(),
        meu: true,
        somenteNesteAparelho: true,
      };

      causosMemoria.unshift(novoCauso);
      salvarCausosLocais(causosMemoria);
      return { ok: true, causo: novoCauso };
    },

    async alternarReacao(
      causoId: string,
      reacao: TipoDeReacao,
    ): Promise<{ readonly ok: boolean; readonly reacoes: Readonly<Record<TipoDeReacao, number>> }> {
      if (usaServidor() && !ehLocal(causoId)) {
        const contagem = await alternarNoServidor(causoId, reacao);
        if (!contagem) return { ok: false, reacoes: { fogo: 0, nojo: 0, trofeu: 0 } };
        const reacoes = { fogo: contagem.fogo, nojo: contagem.nojo, trofeu: contagem.trofeu };
        atualizarMemoria(causoId, {
          reacoes,
          minhaReacao: (['fogo', 'nojo', 'trofeu'] as const).find((t) => contagem.minhas.includes(t)) ?? null,
        });
        return { ok: true, reacoes };
      }

      const causo = causosMemoria.find((c) => c.id === causoId);
      if (!causo) return { ok: false, reacoes: { fogo: 0, nojo: 0, trofeu: 0 } };

      const novasReacoes = { ...causo.reacoes };
      let novaMinhaReacao: TipoDeReacao | null = reacao;
      if (causo.minhaReacao === reacao) {
        novasReacoes[reacao] = Math.max(0, novasReacoes[reacao] - 1);
        novaMinhaReacao = null;
      } else {
        if (causo.minhaReacao) {
          novasReacoes[causo.minhaReacao] = Math.max(0, novasReacoes[causo.minhaReacao] - 1);
        }
        novasReacoes[reacao] = (novasReacoes[reacao] || 0) + 1;
      }
      atualizarMemoria(causoId, { reacoes: novasReacoes, minhaReacao: novaMinhaReacao });
      return { ok: true, reacoes: novasReacoes };
    },

    async alternarCurtida(causoId: string): Promise<{ readonly ok: boolean; readonly curtidas: number; readonly curtido: boolean }> {
      if (usaServidor() && !ehLocal(causoId)) {
        const contagem = await alternarNoServidor(causoId, 'like');
        if (!contagem) return { ok: false, curtidas: 0, curtido: false };
        return { ok: true, curtidas: contagem.like, curtido: contagem.minhas.includes('like') };
      }

      const causo = causosMemoria.find((c) => c.id === causoId);
      if (!causo) return { ok: false, curtidas: 0, curtido: false };
      const curtido = !causo.curtidoPorMim;
      const curtidas = curtido ? (causo.curtidas || 0) + 1 : Math.max(0, (causo.curtidas || 0) - 1);
      atualizarMemoria(causoId, { curtidas, curtidoPorMim: curtido });
      return { ok: true, curtidas, curtido };
    },

    async alternarRepost(causoId: string): Promise<{ readonly ok: boolean; readonly reposts: number; readonly repostado: boolean }> {
      if (usaServidor() && !ehLocal(causoId)) {
        const contagem = await alternarNoServidor(causoId, 'repost');
        if (!contagem) return { ok: false, reposts: 0, repostado: false };
        return { ok: true, reposts: contagem.repost, repostado: contagem.minhas.includes('repost') };
      }

      const causo = causosMemoria.find((c) => c.id === causoId);
      if (!causo) return { ok: false, reposts: 0, repostado: false };
      const repostado = !causo.repostadoPorMim;
      const reposts = repostado ? (causo.reposts || 0) + 1 : Math.max(0, (causo.reposts || 0) - 1);
      atualizarMemoria(causoId, { reposts, repostadoPorMim: repostado });
      return { ok: true, reposts, repostado };
    },

    async listarRespostas(causoId: string): Promise<readonly RespostaDeCauso[]> {
      if (usaServidor() && !ehLocal(causoId)) {
        try {
          const { data, error } = await comTempo(
            supabase.rpc('listar_comentarios', { p_post_id: causoId }),
            TEMPO_DA_LEITURA_MS,
            'comentários',
          );
          if (error) throw error;
          return ((data ?? []) as Array<{
            id: string;
            content: string;
            created_at: string;
            apelido: string | null;
            handle: string | null;
            resposta_a_id: string | null;
            nivel: number | null;
          }>).map((c) => {
            const nome = c.apelido?.trim() || 'Arrotador';
            return {
              id: c.id,
              causoId,
              autorNome: nome,
              autorHandle: c.handle ?? handleDoApelido(nome),
              conteudo: c.content,
              criadoEm: c.created_at,
              respostaAId: c.resposta_a_id ?? undefined,
              nivel: (Math.min(Math.max(c.nivel ?? 0, 0), 2) as 0 | 1 | 2),
            };
          });
        } catch (erro) {
          console.error('Falha ao ler os comentários', erro);
          return [];
        }
      }
      return causosMemoria.find((c) => c.id === causoId)?.comentarios ?? [];
    },

    async adicionarResposta(
      causoId: string,
      conteudo: string,
      autorNome: string,
      autorHandle?: string,
      respostaAId?: string,
    ): Promise<RespostaDeCauso | null> {
      const texto = conteudo?.trim();
      if (!texto) return null;
      const nome = autorNome || 'Você';
      const handle = autorHandle || handleDoApelido(nome);

      if (usaServidor() && !ehLocal(causoId)) {
        try {
          const sessao = await garantirSessao();
          if (!sessao?.user?.id) return null;
          const { data, error } = await comTempo(
            supabase.rpc('criar_comentario', {
              p_conteudo: texto,
              p_post_id: causoId,
              p_resposta_a_id: respostaAId ?? null,
            }),
            TEMPO_DA_ESCRITA_MS,
            'comentar',
          );
          if (error || !data) {
            console.error('O servidor recusou o comentário', error);
            return null;
          }
          const linha = data as { id: string; created_at: string; content: string; nivel: number | null };
          return {
            id: linha.id,
            causoId,
            autorNome: nome,
            autorHandle: handle,
            conteudo: linha.content,
            criadoEm: linha.created_at,
            respostaAId,
            nivel: (Math.min(Math.max(linha.nivel ?? 0, 0), 2) as 0 | 1 | 2),
          };
        } catch (erro) {
          console.error('Falha ao comentar', erro);
          return null;
        }
      }

      const causo = causosMemoria.find((c) => c.id === causoId);
      if (!causo) return null;
      const nova: RespostaDeCauso = {
        id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        causoId,
        autorNome: nome,
        autorHandle: handle,
        conteudo: texto,
        criadoEm: new Date().toISOString(),
        respostaAId,
      };
      const lista = [...(causo.comentarios ?? []), nova];
      atualizarMemoria(causoId, { totalComentarios: lista.length, comentarios: lista });
      return nova;
    },

    // Comunidades "minhas" é preferência deste aparelho: não há tabela de
    // membros no escopo atual, e nenhuma tela mostra isso como contagem.
    async apagarCauso(causoId: string, opcoes?: { readonly apagarAudio?: boolean }): Promise<boolean> {
      const causo = causosMemoria.find((c) => c.id === causoId);

      if (usaServidor() && !ehLocal(causoId)) {
        try {
          const sessao = await garantirSessao();
          if (!sessao?.user?.id) return false;

          // O áudio primeiro: se o arquivo não sair, o causo fica de pé e dá
          // para tentar de novo. Na ordem inversa o arquivo ficaria órfão.
          if (opcoes?.apagarAudio) {
            const resultadoId =
              causo?.resultadoId ?? (await this.obterCauso(causoId))?.resultadoId;
            if (resultadoId) {
              const feito = await criarDesafiosWeb().apagarMeuArroto(resultadoId);
              if (feito !== 'apagado') return false;
            }
          }

          const { data, error } = await comTempo(
            supabase.from('posts_comunidade').delete().eq('id', causoId).eq('user_id', sessao.user.id).select('id'),
            TEMPO_DA_ESCRITA_MS,
            'apagar causo',
          );
          // RLS que recusa não dá erro: devolve lista vazia. Vazio = não apagou.
          if (error || !data || data.length === 0) {
            console.error('O servidor não apagou o causo', error);
            return false;
          }
        } catch (erro) {
          console.error('Falha ao apagar o causo', erro);
          return false;
        }
      }

      const idx = causosMemoria.findIndex((c) => c.id === causoId);
      if (idx >= 0) {
        causosMemoria.splice(idx, 1);
        salvarCausosLocais(causosMemoria);
      }
      return true;
    },

    async entrarComunidade(slug: string): Promise<boolean> {
      minhasComunidadesMemoria.add(slug);
      salvarMinhasComunidadesLocais(Array.from(minhasComunidadesMemoria));
      return true;
    },

    async sairComunidade(slug: string): Promise<boolean> {
      minhasComunidadesMemoria.delete(slug);
      salvarMinhasComunidadesLocais(Array.from(minhasComunidadesMemoria));
      return true;
    },

    async listarMinhasComunidades(): Promise<readonly string[]> {
      return Array.from(minhasComunidadesMemoria);
    },

    async denunciarCauso(causoId: string, motivo: string): Promise<boolean> {
      if (usaServidor() && !ehLocal(causoId)) {
        try {
          const sessao = await garantirSessao();
          if (!sessao?.user?.id) return false;
          const { error } = await comTempo(
            supabase.from('denuncias').insert({
              post_id: causoId,
              user_id: sessao.user.id,
              reason: motivo.trim().length >= 3 ? motivo.trim() : 'Conteúdo impróprio',
            }),
            TEMPO_DA_ESCRITA_MS,
            'denunciar',
          );
          // 23505: já denunciou. Está registrado, então conta como feito.
          if (error && (error as { code?: string }).code !== '23505') {
            console.error('O servidor recusou a denúncia', error);
            return false;
          }
        } catch (erro) {
          console.error('Falha ao denunciar', erro);
          return false;
        }
      }

      denunciasLocais.add(causoId);
      return true;
    },
  };
}

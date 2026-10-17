import { configuracaoAusente, supabase } from '../../db/supabase';
import { garantirSessao } from '../../shared/auth/sessaoAnonima';
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

const CHAVE_CAUSOS = 'aue.causos.v1';
const CHAVE_MINHAS_COMUNIDADES = 'aue.minhas_comunidades.v1';

function lerCausosLocais(): CausoPostado[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const bruto = localStorage.getItem(CHAVE_CAUSOS);
    if (!bruto) return [];
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function salvarCausosLocais(causos: readonly CausoPostado[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CHAVE_CAUSOS, JSON.stringify(causos));
  } catch {
    // ignora erro no safari privado
  }
}

function lerMinhasComunidadesLocais(): string[] {
  try {
    if (typeof localStorage === 'undefined') return ['bonde-geral', 'eu-arroto-e-dai'];
    const bruto = localStorage.getItem(CHAVE_MINHAS_COMUNIDADES);
    if (!bruto) return ['bonde-geral', 'eu-arroto-e-dai'];
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? parsed : ['bonde-geral', 'eu-arroto-e-dai'];
  } catch {
    return ['bonde-geral', 'eu-arroto-e-dai'];
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

/**
 * Adaptador Web da Porta de Comunidade e Feed do Auê 3.0.
 *
 * Conecta com o Supabase (`posts_comunidade`, `reacoes`, `denuncias`) quando
 * as credenciais estiverem ativas, e possui fallback elegante para garantir
 * que o feed nunca fique quebrado ou vazio (cold-start / offline).
 */
export function criarComunidadeWeb(
  opcoes: {
    causosIniciais?: readonly CausoPostado[];
    forcarOffline?: boolean;
  } = {},
): PortaDeComunidade {
  const causosSalvos = lerCausosLocais();
  // Estado local em memória sincronizado com armazenamento local
  const causosMemoria: CausoPostado[] = [
    ...(causosSalvos.length > 0 ? causosSalvos : (opcoes.causosIniciais ?? CAUSOS_PADRAO)),
  ];
  const denunciasLocais = new Set<string>();
  const minhasComunidadesMemoria = new Set<string>(lerMinhasComunidadesLocais());

  return {
    async listarComunidades(): Promise<readonly Comunidade[]> {
      return COMUNIDADES_PADRAO;
    },

    async listarFeed(filtros?: FiltrosDoFeed): Promise<readonly CausoPostado[]> {
      const slug = filtros?.comunidadeSlug;
      const limite = filtros?.limite ?? 30;

      if (!opcoes.forcarOffline && !configuracaoAusente) {
        try {
          let query = supabase
            .from('posts_comunidade')
            .select(`
              id,
              group_id,
              user_id,
              content,
              topic,
              result_id,
              created_at,
              resultados (
                score,
                duration,
                origin_subtype,
                audio_url
              )
            `)
            .order('created_at', { ascending: false })
            .limit(limite);

          if (slug && slug !== 'todos') {
            const comu = obterComunidadePorSlug(slug);
            if (comu) {
              query = query.eq('topic', comu.nome);
            }
          }

          const { data, error } = await query;

          if (!error && data && data.length > 0) {
            const mapeados: CausoPostado[] = data
              .filter((p) => !denunciasLocais.has(p.id))
              .map((p) => {
                const comuEncontrada = COMUNIDADES_PADRAO.find(
                  (c) => c.nome === p.topic || c.id === p.group_id,
                ) ?? COMUNIDADES_PADRAO[0];

                const resultado = Array.isArray(p.resultados)
                  ? p.resultados[0]
                  : p.resultados;

                return {
                  id: p.id,
                  comunidadeId: comuEncontrada.id,
                  comunidadeSlug: comuEncontrada.slug,
                  autorNome: 'Arrotador Anônimo',
                  autorHandle: 'arrotador_anonimo',
                  conteudo: p.content || '',
                  resultadoId: p.result_id ?? undefined,
                  nota: resultado?.score ?? undefined,
                  duracaoSegundos: resultado?.duration ?? undefined,
                  origem: resultado?.origin_subtype ?? undefined,
                  audioUrl: resultado?.audio_url ?? undefined,
                  reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
                  minhaReacao: null,
                  curtidas: 0,
                  reposts: 0,
                  totalComentarios: 0,
                  criadoEm: p.created_at,
                };
              });

            return mapeados;
          }
        } catch {
          // Falha de rede: cai pro fallback de memória
        }
      }

      // Fallback em memória (cold-start / offline / sem credenciais)
      let filtrados = causosMemoria.filter((c) => !denunciasLocais.has(c.id));
      if (slug && slug !== 'todos') {
        filtrados = filtrados.filter((c) => c.comunidadeSlug === slug);
      }
      return filtrados.slice(0, limite);
    },

    async postarCauso(pedido: PedidoDePostagemDeCauso): Promise<ResultadoDaPostagem> {
      // Trava 1: Conteúdo não pode ser vazio
      if (!pedido.conteudo || !pedido.conteudo.trim()) {
        return { ok: false, motivo: 'conteudoVazio' };
      }

      // Trava 2 (LGPD): Se tem áudio atrelado, consentimento é obrigatório
      if (pedido.resultadoId && !pedido.consentimentoAudioPublico) {
        return { ok: false, motivo: 'consentimentoObrigatorio' };
      }

      const comu = obterComunidadePorSlug(pedido.comunidadeSlug) ?? COMUNIDADES_PADRAO[0];
      const autorHandle = pedido.autorHandle || (pedido.autorNome || 'arrotador').toLowerCase().replace(/\s+/g, '_');

      // Se conectado ao Supabase
      if (!opcoes.forcarOffline && !configuracaoAusente) {
        try {
          const sessao = await garantirSessao();
          if (!sessao) {
            return { ok: false, motivo: 'semRede' };
          }

          const { data, error } = await supabase
            .from('posts_comunidade')
            .insert({
              group_id: null,
              user_id: sessao.user.id,
              post_type: pedido.resultadoId ? 'audio_result' : 'text_announcement',
              result_id: pedido.resultadoId ?? null,
              topic: comu.nome,
              content: pedido.conteudo.trim(),
            })
            .select()
            .single();

          if (error || !data) {
            return { ok: false, motivo: 'falhou', detalhe: error?.message ?? 'Erro ao salvar post' };
          }

          const novoCauso: CausoPostado = {
            id: data.id,
            comunidadeId: comu.id,
            comunidadeSlug: comu.slug,
            autorNome: pedido.autorNome || 'Você',
            autorHandle,
            conteudo: data.content,
            resultadoId: pedido.resultadoId,
            nota: pedido.nota,
            audioUrl: pedido.audioUrl,
            duracaoSegundos: pedido.duracaoSegundos,
            origem: pedido.origem,
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

          causosMemoria.unshift(novoCauso);
          salvarCausosLocais(causosMemoria);
          return { ok: true, causo: novoCauso };
        } catch (err: unknown) {
          const detalhe = err instanceof Error ? err.message : String(err);
          return { ok: false, motivo: 'falhou', detalhe };
        }
      }

      // Modo local / offline
      const novoCauso: CausoPostado = {
        id: `causo-local-${Date.now()}`,
        comunidadeId: comu.id,
        comunidadeSlug: comu.slug,
        autorNome: pedido.autorNome || 'Você',
        autorHandle,
        conteudo: pedido.conteudo.trim(),
        resultadoId: pedido.resultadoId,
        nota: pedido.nota,
        audioUrl: pedido.audioUrl,
        duracaoSegundos: pedido.duracaoSegundos,
        origem: pedido.origem,
        reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
        minhaReacao: null,
        curtidas: 0,
        curtidoPorMim: false,
        reposts: 0,
        repostadoPorMim: false,
        totalComentarios: 0,
        criadoEm: new Date().toISOString(),
        meu: true,
      };

      causosMemoria.unshift(novoCauso);
      salvarCausosLocais(causosMemoria);
      return { ok: true, causo: novoCauso };
    },

    async alternarReacao(
      causoId: string,
      reacao: TipoDeReacao,
    ): Promise<{ readonly ok: boolean; readonly reacoes: Readonly<Record<TipoDeReacao, number>> }> {
      const causo = causosMemoria.find((c) => c.id === causoId);
      if (!causo) {
        return { ok: false, reacoes: { fogo: 0, nojo: 0, trofeu: 0 } };
      }

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

      const idx = causosMemoria.indexOf(causo);
      causosMemoria[idx] = {
        ...causo,
        reacoes: novasReacoes,
        minhaReacao: novaMinhaReacao,
      };
      salvarCausosLocais(causosMemoria);

      return { ok: true, reacoes: novasReacoes };
    },

    async alternarCurtida(causoId: string): Promise<{ readonly ok: boolean; readonly curtidas: number; readonly curtido: boolean }> {
      const causo = causosMemoria.find((c) => c.id === causoId);
      if (!causo) {
        return { ok: false, curtidas: 0, curtido: false };
      }

      const novoCurtido = !causo.curtidoPorMim;
      const novasCurtidas = novoCurtido ? (causo.curtidas || 0) + 1 : Math.max(0, (causo.curtidas || 0) - 1);

      const idx = causosMemoria.indexOf(causo);
      causosMemoria[idx] = {
        ...causo,
        curtidas: novasCurtidas,
        curtidoPorMim: novoCurtido,
      };
      salvarCausosLocais(causosMemoria);

      return { ok: true, curtidas: novasCurtidas, curtido: novoCurtido };
    },

    async alternarRepost(causoId: string): Promise<{ readonly ok: boolean; readonly reposts: number; readonly repostado: boolean }> {
      const causo = causosMemoria.find((c) => c.id === causoId);
      if (!causo) {
        return { ok: false, reposts: 0, repostado: false };
      }

      const novoRepost = !causo.repostadoPorMim;
      const novosReposts = novoRepost ? (causo.reposts || 0) + 1 : Math.max(0, (causo.reposts || 0) - 1);

      const idx = causosMemoria.indexOf(causo);
      causosMemoria[idx] = {
        ...causo,
        reposts: novosReposts,
        repostadoPorMim: novoRepost,
      };
      salvarCausosLocais(causosMemoria);

      return { ok: true, reposts: novosReposts, repostado: novoRepost };
    },

    async listarRespostas(causoId: string): Promise<readonly RespostaDeCauso[]> {
      const causo = causosMemoria.find((c) => c.id === causoId);
      return causo?.comentarios ?? [];
    },

    async adicionarResposta(
      causoId: string,
      conteudo: string,
      autorNome: string,
      autorHandle?: string,
    ): Promise<RespostaDeCauso | null> {
      if (!conteudo || !conteudo.trim()) return null;
      const causo = causosMemoria.find((c) => c.id === causoId);
      if (!causo) return null;

      const novaResposta: RespostaDeCauso = {
        id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        causoId,
        autorNome: autorNome || 'Você',
        autorHandle: autorHandle || (autorNome || 'voce').toLowerCase().replace(/\s+/g, '_'),
        conteudo: conteudo.trim(),
        criadoEm: new Date().toISOString(),
      };

      const lista = [...(causo.comentarios ?? []), novaResposta];
      const idx = causosMemoria.indexOf(causo);
      causosMemoria[idx] = {
        ...causo,
        totalComentarios: lista.length,
        comentarios: lista,
      };
      salvarCausosLocais(causosMemoria);

      return novaResposta;
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
      denunciasLocais.add(causoId);

      if (!opcoes.forcarOffline && !configuracaoAusente) {
        try {
          await supabase.from('denuncias').insert({
            post_id: causoId,
            motivo: motivo.trim() || 'Conteúdo impróprio',
            denunciado_em: new Date().toISOString(),
          });
        } catch {
          // Não quebra a interface se a tabela não responder
        }
      }

      return true;
    },
  };
}

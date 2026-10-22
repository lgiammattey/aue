import { supabase } from '../../db/supabase';
import type { ArmazenamentoLocal } from '../../portas/armazenamento';
import {
  EVENTOS_DE_TELEMETRIA,
  type DetalheDoEvento,
  type EventoDeTelemetria,
  type Telemetria,
} from '../../portas/telemetria';
import { lerAquisicaoDaURL } from '../../nucleo/telemetria/aquisicao';
import {
  comAbriuArenaRegistrada,
  comPaginaVisitada,
  decidirSessao,
  jaVisitouPagina,
  type SessaoDeTelemetria,
} from '../../nucleo/telemetria/sessao';
import { PAGINAS_MONITORADAS } from '../../nucleo/telemetria/paginas';

/**
 * A telemetria de verdade: `eventos_de_telemetria`, gravada best-effort.
 *
 * NADA AQUI PODE QUEBRAR O JOGO (`docs/schema/nomenclatura.md`, migração
 * `20260826000001`). Toda falha — rede, configuração, banco recusando a
 * linha — é engolida em silêncio. Quem joga nunca vê um erro de telemetria, e
 * nenhum `await` desta porta atravessa o caminho da partida.
 */

const CHAVE_DA_SESSAO = 'aue.sessao-telemetria.v1';
const PLATAFORMA = 'web';

/**
 * Versão do build, quando existe. `VITE_*` é lida em tempo de build (como
 * toda variável desta família); sem ela, a coluna simplesmente fica `null` —
 * não é bloqueante e não impede nenhum evento de ser gravado.
 */
const VERSAO_APP = (import.meta.env.VITE_APP_VERSION as string | undefined) || null;

/**
 * Janela curta para engolir o mesmo evento repetido — a proteção contra
 * re-render do React (StrictMode monta efeito duas vezes, clique duplo,
 * promessa que resolve atrasada). Não substitui colocar a chamada no lugar
 * certo da Arena; é a segunda rede, testável sozinha.
 */
const JANELA_DE_DEDUPLICACAO_MS = 1500;

/**
 * Identificador de sessão não é segredo nem credencial. Em HTTP local alguns
 * navegadores expõem `crypto`, mas não `crypto.randomUUID`; telemetria jamais
 * pode derrubar a tela por isso.
 */
function gerarIdDeSessao(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  // A coluna `sessao_id` é UUID. A queda precisa continuar compatível com o
  // contrato do banco, mesmo que tenha entropia menor em um HTTP local.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (marcador) => {
    const aleatorio = Math.floor(Math.random() * 16);
    const nibble = marcador === 'x' ? aleatorio : (aleatorio & 0x3) | 0x8;
    return nibble.toString(16);
  });
}

function assinaturaDoEvento(evento: EventoDeTelemetria, detalhe?: DetalheDoEvento): string {
  return `${evento}:${detalhe?.batalhaCodigo ?? ''}:${detalhe?.pagina ?? ''}`;
}

function lerSessaoGuardada(armazenamento: ArmazenamentoLocal): SessaoDeTelemetria | null {
  const bruto = armazenamento.ler(CHAVE_DA_SESSAO);
  if (!bruto) return null;

  try {
    const valor: unknown = JSON.parse(bruto);
    if (
      typeof valor !== 'object' ||
      valor === null ||
      typeof (valor as { id?: unknown }).id !== 'string' ||
      typeof (valor as { expiraEm?: unknown }).expiraEm !== 'number' ||
      typeof (valor as { origem?: unknown }).origem !== 'string' ||
      typeof (valor as { abriuArenaRegistrada?: unknown }).abriuArenaRegistrada !== 'boolean'
    ) {
      return null;
    }
    const paginas = (valor as { paginasVisitadas?: unknown }).paginasVisitadas;
    const paginasVisitadas = Array.isArray(paginas) && paginas.every((pagina) =>
      typeof pagina === 'string' && (PAGINAS_MONITORADAS as readonly string[]).includes(pagina),
    ) ? paginas : [];
    return { ...(valor as SessaoDeTelemetria), paginasVisitadas };
  } catch {
    /* JSON corrompido: trata como se não houvesse sessão guardada. */
    return null;
  }
}

/** `plataforma/web/*` é o único lugar que pode tocar `window`, `crypto` e o cliente do Supabase (ADR 0001 §2). */
export function criarTelemetriaWeb(armazenamento: ArmazenamentoLocal): Telemetria {
  let ultimoEnvio: { assinatura: string; em: number } | null = null;

  function sessaoAtual(agora: number): SessaoDeTelemetria {
    const aquisicaoAtual = lerAquisicaoDaURL(new URLSearchParams(window.location.search));
    const sessao = decidirSessao({
      guardada: lerSessaoGuardada(armazenamento),
      agora,
      aquisicaoAtual,
      gerarId: gerarIdDeSessao,
    });
    armazenamento.gravar(CHAVE_DA_SESSAO, JSON.stringify(sessao));
    return sessao;
  }

  function enviar(evento: EventoDeTelemetria, sessao: SessaoDeTelemetria, detalhe?: DetalheDoEvento): void {
    try {
      const promessa = supabase.from('eventos_de_telemetria').insert({
        evento,
        sessao_id: sessao.id,
        origem: sessao.origem,
        campanha: sessao.campanha,
        conteudo: sessao.conteudo,
        plataforma: PLATAFORMA,
        versao_app: VERSAO_APP,
        batalha_codigo: detalhe?.batalhaCodigo ?? null,
        pagina: detalhe?.pagina ?? null,
      });

      /*
        `.then` com os dois braços, e não `.catch` encadeado: builder do
        supabase-js é PromiseLike, não Promise — não há garantia de `.catch`
        antes de `.then` resolver a cadeia. Os dois braços cobrem rejeição de
        rede e erro reportado no corpo da resposta.
      */
      void promessa.then(
        ({ error }) => {
          if (error) {
            console.warn('[telemetria] evento não gravado:', evento, error.message);
          }
        },
        () => {
          /* Sem rede, ou o servidor não respondeu. A jornada segue igual. */
        },
      );
    } catch {
      /* Configuração ausente, ou qualquer outra coisa síncrona dando errado. */
    }
  }

  return {
    registrar(evento, detalhe) {
      /*
        SEGUNDA CAMADA CONTRA EVENTO INVÁLIDO. O CHECK do banco
        (`eventos_de_telemetria_evento_valido`) já recusaria a linha — isto
        aqui evita a ida à rede quando `evento` chega errado por um `as`
        forçado ou por uma versão do bundle que ficou para trás do banco.
      */
      if (!(EVENTOS_DE_TELEMETRIA as readonly string[]).includes(evento)) {
        return;
      }
      if (evento === 'visitou_pagina' && (!detalhe?.pagina || !(PAGINAS_MONITORADAS as readonly string[]).includes(detalhe.pagina))) return;
      if (evento !== 'visitou_pagina' && detalhe?.pagina) return;

      const agora = Date.now();
      const assinatura = assinaturaDoEvento(evento, detalhe);

      if (ultimoEnvio && ultimoEnvio.assinatura === assinatura && agora - ultimoEnvio.em < JANELA_DE_DEDUPLICACAO_MS) {
        return;
      }
      ultimoEnvio = { assinatura, em: agora };

      let sessao = sessaoAtual(agora);

      if (evento === 'abriu_arena') {
        if (sessao.abriuArenaRegistrada) return;
        sessao = comAbriuArenaRegistrada(sessao);
        armazenamento.gravar(CHAVE_DA_SESSAO, JSON.stringify(sessao));
      }

      if (evento === 'visitou_pagina') {
        if (jaVisitouPagina(sessao, detalhe!.pagina!)) return;
        sessao = comPaginaVisitada(sessao, detalhe!.pagina!);
        armazenamento.gravar(CHAVE_DA_SESSAO, JSON.stringify(sessao));
      }

      enviar(evento, sessao, detalhe);
    },
  };
}

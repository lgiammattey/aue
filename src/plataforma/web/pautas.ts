import { configuracaoAusente, supabase } from '../../db/supabase';
import type { MotivoDeLeitura, ResultadoDaLeitura, TopicoDoForum } from '../../portas/forum';
import type { PautaDoForum, PortaDePautas } from '../../portas/pautas';
import { paraTopico, type Linha } from './forum';

/** Adaptador web das pautas: a única camada que conhece a RPC do Supabase. */

const TEMPO_DA_LEITURA_MS = 6000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class RespostaMalformada extends Error {}

function servidorConfigurado(): boolean {
  if (configuracaoAusente) return false;
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (url.includes('aue-dev.supabase.co') || url.includes('exemplo.supabase.co')) return false;
  if (chave.includes('chave-ficticia') || chave.includes('chave-ausente')) return false;
  return true;
}

function comTempo<T>(promessa: PromiseLike<T>, ms: number, rotulo: string): Promise<T> {
  let relogio: ReturnType<typeof setTimeout>;
  const limite = new Promise<never>((_, rejeitar) => {
    relogio = setTimeout(() => rejeitar(new Error(`Tempo esgotado: ${rotulo}`)), ms);
  });
  return Promise.race([Promise.resolve(promessa), limite]).finally(() => clearTimeout(relogio));
}

function malformada(campo: string): never {
  throw new RespostaMalformada(`campo inválido: ${campo}`);
}

function linhaDe(valor: unknown): Linha {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) malformada('linha');
  return valor as Linha;
}

function textoOuNulo(linha: Linha, campo: string): string | null {
  const valor = linha[campo];
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string') malformada(campo);
  return valor === '' ? null : valor;
}

function inteiro(linha: Linha, campo: string): number {
  const valor = Number(linha[campo]);
  if (!Number.isInteger(valor) || valor < 0) malformada(campo);
  return valor;
}

function motivoDeLeitura(erro: { readonly hint?: string | null }): MotivoDeLeitura {
  return erro.hint?.trim() === 'cursor_invalido' ? 'cursorInvalido'
    : erro.hint?.trim() === 'ordem_invalida' ? 'ordemInvalida'
      : 'falhou';
}

function listaDe(valor: unknown): Linha[] {
  if (!Array.isArray(valor)) malformada('lista');
  return valor.map(linhaDe);
}

/**
 * Cria a porta isolada para a conversa agrupada. `forcarOffline` existe para
 * prova de falha real e para os testes; não cria dados locais.
 */
export function criarPautasWeb(opcoes: { readonly forcarOffline?: boolean } = {}): PortaDePautas {
  const usaServidor = (): boolean => !opcoes.forcarOffline && servidorConfigurado();

  return {
    async obterPautaPorTopico(topicoId): Promise<ResultadoDaLeitura<PautaDoForum | null>> {
      if (!UUID.test(topicoId)) return usaServidor() ? { ok: true, valor: null } : { ok: false, motivo: 'semServidor' };
      if (!usaServidor()) return { ok: false, motivo: 'semServidor' };

      try {
        const { data, error } = await comTempo(
          supabase.rpc('obter_pauta_por_topico', { p_topico_id: topicoId }),
          TEMPO_DA_LEITURA_MS,
          'obter_pauta_por_topico',
        );
        if (error) {
          const motivo = motivoDeLeitura(error);
          if (motivo === 'falhou') console.error('Falha ao ler pauta', error);
          return { ok: false, motivo };
        }

        const linhas = listaDe(data);
        if (linhas.length === 0) return { ok: true, valor: null };

        const primeira = linhas[0];
        const pauta = paraTopico(linhaDe(primeira.pauta));
        const foco = textoOuNulo(primeira, 'entrada_em_foco_id');
        const entradas: TopicoDoForum[] = [];
        let posicaoAnterior = 0;
        for (const linha of linhas) {
          const pautaDaLinha = paraTopico(linhaDe(linha.pauta));
          if (pautaDaLinha.id !== pauta.id || textoOuNulo(linha, 'entrada_em_foco_id') !== foco) malformada('pauta');
          const posicao = inteiro(linha, 'posicao');
          if (posicao <= posicaoAnterior) malformada('posicao');
          posicaoAnterior = posicao;
          entradas.push(paraTopico(linhaDe(linha.entrada)));
        }
        if (foco !== null && !entradas.some((entrada) => entrada.id === foco)) malformada('entrada_em_foco_id');
        return { ok: true, valor: { pauta, entradas, entradaEmFocoId: foco } };
      } catch (erro) {
        console.error('Falha ao ler pauta', erro);
        return { ok: false, motivo: 'falhou' };
      }
    },
  };
}

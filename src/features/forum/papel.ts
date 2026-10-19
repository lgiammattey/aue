import { createContext, useContext, useEffect, useState } from 'react';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';

/**
 * Quem está vendo. Só distingue o que a leitura precisa:
 * - `visitante`: sem sessão ou sessão de convidado (lê tudo, não participa);
 * - `conta`: conta de verdade, com as comunidades onde ela já participa;
 * - `desconhecido`: não deu para saber (rede, servidor). A tela não chuta nem
 *   mostra convite de visitante para quem pode estar logado.
 */
export type Papel =
  | { readonly tipo: 'carregando' }
  | { readonly tipo: 'visitante' }
  | { readonly tipo: 'conta'; readonly slugsDeMembro: ReadonlySet<string> }
  | { readonly tipo: 'desconhecido' };

export function useDescobrirPapel(conta: PortaDeConta, comunidade: PortaDeComunidade): Papel {
  const [papel, setPapel] = useState<Papel>({ tipo: 'carregando' });

  useEffect(() => {
    let ativo = true;
    (async () => {
      let estado;
      try {
        estado = await conta.estado();
      } catch {
        if (ativo) setPapel({ tipo: 'desconhecido' });
        return;
      }
      // Conta que ainda não foi promovida (ou sem sessão) não participa: vê o convite, não um erro.
      if (!estado.temSessao || estado.anonima || estado.podeParticiparSocialmente === false) {
        if (ativo) setPapel({ tipo: 'visitante' });
        return;
      }
      // Conta promovida entra sozinha no bonde-geral; o servidor só conta isso ao escrever,
      // então a lista das minhas comunidades é quem diz. Se ela falhar, vale só o que a leitura trouxe.
      let slugs: readonly string[] = [];
      try {
        slugs = await comunidade.listarMinhasComunidades();
      } catch {
        slugs = [];
      }
      if (ativo) setPapel({ tipo: 'conta', slugsDeMembro: new Set(slugs) });
    })();
    return () => {
      ativo = false;
    };
  }, [conta, comunidade]);

  return papel;
}

export const ContextoDoPapel = createContext<Papel>({ tipo: 'carregando' });

export function usePapel(): Papel {
  return useContext(ContextoDoPapel);
}

// ---------------------------------------------------------------------------
// Participação: quem entrou e quem saiu nesta sessão
// ---------------------------------------------------------------------------

/**
 * O que a pessoa fez NESTA sessão (entrou ou saiu), por cima do que a leitura trouxe.
 * Só é preenchido DEPOIS que o servidor respondeu `true` (nada de otimismo). Vale mais
 * que `sou_membro` e que a lista inicial de comunidades, que ficam velhas depois da ação.
 */
export interface Participacao {
  /** `doServidor` é o que a leitura trouxe; a ação desta sessão ganha dele. */
  ehMembro(slug: string, doServidor: boolean): boolean;
  definirMembro(slug: string, membro: boolean): void;
}

export const ContextoDaParticipacao = createContext<Participacao>({
  ehMembro: (_slug, doServidor) => doServidor,
  definirMembro: () => {},
});

export function useParticipacao(): Participacao {
  return useContext(ContextoDaParticipacao);
}

/**
 * Sou membro desta comunidade? A ação da sessão manda; depois, o que a leitura
 * da comunidade trouxe ou a lista das minhas comunidades (que inclui o bonde-geral
 * para conta promovida).
 */
export function useSouMembro(slug: string, souMembroNaLeitura: boolean): boolean {
  const papel = usePapel();
  const participacao = useParticipacao();
  const daLista = papel.tipo === 'conta' && papel.slugsDeMembro.has(slug);
  return participacao.ehMembro(slug, souMembroNaLeitura || daLista);
}

/** O bonde-geral é de toda conta promovida: o servidor reentra a pessoa sozinho (spec 2.4), então não há "Sair". */
export const SLUG_DO_BONDE_GERAL = 'bonde-geral';

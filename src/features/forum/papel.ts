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
      if (!estado.temSessao || estado.anonima) {
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

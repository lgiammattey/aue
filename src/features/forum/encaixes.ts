import { createContext, useContext, useEffect } from 'react';
import { useDependenciasDoForum } from './contexto';

// Encaixes: a barra do topo e o aside são da casca; o conteúdo de cada um é da tela.

export interface Encaixes {
  readonly topo: HTMLElement | null;
  readonly aside: HTMLElement | null;
  readonly anunciar: (mensagem: string) => void;
  /** A tela diz se é raiz (Comunidades, Explorar) ou aninhada; a barra do topo muda com isso. */
  readonly definirRaiz: (raiz: boolean) => void;
}

export const ContextoDosEncaixes = createContext<Encaixes>({
  topo: null,
  aside: null,
  anunciar: () => {},
  definirRaiz: () => {},
});

/** Região de status única da tela: "Carregando tópicos", "Mais 5 tópicos carregados", "A internet voltou." */
export function useAnunciar(): (mensagem: string) => void {
  return useContext(ContextoDosEncaixes).anunciar;
}

/** Título da aba: "{Título} · Auê!". Vazio enquanto não há o que dizer. */
export function useTituloDoDocumento(titulo: string | null): void {
  const { ambiente } = useDependenciasDoForum();
  useEffect(() => {
    if (titulo) ambiente.definirTituloDoDocumento(`${titulo} · Auê!`);
  }, [ambiente, titulo]);
}


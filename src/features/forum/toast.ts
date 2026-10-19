import { createContext, useContext } from 'react';

/** Confirmação curta (spec 6.12): "Você saiu de X.", "Tópico criado.". Erro nunca vira toast. */
export const ContextoDoToast = createContext<(texto: string) => void>(() => {});

export function useToast(): (texto: string) => void {
  return useContext(ContextoDoToast);
}

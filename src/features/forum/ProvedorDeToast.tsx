import { useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ContextoDosEncaixes } from './encaixes';
import { ContextoDoToast } from './toast';

const DURACAO_DO_TOAST_MS = 3000;

/**
 * Três segundos (spec 6.12). O toast é só visual (`aria-hidden`): quem fala é a
 * região de status única da casca, para a tela nunca ter duas regiões vivas
 * dizendo a mesma coisa.
 */
export function ProvedorDeToast({ children }: { readonly children: ReactNode }) {
  const { anunciar } = useContext(ContextoDosEncaixes);
  const [toast, setToast] = useState<{ readonly texto: string; readonly n: number } | null>(null);
  const mostrar = useCallback(
    (texto: string) => {
      setToast((t) => ({ texto, n: (t?.n ?? 0) + 1 }));
      anunciar(texto);
    },
    [anunciar],
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), DURACAO_DO_TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <ContextoDoToast.Provider value={mostrar}>
      {children}
      <div className="forum-toast-area" aria-hidden="true">
        {toast && (
          <p className="forum-toast" key={toast.n}>
            {toast.texto}
          </p>
        )}
      </div>
    </ContextoDoToast.Provider>
  );
}

import { useEffect, useId, useRef, useState } from 'react';

interface Props {
  readonly aoDenunciar?: () => void;
  readonly aoApagar?: () => void;
}

/** "⋯" do post: Apagar (só do autor) e Denunciar (de quem não é o autor). Sem ação, não aparece. */
export function MenuDoPost({ aoDenunciar, aoApagar }: Props) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const idDoMenu = useId();

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
        botao.current?.focus();
      }
    };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', tecla);
    };
  }, [aberto]);

  if (!aoDenunciar && !aoApagar) return null;

  const escolher = (acao: () => void) => {
    setAberto(false);
    acao();
  };

  return (
    <div ref={raiz} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={botao}
        type="button"
        className="action-btn"
        aria-label="Mais ações"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idDoMenu : undefined}
        title="Mais ações"
        onClick={() => setAberto((v) => !v)}
      >
        <span aria-hidden="true" style={{ fontWeight: 700, letterSpacing: 1 }}>⋯</span>
      </button>
      {aberto && (
        <div
          id={idDoMenu}
          role="menu"
          style={{
            position: 'absolute', right: 0, bottom: '100%', zIndex: 20, minWidth: 160, padding: 4,
            background: 'var(--aue-surface, #14151a)', border: '1px solid var(--aue-line, #333)', borderRadius: 10,
            boxShadow: 'var(--aue-shadow, 0 8px 24px rgba(0,0,0,.4))',
          }}
        >
          {aoApagar && (
            <button type="button" role="menuitem" className="action-btn" style={{ width: '100%', justifyContent: 'flex-start', minHeight: 44 }} onClick={() => escolher(aoApagar)}>
              Apagar
            </button>
          )}
          {aoDenunciar && (
            <button type="button" role="menuitem" className="action-btn" style={{ width: '100%', justifyContent: 'flex-start', minHeight: 44 }} onClick={() => escolher(aoDenunciar)}>
              Denunciar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

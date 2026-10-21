import { useEffect, useId, useRef, useState } from 'react';
import { espacoEmVolta } from '../../plataforma/web/espacoDoElemento';

/** Altura do menu (dois itens de 44px mais respiro) e o que a barra de cima e a de baixo cobrem. */
const ALTURA_DO_MENU = 108;
const RESERVA_DA_BARRA_DE_CIMA = 64;
const RESERVA_DA_BARRA_DE_BAIXO = 112;

interface Props {
  readonly aoDenunciar?: () => void;
  readonly aoApagar?: () => void;
}

/**
 * "⋯" do post: Apagar (só do autor) e Denunciar (de quem não é o autor). Sem ação, não aparece.
 * Vive no canto de cima do card. Abre para baixo; perto da barra inferior abre para cima.
 */
export function MenuDoPost({ aoDenunciar, aoApagar }: Props) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const [paraCima, setParaCima] = useState(false);
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
    <div ref={raiz} className="menu-do-post" style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={botao}
        type="button"
        className="menu-do-post__botao"
        aria-label="Mais ações"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idDoMenu : undefined}
        title="Mais ações"
        onClick={() => {
          if (!aberto && botao.current) {
            // Abre para baixo; se não couber acima da barra inferior (com a área segura), abre para cima.
            const { acima, abaixo } = espacoEmVolta(botao.current);
            const cabeAbaixo = abaixo - RESERVA_DA_BARRA_DE_BAIXO >= ALTURA_DO_MENU;
            const cabeAcima = acima - RESERVA_DA_BARRA_DE_CIMA >= ALTURA_DO_MENU;
            setParaCima(!cabeAbaixo && cabeAcima);
          }
          setAberto((v) => !v);
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {aberto && (
        <div
          id={idDoMenu}
          role="menu"
          className="menu-do-post__lista"
          data-lado={paraCima ? 'cima' : 'baixo'}
          style={{
            position: 'absolute', right: 0, ...(paraCima ? { bottom: '100%' } : { top: '100%' }), zIndex: 20, minWidth: 160, padding: 4,
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

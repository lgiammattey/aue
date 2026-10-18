import React from 'react';

export type TabNavegacaoMobile = 'feed' | 'arena' | 'comm' | 'desafios';

interface BarraInferiorMobileProps {
  abaAtiva: TabNavegacaoMobile;
  aoMudarAba: (aba: TabNavegacaoMobile) => void;
  aoAbrirComposer?: () => void;
  aoAbrirPerfil?: () => void;
}

export const BarraInferiorMobile: React.FC<BarraInferiorMobileProps> = ({
  abaAtiva,
  aoMudarAba,
  aoAbrirComposer,
  aoAbrirPerfil,
}) => {
  const tabs = [
    {
      id: 'feed' as const,
      label: 'Feed',
      d: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z',
    },
    {
      id: 'arena' as const,
      label: 'Auê',
      d: 'M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3',
    },
    {
      id: 'comm' as const,
      label: 'Comunidade',
      d: 'M16 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M17 14a5 5 0 015 5v2',
    },
    {
      id: 'desafios' as const,
      label: 'Desafios',
      d: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3',
    },
  ];

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: '56px',
          display: 'grid',
          gridTemplateColumns: `repeat(${tabs.length + (aoAbrirPerfil ? 1 : 0)}, 1fr)`,
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
          zIndex: 6,
        }}
        aria-label="Navegação móvel"
      >
        {tabs.map((t) => {
          const ativo = abaAtiva === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => aoMudarAba(t.id)}
              aria-label={t.label}
              style={{
                border: 0,
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: ativo ? 'var(--fg)' : 'var(--muted)',
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={ativo ? 2.4 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={t.d} />
              </svg>
            </button>
          );
        })}
        {aoAbrirPerfil && (
          <button
            type="button"
            onClick={aoAbrirPerfil}
            aria-label="Perfil"
            style={{ border: 0, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a8 8 0 0116 0v1" />
            </svg>
          </button>
        )}
      </nav>

      {/* Botão flutuante '+' mobile 56x56 */}
      {aoAbrirComposer && (
        <button
          type="button"
          onClick={aoAbrirComposer}
          aria-label="Novo post"
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '72px',
            zIndex: 6,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 0,
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            fontSize: '28px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          +
        </button>
      )}
    </>
  );
};

import React from 'react';

interface BarraInferiorMobileProps {
  abaAtiva: 'feed' | 'arena' | 'comm' | 'desafios' | 'perfil';
  aoMudarAba: (aba: 'feed' | 'arena' | 'comm' | 'desafios' | 'perfil') => void;
}

export const BarraInferiorMobile: React.FC<BarraInferiorMobileProps> = ({
  abaAtiva,
  aoMudarAba,
}) => {
  const abas = [
    {
      id: 'feed' as const,
      label: 'Bonde',
      d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    },
    {
      id: 'comm' as const,
      label: 'Bondes',
      d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z',
    },
    {
      id: 'arena' as const,
      label: 'Auê',
      d: 'M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3',
      destaque: true,
    },
    {
      id: 'desafios' as const,
      label: 'X1',
      d: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0z',
    },
    {
      id: 'perfil' as const,
      label: 'Perfil',
      d: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
    },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        boxSizing: 'content-box',
      }}
      aria-label="Navegação inferior mobile"
    >
      {abas.map((t) => {
        const ativo = abaAtiva === t.id;

        if (t.destaque) {
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => aoMudarAba(t.id)}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'var(--accent-on)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(198, 255, 0, 0.4)',
                transform: 'translateY(-10px)',
                transition: 'transform .1s ease',
              }}
              aria-label="Abrir Arena de Arroto"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={t.d} />
              </svg>
            </button>
          );
        }

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => aoMudarAba(t.id)}
            style={{
              flex: 1,
              height: '100%',
              minHeight: '44px',
              minWidth: '44px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              background: 'transparent',
              color: ativo ? 'var(--accent)' : 'var(--muted)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: ativo ? 700 : 500,
            }}
            aria-label={t.label}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={ativo ? '2.4' : '1.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={t.d} />
            </svg>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

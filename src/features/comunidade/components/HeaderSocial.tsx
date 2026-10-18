import React from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';

interface HeaderSocialProps {
  abaAtiva: 'feed' | 'comm' | 'desafios';
  filtroFeed: 'todos' | 'minhas';
  aoMudarFiltroFeed: (filtro: 'todos' | 'minhas') => void;
  isMobile: boolean;
  perfil?: PerfilUsuario;
  aoAbrirPerfil?: () => void;
  aoAbrirArena: () => void;
  tema: 'dark' | 'light';
  aoAlternarTema: () => void;
}

export const HeaderSocial: React.FC<HeaderSocialProps> = ({
  abaAtiva,
  filtroFeed,
  aoMudarFiltroFeed,
  isMobile: _isMobile,
  perfil: _perfil,
  aoAbrirPerfil: _aoAbrirPerfil,
  aoAbrirArena,
  tema,
  aoAlternarTema,
}) => {
  const titulos = {
    feed: 'Feed',
    comm: 'Comunidade',
    desafios: 'Desafios',
  };

  const themeIcon =
    tema === 'light'
      ? 'M21 13A9 9 0 1111 3a7 7 0 0010 10z'
      : 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1';

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: '53px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '20px' }}>{titulos[abaAtiva]}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={aoAbrirArena}
            style={{
              background: 'var(--accent, #c6ff00)',
              color: 'var(--accent-on, #000)',
              border: 0,
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Jogar o Auê</span>
          </button>
          <button
            type="button"
            onClick={aoAlternarTema}
            aria-label="Alternar tema"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--border-strong)',
              background: 'none',
              color: 'var(--fg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={themeIcon} />
            </svg>
          </button>
        </div>
      </div>

      {abaAtiva === 'feed' && (
        <div style={{ display: 'flex' }}>
          <button
            type="button"
            onClick={() => aoMudarFiltroFeed('todos')}
            style={{
              flex: 1,
              height: '52px',
              border: 0,
              background: 'none',
              color: filtroFeed === 'todos' ? 'var(--fg)' : 'var(--muted)',
              fontWeight: filtroFeed === 'todos' ? 700 : 500,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: filtroFeed === 'todos' ? '4px solid var(--ind)' : '4px solid transparent',
                boxSizing: 'border-box',
              }}
            >
              Para você
            </span>
          </button>
          <button
            type="button"
            onClick={() => aoMudarFiltroFeed('minhas')}
            style={{
              flex: 1,
              height: '52px',
              border: 0,
              background: 'none',
              color: filtroFeed === 'minhas' ? 'var(--fg)' : 'var(--muted)',
              fontWeight: filtroFeed === 'minhas' ? 700 : 500,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: filtroFeed === 'minhas' ? '4px solid var(--ind)' : '4px solid transparent',
                boxSizing: 'border-box',
              }}
            >
              Minhas comunidades
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

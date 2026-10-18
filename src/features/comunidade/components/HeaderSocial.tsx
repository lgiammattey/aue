import React from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';

interface HeaderSocialProps {
  abaAtiva: 'feed' | 'arena' | 'comm' | 'desafios' | 'perfil';
  filtroFeed: 'todos' | 'minhas';
  aoMudarFiltroFeed: (filtro: 'todos' | 'minhas') => void;
  isMobile: boolean;
  perfil: PerfilUsuario;
  aoAbrirPerfil: () => void;
  aoAbrirArena: () => void;
  tema: 'dark' | 'light';
  aoAlternarTema: () => void;
}

export const HeaderSocial: React.FC<HeaderSocialProps> = ({
  abaAtiva,
  filtroFeed,
  aoMudarFiltroFeed,
  isMobile,
  perfil,
  aoAbrirPerfil,
  aoAbrirArena,
  tema,
  aoAlternarTema,
}) => {
  const titulos = {
    feed: 'Início',
    arena: 'Arena Auê',
    comm: 'Comunidades',
    desafios: 'Desafios',
    perfil: 'Perfil',
  };

  const iniciais = (perfil.nome?.trim().split(/\s+/).length > 1
    ? (perfil.nome.trim().split(/\s+/)[0][0] + perfil.nome.trim().split(/\s+/)[1][0])
    : (perfil.nome?.slice(0, 2) || 'VC')
  ).toUpperCase();

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
          {isMobile && (
            <button
              type="button"
              onClick={aoAbrirPerfil}
              aria-label="Perfil"
              style={{
                width: '32px',
                height: '32px',
                flex: 'none',
                borderRadius: '50%',
                border: 0,
                background: 'var(--surface-2)',
                color: 'var(--fg)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {perfil.avatarUrl ? (
                <img
                  src={perfil.avatarUrl}
                  alt={perfil.nome}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                iniciais
              )}
            </button>
          )}
          <span style={{ fontWeight: 700, fontSize: '20px' }}>{titulos[abaAtiva]}</span>
        </div>

        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={aoAbrirArena}
              style={{
                background: 'none',
                border: 0,
                color: 'var(--fg)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Auê
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
        )}
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

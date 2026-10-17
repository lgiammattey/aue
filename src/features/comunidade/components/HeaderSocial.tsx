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
    feed: 'Bonde do Arroto',
    arena: 'Arena Auê',
    comm: 'Comunidades',
    desafios: 'Desafios X1',
    perfil: 'Seu Perfil',
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
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
              aria-label="Ver Perfil"
              style={{
                width: '34px',
                height: '34px',
                flex: 'none',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--fg)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {perfil.avatarUrl ? (
                <img src={perfil.avatarUrl} alt={perfil.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                perfil.nome.slice(0, 2).toUpperCase()
              )}
            </button>
          )}
          <span style={{ fontWeight: 800, fontSize: '20px', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
            {titulos[abaAtiva]}
          </span>
        </div>

        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {abaAtiva !== 'arena' && (
              <button
                type="button"
                onClick={aoAbrirArena}
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Arrotar
              </button>
            )}
            <button
              type="button"
              onClick={aoAlternarTema}
              aria-label="Alternar tema"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'none',
                color: 'var(--fg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {tema === 'dark' ? (
                  <circle cx="12" cy="12" r="5" />
                ) : (
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                )}
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Abas de filtro da timeline (Todos vs Minhas Comunidades) */}
      {abaAtiva === 'feed' && (
        <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => aoMudarFiltroFeed('todos')}
            style={{
              flex: 1,
              height: '48px',
              border: 'none',
              background: 'transparent',
              color: filtroFeed === 'todos' ? 'var(--fg)' : 'var(--muted)',
              fontWeight: filtroFeed === 'todos' ? 700 : 500,
              fontSize: '15px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <span>Todos os Causos</span>
            {filtroFeed === 'todos' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '25%',
                  right: '25%',
                  height: '3px',
                  borderRadius: '999px',
                  background: 'var(--accent)',
                }}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => aoMudarFiltroFeed('minhas')}
            style={{
              flex: 1,
              height: '48px',
              border: 'none',
              background: 'transparent',
              color: filtroFeed === 'minhas' ? 'var(--fg)' : 'var(--muted)',
              fontWeight: filtroFeed === 'minhas' ? 700 : 500,
              fontSize: '15px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <span>Minhas Comunidades</span>
            {filtroFeed === 'minhas' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '25%',
                  right: '25%',
                  height: '3px',
                  borderRadius: '999px',
                  background: 'var(--accent)',
                }}
              />
            )}
          </button>
        </div>
      )}
    </header>
  );
};

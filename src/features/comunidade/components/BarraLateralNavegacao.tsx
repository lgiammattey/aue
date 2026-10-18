import React from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';

interface BarraLateralNavegacaoProps {
  abaAtiva: 'feed' | 'comm' | 'desafios';
  aoMudarAba: (aba: 'feed' | 'comm' | 'desafios') => void;
  aoAbrirComposer: () => void;
  compacto?: boolean;
  tema: 'dark' | 'light';
  aoAlternarTema: () => void;
  perfil?: PerfilUsuario;
  aoAbrirPerfil?: () => void;
}

export const BarraLateralNavegacao: React.FC<BarraLateralNavegacaoProps> = ({
  abaAtiva,
  aoMudarAba,
  aoAbrirComposer,
  compacto = false,
  tema,
  aoAlternarTema,
  aoAbrirPerfil,
}) => {
  const wide = !compacto;
  const largura = wide ? 275 : 76;
  const navAlign = wide ? 'stretch' : 'center';

  const abas = [
    {
      id: 'feed' as const,
      label: 'Feed',
      d: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z',
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

  const navBtnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    height: '52px',
    padding: wide ? '0 20px 0 12px' : 0,
    width: wide ? 'auto' : '52px',
    justifyContent: wide ? 'flex-start' : 'center',
    border: 0,
    borderRadius: '999px',
    background: 'none',
    color: 'var(--fg)',
    cursor: 'pointer',
    fontSize: '20px',
  };

  const themeIcon =
    tema === 'light'
      ? 'M21 13A9 9 0 1111 3a7 7 0 0010 10z'
      : 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1';

  return (
    <header
      style={{
        width: largura,
        flex: 'none',
        position: 'sticky',
        top: 0,
        height: '100vh',
        padding: wide ? '0 12px 12px' : '0 8px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 5,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: navAlign }}>
        {/* AUÊ! em Anton cor var(--fg) — NUNCA verde */}
        <div
          onClick={() => aoMudarAba('feed')}
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            fontFamily: 'var(--font-display)',
            fontSize: '26px',
            letterSpacing: '.02em',
            color: 'var(--fg)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {wide ? 'AUÊ!' : 'A!'}
        </div>

        {/* Abas */}
        {abas.map((t) => {
          const ativo = abaAtiva === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => aoMudarAba(t.id)}
              style={{
                ...navBtnBase,
                fontWeight: ativo ? 700 : 400,
                color: ativo ? 'var(--fg)' : 'var(--muted)',
              }}
              aria-label={t.label}
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
              {wide && <span>{t.label}</span>}
            </button>
          );
        })}

        {aoAbrirPerfil && (
          <button
            type="button"
            onClick={aoAbrirPerfil}
            aria-label="Perfil"
            style={{ ...navBtnBase, color: 'var(--muted)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a8 8 0 0116 0v1" />
            </svg>
            {wide && <span>Perfil</span>}
          </button>
        )}

        {/* Botão Postar */}
        <button
          type="button"
          onClick={aoAbrirComposer}
          style={
            wide
              ? {
                  height: '52px',
                  marginTop: '16px',
                  border: 0,
                  borderRadius: '999px',
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  fontWeight: 700,
                  fontSize: '17px',
                  cursor: 'pointer',
                  width: '100%',
                }
              : {
                  width: '52px',
                  height: '52px',
                  marginTop: '16px',
                  border: 0,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  fontWeight: 700,
                  fontSize: '26px',
                  cursor: 'pointer',
                }
          }
        >
          {wide ? 'Postar' : '+'}
        </button>
      </div>

      {/* Rodapé: Alternar Tema */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: navAlign }}>
        <button
          type="button"
          onClick={aoAlternarTema}
          style={{
            ...navBtnBase,
            height: '44px',
            fontSize: '15px',
            color: 'var(--muted)',
          }}
          aria-label="Alternar tema"
        >
          <svg
            width="22"
            height="22"
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
          {wide && <span>{tema === 'light' ? 'Tema escuro' : 'Tema claro'}</span>}
        </button>
      </div>
    </header>
  );
};

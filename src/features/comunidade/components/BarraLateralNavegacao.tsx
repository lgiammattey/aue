import React from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';

export type TabNavegacao = 'feed' | 'arena' | 'comm' | 'desafios' | 'perfil';

interface BarraLateralNavegacaoProps {
  abaAtiva: TabNavegacao;
  aoMudarAba: (aba: TabNavegacao) => void;
  aoAbrirComposer: () => void;
  compacto?: boolean;
  tema: 'dark' | 'light';
  aoAlternarTema: () => void;
  perfil?: PerfilUsuario;
  aoAbrirPerfil?: () => void;
  contaLogada?: boolean;
  aoSair?: () => void;
  aoEntrar?: () => void;
}

export const BarraLateralNavegacao: React.FC<BarraLateralNavegacaoProps> = ({
  abaAtiva,
  aoMudarAba,
  aoAbrirComposer,
  compacto = false,
  tema,
  aoAlternarTema,
  aoAbrirPerfil,
  contaLogada,
  aoSair,
  aoEntrar = () => {
    window.location.href = '/login';
  },
  perfil,
}) => {
  const wide = !compacto;
  const largura = wide ? 250 : 76;
  const navAlign = wide ? 'stretch' : 'center';

  const abas = [
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
    textDecoration: 'none',
    boxSizing: 'border-box',
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
        overflowY: 'auto',
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

        {/* Abas Principais */}
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

        {/* Atalho para Vídeos de Arroto */}
        <a
          href="/videos-de-arroto"
          style={{
            ...navBtnBase,
            color: 'var(--muted)',
          }}
          aria-label="Vídeos de arroto"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {wide && <span>Vídeos</span>}
        </a>

        {/* Perfil */}
        {aoAbrirPerfil && (() => {
          const ativo = abaAtiva === 'perfil';
          return (
            <button
              type="button"
              onClick={aoAbrirPerfil}
              aria-label="Perfil"
              style={{
                ...navBtnBase,
                fontWeight: ativo ? 700 : 400,
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
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a8 8 0 0116 0v1" />
              </svg>
              {wide && <span>Perfil</span>}
            </button>
          );
        })()}

        {/* Início / Apresentação Pública */}
        <a
          href="/landing"
          style={{
            ...navBtnBase,
            color: 'var(--muted)',
          }}
          aria-label="Início e apresentação do Auê"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {wide && <span>Início</span>}
        </a>

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

        {/* Status de Autenticação Nítido */}
        {!contaLogada ? (
          wide ? (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--muted)',
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                  }}
                >
                  Modo Visitante
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--fg)', lineHeight: 1.3 }}>
                Você está deslogado. Crie uma conta para salvar seus causos.
              </div>
              <button
                type="button"
                onClick={aoEntrar}
                style={{
                  height: '36px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--fg)',
                  color: 'var(--bg)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Entrar na conta
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={aoEntrar}
              style={{
                ...navBtnBase,
                marginTop: '12px',
                color: 'var(--accent)',
              }}
              title="Modo Visitante — Toque para entrar"
              aria-label="Modo Visitante — Toque para entrar"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
            </button>
          )
        ) : (
          wide ? (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                borderRadius: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--fg)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {perfil?.nome || perfil?.handle || 'Logado'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Conta ativa</div>
                </div>
              </div>
              {aoSair && (
                <button
                  type="button"
                  onClick={aoSair}
                  style={{
                    border: 0,
                    background: 'none',
                    color: 'var(--muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 6px',
                  }}
                  title="Sair da conta"
                >
                  Sair
                </button>
              )}
            </div>
          ) : (
            aoSair && (
              <button
                type="button"
                onClick={aoSair}
                style={{ ...navBtnBase, marginTop: '12px', color: 'var(--muted)' }}
                title="Sair da conta"
                aria-label="Sair da conta"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            )
          )
        )}
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

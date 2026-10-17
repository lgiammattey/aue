import React from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';

interface BarraLateralNavegacaoProps {
  abaAtiva: 'feed' | 'arena' | 'comm' | 'desafios' | 'perfil';
  aoMudarAba: (aba: 'feed' | 'arena' | 'comm' | 'desafios' | 'perfil') => void;
  aoAbrirComposer: () => void;
  compacto?: boolean;
  tema: 'dark' | 'light';
  aoAlternarTema: () => void;
  perfil: PerfilUsuario;
}

export const BarraLateralNavegacao: React.FC<BarraLateralNavegacaoProps> = ({
  abaAtiva,
  aoMudarAba,
  aoAbrirComposer,
  compacto = false,
  tema,
  aoAlternarTema,
  perfil,
}) => {
  const largura = compacto ? '72px' : '260px';
  const navAlign = compacto ? 'center' : 'stretch';

  const abas = [
    {
      id: 'feed' as const,
      label: 'Feed',
      d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    },
    {
      id: 'comm' as const,
      label: 'Bondes',
      d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    },
    {
      id: 'desafios' as const,
      label: 'Desafios',
      d: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3',
    },
    {
      id: 'perfil' as const,
      label: 'Perfil',
      d: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
    },
  ];

  return (
    <aside
      style={{
        width: largura,
        flex: 'none',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box',
        padding: compacto ? '12px 6px' : '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          alignItems: navAlign,
        }}
      >
        {/* Marca Auê */}
        <div
          onClick={() => aoMudarAba('feed')}
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: compacto ? 'center' : 'flex-start',
            padding: compacto ? '0' : '0 12px',
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            letterSpacing: '.02em',
            color: 'var(--accent)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          AUÊ!
        </div>

        {/* Itens de Navegação */}
        {abas.map((t) => {
          const ativo = abaAtiva === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => aoMudarAba(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                justifyContent: compacto ? 'center' : 'flex-start',
                padding: compacto ? '12px' : '12px 16px',
                borderRadius: '999px',
                background: ativo ? 'var(--surface-2)' : 'transparent',
                color: ativo ? 'var(--accent)' : 'var(--fg)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: ativo ? 700 : 500,
                fontSize: '18px',
                fontFamily: 'var(--font-body)',
                transition: 'background-color .15s ease, color .15s ease, transform .1s ease',
              }}
              aria-label={t.label}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={ativo ? '2.4' : '1.8'}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={t.d} />
              </svg>
              {!compacto && <span>{t.label}</span>}
            </button>
          );
        })}

        {/* Botão Arena (Auê) */}
        <button
          type="button"
          onClick={() => aoMudarAba('arena')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            justifyContent: compacto ? 'center' : 'flex-start',
            padding: compacto ? '12px' : '12px 16px',
            borderRadius: '999px',
            background: abaAtiva === 'arena' ? 'var(--accent)' : 'transparent',
            color: abaAtiva === 'arena' ? 'var(--accent-on)' : 'var(--fg)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '18px',
            fontFamily: 'var(--font-body)',
            transition: 'background-color .15s ease, color .15s ease, transform .1s ease',
          }}
          aria-label="Arena de Arroto"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3" />
          </svg>
          {!compacto && <span>Arena Auê</span>}
        </button>

        {/* Botão de Postar Causo */}
        <button
          type="button"
          onClick={aoAbrirComposer}
          style={{
            marginTop: '12px',
            width: compacto ? '50px' : '100%',
            height: compacto ? '50px' : '52px',
            borderRadius: '999px',
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            border: 'none',
            fontWeight: 800,
            fontSize: compacto ? '20px' : '17px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(198, 255, 0, 0.25)',
            transition: 'background-color .15s ease, transform .1s ease',
          }}
          aria-label="Postar causo"
        >
          {compacto ? '+' : 'Postar causo'}
        </button>
      </div>

      {/* Rodapé da Barra Lateral: Tema e Perfil */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: navAlign,
          borderTop: '1px solid var(--border)',
          paddingTop: '12px',
        }}
      >
        {/* Alternador de Tema */}
        <button
          type="button"
          onClick={aoAlternarTema}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: compacto ? 'center' : 'flex-start',
            padding: compacto ? '10px' : '10px 14px',
            borderRadius: '999px',
            background: 'none',
            color: 'var(--fg)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
          aria-label="Alternar tema escuro/claro"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {tema === 'dark' ? (
              <circle cx="12" cy="12" r="5" />
            ) : (
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            )}
          </svg>
          {!compacto && <span>{tema === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>

        {/* Cartão de Perfil */}
        <button
          type="button"
          onClick={() => aoMudarAba('perfil')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: compacto ? '6px' : '8px 12px',
            borderRadius: '999px',
            background: abaAtiva === 'perfil' ? 'var(--surface-2)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--fg)',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--surface-2)',
              border: '2px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              flex: 'none',
              overflow: 'hidden',
            }}
          >
            {perfil.avatarUrl ? (
              <img src={perfil.avatarUrl} alt={perfil.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              perfil.nome.slice(0, 2).toUpperCase()
            )}
          </div>
          {!compacto && (
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {perfil.nome}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
                @{perfil.handle}
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

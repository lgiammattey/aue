import React, { useState } from 'react';
import type { CausoPostado, Comunidade } from '../../../portas/comunidade';

interface ColunaTendenciasProps {
  causos?: readonly CausoPostado[];
  comunidades?: readonly Comunidade[];
  minhasComunidades?: readonly string[];
  aoEntrarComunidade?: (slug: string) => void;
  aoAbrirDesafio?: () => void;
  aoAbrirPerfil?: (handle: string, nome?: string) => void;
  termoBusca?: string;
  aoMudarBusca?: (termo: string) => void;
  aoSelecionarTrend?: (tagOuCategoria: string) => void;
}

export const ColunaTendencias: React.FC<ColunaTendenciasProps> = ({
  aoAbrirPerfil: _aoAbrirPerfil,
  termoBusca = '',
  aoMudarBusca,
  aoSelecionarTrend: _aoSelecionarTrend,
}) => {
  const [buscaInterna, setBuscaInterna] = useState('');
  const valorBusca = aoMudarBusca ? termoBusca : buscaInterna;
  const setBusca = (val: string) => {
    if (aoMudarBusca) {
      aoMudarBusca(val);
    } else {
      setBuscaInterna(val);
    }
  };

  return (
    <aside
      style={{
        width: '320px',
        flex: 'none',
        position: 'sticky',
        top: 0,
        padding: '12px 0 12px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxHeight: '100vh',
        overflowY: 'auto',
      }}
    >
      {/* Busca Pill */}
      <input
        value={valorBusca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar no bonde"
        style={{
          height: '44px',
          borderRadius: '999px',
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
          color: 'var(--fg)',
          padding: '0 18px',
          fontSize: '15px',
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          width: '100%',
        }}
      />

      {/* Card da Comunidade Oficial no Telegram */}
      <section
        style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🦍</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--fg)', lineHeight: 1.2 }}>
              Eu Arroto, e Daí?
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Comunidade oficial no Telegram</div>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.4, color: 'var(--fg)' }}>
          Entre no grupo oficial dos arrotadores raiz no Telegram. Zoeira, causos e duelos sem censura.
        </p>

        <a
          href="https://t.me/+KQjRJFCibjliYzRh"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            height: '40px',
            borderRadius: '999px',
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            gap: '8px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.15.27-.01.06.01.24 0 .37z" />
          </svg>
          Entrar no Telegram
        </a>
      </section>
    </aside>
  );
};

import React, { useState } from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';

interface ComposerCausoProps {
  aoPostar: (texto: string) => Promise<boolean> | boolean;
  aoAbrirArrotar: () => void;
  aoAbrirDesafio: () => void;
  perfil: PerfilUsuario;
}

export const ComposerCauso: React.FC<ComposerCausoProps> = ({
  aoPostar,
  aoAbrirArrotar,
  aoAbrirDesafio,
  perfil,
}) => {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const iniciais = (perfil.nome?.trim().split(/\s+/).length > 1
    ? (perfil.nome.trim().split(/\s+/)[0][0] + perfil.nome.trim().split(/\s+/)[1][0])
    : (perfil.nome?.slice(0, 2) || 'VC')
  ).toUpperCase();

  const handlePostar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      const res = await aoPostar(texto.trim());
      if (res) {
        setTexto('');
      }
    } finally {
      setEnviando(false);
    }
  };

  const chipBtnStyle: React.CSSProperties = {
    height: '36px',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 0,
    borderRadius: '999px',
    background: 'none',
    color: 'var(--fg)',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
      }}
    >
      {/* Avatar 44px */}
      <div
        style={{
          width: '44px',
          height: '44px',
          flex: 'none',
          borderRadius: '50%',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '14px',
          position: 'relative',
          overflow: 'hidden',
          color: 'var(--fg)',
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
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="O que tá rolando no bonde?"
          rows={2}
          style={{
            background: 'none',
            border: 0,
            outline: 'none',
            resize: 'none',
            color: 'var(--fg)',
            fontFamily: 'inherit',
            fontSize: '19px',
            padding: '8px 0',
            width: '100%',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border)',
            paddingTop: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={aoAbrirArrotar}
              style={chipBtnStyle}
              aria-label="Arrotar"
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
                <path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3" />
              </svg>
              <span>Arrotar</span>
            </button>

            <button
              type="button"
              onClick={aoAbrirDesafio}
              style={chipBtnStyle}
              aria-label="Desafiar"
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
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
              </svg>
              <span>Desafiar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePostar}
            disabled={!texto.trim() || enviando}
            style={{
              height: '36px',
              padding: '0 20px',
              border: 0,
              borderRadius: '999px',
              background: 'var(--accent)',
              color: 'var(--accent-on)',
              fontWeight: 700,
              fontSize: '15px',
              cursor: (!texto.trim() || enviando) ? 'default' : 'pointer',
              opacity: (!texto.trim() || enviando) ? 0.6 : 1,
            }}
          >
            Postar
          </button>
        </div>
      </div>
    </div>
  );
};

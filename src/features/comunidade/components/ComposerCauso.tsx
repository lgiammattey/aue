import React, { useState } from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';

export interface DadosNovoPost {
  texto: string;
  comunidadeSlug?: string;
}

interface ComposerCausoProps {
  aoPostar: (dados: string | DadosNovoPost) => Promise<boolean> | boolean;
  aoAbrirArrotar: () => void;
  aoAbrirDesafio: () => void;
  perfil: PerfilUsuario;
  comunidades?: readonly string[] | string[];
  comunidadeInicial?: string;
}

export const ComposerCauso: React.FC<ComposerCausoProps> = ({
  aoPostar,
  aoAbrirArrotar,
  aoAbrirDesafio,
  perfil,
  comunidades,
  comunidadeInicial = 'bonde-geral',
}) => {
  const [texto, setTexto] = useState('');
  const [comunidadeDestino, setComunidadeDestino] = useState(comunidadeInicial);
  const [enviando, setEnviando] = useState(false);

  const iniciais = (perfil.nome?.trim().split(/\s+/).length > 1
    ? (perfil.nome.trim().split(/\s+/)[0][0] + perfil.nome.trim().split(/\s+/)[1][0])
    : (perfil.nome?.slice(0, 2) || 'VC')
  ).toUpperCase();

  const podePostar = Boolean(texto.trim());

  const handlePostar = async () => {
    if (!podePostar || enviando) return;
    setEnviando(true);
    try {
      const payload: DadosNovoPost = {
        texto: texto.trim(),
        comunidadeSlug: comunidadeDestino,
      };

      const res = await aoPostar(payload);
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
        {/* Destino do Causo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>Destino:</span>
            <select
              value={comunidadeDestino}
              onChange={(e) => setComunidadeDestino(e.target.value)}
              aria-label="Destino da publicação"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--fg)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="bonde-geral">Feed</option>
              {comunidades &&
                comunidades
                  .filter((c) => c.toLowerCase() !== 'bonde-geral')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        {/* Campo de Texto do Causo */}
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
            fontSize: '18px',
            padding: '8px 0',
            width: '100%',
          }}
        />

        {/* Barra de Ações do Composer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border)',
            paddingTop: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {/* Botão rápido para o jogo Auê */}
            <button
              type="button"
              onClick={aoAbrirArrotar}
              style={chipBtnStyle}
              aria-label="Jogar o Auê"
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
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              <span>Arrotar na Arena</span>
            </button>

            {/* Botão Desafiar */}
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
            disabled={!podePostar || enviando}
            style={{
              height: '36px',
              padding: '0 20px',
              border: 0,
              borderRadius: '999px',
              background: 'var(--accent, #c6ff00)',
              color: 'var(--accent-on, #000)',
              fontWeight: 700,
              fontSize: '15px',
              cursor: (!podePostar || enviando) ? 'default' : 'pointer',
              opacity: (!podePostar || enviando) ? 0.6 : 1,
            }}
          >
            {enviando ? 'Postando...' : 'Postar'}
          </button>
        </div>
      </div>
    </div>
  );
};

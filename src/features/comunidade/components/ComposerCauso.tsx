import React, { useState } from 'react';
import type { Comunidade } from '../../../portas/comunidade';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';

interface ComposerCausoProps {
  aoPostar: (texto: string, comunidadeSlug: string) => Promise<boolean>;
  aoAbrirArena: () => void;
  aoAbrirDesafio: () => void;
  comunidades: readonly Comunidade[];
  perfil: PerfilUsuario;
}

export const ComposerCauso: React.FC<ComposerCausoProps> = ({
  aoPostar,
  aoAbrirArena,
  aoAbrirDesafio,
  comunidades,
  perfil,
}) => {
  const [texto, setTexto] = useState('');
  const [comuSlug, setComuSlug] = useState('bonde-geral');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;

    setEnviando(true);
    const ok = await aoPostar(texto.trim(), comuSlug);
    setEnviando(false);
    if (ok) {
      setTexto('');
    }
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
      {/* Avatar */}
      <div
        style={{
          width: '44px',
          height: '44px',
          flex: 'none',
          borderRadius: '50%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '15px',
          color: 'var(--fg)',
          overflow: 'hidden',
        }}
      >
        {perfil.avatarUrl ? (
          <img src={perfil.avatarUrl} alt={perfil.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          perfil.nome.slice(0, 2).toUpperCase()
        )}
      </div>

      {/* Form de Composição */}
      <form onSubmit={handleSubmit} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="O que tá rolando no bonde?"
          rows={2}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--fg)',
            fontFamily: 'inherit',
            fontSize: '18px',
            lineHeight: 1.4,
            padding: '4px 0',
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
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Atalho Arrotar na Arena */}
            <button
              type="button"
              onClick={aoAbrirArena}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                background: 'var(--surface)',
                color: 'var(--fg)',
                border: '1px solid var(--border)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3" />
              </svg>
              <span>Arrotar</span>
            </button>

            {/* Atalho Desafiar no X1 */}
            <button
              type="button"
              onClick={aoAbrirDesafio}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                background: 'var(--surface)',
                color: 'var(--fg)',
                border: '1px solid var(--border)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
              </svg>
              <span>Desafiar</span>
            </button>

            {/* Seletor de Comunidade */}
            <select
              value={comuSlug}
              onChange={(e) => setComuSlug(e.target.value)}
              aria-label="Selecionar comunidade"
              style={{
                padding: '6px 10px',
                borderRadius: '999px',
                background: 'var(--surface)',
                color: 'var(--fg)',
                border: '1px solid var(--border)',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {comunidades.map((c) => (
                <option key={c.slug} value={c.slug} style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
                  {c.icone} {c.nome}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!texto.trim() || enviando}
            style={{
              height: '36px',
              padding: '0 20px',
              border: 'none',
              borderRadius: '999px',
              background: texto.trim() && !enviando ? 'var(--accent)' : 'var(--surface-2)',
              color: texto.trim() && !enviando ? 'var(--accent-on)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: texto.trim() && !enviando ? 'pointer' : 'not-allowed',
              transition: 'background-color .15s ease',
            }}
          >
            {enviando ? 'Postando...' : 'Postar'}
          </button>
        </div>
      </form>
    </div>
  );
};

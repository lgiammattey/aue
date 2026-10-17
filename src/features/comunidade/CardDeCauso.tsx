import React, { useState } from 'react';
import type { CausoPostado, TipoDeReacao } from '../../portas/comunidade';
import { formatarNota } from '../../shared/formato/nota';

interface CardDeCausoProps {
  causo: CausoPostado;
  onReagir: (causoId: string, reacao: TipoDeReacao) => void;
  onDuvidar?: (causo: CausoPostado) => void;
  onDenunciar?: (causoId: string) => void;
  onCompartilhar?: (causo: CausoPostado) => void;
}

export const CardDeCauso: React.FC<CardDeCausoProps> = ({
  causo,
  onReagir,
  onDuvidar,
  onDenunciar,
  onCompartilhar,
}) => {
  const [tocando, setTocando] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  const togglePlay = () => {
    setTocando((prev) => !prev);
  };

  const handleDenunciar = () => {
    setMenuAberto(false);
    if (onDenunciar && window.confirm('Deseja denunciar este causo e ocultá-lo do feed?')) {
      onDenunciar(causo.id);
    }
  };

  return (
    <article className="causo-card" data-testid={`card-causo-${causo.id}`}>
      <header className="card-header">
        <div className="user-meta">
          <div className="avatar" aria-hidden="true">
            {causo.nota && causo.nota >= 90 ? '👑' : '💨'}
          </div>
          <div className="author-info">
            <span className="author-name">
              {causo.autorNome}
              <span className="tag-comu">#{causo.comunidadeSlug}</span>
            </span>
            <span className="post-time">há pouco</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn-menu-causo"
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Opções do causo"
          >
            •••
          </button>
          {menuAberto && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 24,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px',
                zIndex: 20,
                minWidth: '120px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              <button
                type="button"
                onClick={handleDenunciar}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--danger)',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                Denunciar
              </button>
            </div>
          )}
        </div>
      </header>

      <p className="causo-texto">{causo.conteudo}</p>

      {causo.nota !== undefined && (
        <div className="audio-box">
          <div className="score-badge">
            <span className="score-label">Nota</span>
            <span className="score-value">{formatarNota(causo.nota)}</span>
          </div>

          <div className="waveform-player">
            <button
              type="button"
              className="btn-play"
              onClick={togglePlay}
              aria-label={tocando ? 'Pausar áudio' : 'Ouvir arroto'}
            >
              {tocando ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>

            <div className="waveform" aria-hidden="true">
              {[40, 70, 100, 85, 60, 95, 100, 75, 50, 80, 45, 30].map((h, i) => (
                <div
                  key={i}
                  className={`bar ${tocando && i < 6 ? 'active' : ''}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <span className="duration">
              {causo.duracaoSegundos ? `${Math.round(causo.duracaoSegundos * 10) / 10}s` : '3s'}
            </span>
          </div>
        </div>
      )}

      <footer className="card-actions">
        <div className="reactions-group">
          <button
            type="button"
            className={`btn-reaction ${causo.minhaReacao === 'fogo' ? 'active' : ''}`}
            onClick={() => onReagir(causo.id, 'fogo')}
            aria-label={`Reagir com fogo (${causo.reacoes.fogo})`}
          >
            🔥 {causo.reacoes.fogo}
          </button>
          <button
            type="button"
            className={`btn-reaction ${causo.minhaReacao === 'nojo' ? 'active' : ''}`}
            onClick={() => onReagir(causo.id, 'nojo')}
            aria-label={`Reagir com nojo (${causo.reacoes.nojo})`}
          >
            🤢 {causo.reacoes.nojo}
          </button>
          <button
            type="button"
            className={`btn-reaction ${causo.minhaReacao === 'trofeu' ? 'active' : ''}`}
            onClick={() => onReagir(causo.id, 'trofeu')}
            aria-label={`Reagir com troféu (${causo.reacoes.trofeu})`}
          >
            🏆 {causo.reacoes.trofeu}
          </button>
        </div>

        {onDuvidar && (
          <button
            type="button"
            className="btn-duvido"
            onClick={() => onDuvidar(causo)}
            aria-label={`Duvidar de ${causo.autorNome}`}
          >
            ⚡ DUVIDO
          </button>
        )}

        {onCompartilhar && (
          <button
            type="button"
            className="btn-reaction"
            onClick={() => onCompartilhar(causo)}
            aria-label="Compartilhar card 9:16"
            title="Compartilhar card"
            style={{ padding: '6px 10px' }}
          >
            📤
          </button>
        )}
      </footer>
    </article>
  );
};

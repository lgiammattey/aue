import React, { useState } from 'react';
import type { VideoCurado } from '../../nucleo/midia/playlistDeVideos';

interface PlayerVideoCardProps {
  readonly video: VideoCurado;
}

export const PlayerVideoCard: React.FC<PlayerVideoCardProps> = ({ video }) => {
  const [reproduzindo, setReproduzindo] = useState(false);

  const ehYoutube = video.plataforma === 'youtube';

  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        background: 'var(--surface, #14140f)',
        border: '1px solid var(--border, #26261f)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Moldura de Vídeo com Proporção 16:9 ou 9:16 adaptável */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: ehYoutube ? '16 / 9' : '9 / 16',
          maxHeight: ehYoutube ? 'none' : '480px',
          background: '#050504',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {reproduzindo ? (
          <iframe
            src={ehYoutube ? `${video.embedUrl}&autoplay=1` : video.embedUrl}
            title={video.titulo}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setReproduzindo(true)}
            aria-label={`Reproduzir ${video.titulo}`}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
              padding: 0,
              background: video.thumbnailUrl
                ? `url(${video.thumbnailUrl}) center/cover no-repeat`
                : 'linear-gradient(135deg, #1c1c16 0%, #0d0d0a 100%)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            {/* Overlay escuro sutil para contraste */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                transition: 'background 0.2s ease',
              }}
            />

            {/* Botão de Play com o estilo Auê (Accent Verde Elétrico) */}
            <div
              style={{
                position: 'relative',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--accent, #c6ff00)',
                color: '#0a0a08',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(198, 255, 0, 0.35)',
                transition: 'transform 0.15s ease',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginLeft: '4px' }}
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>

            <span
              style={{
                position: 'relative',
                fontSize: '13px',
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                letterSpacing: '0.02em',
              }}
            >
              Assistir arroto
            </span>
          </button>
        )}
      </div>

      {/* Metadados e Informações do Vídeo */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              textTransform: 'uppercase',
              color: 'var(--muted, #a3a39a)',
              background: 'var(--bg, #0a0a08)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border, #26261f)',
            }}
          >
            {video.plataforma === 'youtube' ? 'YouTube' : 'TikTok'}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--muted, #a3a39a)',
              fontWeight: 600,
            }}
          >
            {video.autor}
          </span>
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: '18px',
            fontFamily: 'var(--font-display, Anton, sans-serif)',
            fontWeight: 400,
            color: 'var(--fg, #f4f4ee)',
            lineHeight: 1.25,
          }}
        >
          {video.titulo}
        </h3>

        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--muted, #a3a39a)',
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {video.descricao}
        </p>

        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border, #26261f)' }}>
          <a
            href={video.urlOriginal}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: 'var(--muted, #a3a39a)',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Ver original no {video.plataforma === 'youtube' ? 'YouTube' : 'TikTok'} ↗
          </a>
        </div>
      </div>
    </article>
  );
};

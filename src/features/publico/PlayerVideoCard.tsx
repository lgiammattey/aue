import React, { useState } from 'react';
import type { VideoCurado } from '../../nucleo/midia/playlistDeVideos';

interface PlayerVideoCardProps {
  readonly video: VideoCurado;
}

const ROTULOS_CATEGORIAS: Record<VideoCurado['categoria'], string> = {
  trovao: 'Trovão',
  trator: 'Trator',
  rajada: 'Rajada',
  resenha: 'Resenha',
};

export const PlayerVideoCard: React.FC<PlayerVideoCardProps> = ({ video }) => {
  const [reproduzindo, setReproduzindo] = useState(false);

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Moldura de vídeo 16:9 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: '16px',
          background: 'var(--surface-2)',
          overflow: 'hidden',
        }}
      >
        {reproduzindo ? (
          <iframe
            src={`${video.embedUrl}&autoplay=1`}
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
              background: `url(${video.thumbnailUrl}) center/cover no-repeat`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {/* Véu escuro pra o botão e o texto lerem sobre qualquer capa */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />

            {/*
              Botão escuro, não verde elétrico: numa grade de vídeos o verde
              apareceria uma vez por card, e a faixa do fim da página já usa
              a única aparição dele.
            */}
            <div
              style={{
                position: 'relative',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(23, 34, 28, 0.88)',
                color: '#f7f8f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginLeft: '3px' }}
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
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}
            >
              Assistir arroto
            </span>
          </button>
        )}
      </div>

      {/* Título, origem e descrição */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, lineHeight: 1.3, color: 'var(--fg)' }}>
          {video.titulo}
        </h3>
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {ROTULOS_CATEGORIAS[video.categoria]} · YouTube · {video.autor}
        </span>
        <p style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: 1.5, color: 'var(--muted)' }}>
          {video.descricao}
        </p>
        <a
          href={video.urlOriginal}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            alignSelf: 'flex-start',
            minHeight: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--fg)',
            textDecoration: 'none',
          }}
        >
          Ver original no YouTube ↗
        </a>
      </div>
    </article>
  );
};

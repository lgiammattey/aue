import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { LayoutPublico, SecaoPublica } from './LayoutPublico';
import { PlayerVideoCard } from './PlayerVideoCard';
import { PLAYLIST_VIDEOS_ARROTO } from '../../nucleo/midia/playlistDeVideos';

/**
 * `/videos-de-arroto` — Galeria pública de vídeos de arroto do TikTok e YouTube.
 *
 * Página de alta atração para SEO e tráfego orgânico, conectando
 * a zoeira audiovisual da internet à Arena do Auê!.
 */
export const VideosDeArroto: React.FC = () => {
  const [filtro, setFiltro] = useState<'todos' | 'youtube' | 'tiktok'>('todos');

  const videosFiltrados = useMemo(() => {
    if (filtro === 'todos') return PLAYLIST_VIDEOS_ARROTO;
    return PLAYLIST_VIDEOS_ARROTO.filter((v) => v.plataforma === filtro);
  }, [filtro]);

  return (
    <LayoutPublico
      eyebrow="Playlist & Zoeira"
      titulo="Vídeos de Arroto: Os Maiores Estrondos do YouTube e TikTok"
      resumo="Uma seleção curada dos arrotos mais barulhentos, bizarros e engraçados da internet. Do clássico estrondo do vizinho que atravessa a parede às maiores rajadas do TikTok."
    >
      {/* Barra de Filtros */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '32px',
        }}
      >
        <button
          type="button"
          onClick={() => setFiltro('todos')}
          style={{
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border)',
            background: filtro === 'todos' ? 'var(--fg)' : 'var(--surface)',
            color: filtro === 'todos' ? 'var(--bg)' : 'var(--muted)',
            fontFamily: 'inherit',
          }}
        >
          Todos ({PLAYLIST_VIDEOS_ARROTO.length})
        </button>
        <button
          type="button"
          onClick={() => setFiltro('tiktok')}
          style={{
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border)',
            background: filtro === 'tiktok' ? 'var(--fg)' : 'var(--surface)',
            color: filtro === 'tiktok' ? 'var(--bg)' : 'var(--muted)',
            fontFamily: 'inherit',
          }}
        >
          TikTok ({PLAYLIST_VIDEOS_ARROTO.filter((v) => v.plataforma === 'tiktok').length})
        </button>
        <button
          type="button"
          onClick={() => setFiltro('youtube')}
          style={{
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border)',
            background: filtro === 'youtube' ? 'var(--fg)' : 'var(--surface)',
            color: filtro === 'youtube' ? 'var(--bg)' : 'var(--muted)',
            fontFamily: 'inherit',
          }}
        >
          YouTube ({PLAYLIST_VIDEOS_ARROTO.filter((v) => v.plataforma === 'youtube').length})
        </button>
      </div>

      {/* Grade de Vídeos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {videosFiltrados.map((video) => (
          <PlayerVideoCard key={video.id} video={video} />
        ))}
      </div>

      {/* Chamada para a Arena */}
      <SecaoPublica eyebrow="Sua vez" titulo="Acha que seu arroto bate de frente?">
        <p>
          Assistir aos outros é divertido, mas o Auê existe para testar a sua própria potência.
          Abra a Arena pelo celular, solte o som no microfone e deixe a inteligência artificial dar
          sua nota oficial de 0 a 100.
        </p>
        <p>
          Depois da nota, você pode compartilhar o áudio com os amigos no WhatsApp e chamar qualquer
          um para a revanche no duelo X1.
        </p>
        <div style={{ marginTop: '24px' }}>
          <Link to="/" className="desktop-pill desktop-pill-primary desktop-pill-large">
            Entrar na Arena e Arrotar
          </Link>
        </div>
      </SecaoPublica>

      {/* Navegação Cruzada */}
      <div className="desktop-shell publico-extra" style={{ marginTop: '48px' }}>
        <p style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center' }}>
          Veja também:{' '}
          <Link to="/ranking-de-arrotos" style={{ color: 'var(--fg)', fontWeight: 600 }}>
            Ranking e recordes de decibéis
          </Link>{' '}
          ·{' '}
          <Link to="/como-arrotar" style={{ color: 'var(--fg)', fontWeight: 600 }}>
            Como arrotar alto e de propósito
          </Link>{' '}
          ·{' '}
          <Link to="/tipos-de-arroto" style={{ color: 'var(--fg)', fontWeight: 600 }}>
            Os estilos de arroto
          </Link>{' '}
          ·{' '}
          <Link to="/grupos" style={{ color: 'var(--fg)', fontWeight: 600 }}>
            Grupos no WhatsApp e TikTok
          </Link>
        </p>
      </div>
    </LayoutPublico>
  );
};

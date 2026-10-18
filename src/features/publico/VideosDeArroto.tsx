import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { LayoutPublico, SecaoPublica } from './LayoutPublico';
import { PlayerVideoCard } from './PlayerVideoCard';
import { PLAYLIST_VIDEOS_ARROTO } from '../../nucleo/midia/playlistDeVideos';
import type { VideoCurado } from '../../nucleo/midia/playlistDeVideos';

type CategoriaFiltro = 'todos' | VideoCurado['categoria'];

const ROTULOS_CATEGORIAS: Record<CategoriaFiltro, string> = {
  todos: 'Todos',
  trovao: 'Trovão',
  trator: 'Trator',
  rajada: 'Rajada',
  resenha: 'Resenha',
};

/**
 * `/videos-de-arroto` — Galeria pública de vídeos de arroto do YouTube.
 *
 * Página de alta atração para SEO e tráfego orgânico, conectando
 * a zoeira audiovisual da internet à Arena do Auê!.
 */
export const VideosDeArroto: React.FC = () => {
  const [categoria, setCategoria] = useState<CategoriaFiltro>('todos');

  const videosFiltrados = useMemo(() => {
    if (categoria === 'todos') return PLAYLIST_VIDEOS_ARROTO;
    return PLAYLIST_VIDEOS_ARROTO.filter((v) => v.categoria === categoria);
  }, [categoria]);

  const categoriasDisponiveis: readonly CategoriaFiltro[] = [
    'todos',
    'trovao',
    'trator',
    'rajada',
    'resenha',
  ];

  return (
    <LayoutPublico
      eyebrow="Playlist & Zoeira"
      titulo="Vídeos de Arroto: Os Maiores Estrondos do YouTube"
      resumo="Uma seleção curada dos arrotos mais barulhentos, bizarros e engraçados do YouTube. Do clássico estrondo no microfone às maiores aulas e compilações da internet."
    >
      {/* Barra de Filtros por Categoria/Estilo */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '32px',
        }}
      >
        {categoriasDisponiveis.map((cat) => {
          const total =
            cat === 'todos'
              ? PLAYLIST_VIDEOS_ARROTO.length
              : PLAYLIST_VIDEOS_ARROTO.filter((v) => v.categoria === cat).length;
          const ativo = categoria === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoria(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: ativo ? 'var(--fg)' : 'var(--surface)',
                color: ativo ? 'var(--bg)' : 'var(--muted)',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
            >
              {ROTULOS_CATEGORIAS[cat]} ({total})
            </button>
          );
        })}
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
          Abra a Arena pelo celular ou computador, solte o som no microfone e deixe o juiz dar
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
            Grupos no WhatsApp e comunidades
          </Link>
        </p>
      </div>
    </LayoutPublico>
  );
};

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { LayoutPublico, LinksPublicos, SecaoPublica } from './LayoutPublico';
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
 * Seleção de vídeos pra ouvir e aprender, que leva pra Arena do Auê!.
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
      eyebrow="Playlist"
      titulo="Vídeos de arroto pra ouvir e aprender"
      resumo="Uma seleção de arrotos do YouTube: compilações, aulas e uns clássicos da internet."
    >
      <div className="publico-filtros" role="group" aria-label="Filtrar por estilo">
        {categoriasDisponiveis.map((cat) => {
          const total =
            cat === 'todos'
              ? PLAYLIST_VIDEOS_ARROTO.length
              : PLAYLIST_VIDEOS_ARROTO.filter((v) => v.categoria === cat).length;

          return (
            <button
              key={cat}
              type="button"
              className="publico-filtro"
              aria-pressed={categoria === cat}
              onClick={() => setCategoria(cat)}
            >
              {ROTULOS_CATEGORIAS[cat]} ({total})
            </button>
          );
        })}
      </div>

      <div className="publico-grade-videos">
        {videosFiltrados.map((video) => (
          <PlayerVideoCard key={video.id} video={video} />
        ))}
      </div>

      <SecaoPublica eyebrow="Sua vez" titulo="Acha que arrota bem?">
        <p>
          Solta um na Arena e vê a nota de 0 a 100. Depois, se quiser, publique na comunidade ou
          chame alguém pro X1.
        </p>
        <div>
          <Link to="/" className="publico-pilula publico-pilula-grande publico-pilula-escura">
            Ir pra Arena
          </Link>
        </div>
        <p>Veja também:</p>
        <LinksPublicos
          links={[
            { para: '/ranking-de-arrotos', rotulo: 'Ranking e recordes de decibéis' },
            { para: '/como-arrotar', rotulo: 'Como arrotar alto e de propósito' },
            { para: '/tipos-de-arroto', rotulo: 'Os estilos de arroto' },
            { para: '/grupos', rotulo: 'Grupos externos de WhatsApp e Telegram' },
          ]}
        />
      </SecaoPublica>
    </LayoutPublico>
  );
};

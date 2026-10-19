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
        <div>
          <Link to="/" className="publico-pilula publico-pilula-grande publico-pilula-escura">
            Entrar na Arena e Arrotar
          </Link>
        </div>
        <p>Veja também:</p>
        <LinksPublicos
          links={[
            { para: '/ranking-de-arrotos', rotulo: 'Ranking e recordes de decibéis' },
            { para: '/como-arrotar', rotulo: 'Como arrotar alto e de propósito' },
            { para: '/tipos-de-arroto', rotulo: 'Os estilos de arroto' },
            { para: '/grupos', rotulo: 'Grupos no WhatsApp e comunidades' },
          ]}
        />
      </SecaoPublica>
    </LayoutPublico>
  );
};

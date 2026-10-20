import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ItemDoFeed } from './tipos';
import { PlayerDoArroto } from './PlayerDoArroto';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';

interface Props {
  readonly post: ItemDoFeed;
  readonly salvo: boolean;
  readonly audioTocando: boolean;
  readonly tempoAtualDoAudio: number;
  readonly duracaoDoAudio: number | null;
  readonly aoCurtir?: () => void;
  readonly aoReagir?: (tipo: 'fogo' | 'nojo' | 'trofeu') => void;
  readonly aoAlternarSalvar: () => void;
  readonly aoTocarAudio: (urlOuResolver?: string | (() => Promise<string | null>)) => void;
  readonly aoAbrirComentarios?: () => void;
}

function formatarTempoRelativo(isoOuData: string): string {
  try {
    const data = new Date(isoOuData);
    const segundos = Math.max(0, Math.floor((Date.now() - data.getTime()) / 1000));
    if (segundos < 60) return 'agora';
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'ontem';
    if (dias < 7) return `${dias}d`;
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(data);
  } catch {
    return 'agora';
  }
}

export const CardDoPost = memo(function CardDoPost({
  post,
  salvo,
  audioTocando,
  tempoAtualDoAudio,
  duracaoDoAudio,
  aoCurtir,
  aoReagir,
  aoAlternarSalvar,
  aoTocarAudio,
  aoAbrirComentarios,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const [curtidoLocal, setCurtidoLocal] = useState(false);

  const autorInicial = (post.autorNome || post.autorHandle || '?').charAt(0).toUpperCase();
  const autorIdentificador = post.autorHandle ? `u/${post.autorHandle}` : post.autorNome;
  const comunidadeIdentificador = `r/${post.comunidadeSlug}`;

  const video = post.videoUrl
    ? detectarLinkDeVideo(post.videoUrl)
    : post.anexo?.tipo === 'videoExterno' && post.anexo.url
      ? detectarLinkDeVideo(post.anexo.url)
      : null;

  const aoCompartilhar = () => {
    try {
      const url = `${window.location.origin}/r/${post.comunidadeSlug}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Falha silenciosa de clipboard
    }
  };

  const aoDispararCurtir = () => {
    setCurtidoLocal((ant) => !ant);
    aoCurtir?.();
  };

  return (
    <article className="post post--twitter-style" data-post-id={post.id}>
      {/* Avatar à esquerda (44px) estilo Twitter */}
      <div className="post-avatar">
        {post.autorHandle ? (
          <Link
            to={`/u/${post.autorHandle}`}
            className="post-avatar-link"
            aria-label={`Ver perfil de ${post.autorNome}`}
            tabIndex={-1}
            aria-hidden="true"
          >
            <span>{autorInicial}</span>
          </Link>
        ) : (
          <span className="post-avatar-fallback">{autorInicial}</span>
        )}
      </div>

      {/* Conteúdo à direita */}
      <div className="post-body">
        <header className="post-meta">
          <div className="post-meta-author">
            <span className="post-meta-name">
              {post.autorHandle ? (
                <Link to={`/u/${post.autorHandle}`} className="author-profile-link" aria-label={`Abrir perfil de ${autorIdentificador}`}>
                  {post.autorNome}
                </Link>
              ) : (
                post.autorNome
              )}
            </span>
            {post.autorHandle && (
              <Link to={`/u/${post.autorHandle}`} className="post-meta-handle" aria-label={`Perfil u/${post.autorHandle}`}>
                u/{post.autorHandle}
              </Link>
            )}
            <span className="post-meta-dot">·</span>
            <span className="post-meta-time">{formatarTempoRelativo(post.criadoEm)}</span>
          </div>

          <div className="post-meta-badges">
            <Link to={`/r/${post.comunidadeSlug}`} className="badge">
              {comunidadeIdentificador}
            </Link>
            {typeof post.nota === 'number' && post.nota > 0 && (
              <span className="badge-nota" title="Nota do Arroto">
                NOTA {Math.round(post.nota)}
              </span>
            )}
          </div>
        </header>

        <h3
          className="post-title"
          onClick={aoAbrirComentarios}
          style={{ cursor: aoAbrirComentarios ? 'pointer' : 'default' }}
          tabIndex={aoAbrirComentarios ? 0 : undefined}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && aoAbrirComentarios) {
              e.preventDefault();
              aoAbrirComentarios();
            }
          }}
        >
          {post.titulo}
        </h3>

        {post.corpo && <p className="post-text">{post.corpo}</p>}

        {post.anexo?.tipo === 'imagem' && post.anexo.url && (
          <img
            className="post-media-image"
            src={post.anexo.url}
            alt="Imagem publicada na roda"
            loading="lazy"
          />
        )}

        {video && (
          <iframe
            className="post-video"
            src={video.embedUrl}
            title={`Vídeo: ${post.titulo}`}
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}

        {(post.temAudio || post.enderecoDoAudio || (post.anexo?.tipo === 'audio' && post.anexo.url)) && (
          <div className="post-audio-wrapper">
            <PlayerDoArroto
              tocando={audioTocando}
              tempoAtualSegundos={tempoAtualDoAudio}
              duracaoSegundos={duracaoDoAudio}
              aoAlternar={() =>
                aoTocarAudio(post.anexo?.tipo === 'audio' ? post.anexo.url : post.enderecoDoAudio)
              }
            />
          </div>
        )}

        {/* Barra de ações com ícones SVG estilo Twitter e micro-interações */}
        <div className="post-actions post-actions--twitter" aria-label="Ações da publicação">
          {/* Comentários */}
          <button
            type="button"
            className="action-btn action-btn--reply"
            onClick={aoAbrirComentarios}
            aria-label={`💬 ${post.respostasTotal} comentários`}
            title="Responder na roda"
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
              <path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z" />
            </svg>
            <span className="action-btn__count">
              {post.respostasTotal > 0 ? `${post.respostasTotal} comentários` : '💬 Comentários'}
            </span>
          </button>

          {/* Curtir */}
          <button
            type="button"
            className={`action-btn action-btn--like ${curtidoLocal ? 'is-liked' : ''}`}
            onClick={aoDispararCurtir}
            disabled={!aoCurtir}
            aria-label="♡ Curtir"
            title="Curtir"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={curtidoLocal ? '#ff3d5a' : 'none'}
              stroke={curtidoLocal ? '#ff3d5a' : 'currentColor'}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z" />
            </svg>
            <span className="action-btn__count">
              {post.votos > 0 ? post.votos : '♡ Curtir'}
            </span>
          </button>

          {/* Fogo */}
          <button
            type="button"
            className="action-btn action-btn--fire"
            onClick={() => aoReagir?.('fogo')}
            disabled={!aoReagir}
            aria-label="🔥"
            title="Pegou fogo"
          >
            <span aria-hidden="true">🔥</span>
          </button>

          {/* Nojo */}
          <button
            type="button"
            className="action-btn action-btn--sick"
            onClick={() => aoReagir?.('nojo')}
            disabled={!aoReagir}
            aria-label="🤢"
            title="Nojento demais"
          >
            <span aria-hidden="true">🤢</span>
          </button>

          {/* Troféu */}
          <button
            type="button"
            className="action-btn action-btn--trophy"
            onClick={() => aoReagir?.('trofeu')}
            disabled={!aoReagir}
            aria-label="🏆"
            title="Respeito / Troféu"
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
            <span aria-hidden="true">🏆</span>
          </button>

          {/* Salvar */}
          <button
            type="button"
            className={`action-btn action-btn--save ${salvo ? 'is-saved' : ''}`}
            onClick={aoAlternarSalvar}
            aria-label={salvo ? '★ Salvo' : '☆ Salvar'}
            title={salvo ? 'Salvo nos favoritos' : 'Salvar causo'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={salvo ? 'var(--aue-accent)' : 'none'}
              stroke={salvo ? 'var(--aue-accent)' : 'currentColor'}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            <span className="action-btn__text">{salvo ? '★ Salvo' : '☆ Salvar'}</span>
          </button>

          {/* Compartilhar */}
          <button
            type="button"
            className="action-btn action-btn--share"
            onClick={aoCompartilhar}
            aria-label="↗ Compartilhar"
            title="Copiar link"
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
              <path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6" />
            </svg>
            <span className="action-btn__text">
              {copiado ? 'Copiado!' : '↗ Compartilhar'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
});

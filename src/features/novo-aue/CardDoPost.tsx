import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ItemComentario, ItemDoFeed } from './tipos';
import type { AnexoRascunho } from './ModalCompositor';
import type { GravacaoLivreDoForum } from '../../portas/forum';
import { PlayerDoArroto } from './PlayerDoArroto';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';

interface Props {
  readonly post: ItemDoFeed;
  readonly salvo: boolean;
  readonly audioTocando: boolean;
  readonly tempoAtualDoAudio: number;
  readonly duracaoDoAudio: number | null;
  readonly threadAberta?: boolean;
  readonly comentarios?: readonly ItemComentario[];
  readonly carregandoComentarios?: boolean;
  readonly enviandoComentario?: boolean;
  readonly criarGravacao?: () => GravacaoLivreDoForum;
  readonly aoEnviarComentario?: (dados: {
    conteudo: string;
    paiId: string | null;
    anexo: AnexoRascunho | null;
  }) => Promise<boolean>;
  readonly aoCurtir?: () => void;
  readonly aoReagir?: (tipo: 'fogo' | 'nojo' | 'trofeu') => void;
  readonly aoAlternarSalvar?: () => void;
  readonly aoTocarAudio?: (urlOuResolver?: string | (() => Promise<string | null>)) => void;
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
  threadAberta = false,
  aoCurtir,
  aoReagir,
  aoAlternarSalvar,
  aoTocarAudio,
  aoAbrirComentarios,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const [curtidoLocal, setCurtidoLocal] = useState(false);

  const autorInicial = (post.autorNome || post.autorHandle || '?').charAt(0).toUpperCase();
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
      // Ignora falha de clipboard
    }
  };

  const aoDispararCurtir = () => {
    setCurtidoLocal((ant) => !ant);
    aoCurtir?.();
  };

  return (
    <article
      className="feed-post card-do-post"
      id={`post-${post.id}`}
    >
      {/* Coluna do Avatar (Estilo Twitter) */}
      <div className="post-avatar-col">
        {post.autorHandle ? (
          <Link
            to={`/u/${post.autorHandle}`}
            className="post-avatar-link"
            tabIndex={-1}
            aria-label={`Foto de perfil de ${post.autorNome}`}
          >
            {post.autorAvatarUrl ? (
              <img
                src={post.autorAvatarUrl}
                alt={post.autorNome}
                className="post-avatar-img"
                loading="lazy"
              />
            ) : (
              <span className="post-avatar-fallback">{autorInicial}</span>
            )}
          </Link>
        ) : (
          <div className="post-avatar-static">
            {post.autorAvatarUrl ? (
              <img
                src={post.autorAvatarUrl}
                alt={post.autorNome}
                className="post-avatar-img"
                loading="lazy"
              />
            ) : (
              <span className="post-avatar-fallback">{autorInicial}</span>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo Principal do Post */}
      <div className="post-main-content">
        {/* Cabeçalho de Metadados: Nome, @handle, tempo e badges */}
        <header className="post-meta-header">
          <div className="post-meta-ident">
            {post.autorHandle ? (
              <Link
                to={`/u/${post.autorHandle}`}
                className="author-profile-link"
                aria-label={`Abrir perfil de ${post.autorNome}`}
              >
                {post.autorNome}
              </Link>
            ) : (
              <span className="author-name">{post.autorNome}</span>
            )}

            {post.autorHandle && (
              <Link
                to={`/u/${post.autorHandle}`}
                className="post-meta-handle"
                aria-label={`Abrir perfil de u/${post.autorHandle}`}
              >
                u/{post.autorHandle}
              </Link>
            )}

            <span className="post-meta-dot" aria-hidden="true">
              ·
            </span>

            <time dateTime={post.criadoEm} className="post-meta-time">
              {formatarTempoRelativo(post.criadoEm)}
            </time>
          </div>

          <div className="post-meta-badges">
            <Link
              to={`/c/${post.comunidadeSlug}`}
              className="badge-comunidade"
              title={`Ir para ${post.comunidadeSlug}`}
            >
              {comunidadeIdentificador}
            </Link>

            {post.nota !== undefined && post.nota !== null && (
              <span className="badge-nota" title={`Nota do arroto: ${post.nota}/100`}>
                <span className="badge-nota__label">NOTA</span>
                <span className="badge-nota__value">{post.nota}</span>
              </span>
            )}
          </div>
        </header>

        {/* Título do Causo / Tópico */}
        <h3 className="post-title">
          {post.autorHandle ? (
            <Link to={`/c/${post.comunidadeSlug}`} className="post-title-link">
              {post.titulo}
            </Link>
          ) : (
            post.titulo
          )}
        </h3>

        {/* Corpo do Texto */}
        {post.corpo && <p className="post-body">{post.corpo}</p>}

        {/* Player de Áudio integrado */}
        {(post.temAudio || post.enderecoDoAudio || (post.anexo?.tipo === 'audio' && post.anexo.url)) && (
          <div className="post-audio-wrapper">
            <PlayerDoArroto
              tocando={audioTocando}
              tempoAtualSegundos={tempoAtualDoAudio}
              duracaoSegundos={duracaoDoAudio}
              aoAlternar={() =>
                aoTocarAudio?.(post.anexo?.tipo === 'audio' ? post.anexo.url : post.enderecoDoAudio)
              }
            />
          </div>
        )}

        {/* Imagem em anexo */}
        {post.anexo?.tipo === 'imagem' && post.anexo.url && (
          <div className="post-media-image">
            <img
              src={post.anexo.url}
              alt="Anexo do causo"
              className="post-attachment-img"
              loading="lazy"
            />
          </div>
        )}

        {/* Vídeo embutido (YouTube ou TikTok) */}
        {video && (
          <div className="post-media-video">
            <iframe
              className="post-video"
              src={video.embedUrl}
              title={`Vídeo do post ${post.titulo}`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}

        {/* Barra de Ações (Estilo Twitter/X: Ícones vetoriais enxutos com contadores numéricos) */}
        <div className="post-actions--twitter" role="toolbar" aria-label="Ações do causo">
          {/* Responder / Comentários */}
          <button
            type="button"
            className={`action-btn action-btn--reply ${threadAberta ? 'is-active' : ''}`}
            onClick={aoAbrirComentarios}
            aria-label={`${post.respostasTotal} comentários`}
            title={threadAberta ? 'Recolher respostas' : 'Ver respostas'}
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
            {post.respostasTotal > 0 && (
              <span className="action-btn__count">{post.respostasTotal}</span>
            )}
            <span className="sr-only">comentários</span>
          </button>

          {/* Curtir */}
          <button
            type="button"
            className={`action-btn action-btn--like ${curtidoLocal ? 'is-liked' : ''}`}
            onClick={aoDispararCurtir}
            aria-label="Curtir"
            title="Curtir causo"
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
            {post.votos > 0 && <span className="action-btn__count">{post.votos}</span>}
            <span className="sr-only">Curtir</span>
          </button>

          {/* Fogo */}
          <button
            type="button"
            className="action-btn action-btn--emoji"
            onClick={() => aoReagir?.('fogo')}
            aria-label="🔥"
            title="Pegou fogo"
          >
            <span>🔥</span>
          </button>

          {/* Nojo */}
          <button
            type="button"
            className="action-btn action-btn--emoji"
            onClick={() => aoReagir?.('nojo')}
            aria-label="🤢"
            title="Nojento demais"
          >
            <span>🤢</span>
          </button>

          {/* Troféu */}
          <button
            type="button"
            className="action-btn action-btn--emoji"
            onClick={() => aoReagir?.('trofeu')}
            aria-label="🏆"
            title="Respeito / Troféu"
          >
            <span aria-hidden="true">🏆</span>
            <span className="sr-only">Troféu</span>
          </button>

          {/* Salvar */}
          <button
            type="button"
            className={`action-btn action-btn--save ${salvo ? 'is-saved' : ''}`}
            onClick={aoAlternarSalvar}
            aria-label={salvo ? 'Salvo' : 'Salvar'}
            title={salvo ? 'Remover dos salvos' : 'Salvar causo'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={salvo ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            <span className="sr-only">{salvo ? 'Salvo' : 'Salvar'}</span>
          </button>

          {/* Compartilhar */}
          <button
            type="button"
            className="action-btn action-btn--share"
            onClick={aoCompartilhar}
            aria-label="Compartilhar"
            title="Copiar link do causo"
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
            {copiado && <span className="action-btn__feedback">Copiado!</span>}
            <span className="sr-only">Compartilhar</span>
          </button>
        </div>
      </div>
    </article>
  );
});

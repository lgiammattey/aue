/**
 * CANÔNICO ATIVO — Card de Post "Ficha de Jogada" (Carbono + Laranja Elétrico)
 * NUNCA altere o CardDeCauso legado para novos comportamentos de feed.
 */
import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuDoPost } from './MenuDoPost';
import type { EngajamentoDoPost, ItemComentario, ItemDoFeed, ReacaoDeAtitude } from './tipos';
import type { AnexoRascunho } from './ModalCompositor';
import type { GravacaoLivreDoForum } from '../../portas/forum';
import { PlayerDoArroto } from './PlayerDoArroto';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';
import './CardDoPost.css';

interface Props {
  readonly post: ItemDoFeed;
  readonly variante?: 'perfil' | 'feed';
  /** Só é exibido quando a rota fornece persistência real. */
  readonly salvo?: boolean;
  readonly reacoes?: Partial<Omit<EngajamentoDoPost, 'minhas'>>;
  readonly minhas?: readonly string[];
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
  readonly aoReagir?: (tipo: ReacaoDeAtitude) => void;
  readonly aoDesafiar?: () => void;
  readonly aoAlternarSalvar?: () => void;
  /** Só chega em post de outra pessoa. */
  readonly aoDenunciar?: () => void;
  /** Só chega em post do próprio autor. */
  readonly aoApagar?: () => void;
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
  variante = 'feed',
  salvo,
  reacoes,
  minhas = [],
  audioTocando,
  tempoAtualDoAudio,
  duracaoDoAudio,
  threadAberta = false,
  aoCurtir,
  aoReagir,
  aoDesafiar,
  aoAlternarSalvar,
  aoDenunciar,
  aoApagar,
  aoTocarAudio,
  aoAbrirComentarios,
}: Props) {
  const [copiado, setCopiado] = useState(false);

  const autorInicial = (post.autorNome || post.autorHandle || '?').charAt(0).toUpperCase();
  const ePessoal = post.origem === 'pessoal';
  const temAnexoOuVideo = Boolean(post.anexo) || Boolean(post.videoUrl);
  const tituloAutomaticoDeMidia = ePessoal
    && temAnexoOuVideo
    && !post.corpo.trim()
    && post.titulo.trim() === 'Mídia no perfil';
  const tituloExibivel = tituloAutomaticoDeMidia ? '' : post.titulo;

  const video = post.videoUrl
    ? detectarLinkDeVideo(post.videoUrl)
    : post.anexo?.tipo === 'videoExterno' && post.anexo.url
      ? detectarLinkDeVideo(post.anexo.url)
      : post.anexo
        ? null
        : detectarLinkDeVideo(post.corpo) ?? detectarLinkDeVideo(post.titulo);

  const aoCompartilhar = async () => {
    const id = post.id.replace(/^(topico|causo)-/, '');
    const caminho = post.tipo === 'causo' || !post.autorHandle
      ? `/historia/${encodeURIComponent(id)}`
      : `/u/${encodeURIComponent(post.autorHandle)}#post-${encodeURIComponent(post.id)}`;
    const url = `${window.location.origin}${caminho}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: post.titulo, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (erro) {
      if ((erro as { name?: string }).name === 'AbortError') return;
      window.prompt('Copie o link:', url);
    }
  };

  const aoDispararCurtir = () => {
    aoCurtir?.();
  };

  const temAudio = Boolean(
    post.temAudio || post.enderecoDoAudio || (post.anexo?.tipo === 'audio' && post.anexo.url),
  );
  const temNota = post.nota !== undefined && post.nota !== null;
  const notaOuro = temNota && Number(post.nota) >= 80;

  return (
    <article
      className={`feed-post card-do-post${variante === 'perfil' ? ' card-do-post--perfil' : ''}${post.tipo === 'topico' && post.respostasTotal > 0 ? ' card-do-post--thread' : ''}${audioTocando ? ' card-do-post--tocando' : ''}`}
      id={`post-${post.id}`}
    >
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

      <div className="post-main-content">
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

            <div className="post-meta-details">
              {post.autorHandle && (
                <Link
                  to={`/u/${post.autorHandle}`}
                  className="post-meta-handle"
                  aria-label={`Abrir perfil de u/${post.autorHandle}`}
                >
                  @{post.autorHandle}
                </Link>
              )}

              {post.autorHandle && <span className="post-meta-dot" aria-hidden="true">·</span>}

              <time dateTime={post.criadoEm} className="post-meta-time">
                {formatarTempoRelativo(post.criadoEm)}
              </time>
            </div>
          </div>

          <MenuDoPost aoDenunciar={aoDenunciar} aoApagar={aoApagar} />
        </header>

        {post.corpo && tituloExibivel && tituloExibivel.trim() !== post.corpo.trim() && !post.corpo.startsWith(tituloExibivel) && (
          <div className="post-topic-tag">
            <span className="post-topic-tag__label">{tituloExibivel}</span>
          </div>
        )}

        {(post.corpo || tituloExibivel) && (
          <p className="post-body">{post.corpo || tituloExibivel}</p>
        )}

        {temAudio && (
          <div className={`post-audio-wrapper audio-com-nota${temNota ? ' audio-com-nota--com-placar' : ''}`}>
            <div className="audio-com-nota__player">
              <PlayerDoArroto
                tocando={audioTocando}
                tempoAtualSegundos={tempoAtualDoAudio}
                duracaoSegundos={duracaoDoAudio}
                aoAlternar={() =>
                  aoTocarAudio?.(post.anexo?.tipo === 'audio' ? post.anexo.url : post.enderecoDoAudio)
                }
              />
            </div>
            {temNota && (
              <div className={`audio-com-nota__placar${notaOuro ? ' is-ouro' : ''}`}>
                <span className="audio-com-nota__rotulo">NOTA</span>
                <span className="audio-com-nota__nota" role="img" aria-label={`Nota: ${post.nota} de 100`}>
                  {post.nota}
                </span>
              </div>
            )}
          </div>
        )}

        {!temAudio && temNota && (
          <div className={`post-nota-isolada${notaOuro ? ' is-ouro' : ''}`}>
            <span className="audio-com-nota__rotulo">NOTA</span>
            <span className="audio-com-nota__nota" role="img" aria-label={`Nota: ${post.nota} de 100`}>
              {post.nota}
            </span>
          </div>
        )}

        {post.anexo?.tipo === 'imagem' && post.anexo.url && (
          <div className="post-media-image">
            <img
              src={post.anexo.url}
              alt="Anexo do post"
              className="post-attachment-img"
              loading="lazy"
            />
          </div>
        )}

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

        <footer className="post-footer-ficha" aria-label="Interações da jogada">
          {variante !== 'perfil' && (
            <div className="post-reactions-bar" role="group" aria-label="Reações competitivas">
              <button
                type="button"
                className={`reaction-chip action-btn action-btn--like${minhas.includes('like') ? ' is-active' : ''}`}
                onClick={aoDispararCurtir}
                disabled={!aoCurtir}
                aria-pressed={minhas.includes('like')}
                aria-label="Curtir"
                title={aoCurtir ? (minhas.includes('like') ? 'Tirar o like' : 'Dar like') : 'Like não está disponível aqui'}
              >
                <span aria-hidden="true">👍</span>
                {reacoes && (reacoes.like ?? 0) > 0 && <span className="action-btn__count">{reacoes.like}</span>}
                <span className="sr-only">Curtir</span>
              </button>

              {([
                ['dislike', '👎', 'Dislike', 'Dislike'],
                ['dedo', '🖕', 'Dedo do meio', 'Dedo do meio'],
                ['hangloose', '🤙', 'Hangloose', 'Hangloose'],
                ['rock', '🤘', 'Sinal do rock', 'Rock'],
                ['cerveja', '🍺', 'Cerveja', 'Cerveja'],
                ['refrigerante', '🥤', 'Refrigerante', 'Refrigerante'],
              ] as const).map(([tipo, emoji, titulo, nome]) => (
                <button
                  key={tipo}
                  type="button"
                  className={`reaction-chip action-btn action-btn--emoji${minhas.includes(tipo) ? ' is-active' : ''}`}
                  onClick={() => aoReagir?.(tipo)}
                  disabled={!aoReagir}
                  aria-pressed={minhas.includes(tipo)}
                  aria-label={emoji}
                  title={aoReagir ? titulo : 'Reagir não está disponível aqui'}
                >
                  <span aria-hidden="true">{emoji}</span>
                  {(reacoes?.[tipo] ?? 0) > 0 && <span className="action-btn__count">{reacoes?.[tipo]}</span>}
                  <span className="sr-only">{nome}</span>
                </button>
              ))}
            </div>
          )}

          <div className="post-actions-bar post-actions--twitter" role="toolbar" aria-label="Ações do post">
            <button
              type="button"
              className={`action-btn action-btn--reply${threadAberta ? ' is-active' : ''}`}
              onClick={aoAbrirComentarios}
              aria-label={`${post.respostasTotal} comentários`}
              title={threadAberta ? 'Recolher respostas' : 'Ver respostas'}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 4.5H4a2 2 0 00-2 2v9a2 2 0 002 2h9l5 3.5v-3.5h2a2 2 0 002-2v-9a2 2 0 00-2-2z" />
                <path d="M8 11h.01M12 11h.01M16 11h.01" strokeWidth="2.4" />
              </svg>
              {post.respostasTotal > 0 && (
                <span className="action-btn__count">{post.respostasTotal}</span>
              )}
              <span className="sr-only">comentários</span>
            </button>

            {salvo !== undefined && (
              <button
                type="button"
                className={`action-btn action-btn--save${salvo ? ' is-saved' : ''}`}
                onClick={aoAlternarSalvar}
                disabled={!aoAlternarSalvar}
                aria-pressed={Boolean(salvo)}
                aria-label={salvo ? 'Salvo' : 'Salvar'}
                title={aoAlternarSalvar ? (salvo ? 'Remover dos salvos' : 'Salvar') : 'Salvar não está disponível aqui'}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill={salvo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
                <span className="sr-only">{salvo ? 'Salvo' : 'Salvar'}</span>
              </button>
            )}

            <button
              type="button"
              className="action-btn action-btn--share"
              onClick={() => void aoCompartilhar()}
              aria-label="Compartilhar"
              title="Compartilhar o link"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6" />
              </svg>
              {copiado && <span className="action-btn__feedback">Copiado!</span>}
              <span className="sr-only">Compartilhar</span>
            </button>

            {aoDesafiar && (
              <button
                type="button"
                className="action-btn action-btn--challenge"
                onClick={aoDesafiar}
                aria-label={post.autorHandle ? `Desafiar @${post.autorHandle}` : 'Desafiar'}
                title={post.autorHandle ? `Desafiar @${post.autorHandle}` : 'Desafiar'}
              >
                <span aria-hidden="true">⚔️</span>
                <span className="action-btn__count">Puxar X1</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </article>
  );
});

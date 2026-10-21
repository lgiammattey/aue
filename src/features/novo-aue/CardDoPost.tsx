/**
 * CANÔNICO ATIVO — Card de Post da Tropa do Arroto (OpenDesign)
 * Referência visual: docs/design/prototipo/Bonde do Arroto.dc.html
 * Mapeamento: docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md
 * 
 * NUNCA altere o CardDeCauso legado para novos comportamentos de feed.
 * Toda melhoria no card de post (ações, avatar, player, notas) deve ser feita aqui.
 */
import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuDoPost } from './MenuDoPost';
import type { EngajamentoDoPost, ItemComentario, ItemDoFeed } from './tipos';
import type { AnexoRascunho } from './ModalCompositor';
import type { GravacaoLivreDoForum } from '../../portas/forum';
import { PlayerDoArroto } from './PlayerDoArroto';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';
import './TokensDoCard.css';
import './CardDoPost.css';

interface Props {
  readonly post: ItemDoFeed;
  /**
   * `feed` (padrão): feed, Seguindo, comunidade e thread. Mantém a nota, as
   * reações emoji e o salvar.
   * `perfil`: o card do print do perfil. Sem nota, sem emoji, sem salvar, e o
   * coração só aparece quando há ação ligada à porta real.
   */
  readonly variante?: 'feed' | 'perfil';
  /** Só é exibido quando a rota fornece persistência real. */
  readonly salvo?: boolean;
  readonly reacoes?: Pick<EngajamentoDoPost, 'like' | 'fogo' | 'nojo' | 'trofeu'>;
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
  readonly aoReagir?: (tipo: 'fogo' | 'nojo' | 'trofeu') => void;
  readonly aoAlternarSalvar?: () => void;
  /** Só chega em post de outra pessoa. */
  readonly aoDenunciar?: () => void;
  /** Só chega em post do próprio autor. */
  readonly aoApagar?: () => void;
  readonly aoTocarAudio?: (urlOuResolver?: string | (() => Promise<string | null>)) => void;
  readonly aoAbrirComentarios?: () => void;
}

/** `null` quando não há data válida: o card omite o tempo em vez de dizer "agora". */
function formatarTempoRelativo(isoOuData: string): string | null {
  if (!isoOuData) return null;
  try {
    const data = new Date(isoOuData);
    if (Number.isNaN(data.getTime())) return null;
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
    return null;
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
  aoAlternarSalvar,
  aoDenunciar,
  aoApagar,
  aoTocarAudio,
  aoAbrirComentarios,
}: Props) {
  const [copiado, setCopiado] = useState(false);

  const autorInicial = (post.autorNome || post.autorHandle || '?').charAt(0).toUpperCase();
  const comunidadeIdentificador = `r/${post.comunidadeSlug}`;
  const noPerfil = variante === 'perfil';
  const tempo = formatarTempoRelativo(post.criadoEm);
  // Duração do áudio tocando agora, ou a que a porta já trouxe. Sem nenhuma das duas, o player mostra o tempo corrido.
  const duracaoConhecida = duracaoDoAudio
    ?? post.duracaoSegundos
    ?? (post.anexo?.tipo === 'audio' && post.anexo.duracaoMs ? post.anexo.duracaoMs / 1000 : null);

  // Vídeos antigos (ex.: r/arrotos-youtube) foram espelhados como tópico com o link
  // dentro do texto e sem anexo; sem este último recurso ficariam só como texto.
  const video = post.videoUrl
    ? detectarLinkDeVideo(post.videoUrl)
    : post.anexo?.tipo === 'videoExterno' && post.anexo.url
      ? detectarLinkDeVideo(post.anexo.url)
      : post.anexo
        ? null
        : detectarLinkDeVideo(post.corpo) ?? detectarLinkDeVideo(post.titulo);

  const aoCompartilhar = async () => {
    const id = post.id.replace(/^(topico|causo)-/, '');
    const caminho = post.tipo === 'topico'
      ? `/c/${encodeURIComponent(post.comunidadeSlug)}/t/${encodeURIComponent(id)}`
      : `/historia/${encodeURIComponent(id)}`;
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
      // Sem permissão de área de transferência: entrega o link para a pessoa copiar na mão.
      window.prompt('Copie o link:', url);
    }
  };

  const aoDispararCurtir = () => {
    aoCurtir?.();
  };

  return (
    <article
      className={`feed-post card-do-post${noPerfil ? ' card-do-post--perfil' : ''}`}
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
        {/* Linha 1: nome, @handle · tempo e o ⋯ no canto. Linha 2: r/comunidade (e a nota, no feed). */}
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
                aria-label={`Abrir perfil de @${post.autorHandle}`}
              >
                @{post.autorHandle}
              </Link>
            )}

            {tempo && (
              <>
                <span className="post-meta-dot" aria-hidden="true">
                  ·
                </span>

                <time dateTime={post.criadoEm} className="post-meta-time">
                  {tempo}
                </time>
              </>
            )}
          </div>

          <MenuDoPost aoDenunciar={aoDenunciar} aoApagar={aoApagar} />
        </header>

        <div className="post-meta-badges">
          <Link
            to={`/c/${post.comunidadeSlug}`}
            className="badge-comunidade"
            title={`Ir para ${post.comunidadeSlug}`}
          >
            {comunidadeIdentificador}
          </Link>

          {!noPerfil && post.nota !== undefined && post.nota !== null && (
            <span className="badge-nota" title={`Nota do arroto: ${post.nota}/100`}>
              <span className="badge-nota__label">NOTA</span>
              <span className="badge-nota__value">{post.nota}</span>
            </span>
          )}
        </div>

        {/* Tag de Tópico (só quando há título distinto do corpo do post) */}
        {post.corpo && post.titulo && post.titulo.trim() !== post.corpo.trim() && !post.corpo.startsWith(post.titulo) && (
          <div className="post-topic-tag">
            <span className="post-topic-tag__label">{post.titulo}</span>
          </div>
        )}

        {/* Corpo do Texto */}
        {(post.corpo || post.titulo) && (
          <p className="post-body">{post.corpo || post.titulo}</p>
        )}

        {/* Player de Áudio integrado */}
        {(post.temAudio || post.enderecoDoAudio || (post.anexo?.tipo === 'audio' && post.anexo.url)) && (
          <div className="post-audio-wrapper">
            <PlayerDoArroto
              tocando={audioTocando}
              tempoAtualSegundos={tempoAtualDoAudio}
              duracaoSegundos={duracaoConhecida}
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
            <span className="action-btn__count">{post.respostasTotal}</span>
            <span className="sr-only">comentários</span>
          </button>

          {/* Curtir. No perfil só existe se há ação real por trás; o número vem da porta. */}
          {(!noPerfil || aoCurtir) && <button
            type="button"
            className={`action-btn action-btn--like ${minhas.includes('like') ? 'is-active' : ''}`}
            onClick={aoDispararCurtir}
            disabled={!aoCurtir}
            aria-pressed={minhas.includes('like')}
            aria-label="Curtir"
            title={aoCurtir ? (minhas.includes('like') ? 'Tirar a curtida' : 'Curtir') : 'Curtir não está disponível aqui'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={minhas.includes('like') ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z" />
            </svg>
            <span className="action-btn__count">{reacoes ? reacoes.like : null}</span>
            <span className="sr-only">Curtir</span>
          </button>}

          {!noPerfil && ([
            ['fogo', '🔥', 'Pegou fogo', 'fogo'],
            ['nojo', '🤢', 'Nojento demais', 'nojo'],
            ['trofeu', '🏆', 'Respeito / Troféu', 'Troféu'],
          ] as const).map(([tipo, emoji, titulo, nome]) => (
            <button
              key={tipo}
              type="button"
              className={`action-btn action-btn--emoji ${minhas.includes(tipo) ? 'is-active' : ''}`}
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

          {/* Sem porta de salvos, o controle continua visível mas indisponível. */}
          {!noPerfil && salvo !== undefined && <button
            type="button"
            className={`action-btn action-btn--save ${salvo ? 'is-saved' : ''}`}
            onClick={aoAlternarSalvar}
            disabled={!aoAlternarSalvar}
            aria-pressed={Boolean(salvo)}
            aria-label={salvo ? 'Salvo' : 'Salvar'}
            title={aoAlternarSalvar ? (salvo ? 'Remover dos salvos' : 'Salvar') : 'Salvar não está disponível aqui'}
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
          }

          {/* Compartilhar */}
          <button
            type="button"
            className="action-btn action-btn--share"
            onClick={() => void aoCompartilhar()}
            aria-label="Compartilhar"
            title="Compartilhar o link"
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

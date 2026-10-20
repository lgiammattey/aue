import { memo, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
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
  readonly aoAlternarSalvar: () => void;
  readonly aoTocarAudio: (urlOuResolver?: string | (() => Promise<string | null>)) => void;
  readonly aoAbrirComentarios?: () => void;
}

const LIMITE_RESPOSTA = 180;

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
  comentarios = [],
  carregandoComentarios = false,
  enviandoComentario = false,
  criarGravacao,
  aoEnviarComentario,
  aoCurtir,
  aoReagir,
  aoAlternarSalvar,
  aoTocarAudio,
  aoAbrirComentarios,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const [curtidoLocal, setCurtidoLocal] = useState(false);

  // Estados do compositor inline de resposta
  const [textoResposta, setTextoResposta] = useState('');
  const [paiId, setPaiId] = useState<string | null>(null);
  const [autorRespostaNome, setAutorRespostaNome] = useState<string | null>(null);
  const [anexo, setAnexo] = useState<AnexoRascunho | null>(null);
  const [mostrarCampoLink, setMostrarCampoLink] = useState(false);
  const [linkVideo, setLinkVideo] = useState('');
  const [erroComentario, setErroComentario] = useState<string | null>(null);
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [segundosAudio, setSegundosAudio] = useState(0);

  const gravacaoRef = useRef<GravacaoLivreDoForum | null>(null);
  const timerAudioRef = useRef<number | null>(null);
  const inputTextoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      gravacaoRef.current?.cancelar();
      if (timerAudioRef.current) window.clearInterval(timerAudioRef.current);
    };
  }, []);

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
      // Ignora falha de clipboard
    }
  };

  const aoDispararCurtir = () => {
    setCurtidoLocal((ant) => !ant);
    aoCurtir?.();
  };

  // Gravação de áudio com 1 clique no compositor inline
  const alternarGravacaoAudio = async () => {
    if (gravandoAudio) {
      if (timerAudioRef.current) {
        window.clearInterval(timerAudioRef.current);
        timerAudioRef.current = null;
      }
      gravacaoRef.current?.parar();
      return;
    }

    if (!criarGravacao) {
      setErroComentario('Gravação de áudio indisponível agora.');
      return;
    }

    const nova = criarGravacao();
    gravacaoRef.current = nova;
    const inicio = await nova.iniciar();

    if (!inicio.ok) {
      setErroComentario(
        inicio.motivo === 'negado'
          ? 'Libere o microfone para gravar áudio.'
          : 'Não deu para iniciar a gravação.',
      );
      return;
    }

    setGravandoAudio(true);
    setSegundosAudio(0);
    timerAudioRef.current = window.setInterval(() => {
      setSegundosAudio((ant) => ant + 1);
    }, 1000);

    const fim = await inicio.conclusao;
    setGravandoAudio(false);
    if (timerAudioRef.current) {
      window.clearInterval(timerAudioRef.current);
      timerAudioRef.current = null;
    }

    if (!fim.ok) {
      if (fim.motivo !== 'cancelado') setErroComentario('A gravação falhou. Tente de novo.');
      return;
    }

    setAnexo({
      tipo: 'audio',
      arquivo: fim.audio.dados,
      duracaoMs: fim.audio.duracaoMs,
    });
    setErroComentario(null);
  };

  const escolherImagem = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(arquivo.type)) {
      setErroComentario('Apenas imagem ou GIF.');
      return;
    }
    setAnexo({ tipo: 'imagem', arquivo });
    setErroComentario(null);
  };

  const adicionarLink = () => {
    const v = detectarLinkDeVideo(linkVideo.trim());
    if (!v) {
      setErroComentario('Cole um link válido do YouTube ou TikTok.');
      return;
    }
    setAnexo({ tipo: 'videoExterno', url: v.urlOriginal });
    setLinkVideo('');
    setMostrarCampoLink(false);
    setErroComentario(null);
  };

  const responderPara = (c: ItemComentario) => {
    setPaiId(c.id);
    setAutorRespostaNome(c.autorHandle ? `@${c.autorHandle}` : c.autorNome);
    inputTextoRef.current?.focus();
  };

  const submeterComentario = async (e: FormEvent) => {
    e.preventDefault();
    if (!aoEnviarComentario || (!textoResposta.trim() && !anexo) || enviandoComentario) return;

    const ok = await aoEnviarComentario({
      conteudo: textoResposta.trim(),
      paiId,
      anexo,
    });

    if (ok) {
      setTextoResposta('');
      setPaiId(null);
      setAutorRespostaNome(null);
      setAnexo(null);
      setLinkVideo('');
      setMostrarCampoLink(false);
    }
  };

  return (
    <article className="post post--twitter-style" data-post-id={post.id}>
      {/* Avatar à esquerda com foto se disponível ou inicial */}
      <div className="post-avatar">
        {post.autorHandle ? (
          <Link
            to={`/u/${post.autorHandle}`}
            className="post-avatar-link"
            aria-label={`Foto de perfil de ${post.autorNome}`}
            tabIndex={-1}
          >
            {post.autorAvatarUrl ? (
              <img
                src={post.autorAvatarUrl}
                alt={post.autorNome}
                className="post-avatar-img"
                loading="lazy"
              />
            ) : (
              <span>{autorInicial}</span>
            )}
          </Link>
        ) : (
          <span className="post-avatar-fallback">
            {post.autorAvatarUrl ? (
              <img
                src={post.autorAvatarUrl}
                alt={post.autorNome}
                className="post-avatar-img"
                loading="lazy"
              />
            ) : (
              <span>{autorInicial}</span>
            )}
          </span>
        )}
      </div>

      {/* Conteúdo à direita */}
      <div className="post-body">
        <header className="post-meta">
          <div className="post-meta-author">
            <span className="post-meta-name">
              {post.autorHandle ? (
                <Link
                  to={`/u/${post.autorHandle}`}
                  className="author-profile-link"
                  aria-label={`Abrir perfil de ${autorIdentificador}`}
                >
                  {post.autorNome}
                </Link>
              ) : (
                post.autorNome
              )}
            </span>
            {post.autorHandle && (
              <Link
                to={`/u/${post.autorHandle}`}
                className="post-meta-handle"
                aria-label={`Perfil u/${post.autorHandle}`}
              >
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

        {/* Barra de ações com contadores e estilo Twitter */}
        <div className="post-actions post-actions--twitter" aria-label="Ações da publicação">
          {/* Botão Comentários / Thread */}
          <button
            type="button"
            className={`action-btn action-btn--reply ${threadAberta ? 'is-active' : ''}`}
            onClick={aoAbrirComentarios}
            aria-label={`💬 ${post.respostasTotal} comentários`}
            title={threadAberta ? 'Recolher respostas' : 'Ver respostas na roda'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={threadAberta ? 'currentColor' : 'none'}
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

        {/* ==================== THREAD INLINE DE COMENTÁRIOS (SEM MODAL) ==================== */}
        {threadAberta && (
          <section className="post-thread-inline" aria-label="Respostas na roda">
            <div className="thread-inline-header">
              <h2 className="thread-inline-title">Resenha na roda</h2>
              <button
                type="button"
                className="thread-inline-close-btn"
                onClick={aoAbrirComentarios}
                aria-label="Fechar resenha"
              >
                ✕
              </button>
            </div>

            {/* Linha vertical conectando ao autor original */}
            <div className="thread-inline-parent-echo">
              <strong>
                {post.autorHandle ? (
                  <Link
                    to={`/u/${post.autorHandle}`}
                    aria-label={`Abrir perfil de ${post.autorNome}`}
                  >
                    {post.autorNome}
                  </Link>
                ) : (
                  post.autorNome
                )}
              </strong>
              <p>{post.corpo || post.titulo}</p>
            </div>

            {/* Lista de respostas com avatar de cada pessoa */}
            <div className="thread-inline-stream">
              {carregandoComentarios ? (
                <div className="thread-inline-loading">
                  <span className="comments-spinner" aria-hidden="true" />
                  <p>Ouvindo a roda…</p>
                </div>
              ) : comentarios.length === 0 ? (
                <p className="thread-inline-empty">Nenhum comentário ainda. Puxa o papo.</p>
              ) : (
                comentarios.map((c) => {
                  const inicialResp = (c.autorNome || '?').charAt(0).toUpperCase();
                  return (
                    <article
                      key={c.id}
                      className="thread-inline-comment"
                      style={{ marginLeft: `${Math.min(c.nivel ?? 0, 2) * 16}px` }}
                    >
                      {/* Avatar redondo da pessoa */}
                      <div className="thread-comment-avatar">
                        {c.autorAvatarUrl ? (
                          <img
                            src={c.autorAvatarUrl}
                            alt={c.autorNome}
                            className="post-avatar-img"
                            loading="lazy"
                          />
                        ) : (
                          <span>{inicialResp}</span>
                        )}
                      </div>

                      <div className="thread-comment-body">
                        <div className="thread-comment-meta">
                          <strong>
                            {c.autorHandle ? (
                              <Link
                                to={`/u/${c.autorHandle}`}
                                aria-label={`Abrir perfil de ${c.autorNome}`}
                              >
                                {c.autorNome}
                              </Link>
                            ) : (
                              c.autorNome
                            )}
                          </strong>
                          {c.autorHandle && <span>@{c.autorHandle}</span>}
                          <span>·</span>
                          <time>{formatarTempoRelativo(c.criadoEm)}</time>
                        </div>

                        {c.conteudo && <p className="thread-comment-text">{c.conteudo}</p>}

                        {c.anexo?.tipo === 'imagem' && c.anexo.url && (
                          <img
                            src={c.anexo.url}
                            alt="Imagem na resposta"
                            className="comment-media-img"
                            loading="lazy"
                          />
                        )}

                        {c.anexo?.tipo === 'audio' && c.anexo.url && (
                          <div className="comment-audio">
                            <audio controls src={c.anexo.url} preload="metadata" />
                          </div>
                        )}

                        {c.anexo?.tipo === 'videoExterno' &&
                          c.anexo.url &&
                          detectarLinkDeVideo(c.anexo.url) && (
                            <iframe
                              className="post-video"
                              src={detectarLinkDeVideo(c.anexo.url)!.embedUrl}
                              title="Vídeo na resposta"
                              loading="lazy"
                              allowFullScreen
                            />
                          )}

                        <button
                          type="button"
                          className="comment-reply-btn"
                          onClick={() => responderPara(c)}
                        >
                          Responder a {c.autorNome}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {/* Compositor inline de resposta direta com ÁUDIO EM 1 CLIQUE */}
            <form onSubmit={submeterComentario} className="thread-inline-composer">
              {autorRespostaNome && (
                <div className="comments-replying-to">
                  <span>
                    Respondendo a <strong>{autorRespostaNome}</strong>
                  </span>
                  <button
                    type="button"
                    className="replying-cancel"
                    onClick={() => {
                      setPaiId(null);
                      setAutorRespostaNome(null);
                    }}
                    aria-label="Cancelar resposta direta"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="thread-composer-input-row">
                <textarea
                  ref={inputTextoRef}
                  maxLength={LIMITE_RESPOSTA}
                  value={textoResposta}
                  onChange={(e) => setTextoResposta(e.target.value)}
                  placeholder={
                    autorRespostaNome
                      ? `Responder a ${autorRespostaNome}…`
                      : 'Responder para a roda…'
                  }
                  aria-label="Escrever resposta"
                  rows={2}
                  disabled={enviandoComentario || gravandoAudio}
                />
              </div>

              {/* Anexo selecionado */}
              {anexo && (
                <div className="composer-attachment-pill">
                  <span>
                    {anexo.tipo === 'imagem'
                      ? '📷 Imagem selecionada'
                      : anexo.tipo === 'audio'
                        ? `🎙️ Áudio de ${Math.ceil(anexo.duracaoMs / 1000)}s anexado`
                        : '🎥 Vídeo externo anexado'}
                  </span>
                  <button
                    type="button"
                    className="attachment-remove-btn"
                    onClick={() => setAnexo(null)}
                    disabled={enviandoComentario || gravandoAudio}
                    aria-label="Remover anexo"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input para link de vídeo */}
              {mostrarCampoLink && !anexo && (
                <div className="composer-link-input-bar">
                  <input
                    type="url"
                    value={linkVideo}
                    onChange={(e) => setLinkVideo(e.target.value)}
                    placeholder="Cole o link do YouTube ou TikTok"
                    aria-label="Link do vídeo"
                    disabled={enviandoComentario || gravandoAudio}
                  />
                  <button
                    type="button"
                    className="action-pill-btn"
                    onClick={adicionarLink}
                    disabled={enviandoComentario || gravandoAudio || !linkVideo.trim()}
                  >
                    Anexar
                  </button>
                  <button
                    type="button"
                    className="action-pill-btn"
                    onClick={() => setMostrarCampoLink(false)}
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {erroComentario && (
                <p className="comments-composer-error" role="alert">
                  {erroComentario}
                </p>
              )}

              <footer className="comments-composer-footer">
                <div className="comments-tools-icons">
                  {/* Botão Microfone: GRAVAÇÃO DE ÁUDIO COM 1 CLIQUE */}
                  <button
                    type="button"
                    className={`composer-tool-btn ${gravandoAudio ? 'is-recording' : ''}`}
                    onClick={() => void alternarGravacaoAudio()}
                    disabled={enviandoComentario || (!gravandoAudio && Boolean(anexo))}
                    title={gravandoAudio ? 'Parar gravação' : 'Gravar áudio (1 clique)'}
                    aria-label={gravandoAudio ? 'Parar gravação' : 'Gravar áudio'}
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill={gravandoAudio ? '#ff3d5a' : 'none'}
                      stroke={gravandoAudio ? '#ff3d5a' : 'currentColor'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    {gravandoAudio && (
                      <span className="recording-counter">
                        0:{String(segundosAudio).padStart(2, '0')}
                      </span>
                    )}
                  </button>

                  {/* Foto / Imagem */}
                  <label
                    className="composer-tool-btn"
                    title="Adicionar imagem"
                    aria-label="Adicionar imagem"
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={escolherImagem}
                      disabled={enviandoComentario || gravandoAudio || Boolean(anexo)}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {/* Vídeo */}
                  <button
                    type="button"
                    className="composer-tool-btn"
                    onClick={() => setMostrarCampoLink((ant) => !ant)}
                    disabled={enviandoComentario || gravandoAudio || Boolean(anexo)}
                    title="Adicionar link de vídeo"
                    aria-label="Adicionar vídeo externo"
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </button>

                  <span className="comments-char-count">
                    {textoResposta.length}/{LIMITE_RESPOSTA}
                  </span>
                </div>

                <button
                  type="submit"
                  className="comments-submit-btn"
                  disabled={
                    enviandoComentario ||
                    gravandoAudio ||
                    (!textoResposta.trim() && !anexo)
                  }
                >
                  {enviandoComentario ? 'Enviando…' : 'Responder'}
                </button>
              </footer>
            </form>
          </section>
        )}
      </div>
    </article>
  );
});

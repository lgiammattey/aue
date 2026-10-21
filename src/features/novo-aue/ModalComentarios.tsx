import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { GravacaoLivreDoForum } from '../../portas/forum';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';
import { montarArvoreDeRespostas, type NoDeResposta } from '../../nucleo/forum/apresentacao';
import type { ItemComentario, ItemDoFeed } from './tipos';
import type { AnexoRascunho } from './ModalCompositor';

interface Props {
  readonly aberto: boolean;
  readonly post: ItemDoFeed | null;
  readonly comentarios: readonly ItemComentario[];
  readonly carregando: boolean;
  readonly enviando: boolean;
  readonly aoFechar: () => void;
  readonly criarGravacao?: () => GravacaoLivreDoForum;
  readonly aoEnviarComentario: (dados: {
    conteudo: string;
    paiId: string | null;
    anexo: AnexoRascunho | null;
  }) => Promise<boolean>;
}

const LIMITE = 180;
const RECUO_VISUAL_MAXIMO = 2;
type ComentarioComPai = ItemComentario & { readonly paiId: string | null };

function tempoRelativo(iso: string): string {
  try {
    const segundos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (segundos < 60) return 'agora';
    if (segundos < 3600) return `${Math.floor(segundos / 60)}m`;
    if (segundos < 86400) return `${Math.floor(segundos / 3600)}h`;
    return `${Math.floor(segundos / 86400)}d`;
  } catch {
    return 'agora';
  }
}

interface ComentarioDaArvoreProps {
  readonly no: NoDeResposta<ComentarioComPai>;
  readonly profundidade: number;
  readonly aoResponder: (comentario: ItemComentario) => void;
  readonly aoFechar: () => void;
}

function ComentarioDaArvore({ no, profundidade, aoResponder, aoFechar }: ComentarioDaArvoreProps) {
  const comentario = no.resposta;
  const inicial = (comentario.autorNome || '?').charAt(0).toUpperCase();

  return (
    <li className="comment-tree__branch">
      <article className="comment-item" data-profundidade-visual={Math.min(profundidade, RECUO_VISUAL_MAXIMO)}>
        <div className="comment-avatar">
          {comentario.autorAvatarUrl ? <img src={comentario.autorAvatarUrl} alt={comentario.autorNome} className="post-avatar-img" loading="lazy" /> : <span>{inicial}</span>}
        </div>
        <div className="comment-body">
          <div className="comment-meta">
            <strong>
              {comentario.autorHandle ? (
                <Link to={`/u/${comentario.autorHandle}`} onClick={aoFechar} aria-label={`Abrir perfil de ${comentario.autorNome}`}>
                  {comentario.autorNome}
                </Link>
              ) : (
                comentario.autorNome
              )}
            </strong>
            {comentario.autorHandle && <span>@{comentario.autorHandle}</span>}
            <span>·</span>
            <time>{tempoRelativo(comentario.criadoEm)}</time>
          </div>

          {comentario.conteudo ? <p className="comment-text">{comentario.conteudo}</p> : <p className="comment-unavailable">Conteúdo indisponível.</p>}

          {comentario.anexo?.tipo === 'imagem' && comentario.anexo.url && <img src={comentario.anexo.url} alt="Imagem no comentário" className="comment-media-img" loading="lazy" />}
          {comentario.anexo?.tipo === 'audio' && comentario.anexo.url && <div className="comment-audio"><audio controls src={comentario.anexo.url} preload="metadata" /></div>}
          {comentario.anexo?.tipo === 'videoExterno' && comentario.anexo.url && detectarLinkDeVideo(comentario.anexo.url) && (
            <iframe className="post-video" src={detectarLinkDeVideo(comentario.anexo.url)!.embedUrl} title="Vídeo no comentário" loading="lazy" allowFullScreen />
          )}

          <div className="comment-actions">
            <button type="button" className="comment-reply-btn" onClick={() => aoResponder(comentario)}>
              Responder a {comentario.autorNome}
            </button>
          </div>
        </div>
      </article>

      {no.filhas.length > 0 && (
        <ol className={`comment-tree comment-tree--nivel-${Math.min(profundidade + 1, RECUO_VISUAL_MAXIMO)}`}>
          {no.filhas.map((filha) => (
            <ComentarioDaArvore key={filha.resposta.id} no={filha} profundidade={profundidade + 1} aoResponder={aoResponder} aoFechar={aoFechar} />
          ))}
        </ol>
      )}
    </li>
  );
}

export function ModalComentarios({
  aberto,
  post,
  comentarios,
  carregando,
  enviando,
  aoFechar,
  criarGravacao,
  aoEnviarComentario,
}: Props) {
  const [texto, setTexto] = useState('');
  const [paiId, setPaiId] = useState<string | null>(null);
  const [autorResposta, setAutorResposta] = useState<string | null>(null);
  const [anexo, setAnexo] = useState<AnexoRascunho | null>(null);
  const [mostrarCampoLink, setMostrarCampoLink] = useState(false);
  const [link, setLink] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [gravando, setGravando] = useState(false);
  const [segundosGravacao, setSegundosGravacao] = useState(0);

  const gravacao = useRef<GravacaoLivreDoForum | null>(null);
  const timerGravacao = useRef<number | null>(null);
  const inputTextoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      gravacao.current?.cancelar();
      if (timerGravacao.current) window.clearInterval(timerGravacao.current);
    };
  }, []);

  if (!aberto || !post) return null;

  const autorPostInicial = (post.autorNome || '?').charAt(0).toUpperCase();

  const escolherImagem = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(arquivo.type)) {
      setErro('Só imagem ou GIF entra aqui.');
      return;
    }
    setAnexo({ tipo: 'imagem', arquivo });
    setErro(null);
  };

  const adicionarLink = () => {
    const video = detectarLinkDeVideo(link.trim());
    if (!video) {
      setErro('Cole um link válido do YouTube ou TikTok.');
      return;
    }
    setAnexo({ tipo: 'videoExterno', url: video.urlOriginal });
    setLink('');
    setMostrarCampoLink(false);
    setErro(null);
  };

  const alternarGravacao = async () => {
    if (gravando) {
      if (timerGravacao.current) {
        window.clearInterval(timerGravacao.current);
        timerGravacao.current = null;
      }
      gravacao.current?.parar();
      return;
    }

    if (!criarGravacao) {
      setErro('Gravação de áudio indisponível.');
      return;
    }

    const nova = criarGravacao();
    gravacao.current = nova;
    const inicio = await nova.iniciar();

    if (!inicio.ok) {
      setErro(
        inicio.motivo === 'negado'
          ? 'Libere o microfone para gravar.'
          : 'Não deu para iniciar a gravação.',
      );
      return;
    }

    setGravando(true);
    setSegundosGravacao(0);
    timerGravacao.current = window.setInterval(() => {
      setSegundosGravacao((ant) => ant + 1);
    }, 1000);

    const fim = await inicio.conclusao;
    setGravando(false);
    if (timerGravacao.current) {
      window.clearInterval(timerGravacao.current);
      timerGravacao.current = null;
    }

    if (!fim.ok) {
      if (fim.motivo !== 'cancelado') setErro('A gravação falhou. Tente de novo.');
      return;
    }

    setAnexo({
      tipo: 'audio',
      arquivo: fim.audio.dados,
      duracaoMs: fim.audio.duracaoMs,
    });
    setErro(null);
  };

  const iniciarRespostaPara = (c: ItemComentario) => {
    setPaiId(c.id);
    setAutorResposta(c.autorHandle ? `@${c.autorHandle}` : c.autorNome);
    inputTextoRef.current?.focus();
  };

  const cancelarResposta = () => {
    setPaiId(null);
    setAutorResposta(null);
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando || (!texto.trim() && !anexo)) return;

    const ok = await aoEnviarComentario({
      conteudo: texto.trim(),
      paiId,
      anexo,
    });

    if (ok) {
      setTexto('');
      setPaiId(null);
      setAutorResposta(null);
      setAnexo(null);
      setLink('');
      setMostrarCampoLink(false);
    } else {
      setErro('Não deu para publicar sua resposta. Seu rascunho continua aqui.');
    }
  };

  const comentariosComPai: readonly ComentarioComPai[] = comentarios.map((comentario) => ({
    ...comentario,
    paiId: comentario.paiId ?? null,
  }));
  const arvoreDeComentarios = montarArvoreDeRespostas(comentariosComPai);

  return (
    <div
      className="modal-comentarios-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalComentariosTitulo"
      onClick={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div className="modal-comentarios-sheet" style={{ maxWidth: 620 }}>
        {/* Puxador para mobile (bottom sheet) */}
        <div className="bottom-sheet-handle" aria-hidden="true" />

        {/* Cabeçalho */}
        <header className="comments-sheet-header">
          <div className="comments-sheet-title-wrap">
            <span className="comments-sheet-badge">r/{post.comunidadeSlug}</span>
            <h2 id="modalComentariosTitulo" className="comments-sheet-title">
              Resenha na roda
            </h2>
          </div>
          <button
            type="button"
            className="comments-sheet-close"
            onClick={aoFechar}
            aria-label="Fechar comentários"
          >
            ✕
          </button>
        </header>

        {/* Post Pai em destaque conectado */}
        <div className="comments-thread-parent">
          <div className="thread-avatar">
            <span>{autorPostInicial}</span>
          </div>
          <div className="thread-parent-body">
            <div className="thread-parent-meta">
              <strong>
                {post.autorHandle ? (
                  <Link
                    to={`/u/${post.autorHandle}`}
                    onClick={aoFechar}
                    aria-label={`Abrir perfil de ${post.autorNome}`}
                  >
                    {post.autorNome}
                  </Link>
                ) : (
                  post.autorNome
                )}
              </strong>
              {post.autorHandle && <span>@{post.autorHandle}</span>}
              <span>·</span>
              <span>{tempoRelativo(post.criadoEm)}</span>
            </div>
            {post.titulo && <p className="thread-parent-title"><strong>{post.titulo}</strong></p>}
            {post.corpo && <p className="thread-parent-text">{post.corpo}</p>}
          </div>
        </div>

        {/* Lista de Comentários / Thread */}
        <div className="comments-list-stream" aria-label="Lista de comentários">
          {carregando ? (
            <div className="comments-loading">
              <span className="comments-spinner" aria-hidden="true" />
              <p>Ouvindo a roda…</p>
            </div>
          ) : comentarios.length === 0 ? (
            <div className="comments-empty">
              <p>Nenhuma resposta ainda. Puxe o papo e mande ver.</p>
            </div>
          ) : (
            <ol className="comment-tree comment-tree--nivel-0">
              {arvoreDeComentarios.map((no) => (
                <ComentarioDaArvore key={no.resposta.id} no={no} profundidade={0} aoResponder={iniciarRespostaPara} aoFechar={aoFechar} />
              ))}
            </ol>
          )}
        </div>

        {/* Compositor ágil de resposta direta */}
        <form onSubmit={enviar} className="comments-composer-form">
          {autorResposta && (
            <div className="comments-replying-to">
              <span>Respondendo a <strong>{autorResposta}</strong></span>
              <button
                type="button"
                className="replying-cancel"
                onClick={cancelarResposta}
                aria-label="Cancelar resposta direta"
              >
                ✕
              </button>
            </div>
          )}

          <div className="comments-input-row">
            <textarea
              ref={inputTextoRef}
              maxLength={LIMITE}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={autorResposta ? `Responder a ${autorResposta}…` : 'Responder para a roda…'}
              aria-label="Escrever resposta"
              rows={2}
              disabled={enviando || gravando}
            />
          </div>

          {/* Anexo selecionado */}
          {anexo && (
            <div className="composer-attachment-pill">
              <span>
                {anexo.tipo === 'imagem'
                  ? '📷 Imagem selecionada'
                  : anexo.tipo === 'audio'
                    ? `🎙️ Áudio gravado (${Math.ceil(anexo.duracaoMs / 1000)}s)`
                    : '🎥 Vídeo anexado'}
              </span>
              <button
                type="button"
                className="attachment-remove-btn"
                onClick={() => setAnexo(null)}
                disabled={enviando || gravando}
                aria-label="Remover anexo"
              >
                ✕
              </button>
            </div>
          )}

          {/* Campo para colar link de vídeo */}
          {mostrarCampoLink && !anexo && (
            <div className="composer-link-input-bar">
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Cole o link do YouTube ou TikTok"
                aria-label="Link do vídeo"
                disabled={enviando || gravando}
              />
              <button
                type="button"
                className="action-pill-btn"
                onClick={adicionarLink}
                disabled={enviando || gravando || !link.trim()}
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

          {erro && (
            <p className="comments-composer-error" role="alert">
              {erro}
            </p>
          )}

          <div className="comments-composer-footer">
            <div className="comments-tools-icons">
              {/* Botão Gravar Áudio com 1 clique */}
              <button
                type="button"
                className={`composer-tool-btn ${gravando ? 'is-recording' : ''}`}
                onClick={() => void alternarGravacao()}
                disabled={enviando || (!gravando && Boolean(anexo))}
                title={gravando ? 'Parar gravação' : 'Gravar áudio (1 clique)'}
                aria-label={gravando ? 'Parar gravação' : 'Gravar áudio'}
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill={gravando ? '#ff3d5a' : 'none'}
                  stroke={gravando ? '#ff3d5a' : 'currentColor'}
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
                {gravando && (
                  <span className="recording-counter">
                    0:{String(segundosGravacao).padStart(2, '0')}
                  </span>
                )}
              </button>

              {/* Botão Foto / Imagem */}
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
                  disabled={enviando || gravando || Boolean(anexo)}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Botão Vídeo Embed */}
              <button
                type="button"
                className="composer-tool-btn"
                onClick={() => setMostrarCampoLink((ant) => !ant)}
                disabled={enviando || gravando || Boolean(anexo)}
                title="Adicionar vídeo do YouTube/TikTok"
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
                {texto.length}/{LIMITE}
              </span>
            </div>

            <button
              type="submit"
              className="comments-submit-btn"
              disabled={enviando || gravando || (!texto.trim() && !anexo)}
            >
              {enviando ? 'Enviando…' : 'Responder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

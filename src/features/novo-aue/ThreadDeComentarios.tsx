/**
 * CANÔNICO ATIVO — Visualização de Conversa / Thread de Comentários
 * Referência visual: docs/design/prototipo/Bonde do Arroto.dc.html
 * Mapeamento: docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md
 * 
 * Exibe o post principal destacado no topo, stream de respostas fluidas,
 * compositor integrado e encadeamento limpo sem aninhamento dentro do card.
 */
import { memo, useRef, useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import type { ItemComentario, ItemDoFeed } from './tipos';
import type { AnexoRascunho } from './ModalCompositor';
import type { GravacaoLivreDoForum } from '../../portas/forum';
import { CardDoPost } from './CardDoPost';

export interface ThreadDeComentariosProps {
  post: ItemDoFeed;
  comentarios: readonly ItemComentario[];
  carregando: boolean;
  enviando: boolean;
  criarGravacao?: () => GravacaoLivreDoForum;
  aoVoltar: () => void;
  aoEnviarComentario: (dados: {
    conteudo: string;
    paiId: string | null;
    anexo: AnexoRascunho | null;
  }) => Promise<boolean>;
  aoCurtir?: () => void;
  aoReagir?: (tipo: 'fogo' | 'nojo' | 'trofeu') => void;
  aoAlternarSalvar?: () => void;
  aoTocarAudio?: (fonte?: string | (() => Promise<string | null>)) => void;
  salvo?: boolean;
  audioTocando?: boolean;
  tempoAtualDoAudio?: number;
  duracaoDoAudio?: number | null;
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

function detectarLinkDeVideo(url: string): { tipo: 'youtube' | 'tiktok'; embedUrl: string } | null {
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    return {
      tipo: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };
  }
  const ttMatch = url.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/)(\d+)/);
  if (ttMatch) {
    return {
      tipo: 'tiktok',
      embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
    };
  }
  return null;
}

export const ThreadDeComentarios = memo(function ThreadDeComentarios({
  post,
  comentarios,
  carregando,
  enviando,
  criarGravacao,
  aoVoltar,
  aoEnviarComentario,
  aoCurtir,
  aoReagir,
  aoAlternarSalvar,
  aoTocarAudio,
  salvo = false,
  audioTocando = false,
  tempoAtualDoAudio = 0,
  duracaoDoAudio = null,
}: ThreadDeComentariosProps) {
  const [textoResposta, setTextoResposta] = useState('');
  const [paiId, setPaiId] = useState<string | null>(null);
  const [autorRespostaNome, setAutorRespostaNome] = useState<string | null>(null);
  const [anexo, setAnexo] = useState<AnexoRascunho | null>(null);
  const [linkVideo, setLinkVideo] = useState('');
  const [mostrarCampoLink, setMostrarCampoLink] = useState(false);
  const [erroComentario, setErroComentario] = useState<string | null>(null);

  // Gravação de áudio com 1 clique
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [segundosAudio, setSegundosAudio] = useState(0);
  const gravacaoRef = useRef<GravacaoLivreDoForum | null>(null);
  const timerAudioRef = useRef<number | null>(null);
  const inputTextoRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => {
      gravacaoRef.current?.cancelar();
      if (timerAudioRef.current) window.clearInterval(timerAudioRef.current);
    };
  }, []);

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
  };

  const escolherImagem = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErroComentario('Envie apenas imagem (PNG, JPG, WebP ou GIF).');
      return;
    }
    setAnexo({
      tipo: 'imagem',
      arquivo: file,
    });
    setErroComentario(null);
    e.target.value = '';
  };

  const adicionarLink = () => {
    const info = detectarLinkDeVideo(linkVideo.trim());
    if (!info) {
      setErroComentario('Cole um link válido do YouTube ou TikTok.');
      return;
    }
    setAnexo({
      tipo: 'videoExterno',
      url: linkVideo.trim(),
    });
    setLinkVideo('');
    setMostrarCampoLink(false);
    setErroComentario(null);
  };

  const responderPara = (comentario: ItemComentario) => {
    setPaiId(comentario.id);
    setAutorRespostaNome(comentario.autorNome);
    inputTextoRef.current?.focus();
  };

  const submeterComentario = async (e: FormEvent) => {
    e.preventDefault();
    if (!textoResposta.trim() && !anexo) {
      setErroComentario('Escreva algo ou anexe um áudio/mídia.');
      return;
    }

    setErroComentario(null);
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
      setMostrarCampoLink(false);
    }
  };

  return (
    <section className="thread-view" aria-label="Resenha na roda">
      {/* Cabeçalho no padrão Twitter: seta para voltar e título da conversa */}
      <div className="thread-view-header">
        <button
          type="button"
          className="thread-back-btn"
          onClick={aoVoltar}
          aria-label="Voltar para o feed"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Voltar</span>
        </button>
        <h2 className="thread-view-title">Resenha na roda</h2>
      </div>

      {/* Post original exibido no topo de forma independente (SEM comentários dentro dele) */}
      <div className="thread-original-post">
        <CardDoPost
          post={post}
          salvo={salvo}
          audioTocando={audioTocando}
          tempoAtualDoAudio={tempoAtualDoAudio}
          duracaoDoAudio={duracaoDoAudio}
          aoCurtir={aoCurtir}
          aoReagir={aoReagir}
          aoAlternarSalvar={aoAlternarSalvar}
          aoTocarAudio={aoTocarAudio}
          aoAbrirComentarios={() => {}}
        />
      </div>

      {/* Compositor de resposta fora do card */}
      <form onSubmit={submeterComentario} className="thread-composer-box">
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
            disabled={enviando || gravandoAudio}
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
              disabled={enviando || gravandoAudio}
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
              disabled={enviando || gravandoAudio}
            />
            <button
              type="button"
              className="action-pill-btn"
              onClick={adicionarLink}
              disabled={enviando || gravandoAudio || !linkVideo.trim()}
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
            {/* Gravação de áudio com 1 clique */}
            <button
              type="button"
              className={`composer-tool-btn ${gravandoAudio ? 'is-recording' : ''}`}
              onClick={() => void alternarGravacaoAudio()}
              disabled={enviando || (!gravandoAudio && Boolean(anexo))}
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

            {/* Imagem */}
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
                disabled={enviando || gravandoAudio || Boolean(anexo)}
                style={{ display: 'none' }}
              />
            </label>

            {/* Vídeo */}
            <button
              type="button"
              className="composer-tool-btn"
              onClick={() => setMostrarCampoLink((ant) => !ant)}
              disabled={enviando || gravandoAudio || Boolean(anexo)}
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
              enviando ||
              gravandoAudio ||
              (!textoResposta.trim() && !anexo)
            }
          >
            {enviando ? 'Enviando…' : 'Responder'}
          </button>
        </footer>
      </form>

      {/* Lista de respostas fora do card */}
      <div className="thread-stream">
        {carregando ? (
          <div className="thread-inline-loading">
            <span className="comments-spinner" aria-hidden="true" />
            <p>Ouvindo a roda…</p>
          </div>
        ) : comentarios.length === 0 ? (
          <p className="thread-inline-empty">Nenhum comentário ainda. Puxe o papo acima.</p>
        ) : (
          comentarios.map((c) => {
            const inicialResp = (c.autorNome || '?').charAt(0).toUpperCase();
            return (
              <article
                key={c.id}
                className="thread-reply-item"
                style={{ marginLeft: `${Math.min(c.nivel ?? 0, 2) * 16}px` }}
              >
                {/* Avatar redondo da pessoa */}
                <div className="thread-reply-avatar">
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

                <div className="thread-reply-body">
                  <div className="thread-reply-meta">
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

                  {c.conteudo && <p className="thread-reply-text">{c.conteudo}</p>}

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

                  <div className="thread-reply-actions">
                    <button
                      type="button"
                      className="thread-reply-btn"
                      onClick={() => responderPara(c)}
                    >
                      Responder a {c.autorNome}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
});

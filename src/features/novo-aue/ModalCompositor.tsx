/**
 * CANÔNICO ATIVO — Compositor de Novos Causos e Posts
 * Referência visual: docs/design/prototipo/Bonde do Arroto.dc.html
 * Mapeamento: docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md
 * 
 * Permite digitação com limite de 180 caracteres, gravação de áudio em 1 clique
 * e anexo de imagens/links de vídeo. Não utilize o ComposerCauso legado.
 */
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { ControleDeDialogo } from '../../portas/controleDeDialogo';
import type { ComunidadeDoForum, GravacaoLivreDoForum } from '../../portas/forum';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';
import { criarEnderecoLocal, soltarEnderecoLocal } from '../../plataforma/web/enderecoDeAudio';
import { PreviaDeVideoNoCompositor } from './PreviaDeVideoNoCompositor';

export type AnexoRascunho =
  | { readonly tipo: 'imagem'; readonly arquivo: File }
  | { readonly tipo: 'audio'; readonly arquivo: Blob; readonly duracaoMs: number }
  | { readonly tipo: 'videoExterno'; readonly url: string };

interface Props {
  readonly aberto: boolean;
  readonly controleDeDialogo?: ControleDeDialogo;
  readonly destino?: 'pessoal' | 'comunidade';
  readonly comunidades: readonly ComunidadeDoForum[];
  readonly comunidadePadraoSlug?: string;
  readonly autor?: { readonly nome: string; readonly avatarUrl?: string };
  readonly aoFechar: () => void;
  readonly criarGravacao?: () => GravacaoLivreDoForum;
  readonly aoPublicar: (dados: {
    titulo?: string;
    corpo: string;
    comunidadeSlug?: string;
    anexo: AnexoRascunho | null;
  }) => Promise<boolean>;
}

const LIMITE = 180;

export function ModalCompositor({
  aberto,
  controleDeDialogo,
  destino = 'pessoal',
  comunidades,
  comunidadePadraoSlug,
  autor,
  aoFechar,
  criarGravacao,
  aoPublicar,
}: Props) {
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [comunidadeSlug, setComunidadeSlug] = useState(
    comunidadePadraoSlug ?? comunidades[0]?.slug ?? '',
  );
  const [anexo, setAnexo] = useState<AnexoRascunho | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [segundosGravacao, setSegundosGravacao] = useState(0);
  const [enderecoDoAudio, setEnderecoDoAudio] = useState<string | null>(null);
  const [enderecoDaImagem, setEnderecoDaImagem] = useState<string | null>(null);
  const [tocandoAudio, setTocandoAudio] = useState(false);

  const gravacao = useRef<GravacaoLivreDoForum | null>(null);
  const timerGravacao = useRef<number | null>(null);
  const inputTextoRef = useRef<HTMLTextAreaElement>(null);
  const playerDeAudio = useRef<HTMLAudioElement>(null);
  const limparVisibilidadeDoCampo = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (comunidadePadraoSlug) setComunidadeSlug(comunidadePadraoSlug);
  }, [comunidadePadraoSlug]);

  useEffect(() => {
    return () => {
      gravacao.current?.cancelar();
      if (timerGravacao.current) window.clearInterval(timerGravacao.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (enderecoDoAudio) soltarEnderecoLocal(enderecoDoAudio);
    };
  }, [enderecoDoAudio]);

  useEffect(() => {
    return () => {
      if (enderecoDaImagem) soltarEnderecoLocal(enderecoDaImagem);
    };
  }, [enderecoDaImagem]);

  useEffect(() => {
    if (!aberto || !controleDeDialogo) return;
    return controleDeDialogo.bloquearRolagemDoDocumento();
  }, [aberto, controleDeDialogo]);

  useEffect(() => {
    if (!aberto || !controleDeDialogo) return;
    limparVisibilidadeDoCampo.current?.();
    limparVisibilidadeDoCampo.current = controleDeDialogo.manterCampoVisivelAoAbrirTeclado('compositor-campo');
    return () => {
      limparVisibilidadeDoCampo.current?.();
      limparVisibilidadeDoCampo.current = null;
    };
  }, [aberto, controleDeDialogo]);

  const manterCampoVisivel = () => {
    if (!controleDeDialogo) return;
    limparVisibilidadeDoCampo.current?.();
    limparVisibilidadeDoCampo.current = controleDeDialogo.manterCampoVisivelAoAbrirTeclado('compositor-campo');
  };

  if (!aberto) return null;

  const videoNoTexto = detectarLinkDeVideo(corpo);
  const imagemSelecionada = anexo?.tipo === 'imagem';
  const comunidadeAtual = comunidades.find((comunidade) => comunidade.slug === comunidadeSlug);
  const contextoDaComunidade = destino === 'comunidade' && comunidadeSlug
    ? comunidadeAtual
      ? comunidadeAtual.nome
      : 'Comunidade selecionada'
    : null;

  const escolherImagem = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (videoNoTexto) {
      setErro('Remova o link de vídeo antes de anexar uma imagem.');
      evento.target.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(arquivo.type)) {
      setErro('Só imagem ou GIF entra aqui.');
      return;
    }
    setEnderecoDaImagem(criarEnderecoLocal(arquivo));
    setAnexo({ tipo: 'imagem', arquivo });
    setErro(null);
  };

  const descartarImagem = () => {
    setEnderecoDaImagem(null);
    setAnexo(null);
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
      setErro('Gravação de áudio indisponível agora.');
      return;
    }

    const nova = criarGravacao();
    gravacao.current = nova;
    const inicio = await nova.iniciar();

    if (!inicio.ok) {
      setErro(
        inicio.motivo === 'negado'
          ? 'Libere o microfone para gravar áudio.'
          : inicio.motivo === 'inseguro'
            ? 'Para gravar áudio, abra o Auê em localhost ou HTTPS.'
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
    gravacao.current = null;
    if (timerGravacao.current) {
      window.clearInterval(timerGravacao.current);
      timerGravacao.current = null;
    }

    if (!fim.ok) {
      if (fim.motivo !== 'cancelado') setErro('A gravação não deu certo. Tenta de novo.');
      return;
    }

    setEnderecoDoAudio(criarEnderecoLocal(fim.audio.dados));
    setAnexo({
      tipo: 'audio',
      arquivo: fim.audio.dados,
      duracaoMs: fim.audio.duracaoMs,
    });
    setErro(null);
  };

  const descartarAudio = () => {
    setEnderecoDoAudio(null);
    setTocandoAudio(false);
    setAnexo(null);
  };

  const alternarPlayerDeAudio = async () => {
    const player = playerDeAudio.current;
    if (!player) return;

    if (!player.paused) {
      player.pause();
      return;
    }

    try {
      await player.play();
      setTocandoAudio(true);
    } catch {
      setErro('Não deu para tocar esse áudio agora.');
    }
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;

    if (destino === 'comunidade' && (!comunidadeSlug || !titulo.trim() || !corpo.trim())) {
      setErro(!titulo.trim() ? 'Dê um assunto ao tópico.' : 'Escreva a mensagem do tópico.');
      return;
    }

    if (destino !== 'comunidade' && !corpo.trim() && !anexo) return;
    setEnviando(true);
    setErro(null);

    try {
      const publicado = await aoPublicar({
        ...(destino === 'comunidade' ? { titulo: titulo.trim() } : {}),
        corpo: corpo.trim(),
        ...(destino === 'comunidade' ? { comunidadeSlug } : {}),
        anexo,
      });
      if (!publicado) return;
      setTitulo('');
      setCorpo('');
      if (anexo?.tipo === 'audio') descartarAudio();
      else if (anexo?.tipo === 'imagem') descartarImagem();
      else setAnexo(null);
      aoFechar();
    } finally {
      setEnviando(false);
    }
  };

  const inicialDoAutor = (autor?.nome || 'Você').charAt(0).toUpperCase();

  return (
    <div
      className="modal-comentarios-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogComposerTitle"
      onClick={(e) => e.target === e.currentTarget && !gravando && aoFechar()}
    >
      <div className="modal-comentarios-sheet composer-sheet" style={{ maxWidth: 600 }}>
        <header className="comments-sheet-header">
          <div className="comments-sheet-title-wrap">
            <h2 id="dialogComposerTitle" className="comments-sheet-title">
              {destino === 'pessoal' ? 'Novo post' : 'Novo tópico'}
            </h2>
          </div>
          <button
            type="button"
            className="comments-sheet-close"
            onClick={aoFechar}
            aria-label="Fechar modal"
            disabled={enviando || gravando}
          >
            ✕
          </button>
        </header>

        <form onSubmit={enviar} className="composer-clean-form">
          {destino === 'comunidade' && (
            <label className="composer-topic-title">
              <span>Assunto</span>
              <input
                value={titulo}
                onChange={(e) => { setTitulo(e.target.value); setErro(null); }}
                maxLength={120}
                placeholder="Qual é a resenha?"
                aria-label="Título do tópico"
                disabled={enviando || gravando}
                required
              />
            </label>
          )}
          <div className="composer-message-row">
            <span className="composer-author-avatar" aria-hidden="true">
              {autor?.avatarUrl ? <img src={autor.avatarUrl} alt="" /> : inicialDoAutor}
            </span>
            <textarea
              ref={inputTextoRef}
              id="compositor-campo"
              maxLength={LIMITE}
              rows={4}
              placeholder={destino === 'pessoal' ? 'O que tá pegando?' : 'Conta a resenha…'}
              value={corpo}
              onChange={(e) => {
                const proximoCorpo = e.target.value;
                if (imagemSelecionada && detectarLinkDeVideo(proximoCorpo)) {
                  setErro('Remova a imagem antes de anexar um link de vídeo.');
                  return;
                }
                setCorpo(proximoCorpo);
                setErro(null);
              }}
              onFocus={manterCampoVisivel}
              aria-label={destino === 'pessoal' ? 'Texto da publicação' : 'Mensagem do tópico'}
              disabled={enviando || gravando}
            />
          </div>

          {!anexo && <PreviaDeVideoNoCompositor texto={corpo} />}

          {anexo?.tipo === 'imagem' && enderecoDaImagem && (
            <figure className="composer-image-preview">
              <img src={enderecoDaImagem} alt="Prévia da imagem selecionada" />
              <figcaption>
                <span>Imagem pronta para publicar</span>
                <button
                  type="button"
                  className="composer-image-discard"
                  onClick={descartarImagem}
                  disabled={enviando}
                  aria-label="Remover imagem selecionada"
                >
                  Remover
                </button>
              </figcaption>
            </figure>
          )}

          {gravando && (
            <div className="composer-audio-strip composer-audio-strip--recording" role="status">
              <span className="composer-recording-dot" aria-hidden="true" />
              <span className="composer-audio-state">Gravando</span>
              <div className="composer-audio-wave" aria-hidden="true">
                {Array.from({ length: 14 }, (_, indice) => <i key={indice} />)}
              </div>
              <time className="composer-audio-time">
                0:{String(segundosGravacao).padStart(2, '0')}
              </time>
              <button
                type="button"
                className="composer-stop-recording"
                onClick={() => void alternarGravacao()}
                aria-label="Parar e revisar gravação"
              >
                Parar
              </button>
            </div>
          )}

          {anexo?.tipo === 'audio' && enderecoDoAudio && (
            <div className="composer-audio-strip composer-audio-strip--preview">
              <audio
                ref={playerDeAudio}
                src={enderecoDoAudio}
                onPlay={() => setTocandoAudio(true)}
                onPause={() => setTocandoAudio(false)}
                onEnded={() => setTocandoAudio(false)}
              />
              <button
                type="button"
                className="composer-audio-play"
                onClick={() => void alternarPlayerDeAudio()}
                aria-label={tocandoAudio ? 'Pausar áudio gravado' : 'Ouvir áudio gravado'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  {tocandoAudio
                    ? <path d="M7 5h3v14H7zm7 0h3v14h-3z" />
                    : <path d="M8 5v14l11-7z" />}
                </svg>
              </button>
              <div className={`composer-audio-wave ${tocandoAudio ? 'is-playing' : ''}`} aria-hidden="true">
                {Array.from({ length: 14 }, (_, indice) => <i key={indice} />)}
              </div>
              <time className="composer-audio-time">
                {formatarDuracao(anexo.duracaoMs)}
              </time>
              <button
                type="button"
                className="composer-audio-discard"
                onClick={descartarAudio}
                disabled={enviando}
                aria-label="Descartar áudio gravado"
                title="Descartar áudio"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v5M14 11v5" />
                </svg>
              </button>
            </div>
          )}

          {anexo?.tipo === 'videoExterno' && (
            <div className="composer-attachment-pill">
              <span>🎥 Vídeo externo anexado</span>
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

          {erro && (
            <p className="comments-composer-error" role="alert">
              {erro}
            </p>
          )}

          <footer className="comments-composer-footer" style={{ marginTop: '12px' }}>
            <div className="comments-tools-icons">
              {/* Microfone (1 clique) */}
              <button
                type="button"
                className={`composer-tool-btn ${gravando ? 'is-recording' : ''}`}
                onClick={() => void alternarGravacao()}
                disabled={enviando || (!gravando && Boolean(anexo))}
                title="Gravar áudio"
                aria-label="Gravar áudio"
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
              </button>

              {/* Imagem */}
              <label
                className={`composer-tool-btn ${videoNoTexto ? 'is-disabled' : ''}`}
                title="Adicionar imagem"
                aria-label="Adicionar imagem"
                aria-disabled={Boolean(videoNoTexto)}
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
                  disabled={enviando || gravando || Boolean(anexo) || Boolean(videoNoTexto)}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Link Vídeo */}
              <button
                type="button"
                className="composer-tool-btn"
                onClick={() => inputTextoRef.current?.focus()}
                disabled={enviando || gravando || imagemSelecionada}
                title="Cole um link do YouTube ou TikTok no texto"
                aria-label="Colar link de vídeo no texto"
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
                {corpo.length}/{LIMITE}
              </span>
            </div>

            {contextoDaComunidade && (
              <span className="composer-community-context" title={contextoDaComunidade}>
                {contextoDaComunidade}
              </span>
            )}

            <div className="composer-actions-group">
              <button
                type="button"
                className="action-pill-btn"
                onClick={aoFechar}
                disabled={enviando || gravando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="comments-submit-btn"
                disabled={enviando || gravando || (!corpo.trim() && !anexo)}
              >
                {enviando ? 'Publicando…' : 'Publicar'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

function formatarDuracao(duracaoMs: number): string {
  const segundos = Math.ceil(duracaoMs / 1000);
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}

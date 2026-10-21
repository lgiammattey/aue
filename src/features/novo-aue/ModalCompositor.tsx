/**
 * CANÔNICO ATIVO — Compositor de Novos Causos e Posts
 * Referência visual: docs/design/prototipo/Bonde do Arroto.dc.html
 * Mapeamento: docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md
 * 
 * Permite digitação com limite de 180 caracteres, gravação de áudio em 1 clique
 * e anexo de imagens/links de vídeo. Não utilize o ComposerCauso legado.
 */
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { ComunidadeDoForum, GravacaoLivreDoForum } from '../../portas/forum';
import type { ControleDeDialogo } from '../../portas/controleDeDialogo';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';

export type AnexoRascunho =
  | { readonly tipo: 'imagem'; readonly arquivo: File }
  | { readonly tipo: 'audio'; readonly arquivo: Blob; readonly duracaoMs: number }
  | { readonly tipo: 'videoExterno'; readonly url: string };

interface Props {
  readonly aberto: boolean;
  readonly controleDeDialogo: ControleDeDialogo;
  readonly comunidades: readonly ComunidadeDoForum[];
  readonly comunidadePadraoSlug?: string;
  readonly aoFechar: () => void;
  readonly criarGravacao?: () => GravacaoLivreDoForum;
  readonly aoPublicar: (dados: {
    corpo: string;
    comunidadeSlug: string;
    anexo: AnexoRascunho | null;
  }) => Promise<boolean>;
}

const LIMITE = 180;

export function ModalCompositor({
  aberto,
  controleDeDialogo,
  comunidades,
  comunidadePadraoSlug,
  aoFechar,
  criarGravacao,
  aoPublicar,
}: Props) {
  const [corpo, setCorpo] = useState('');
  const [comunidadeSlug, setComunidadeSlug] = useState(
    comunidadePadraoSlug ?? comunidades[0]?.slug ?? '',
  );
  const [anexo, setAnexo] = useState<AnexoRascunho | null>(null);
  const [mostrarCampoLink, setMostrarCampoLink] = useState(false);
  const [link, setLink] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [segundosGravacao, setSegundosGravacao] = useState(0);

  const gravacao = useRef<GravacaoLivreDoForum | null>(null);
  const timerGravacao = useRef<number | null>(null);
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
    if (!aberto) return;
    return controleDeDialogo.bloquearRolagemDoDocumento();
  }, [aberto, controleDeDialogo]);

  useEffect(() => {
    if (!aberto) return;
    limparVisibilidadeDoCampo.current?.();
    limparVisibilidadeDoCampo.current = controleDeDialogo.manterCampoVisivelAoAbrirTeclado('compositor-campo');
    return () => {
      limparVisibilidadeDoCampo.current?.();
      limparVisibilidadeDoCampo.current = null;
    };
  }, [aberto, controleDeDialogo]);

  const manterCampoVisivel = () => {
    limparVisibilidadeDoCampo.current?.();
    limparVisibilidadeDoCampo.current = controleDeDialogo.manterCampoVisivelAoAbrirTeclado('compositor-campo');
  };

  if (!aberto) return null;

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
      if (fim.motivo !== 'cancelado') setErro('A gravação não deu certo. Tenta de novo.');
      return;
    }

    setAnexo({
      tipo: 'audio',
      arquivo: fim.audio.dados,
      duracaoMs: fim.audio.duracaoMs,
    });
    setErro(null);
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando || (!corpo.trim() && !anexo) || !comunidadeSlug) return;
    setEnviando(true);
    setErro(null);

    try {
      const publicado = await aoPublicar({ corpo: corpo.trim(), comunidadeSlug, anexo });
      if (!publicado) return;
      setCorpo('');
      setAnexo(null);
      setLink('');
      setMostrarCampoLink(false);
      aoFechar();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="modal-comentarios-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogComposerTitle"
      onClick={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div className="modal-comentarios-sheet composer-sheet" style={{ maxWidth: 600 }}>
        <header className="comments-sheet-header">
          <div className="comments-sheet-title-wrap">
            <h2 id="dialogComposerTitle" className="comments-sheet-title">
              Novo post na roda
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
          {comunidades.length > 0 && (
            <div className="composer-community-selector">
              <span className="selector-label">Roda:</span>
              <select
                value={comunidadeSlug}
                onChange={(e) => setComunidadeSlug(e.target.value)}
                aria-label="Escolha a roda"
                disabled={enviando || gravando}
              >
                {comunidades.map((c) => (
                  <option key={c.id} value={c.slug}>
                    r/{c.slug} — {c.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <textarea
            id="compositor-campo"
            maxLength={LIMITE}
            rows={4}
            placeholder="O que tá pegando na roda?"
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            onFocus={manterCampoVisivel}
            aria-label="Texto da publicação"
            disabled={enviando || gravando}
          />

          {anexo && (
            <div className="composer-attachment-pill">
              <span>
                {anexo.tipo === 'imagem'
                  ? '📷 Imagem selecionada'
                  : anexo.tipo === 'audio'
                    ? `🎙️ Áudio de ${Math.ceil(anexo.duracaoMs / 1000)}s gravado`
                    : '🎥 Vídeo externo anexado'}
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
                Adicionar
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

          <footer className="comments-composer-footer" style={{ marginTop: '12px' }}>
            <div className="comments-tools-icons">
              {/* Microfone (1 clique) */}
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
                  disabled={enviando || gravando || Boolean(anexo)}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Link Vídeo */}
              <button
                type="button"
                className="composer-tool-btn"
                onClick={() => setMostrarCampoLink((ant) => !ant)}
                disabled={enviando || gravando || Boolean(anexo)}
                title="Adicionar vídeo do YouTube/TikTok"
                aria-label="Adicionar link de vídeo"
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

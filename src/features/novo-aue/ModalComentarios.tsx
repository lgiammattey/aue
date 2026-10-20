import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { ItemComentario, ItemDoFeed } from './tipos';

interface Props {
  readonly aberto: boolean;
  readonly post: ItemDoFeed | null;
  readonly comentarios: readonly ItemComentario[];
  readonly carregando: boolean;
  readonly enviando: boolean;
  readonly aoFechar: () => void;
  readonly aoEnviarComentario: (conteudo: string) => Promise<void>;
  readonly aoIrParaConversaCompleta?: () => void;
}

function formatarTempo(iso: string): string {
  try {
    const agora = Date.now();
    const data = new Date(iso).getTime();
    const diff = Math.max(0, Math.floor((agora - data) / 1000));
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  } catch {
    return 'recentemente';
  }
}

export function ModalComentarios({
  aberto,
  post,
  comentarios,
  carregando,
  enviando,
  aoFechar,
  aoEnviarComentario,
  aoIrParaConversaCompleta,
}: Props) {
  const [texto, setTexto] = useState('');

  if (!aberto || !post) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    await aoEnviarComentario(texto.trim());
    setTexto('');
  };

  return (
    <div
      className="modal open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalComentariosTitulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div className="dialog" style={{ maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="dialog-head" style={{ borderBottom: '1px solid var(--aue-line)', paddingBottom: 14 }}>
          <div>
            <span style={{ color: 'var(--aue-accent)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
              r/{post.comunidadeSlug}
            </span>
            <h2 id="modalComentariosTitulo" style={{ fontSize: 20, marginTop: 2 }}>
              Resenha na roda
            </h2>
          </div>
          <button type="button" className="close" onClick={aoFechar} aria-label="Fechar comentários">
            ✕
          </button>
        </div>

        {/* Post Resumido */}
        <div
          style={{
            background: 'var(--aue-surface-2)',
            border: '1px solid var(--aue-line)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--aue-muted)', marginBottom: 4 }}>
            {post.autorHandle ? (
              <Link className="author-profile-link" to={`/u/${post.autorHandle}`} onClick={aoFechar} aria-label={`Abrir perfil de ${post.autorNome}`}>
                <strong>{post.autorNome}</strong> <span>@{post.autorHandle}</span>
              </Link>
            ) : <strong>{post.autorNome}</strong>}
            <span>·</span>
            <span>{formatarTempo(post.criadoEm)}</span>
          </div>
          <h3 style={{ fontSize: 15, margin: 0, fontWeight: 800, lineHeight: 1.3 }}>{post.titulo}</h3>
          {post.corpo && post.corpo !== post.titulo && (
            <p style={{ fontSize: 13, color: 'var(--aue-muted)', marginTop: 4, marginInline: 0, marginBottom: 0 }}>
              {post.corpo}
            </p>
          )}
        </div>

        {/* Lista de Comentários */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 120,
            maxHeight: 280,
            paddingRight: 4,
            marginBottom: 16,
          }}
          aria-label="Lista de comentários"
        >
          {carregando ? (
            <p style={{ color: 'var(--aue-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
              Ouvindo o que a roda comentou…
            </p>
          ) : comentarios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--aue-muted)' }}>
              <p style={{ fontSize: 15, fontWeight: 700 }}>Nenhum comentário na roda ainda.</p>
              <small>Solte o primeiro causo ou resposta para puxar o papo.</small>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comentarios.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: 'var(--aue-surface)',
                    border: '1px solid var(--aue-line)',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      {c.autorHandle ? (
                        <Link className="author-profile-link" to={`/u/${c.autorHandle}`} onClick={aoFechar} aria-label={`Abrir perfil de ${c.autorNome}`}>
                          <strong style={{ fontSize: 13 }}>{c.autorNome}</strong>{' '}
                          <span style={{ fontSize: 12, color: 'var(--aue-subtle)' }}>@{c.autorHandle}</span>
                        </Link>
                      ) : <strong style={{ fontSize: 13 }}>{c.autorNome}</strong>}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--aue-subtle)' }}>{formatarTempo(c.criadoEm)}</span>
                  </div>
                  <p style={{ fontSize: 14, margin: 0, color: 'var(--aue-text)', lineHeight: 1.4 }}>{c.conteudo}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulário de Nova Resposta */}
        <form onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--aue-line)', paddingTop: 14 }}>
          <label htmlFor="comentarioInput" className="forum-sr" style={{ display: 'none' }}>
            Escrever resposta
          </label>
          <textarea
            id="comentarioInput"
            placeholder="Responder para a roda…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={enviando}
            required
            rows={2}
            style={{
              width: '100%',
              minHeight: 64,
              resize: 'vertical',
              padding: 10,
              fontSize: 14,
              background: 'var(--aue-surface-2)',
              border: '1px solid var(--aue-line)',
              borderRadius: 8,
              color: 'var(--aue-text)',
              marginBottom: 10,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            {aoIrParaConversaCompleta ? (
              <button
                type="button"
                className="tab"
                onClick={aoIrParaConversaCompleta}
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                ↗ Ver página completa
              </button>
            ) : <span />}
            <button
              type="submit"
              className="submit"
              disabled={enviando || !texto.trim()}
              style={{ padding: '8px 18px', fontSize: 14 }}
            >
              {enviando ? 'Enviando…' : 'Responder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

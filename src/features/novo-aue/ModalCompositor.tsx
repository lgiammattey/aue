import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ComunidadeDoForum } from '../../portas/forum';

interface Props {
  readonly aberto: boolean;
  readonly comunidades: readonly ComunidadeDoForum[];
  readonly comunidadePadraoSlug?: string;
  readonly aoFechar: () => void;
  readonly aoPublicar: (dados: {
    titulo: string;
    corpo: string;
    comunidadeSlug: string;
    tipo: 'Texto' | 'Áudio' | 'Vídeo';
  }) => Promise<void>;
}

export function ModalCompositor({
  aberto,
  comunidades,
  comunidadePadraoSlug,
  aoFechar,
  aoPublicar,
}: Props) {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<'Texto' | 'Áudio' | 'Vídeo'>('Texto');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [comunidadeSlug, setComunidadeSlug] = useState(
    comunidadePadraoSlug ?? comunidades[0]?.slug ?? 'arena-do-arroto',
  );
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (comunidadePadraoSlug) {
      setComunidadeSlug(comunidadePadraoSlug);
    } else if (comunidades.length > 0 && (!comunidadeSlug || !comunidades.some((c) => c.slug === comunidadeSlug))) {
      setComunidadeSlug(comunidades[0].slug);
    }
  }, [comunidadePadraoSlug, comunidades, comunidadeSlug]);

  if (!aberto) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setEnviando(true);
    try {
      await aoPublicar({
        titulo: titulo.trim(),
        corpo: corpo.trim(),
        comunidadeSlug,
        tipo,
      });
      setTitulo('');
      setCorpo('');
      aoFechar();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="dialogComposerTitle">
      <div className="dialog">
        <div className="dialog-head">
          <h2 id="dialogComposerTitle">Soltar um arroto</h2>
          <button type="button" className="close" onClick={aoFechar} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        <div className="post-types" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['Texto', 'Áudio', 'Vídeo'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={tipo === t ? 'tab active' : 'tab'}
              onClick={() => setTipo(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {comunidades.length > 0 && (
            <select
              value={comunidadeSlug}
              onChange={(e) => setComunidadeSlug(e.target.value)}
              aria-label="Escolha a roda"
            >
              {comunidades.map((c) => (
                <option key={c.id} value={c.slug}>
                  r/{c.slug} — {c.nome}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            placeholder="Título do seu post…"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            aria-label="Título da publicação"
          />

          {tipo === 'Áudio' && (
            <div style={{ background: 'var(--aue-surface-2)', border: '1px solid var(--aue-line)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--aue-muted)' }}>
                Quer gravar seu arroto com medição real do algoritmo YAMNet e receber a nota da banca?
              </p>
              <button
                type="button"
                className="tab"
                style={{ border: '1px solid var(--aue-accent)', color: 'var(--aue-accent)' }}
                onClick={() => {
                  aoFechar();
                  navigate('/arena');
                }}
              >
                🎙 Abrir a Arena de Gravação
              </button>
            </div>
          )}

          <textarea
            placeholder={
              tipo === 'Texto'
                ? 'Conte o que rolou, quem ouviu e qual foi a reação…'
                : tipo === 'Áudio'
                ? 'Descrição do arroto gravado…'
                : 'Link ou relato do vídeo do arroto…'
            }
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            aria-label="Conteúdo do post"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              className="tab"
              onClick={aoFechar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="submit"
              disabled={enviando || !titulo.trim()}
            >
              {enviando ? 'Publicando…' : 'Publicar no Auê'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from 'react';

interface Props {
  readonly aberto: boolean;
  readonly aoFechar: () => void;
  readonly aoCriar: (dados: { nome: string; slug: string; descricao: string }) => Promise<void>;
}

export function ModalFundarComunidade({ aberto, aoFechar, aoCriar }: Props) {
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!aberto) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !slug.trim()) return;
    setEnviando(true);
    try {
      await aoCriar({
        nome: nome.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        descricao: descricao.trim(),
      });
      setNome('');
      setSlug('');
      setDescricao('');
      aoFechar();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="dialogFounderTitle">
      <div className="dialog">
        <div className="dialog-head">
          <h2 id="dialogFounderTitle">Fundar comunidade</h2>
          <button type="button" className="close" onClick={aoFechar} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nome da comunidade (ex: Arroto Matinal)"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (!slug) {
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }
            }}
            required
            aria-label="Nome da comunidade"
          />

          <input
            type="text"
            placeholder="Identificador na URL (ex: arroto-matinal)"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
            required
            aria-label="Identificador na URL"
          />

          <textarea
            placeholder="Sobre o que é a sua roda e quem é bem-vindo…"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            aria-label="Descrição da comunidade"
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
              disabled={enviando || !nome.trim() || !slug.trim()}
            >
              {enviando ? 'Fundando…' : 'Fundar roda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

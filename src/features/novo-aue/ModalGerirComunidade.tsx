import { useState, type FormEvent } from 'react';

interface Props {
  readonly aberto: boolean;
  readonly regrasIniciais: readonly string[];
  readonly moderadoresIniciais: readonly (readonly [string, string])[];
  readonly aoFechar: () => void;
  readonly aoSalvar: (dados: { regras: string[]; moderadores: (readonly [string, string])[] }) => void;
}

export function ModalGerirComunidade({
  aberto,
  regrasIniciais,
  moderadoresIniciais,
  aoFechar,
  aoSalvar,
}: Props) {
  const [regrasTexto, setRegrasTexto] = useState(() => regrasIniciais.join('\n'));
  const [modsTexto, setModsTexto] = useState(() =>
    moderadoresIniciais.map(([handle, papel]) => `${handle}: ${papel}`).join('\n'),
  );

  if (!aberto) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const novasRegras = regrasTexto
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    const novosMods: (readonly [string, string])[] = modsTexto
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [handle, papel] = l.split(':').map((s) => s.trim());
        return [handle ?? 'u/mod', papel ?? 'moderador'] as const;
      });

    aoSalvar({ regras: novasRegras, moderadores: novosMods });
    aoFechar();
  };

  return (
    <div
      className="modal open"
      id="communityAdminModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogAdminTitle"
    >
      <div className="dialog">
        <div className="dialog-head">
          <h2 id="dialogAdminTitle">Administrar comunidade</h2>
          <button type="button" className="close" onClick={aoFechar} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="community-form">
          <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            Regras da comunidade
            <textarea
              value={regrasTexto}
              onChange={(e) => setRegrasTexto(e.target.value)}
              aria-label="Regras da comunidade"
              rows={4}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            Moderadores
            <textarea
              value={modsTexto}
              onChange={(e) => setModsTexto(e.target.value)}
              aria-label="Moderadores"
              rows={3}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="tab" onClick={aoFechar}>
              Cancelar
            </button>
            <button type="submit" className="submit">
              Salvar gestão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

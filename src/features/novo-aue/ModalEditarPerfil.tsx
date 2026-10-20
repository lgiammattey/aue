import { useState, type FormEvent } from 'react';

interface Props {
  readonly aberto: boolean;
  readonly nomeInicial: string;
  readonly bioInicial: string;
  readonly cidadeInicial: string;
  readonly aoFechar: () => void;
  readonly aoSalvar: (dados: { apelido: string; bio: string; cidade: string }) => Promise<void>;
}

export function ModalEditarPerfil({
  aberto,
  nomeInicial,
  bioInicial,
  cidadeInicial,
  aoFechar,
  aoSalvar,
}: Props) {
  const [apelido, setApelido] = useState(nomeInicial);
  const [bio, setBio] = useState(bioInicial);
  const [cidade, setCidade] = useState(cidadeInicial);
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!apelido.trim()) return;
    setSalvando(true);
    try {
      await aoSalvar({
        apelido: apelido.trim(),
        bio: bio.trim(),
        cidade: cidade.trim(),
      });
      aoFechar();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="modal open"
      id="profileModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogProfileTitle"
    >
      <div className="dialog">
        <div className="dialog-head">
          <h2 id="dialogProfileTitle">Editar perfil</h2>
          <button type="button" className="close" onClick={aoFechar} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Nome de exibição
            <input
              type="text"
              id="profileNameInput"
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              required
              aria-label="Nome de exibição"
            />
          </label>

          <label>
            Bio
            <textarea
              id="profileBioInput"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              aria-label="Bio do perfil"
            />
          </label>

          <label>
            Cidade
            <input
              type="text"
              id="profileCityInput"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              aria-label="Cidade"
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              className="tab"
              onClick={aoFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="submit"
              id="saveProfileBtn"
              disabled={salvando || !apelido.trim()}
            >
              {salvando ? 'Salvando…' : 'Salvar mudanças'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

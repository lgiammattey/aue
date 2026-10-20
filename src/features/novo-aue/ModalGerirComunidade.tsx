import { useRef, useState, type FormEvent } from 'react';

interface Props {
  readonly aberto: boolean;
  readonly regrasIniciais: readonly string[];
  readonly moderadoresIniciais: readonly (readonly [string, string])[];
  readonly fotoUrlInicial?: string | null;
  readonly capaUrlInicial?: string | null;
  readonly aoFechar: () => void;
  readonly aoSalvar: (dados: {
    regras: string[];
    moderadores: (readonly [string, string])[];
    fotoUrl?: string | null;
    capaUrl?: string | null;
  }) => void;
}

export function ModalGerirComunidade({
  aberto,
  regrasIniciais,
  moderadoresIniciais,
  fotoUrlInicial,
  capaUrlInicial,
  aoFechar,
  aoSalvar,
}: Props) {
  const [regrasTexto, setRegrasTexto] = useState(() => regrasIniciais.join('\n'));
  const [modsTexto, setModsTexto] = useState(() =>
    moderadoresIniciais.map(([handle, papel]) => `${handle}: ${papel}`).join('\n'),
  );
  const [fotoUrl, setFotoUrl] = useState<string | null>(() => fotoUrlInicial ?? null);
  const [capaUrl, setCapaUrl] = useState<string | null>(() => capaUrlInicial ?? null);

  const fileInputFoto = useRef<HTMLInputElement | null>(null);
  const fileInputCapa = useRef<HTMLInputElement | null>(null);

  if (!aberto) return null;

  const handleFotoUpload = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFotoUrl(url);
  };

  const handleCapaUpload = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapaUrl(url);
  };

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

    aoSalvar({
      regras: novasRegras,
      moderadores: novosMods,
      fotoUrl,
      capaUrl,
    });
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
      <div className="dialog" style={{ maxWidth: 540 }}>
        <div className="dialog-head">
          <h2 id="dialogAdminTitle">Administrar comunidade</h2>
          <button type="button" className="close" onClick={aoFechar} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="community-form">
          {/* Capa / Thumbnail da Comunidade */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Capa / Thumbnail da comunidade
            </span>
            <div
              style={{
                height: 100,
                borderRadius: 8,
                border: '1px dashed var(--aue-line)',
                background: capaUrl
                  ? `url("${capaUrl}") center/cover no-repeat`
                  : 'var(--aue-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <button
                type="button"
                className="tab"
                style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(0,0,0,0.6)' }}
                onClick={() => fileInputCapa.current?.click()}
              >
                {capaUrl ? 'Trocar capa' : '+ Escolher thumbnail/capa'}
              </button>
              {capaUrl && (
                <button
                  type="button"
                  className="tab"
                  style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(0,0,0,0.6)', marginLeft: 8 }}
                  onClick={() => setCapaUrl(null)}
                >
                  Remover
                </button>
              )}
            </div>
            <input
              ref={fileInputCapa}
              type="file"
              accept="image/*"
              aria-label="Capa da comunidade"
              style={{ display: 'none' }}
              onChange={(e) => handleCapaUpload(e.target.files?.[0])}
            />
          </div>

          {/* Foto de Perfil / Avatar da Comunidade */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '1px solid var(--aue-line)',
                background: fotoUrl
                  ? `url("${fotoUrl}") center/cover no-repeat`
                  : 'var(--aue-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: 'var(--aue-muted)',
                flexShrink: 0,
              }}
            >
              {!fotoUrl && '📷'}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Foto de perfil da comunidade
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="tab"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => fileInputFoto.current?.click()}
                >
                  {fotoUrl ? 'Trocar foto' : '+ Escolher foto'}
                </button>
                {fotoUrl && (
                  <button
                    type="button"
                    className="tab"
                    style={{ fontSize: 12, padding: '4px 10px' }}
                    onClick={() => setFotoUrl(null)}
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputFoto}
              type="file"
              accept="image/*"
              aria-label="Foto de perfil da comunidade"
              style={{ display: 'none' }}
              onChange={(e) => handleFotoUpload(e.target.files?.[0])}
            />
          </div>

          <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            Regras da comunidade
            <textarea
              value={regrasTexto}
              onChange={(e) => setRegrasTexto(e.target.value)}
              aria-label="Regras da comunidade"
              rows={3}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            Moderadores
            <textarea
              value={modsTexto}
              onChange={(e) => setModsTexto(e.target.value)}
              aria-label="Moderadores"
              rows={2}
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

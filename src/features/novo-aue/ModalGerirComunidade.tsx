import { useRef, useState, type FormEvent } from 'react';
import type { TipoDeMidiaDaComunidade } from '../../portas/forum';

interface Props {
  readonly aberto: boolean;
  readonly regrasIniciais: readonly string[];
  readonly moderadoresIniciais: readonly (readonly [string, string])[];
  readonly fotoUrlInicial?: string | null;
  readonly capaUrlInicial?: string | null;
  readonly podeGerirMidia: boolean;
  readonly midiaEnviando?: TipoDeMidiaDaComunidade | null;
  readonly aoFechar: () => void;
  readonly aoSalvar: (dados: {
    regras: string[];
    moderadores: (readonly [string, string])[];
  }) => void;
  readonly aoEscolherMidia: (tipo: TipoDeMidiaDaComunidade, arquivo?: File) => void;
  readonly aoRemoverMidia: (tipo: TipoDeMidiaDaComunidade) => void;
}

export function ModalGerirComunidade({
  aberto,
  regrasIniciais,
  moderadoresIniciais,
  fotoUrlInicial,
  capaUrlInicial,
  podeGerirMidia,
  midiaEnviando,
  aoFechar,
  aoSalvar,
  aoEscolherMidia,
  aoRemoverMidia,
}: Props) {
  const [regrasTexto, setRegrasTexto] = useState(() => regrasIniciais.join('\n'));
  const [modsTexto, setModsTexto] = useState(() =>
    moderadoresIniciais.map(([handle, papel]) => `${handle}: ${papel}`).join('\n'),
  );
  const fileInputFoto = useRef<HTMLInputElement | null>(null);
  const fileInputCapa = useRef<HTMLInputElement | null>(null);

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

    aoSalvar({
      regras: novasRegras,
      moderadores: novosMods,
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
                background: capaUrlInicial
                  ? `url("${capaUrlInicial}") center/cover no-repeat`
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
                disabled={!podeGerirMidia || midiaEnviando === 'capa'}
              >
                {midiaEnviando === 'capa' ? 'Salvando…' : capaUrlInicial ? 'Trocar capa' : '+ Escolher thumbnail/capa'}
              </button>
              {capaUrlInicial && (
                <button
                  type="button"
                  className="tab"
                  style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(0,0,0,0.6)', marginLeft: 8 }}
                  onClick={() => aoRemoverMidia('capa')}
                  disabled={!podeGerirMidia || midiaEnviando === 'capa'}
                >
                  Remover
                </button>
              )}
            </div>
            <input
              ref={fileInputCapa}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Capa da comunidade"
              style={{ display: 'none' }}
              onChange={(e) => aoEscolherMidia('capa', e.target.files?.[0])}
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
                background: fotoUrlInicial
                  ? `url("${fotoUrlInicial}") center/cover no-repeat`
                  : 'var(--aue-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: 'var(--aue-muted)',
                flexShrink: 0,
              }}
            >
              {!fotoUrlInicial && '📷'}
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
                  disabled={!podeGerirMidia || midiaEnviando === 'avatar'}
                >
                  {midiaEnviando === 'avatar' ? 'Salvando…' : fotoUrlInicial ? 'Trocar foto' : '+ Escolher foto'}
                </button>
                {fotoUrlInicial && (
                  <button
                    type="button"
                    className="tab"
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => aoRemoverMidia('avatar')}
                  disabled={!podeGerirMidia || midiaEnviando === 'avatar'}
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputFoto}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Foto de perfil da comunidade"
              style={{ display: 'none' }}
              onChange={(e) => aoEscolherMidia('avatar', e.target.files?.[0])}
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

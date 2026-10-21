import { useEffect, useRef, useState, type FormEvent } from 'react';
import { manterFocoNoDialogo } from '../../plataforma/web/focoNoDialogo';

export const LIMITE_DO_MOTIVO = 500;

interface Props {
  readonly tipo: 'denunciar' | 'apagar';
  /** Título do post, só para a pessoa saber de qual está falando. */
  readonly titulo: string;
  /** Causo com áudio: oferece apagar o arquivo junto. */
  readonly temAudio: boolean;
  readonly enviando: boolean;
  readonly erro: string | null;
  readonly aoConfirmar: (dados: { motivo: string; apagarAudio: boolean }) => void;
  readonly aoCancelar: () => void;
}

/** Confirmação de denunciar ou apagar. Quem chama só fecha depois do `ok` do servidor. */
export function DialogoDoPost({ tipo, titulo, temAudio, enviando, erro, aoConfirmar, aoCancelar }: Props) {
  const dialogo = useRef<HTMLDivElement>(null);
  const [motivo, setMotivo] = useState('');
  const [apagarAudio, setApagarAudio] = useState(true);
  const denunciando = tipo === 'denunciar';

  useEffect(() => {
    dialogo.current?.focus();
  }, []);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (enviando || motivo.length > LIMITE_DO_MOTIVO) return;
    aoConfirmar({ motivo: motivo.trim(), apagarAudio: temAudio && apagarAudio });
  };

  const resumo = titulo.length > 80 ? `${titulo.slice(0, 80)}…` : titulo;

  return (
    <div className="modal open" role="presentation" onClick={(e) => e.target === e.currentTarget && !enviando && aoCancelar()}>
      <div
        ref={dialogo}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogoDoPostTitulo"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !enviando) aoCancelar();
          manterFocoNoDialogo(e.nativeEvent, dialogo.current);
        }}
      >
        <div className="dialog-head">
          <h2 id="dialogoDoPostTitulo">{denunciando ? 'Denunciar post' : 'Apagar post'}</h2>
          <button type="button" className="close" onClick={aoCancelar} disabled={enviando} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={enviar}>
          <p style={{ margin: '0 0 12px', opacity: 0.8 }}>“{resumo}”</p>

          {denunciando ? (
            <>
              <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                Por que você está denunciando? (opcional)
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  maxLength={LIMITE_DO_MOTIVO}
                  disabled={enviando}
                  aria-label="Motivo da denúncia"
                />
              </label>
              <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.7 }}>
                A denúncia chega para quem cuida do Auê. Não dá para desfazer, e o post não some só porque você denunciou.
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 12px' }}>Isso não dá para desfazer.</p>
              {temAudio && (
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <input type="checkbox" checked={apagarAudio} onChange={(e) => setApagarAudio(e.target.checked)} disabled={enviando} />
                  Apagar também o áudio do meu arroto
                </label>
              )}
            </>
          )}

          {erro && <p role="alert" style={{ margin: '0 0 12px' }}>{erro}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="tab" onClick={aoCancelar} disabled={enviando}>Cancelar</button>
            <button type="submit" className="submit" disabled={enviando}>
              {enviando ? (denunciando ? 'Enviando…' : 'Apagando…') : denunciando ? 'Enviar denúncia' : 'Apagar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

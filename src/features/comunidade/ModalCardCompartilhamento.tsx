import React, { useState } from 'react';
import { formatarNota } from '../../shared/formato/nota';

interface ModalCardCompartilhamentoProps {
  aberto: boolean;
  nota: number;
  autorNome: string;
  comunidadeNome: string;
  textoCauso?: string;
  codigoDesafio?: string;
  onFechar: () => void;
}

export const ModalCardCompartilhamento: React.FC<ModalCardCompartilhamentoProps> = ({
  aberto,
  nota,
  autorNome,
  comunidadeNome,
  textoCauso,
  codigoDesafio = 'k4x9',
  onFechar,
}) => {
  const [copiado, setCopiado] = useState(false);

  if (!aberto) return null;

  const urlDesafio = `https://aue.web.app/b/${codigoDesafio}`;
  const textoZap = `Soltei um arroto de nota ${nota} no Auê! Quero ver bater: ${urlDesafio}`;
  const linkZap = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoZap)}`;

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(urlDesafio);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="modal-causo-overlay" role="dialog" aria-modal="true" aria-label="Card de compartilhamento">
      <div className="modal-causo-box" style={{ maxWidth: '360px', alignItems: 'center' }}>
        <header className="modal-header" style={{ width: '100%' }}>
          <h2 className="modal-titulo">CARD 9:16</h2>
          <button
            type="button"
            className="btn-fechar-modal"
            onClick={onFechar}
            aria-label="Fechar card"
          >
            ✕
          </button>
        </header>

        {/* Card Vertical Proporção 9:16 */}
        <div
          style={{
            width: '260px',
            aspectRatio: '9/16',
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: '24px',
            padding: '24px 20px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '15px',
                letterSpacing: '0.08em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
              }}
            >
              BONDE DO ARROTO
            </span>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
              @{autorNome.toLowerCase().replace(/\s+/g, '_')} · {comunidadeNome}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '84px',
                lineHeight: 1,
                background: 'var(--accent)',
                color: 'var(--bg)',
                alignSelf: 'flex-start',
                padding: '4px 14px',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              {formatarNota(nota)}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                lineHeight: 1.1,
                textTransform: 'uppercase',
                color: 'var(--fg)',
                marginTop: '6px',
              }}
            >
              {textoCauso ? textoCauso.slice(0, 50) : 'TÁ MALUCO. BATE ESSE.'}
            </span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--muted)',
              borderTop: '1px solid var(--border)',
              paddingTop: '10px',
            }}
          >
            aue.web.app/b/{codigoDesafio}
          </div>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '16px' }}>
          <a
            href={linkZap}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-salvar-causo"
            style={{ textAlign: 'center', textDecoration: 'none' }}
          >
            MANDAR NO WHATSAPP
          </a>
          <button
            type="button"
            className="btn-cancelar-causo"
            onClick={handleCopiar}
            style={{ width: '100%' }}
          >
            {copiado ? 'LINK COPIADO!' : 'COPIAR LINK DO DESAFIO'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { formatarNota } from '../../shared/formato/nota';

interface ModalCardCompartilhamentoProps {
  aberto: boolean;
  /** Endereço público e abrível do que está sendo compartilhado. */
  url: string;
  /** Só existe quando o servidor entregou uma nota. Sem nota, o card não mostra placar. */
  nota?: number | string;
  autorNome: string;
  comunidadeNome?: string;
  textoCauso?: string;
  /** Rótulo do botão de link: "Copiar link do causo" ou "Copiar link do X1". */
  rotuloLink?: string;
  onFechar: () => void;
  onNotificar?: (msg: string) => void;
}

export const ModalCardCompartilhamento: React.FC<ModalCardCompartilhamentoProps> = ({
  aberto,
  url,
  nota,
  autorNome,
  comunidadeNome,
  textoCauso,
  rotuloLink = 'Copiar link',
  onFechar,
  onNotificar,
}) => {
  if (!aberto) return null;

  const cardKicker = comunidadeNome ? `${autorNome} · ${comunidadeNome}` : autorNome;
  const temNota = nota !== undefined && nota !== '';
  const cardScore = typeof nota === 'number' ? formatarNota(nota) : String(nota ?? '');
  const cardLine = textoCauso ? textoCauso.slice(0, 48) : '';
  const urlCurta = url.replace(/^https?:\/\//, '');

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      onNotificar?.('Link copiado.');
    } catch {
      onNotificar?.('Não deu pra copiar. Selecione o link e copie na mão.');
    }
  };

  const handleWhatsApp = () => {
    const textoZap = temNota
      ? `Olha esse arroto de nota ${cardScore} no Auê: ${url}`
      : `Olha esse causo no Auê: ${url}`;
    const link = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoZap)}`;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const outBtnStyle: React.CSSProperties = {
    minHeight: '44px',
    borderRadius: '12px',
    border: '1px solid var(--border-strong)',
    background: 'transparent',
    color: 'var(--fg)',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-scrim, rgba(0,0,0,0.75))',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
        boxSizing: 'border-box',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Modal de Compartilhamento"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: '24px',
          padding: '20px 16px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,.35)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header do Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--fg)' }}>
            COMPARTILHAR
          </span>
          <button
            type="button"
            onClick={onFechar}
            style={{
              background: 'none',
              border: 0,
              color: 'var(--muted)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>

        {/* Card Proporção 9:12 Canônica */}
        <div
          style={{
            aspectRatio: '9/12',
            width: '225px',
            alignSelf: 'center',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            padding: '18px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--muted)', letterSpacing: '.04em' }}>
            AUÊ!
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{cardKicker}</span>
            {temNota && (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '64px',
                lineHeight: 1,
                background: 'var(--accent)',
                color: 'var(--accent-on)',
                alignSelf: 'flex-start',
                padding: '4px 12px',
                borderRadius: '12px',
              }}
            >
              {cardScore}
            </span>
            )}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', lineHeight: 1.15, color: 'var(--fg)' }}>
              {cardLine}
            </span>
          </div>

          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: 'var(--muted)' }}>
            {urlCurta}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button type="button" onClick={handleCopiarLink} style={outBtnStyle}>
            {rotuloLink}
          </button>
          <button type="button" onClick={handleWhatsApp} style={outBtnStyle}>
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

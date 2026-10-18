import React, { useEffect, useState } from 'react';
import { formatarNota } from '../../shared/formato/nota';

interface ModalCardCompartilhamentoProps {
  aberto: boolean;
  nota: number | string;
  autorNome: string;
  comunidadeNome?: string;
  textoCauso?: string;
  codigoDesafio?: string;
  onFechar: () => void;
  onNotificar?: (msg: string) => void;
}

export const ModalCardCompartilhamento: React.FC<ModalCardCompartilhamentoProps> = ({
  aberto,
  nota,
  autorNome,
  comunidadeNome = 'Bonde do Arroto',
  textoCauso,
  codigoDesafio = 'k4x9',
  onFechar,
  onNotificar,
}) => {
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gerando) {
      timer = setInterval(() => {
        setProgresso((p) => {
          const prox = p + 12 + Math.random() * 10;
          if (prox >= 100) {
            clearInterval(timer);
            setGerando(false);
            if (onNotificar) onNotificar('Vídeo pronto pro TikTok. Baixando.');
            return 0;
          }
          return prox;
        });
      }, 300);
    }
    return () => clearInterval(timer);
  }, [gerando, onNotificar]);

  if (!aberto) return null;

  const urlX1 = `https://aue.app/x1/${codigoDesafio}`;

  const cardKicker = `@${autorNome.toLowerCase().replace(/\s+/g, '_')} · ${comunidadeNome}`;
  const cardScore = typeof nota === 'number' ? formatarNota(nota) : String(nota || 'BO');
  const cardLine = textoCauso ? textoCauso.slice(0, 48) : 'Bate esse arroto.';

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(urlX1);
      if (onNotificar) onNotificar('Link copiado.');
    } catch {
      // fallback
    }
  };

  const handleBaixarPNG = () => {
    if (onNotificar) onNotificar('Card salvo.');
  };

  const handleWhatsApp = () => {
    const textoZap = `Soltei um arroto de nota ${cardScore} no Auê! Quero ver bater: ${urlX1}`;
    const link = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoZap)}`;
    window.open(link, '_blank');
    if (onNotificar) onNotificar('Abrindo compartilhamento.');
  };

  const handleGerarVideo = () => {
    setProgresso(0);
    setGerando(true);
  };

  const outBtnStyle: React.CSSProperties = {
    height: '40px',
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
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', lineHeight: 1.15, color: 'var(--fg)' }}>
              {cardLine}
            </span>
          </div>

          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: 'var(--muted)' }}>
            aue.app/x1/{codigoDesafio}
          </span>
        </div>

        {/* Barra de progresso ao gerar vídeo */}
        {gerando && (
          <div
            style={{
              height: '44px',
              borderRadius: '12px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                background: 'var(--surface-2)',
                width: `${Math.min(100, progresso)}%`,
                transition: 'width .2s ease',
              }}
            />
            <span style={{ position: 'relative', color: 'var(--fg)', fontWeight: 600 }}>
              Gerando vídeo 9:16... {Math.min(99, Math.round(progresso))}%
            </span>
          </div>
        )}

        {/* Grid com 4 opções do protótipo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={handleGerarVideo}
            style={outBtnStyle}
          >
            Vídeo pro TikTok
          </button>
          <button
            type="button"
            onClick={handleBaixarPNG}
            style={outBtnStyle}
          >
            Baixar card (PNG)
          </button>
          <button
            type="button"
            onClick={handleCopiarLink}
            style={outBtnStyle}
          >
            Copiar link do X1
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            style={outBtnStyle}
          >
            Stories / WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

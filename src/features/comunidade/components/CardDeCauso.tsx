import React, { useState } from 'react';
import type { CausoPostado } from '../../../portas/comunidade';

interface CardDeCausoProps {
  causo: CausoPostado;
  aoCurtir: (id: string) => void;
  aoRepostar: (id: string) => void;
  aoDuvidar: (causo: CausoPostado) => void;
  aoCompartilhar: (causo: CausoPostado) => void;
  aoResponder: (causoId: string, texto: string) => void;
  aoDenunciar: (id: string) => void;
}

export const CardDeCauso: React.FC<CardDeCausoProps> = ({
  causo,
  aoCurtir,
  aoRepostar,
  aoDuvidar,
  aoCompartilhar,
  aoResponder,
  aoDenunciar,
}) => {
  const [tocando, setTocando] = useState(false);
  const [threadAberta, setThreadAberta] = useState(false);
  const [textoResposta, setTextoResposta] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);

  // Geração determinística de barras de waveform baseada no id do causo
  const barrasWaveform = Array.from({ length: 24 }, (_, i) => {
    const seed = causo.id.charCodeAt(i % causo.id.length) || 12;
    const altura = 6 + Math.abs(Math.sin(i * 1.6 + seed)) * 18;
    return {
      altura,
    };
  });

  const toggleAudio = () => {
    if (causo.audioUrl) {
      // Reprodução real se tiver áudio
      const audio = new Audio(causo.audioUrl);
      if (!tocando) {
        audio.play().catch(() => {});
        setTocando(true);
        audio.onended = () => setTocando(false);
      } else {
        setTocando(false);
      }
    } else {
      // Simples toggle de feedback se for áudio sintético
      setTocando(!tocando);
      if (!tocando) {
        setTimeout(() => setTocando(false), 3000);
      }
    }
  };

  const enviarResposta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoResposta.trim()) return;
    aoResponder(causo.id, textoResposta);
    setTextoResposta('');
  };

  const handleDenunciar = () => {
    setMenuAberto(false);
    if (window.confirm('Deseja denunciar este causo e ocultá-lo do feed?')) {
      aoDenunciar(causo.id);
    }
  };

  return (
    <article
      data-testid={`card-causo-${causo.id}`}
      style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '12px',
        background: 'var(--bg)',
        transition: 'background-color .15s ease',
      }}
    >
      {/* Avatar do Autor */}
      <div
        style={{
          width: '44px',
          height: '44px',
          flex: 'none',
          borderRadius: '50%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '15px',
          color: 'var(--fg)',
          userSelect: 'none',
        }}
      >
        {causo.autorNome.slice(0, 2).toUpperCase()}
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Cabeçalho do Card */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline', flexWrap: 'wrap', minWidth: 0 }}>
            <b style={{ fontSize: '15px', color: 'var(--fg)' }}>{causo.autorNome}</b>
            <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
              @{causo.autorHandle || causo.autorNome.toLowerCase().replace(/\s+/g, '_')}
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              aria-label="Mais opções"
              style={{
                width: '32px',
                height: '32px',
                border: 'none',
                borderRadius: '50%',
                background: 'transparent',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </button>

            {menuAberto && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '32px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '6px',
                  zIndex: 30,
                  minWidth: '130px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <button
                  type="button"
                  onClick={handleDenunciar}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ff4d4f',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                  }}
                >
                  Denunciar causo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Texto do Causo */}
        <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.45, color: 'var(--fg)', textWrap: 'pretty' }}>
          {causo.conteudo}
        </p>

        {/* Tag da Comunidade */}
        <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
          Postado em <b style={{ color: 'var(--fg)', fontWeight: 600 }}>{causo.comunidadeSlug}</b>
        </div>

        {/* Player de Áudio e Nota (se houver arroto anexado) */}
        {(causo.nota !== undefined || causo.audioUrl) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '10px 14px',
              background: 'var(--surface)',
              marginTop: '4px',
            }}
          >
            <button
              type="button"
              onClick={toggleAudio}
              aria-label={tocando ? 'Pausar arroto' : 'Ouvir arroto'}
              style={{
                width: '40px',
                height: '40px',
                flex: 'none',
                borderRadius: '50%',
                border: 'none',
                background: tocando ? 'var(--accent)' : 'var(--fg)',
                color: tocando ? 'var(--accent-on)' : 'var(--bg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform .1s ease',
              }}
            >
              {tocando ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Waveform animado */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '3px', height: '28px', minWidth: 0, overflow: 'hidden' }}>
              {barrasWaveform.map((b, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: `${tocando ? Math.min(26, b.altura * 1.3) : b.altura}px`,
                    borderRadius: '2px',
                    background: tocando ? 'var(--accent)' : 'var(--muted)',
                    transition: 'height .15s ease',
                    flex: 'none',
                  }}
                />
              ))}
            </div>

            {causo.duracaoSegundos && (
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--muted)' }}>
                0:0{Math.round(causo.duracaoSegundos)}
              </span>
            )}

            {causo.nota !== undefined && (
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  lineHeight: 1,
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  borderRadius: '10px',
                  padding: '4px 8px',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                }}
              >
                {causo.nota}
              </span>
            )}
          </div>
        )}

        {/* Barra de Ações Sociais */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            maxWidth: '440px',
            marginTop: '4px',
            marginLeft: '-8px',
          }}
        >
          {/* Thread / Respostas */}
          <button
            type="button"
            onClick={() => setThreadAberta((v) => !v)}
            aria-label="Respostas"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '999px',
              border: 'none',
              background: 'transparent',
              color: threadAberta ? 'var(--fg)' : 'var(--muted)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z" />
            </svg>
            <span>{causo.totalComentarios || (causo.comentarios ? causo.comentarios.length : 0)}</span>
          </button>

          {/* Repost */}
          <button
            type="button"
            onClick={() => aoRepostar(causo.id)}
            aria-label="Repostar causo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '999px',
              border: 'none',
              background: 'transparent',
              color: causo.repostadoPorMim ? 'var(--accent)' : 'var(--muted)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3" />
            </svg>
            <span>{causo.reposts || 0}</span>
          </button>

          {/* Curtir / Like */}
          <button
            type="button"
            onClick={() => aoCurtir(causo.id)}
            aria-label="Curtir causo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '999px',
              border: 'none',
              background: 'transparent',
              color: causo.curtidoPorMim ? '#ff4d4f' : 'var(--muted)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={causo.curtidoPorMim ? '#ff4d4f' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z" />
            </svg>
            <span>{causo.curtidas || 0}</span>
          </button>

          {/* Desafiar Autor no X1 */}
          <button
            type="button"
            onClick={() => aoDuvidar(causo)}
            aria-label="Desafiar autor no X1"
            title="Duvidar e chamar pro X1"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '999px',
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
            </svg>
          </button>

          {/* Compartilhar Card */}
          <button
            type="button"
            onClick={() => aoCompartilhar(causo)}
            aria-label="Compartilhar card 9:12"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 10px',
              borderRadius: '999px',
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6" />
            </svg>
          </button>
        </div>

        {/* Thread de Respostas Expandida */}
        {threadAberta && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '12px',
              marginTop: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Lista de Comentários */}
            {causo.comentarios && causo.comentarios.length > 0 ? (
              causo.comentarios.map((r) => (
                <div key={r.id} style={{ display: 'flex', gap: '10px' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      flex: 'none',
                      borderRadius: '50%',
                      background: 'var(--surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  >
                    {r.autorNome.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                      <b style={{ fontSize: '13px' }}>{r.autorNome}</b>
                      <span style={{ color: 'var(--muted)', fontSize: '12px' }}>@{r.autorHandle}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--fg)', marginTop: '2px' }}>
                      {r.conteudo}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                Sem respostas ainda. Seja o primeiro arrotador a comentar.
              </span>
            )}

            {/* Form de Resposta */}
            <form onSubmit={enviarResposta} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <input
                type="text"
                value={textoResposta}
                onChange={(e) => setTextoResposta(e.target.value)}
                placeholder={`Responder a @${causo.autorHandle || 'arrotador'}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '38px',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '0 14px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '999px',
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Responder
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};

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
  aoAbrirPerfil?: (handle: string, nome?: string) => void;
}

export const CardDeCauso: React.FC<CardDeCausoProps> = ({
  causo,
  aoCurtir,
  aoRepostar,
  aoDuvidar,
  aoCompartilhar,
  aoResponder,
  aoDenunciar,
  aoAbrirPerfil,
}) => {
  const [tocando, setTocando] = useState(false);
  const [threadAberta, setThreadAberta] = useState(false);
  const [textoResposta, setTextoResposta] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);

  // Geração determinística de waveform com 28 barras canônicas
  const barras = Array.from({ length: 28 }, (_, i) => {
    const seed = (causo.id?.charCodeAt(i % causo.id.length) || (i * 3 + 7)) % 100;
    const altura = 6 + Math.abs(Math.sin(i * 1.7 + seed)) * 20;
    return {
      altura,
    };
  });

  const togglePlay = () => {
    if (!causo.audioUrl) return;
    const audio = new Audio(causo.audioUrl);
    if (!tocando) {
      audio.play().catch(() => {});
      setTocando(true);
      audio.onended = () => setTocando(false);
    } else {
      setTocando(false);
    }
  };

  const enviarResposta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoResposta.trim()) return;
    aoResponder(causo.id, textoResposta.trim());
    setTextoResposta('');
  };

  const handleDenunciar = () => {
    setMenuAberto(false);
    aoDenunciar(causo.id);
  };

  const autorIni = (causo.autorNome?.trim().split(/\s+/).length > 1
    ? (causo.autorNome.trim().split(/\s+/)[0][0] + causo.autorNome.trim().split(/\s+/)[1][0])
    : (causo.autorNome?.slice(0, 2) || 'VC')
  ).toUpperCase();

  const handle = causo.autorHandle || causo.autorNome.toLowerCase().replace(/\s+/g, '_');
  const tempo = causo.criadoEm ? new Date(causo.criadoEm).toLocaleDateString('pt-BR') : 'agora';

  const formatarDuracao = (s?: number) => {
    if (!s) return '0:07';
    const min = Math.floor(s / 60);
    const seg = Math.round(s % 60);
    return `${min}:${String(seg).padStart(2, '0')}`;
  };

  const actBtnStyle = (ativo?: boolean): React.CSSProperties => ({
    borderRadius: '999px',
    background: 'none',
    border: 0,
    color: ativo ? 'var(--fg)' : 'var(--muted)',
    fontWeight: ativo ? 700 : 400,
    fontSize: '13px',
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });

  const comentarios = causo.comentarios || [];

  return (
    <article
      data-testid={`card-causo-${causo.id}`}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '12px',
        background: 'var(--bg)',
      }}
    >
      {/* Avatar 44px */}
      <div
        onClick={() => aoAbrirPerfil?.(handle, causo.autorNome)}
        style={{
          width: '44px',
          height: '44px',
          flex: 'none',
          borderRadius: '50%',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '14px',
          color: 'var(--fg)',
          userSelect: 'none',
          cursor: aoAbrirPerfil ? 'pointer' : 'default',
        }}
        title={`Ver perfil de @${handle}`}
      >
        {autorIni}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div
            onClick={() => aoAbrirPerfil?.(handle, causo.autorNome)}
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              minWidth: 0,
              cursor: aoAbrirPerfil ? 'pointer' : 'default',
            }}
            title={`Ver perfil de @${handle}`}
          >
            <b style={{ fontSize: '15px', color: 'var(--fg)' }}>{causo.autorNome}</b>
            <span style={{ color: 'var(--muted)', fontSize: '15px' }}>
              @{handle} · {tempo}
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              aria-label="Mais"
              style={{
                width: '32px',
                height: '32px',
                margin: '-6px -8px 0 0',
                flex: 'none',
                border: 0,
                borderRadius: '50%',
                background: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
                  background: 'var(--surface)',
                  border: '1px solid var(--border-strong)',
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
                    color: 'var(--danger, #ff4d4f)',
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

        {/* Texto */}
        <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.4, textWrap: 'pretty', color: 'var(--fg)' }}>
          {causo.conteudo}
        </p>

        {/* Postado em... */}
        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
          Postado em <b style={{ fontWeight: 600, color: 'var(--fg)' }}>{causo.comunidadeSlug}</b>
        </span>

        {/* Player com waveform de 28 barras, duração mono e badge Anton 24px */}
        {(causo.nota !== undefined || causo.audioUrl) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '12px',
              marginTop: '4px',
            }}
          >
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Tocar"
              style={{
                width: '40px',
                height: '40px',
                flex: 'none',
                borderRadius: '50%',
                border: 0,
                background: 'var(--fg)',
                color: 'var(--bg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {tocando ? (
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                ) : (
                  <path d="M7 4l13 8-13 8z" />
                )}
              </svg>
            </button>

            {/* Waveform de 28 barras */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                height: '28px',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              {barras.map((b, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: `${b.altura}px`,
                    borderRadius: '2px',
                    background: tocando ? 'var(--fg)' : 'var(--muted)',
                    flex: 'none',
                  }}
                />
              ))}
            </div>

            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--muted)' }}>
              {formatarDuracao(causo.duracaoSegundos)}
            </span>

            {causo.nota !== undefined && (
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  lineHeight: 1,
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  borderRadius: '12px',
                  padding: '6px 10px',
                }}
              >
                {causo.nota}
              </span>
            )}
          </div>
        )}

        {/* Botões de Ação */}
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '420px', marginLeft: '-8px' }}>
          {/* Reply */}
          <button
            type="button"
            onClick={() => setThreadAberta((v) => !v)}
            style={actBtnStyle(threadAberta)}
            aria-label="Responder"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z" />
            </svg>
            <span>{comentarios.length}</span>
          </button>

          {/* Repost */}
          <button
            type="button"
            onClick={() => aoRepostar(causo.id)}
            style={actBtnStyle(causo.repostadoPorMim)}
            aria-label="Repostar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3" />
            </svg>
            <span>{causo.reposts || 0}</span>
          </button>

          {/* Like com coração */}
          <button
            type="button"
            onClick={() => aoCurtir(causo.id)}
            style={actBtnStyle(causo.curtidoPorMim)}
            aria-label="Curtir"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={causo.curtidoPorMim ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z" />
            </svg>
            <span>{causo.curtidas || 0}</span>
          </button>

          {/* Challenge (Desafiar) */}
          <button
            type="button"
            onClick={() => aoDuvidar(causo)}
            style={actBtnStyle()}
            aria-label="Desafiar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
            </svg>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => aoCompartilhar(causo)}
            style={actBtnStyle()}
            aria-label="Compartilhar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6" />
            </svg>
          </button>
        </div>

        {/* Thread de respostas inline */}
        {threadAberta && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {comentarios.length > 0 ? (
              comentarios.map((r) => {
                const rIni = (r.autorNome?.trim().split(/\s+/).length > 1
                  ? (r.autorNome.trim().split(/\s+/)[0][0] + r.autorNome.trim().split(/\s+/)[1][0])
                  : (r.autorNome?.slice(0, 2) || 'VC')
                ).toUpperCase();

                return (
                  <div key={r.id} style={{ display: 'flex', gap: '10px' }}>
                    <div
                      onClick={() => aoAbrirPerfil?.(r.autorHandle, r.autorNome)}
                      style={{
                        width: '32px',
                        height: '32px',
                        flex: 'none',
                        borderRadius: '50%',
                        background: 'var(--surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '11px',
                        color: 'var(--fg)',
                        cursor: aoAbrirPerfil ? 'pointer' : 'default',
                      }}
                      title={`Ver perfil de @${r.autorHandle}`}
                    >
                      {rIni}
                    </div>
                    <div style={{ minWidth: 0, lineHeight: 1.4 }}>
                      <span
                        onClick={() => aoAbrirPerfil?.(r.autorHandle, r.autorNome)}
                        style={{ cursor: aoAbrirPerfil ? 'pointer' : 'default' }}
                      >
                        <b style={{ fontSize: '14px' }}>{r.autorNome}</b>{' '}
                        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                          @{r.autorHandle} · agora
                        </span>
                      </span>
                      <div style={{ fontSize: '14px', textWrap: 'pretty', color: 'var(--fg)' }}>
                        {r.conteudo}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
                Sem respostas. Seja o primeiro.
              </span>
            )}

            <form onSubmit={enviarResposta} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={textoResposta}
                onChange={(e) => setTextoResposta(e.target.value)}
                placeholder={`Responder a @${handle}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '40px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '0 16px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                aria-label="Enviar resposta"
                style={{
                  height: '40px',
                  padding: '0 18px',
                  border: 0,
                  borderRadius: '18px',
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  flex: 'none',
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

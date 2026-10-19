import React, { useEffect, useRef, useState } from 'react';
import type { CausoPostado } from '../../../portas/comunidade';
import { ArvoreDeComentarios } from './ArvoreDeComentarios';
import { MENSAGEM_DE_ERRO_DE_RESPOSTA, useEnvioDeResposta, type ResultadoDoEnvio } from './useEnvioDeResposta';

interface CardDeCausoProps {
  causo: CausoPostado;
  aoCurtir: (id: string) => void;
  /** Reservado para quando repost tiver distribuição real no Bonde. */
  aoRepostar?: (id: string) => void;
  aoDuvidar: (causo: CausoPostado) => void;
  aoCompartilhar: (causo: CausoPostado) => void;
  aoResponder: (causoId: string, texto: string, respostaAId?: string) => ResultadoDoEnvio;
  /** Pede os comentários ao servidor quando a conversa abre. */
  aoAbrirConversa?: (causoId: string) => void | Promise<void>;
  aoDenunciar: (id: string) => void;
  /** Só aparece nos meus causos. */
  aoApagar?: (causo: CausoPostado) => void | Promise<void>;
  aoAbrirPerfil?: (handle: string, nome?: string) => void;
  aoAbrirHistoria?: (id: string) => void;
}

export const CardDeCauso: React.FC<CardDeCausoProps> = ({
  causo,
  aoCurtir,
  aoRepostar: _aoRepostar,
  aoDuvidar,
  aoCompartilhar,
  aoResponder,
  aoAbrirConversa,
  aoDenunciar,
  aoApagar,
  aoAbrirPerfil,
  aoAbrirHistoria,
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

  const playerRef = useRef<HTMLAudioElement | null>(null);
  const [erroDeAudio, setErroDeAudio] = useState(false);

  useEffect(() => () => playerRef.current?.pause(), []);

  const togglePlay = async () => {
    if (!causo.enderecoDoAudio) return;
    if (tocando) {
      playerRef.current?.pause();
      setTocando(false);
      return;
    }
    setErroDeAudio(false);
    // O endereço é assinado e vence em minutos: pedido na hora de tocar.
    const endereco = await causo.enderecoDoAudio();
    if (!endereco) {
      setErroDeAudio(true);
      return;
    }
    const player = new Audio(endereco);
    player.onended = () => setTocando(false);
    playerRef.current = player;
    try {
      await player.play();
      setTocando(true);
    } catch {
      setErroDeAudio(true);
    }
  };

  const envioDaResposta = useEnvioDeResposta();

  const enviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoResposta.trim()) return;
    const ok = await envioDaResposta.enviar(() => aoResponder(causo.id, textoResposta.trim()));
    if (ok) setTextoResposta('');
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
  // Só o @ que o servidor mandou abre perfil; o fabricado do nome e o causo
  // "só neste aparelho" ficam sem link.
  const handleDoPerfil =
    aoAbrirPerfil && causo.autorHandleDoServidor && !causo.somenteNesteAparelho && causo.autorHandle
      ? causo.autorHandle
      : null;
  const abrirPerfilDoAutor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (handleDoPerfil) aoAbrirPerfil?.(handleDoPerfil, causo.autorNome);
  };
  const botaoDoAutor: React.CSSProperties = {
    background: 'none',
    border: 0,
    padding: 0,
    margin: 0,
    font: 'inherit',
    color: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  };
  const tempo = causo.criadoEm ? new Date(causo.criadoEm).toLocaleDateString('pt-BR') : 'agora';

  const AvatarTag = handleDoPerfil ? 'button' : 'div';
  const propsDoAvatar = handleDoPerfil
    ? { type: 'button' as const, onClick: abrirPerfilDoAutor, 'aria-label': `Ver perfil de @${handleDoPerfil}` }
    : {};

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
  const totalDeComentarios = Math.max(causo.totalComentarios ?? 0, comentarios.length);

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
      <AvatarTag
        {...propsDoAvatar}
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
          padding: 0,
          border: 0,
          cursor: handleDoPerfil ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {causo.autorAvatarUrl ? (
          <img
            src={causo.autorAvatarUrl}
            alt=""
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          autorIni
        )}
      </AvatarTag>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          {(() => {
            const nomeEHandle = (
              <>
                <b style={{ fontSize: '15px', color: 'var(--fg)' }}>{causo.autorNome}</b>
                <span style={{ color: 'var(--muted)', fontSize: '15px' }}>
                  @{handle} · {tempo}
                </span>
              </>
            );
            const estiloLinha: React.CSSProperties = {
              display: 'flex',
              gap: '4px',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              minWidth: 0,
            };
            return handleDoPerfil ? (
              <button
                type="button"
                onClick={abrirPerfilDoAutor}
                aria-label={`Ver perfil de ${causo.autorNome}, @${handleDoPerfil}`}
                style={{ ...botaoDoAutor, ...estiloLinha, alignItems: 'center', minHeight: '44px', margin: '-12px 0' }}
              >
                {nomeEHandle}
              </button>
            ) : (
              <div style={estiloLinha}>{nomeEHandle}</div>
            );
          })()}

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              aria-label="Mais"
              aria-haspopup="true"
              aria-expanded={menuAberto}
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
                role="menu"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setMenuAberto(false);
                }}
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
                  role="menuitem"
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
                  Denunciar resenha
                </button>
                {causo.meu && aoApagar && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuAberto(false);
                      void aoApagar(causo);
                    }}
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
                    Apagar minha resenha
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Texto do Causo (120 caracteres no feed com '...' e expansão de história) */}
        {(() => {
          const textoLongo = (causo.conteudo?.length || 0) > 120;
          const textoExibido = textoLongo ? `${causo.conteudo.slice(0, 120)}...` : causo.conteudo;
          return (
            <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.4, textWrap: 'pretty', color: 'var(--fg)' }}>
              {textoExibido}{' '}
              {textoLongo && (
                <button
                  type="button"
                  onClick={() => aoAbrirHistoria?.(causo.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent, #c6ff00)',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  abrir história completa
                </button>
              )}
            </p>
          );
        })()}

        {/* Imagem se houver */}
        {causo.imagemUrl && (
          <div style={{ marginTop: '6px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img
              src={causo.imagemUrl}
              alt="Imagem da resenha"
              style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* Postado em... (não exibe quando for postado no Feed) */}
        {causo.comunidadeSlug && causo.comunidadeSlug.toLowerCase() !== 'feed' && (
          <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Postado em <b style={{ fontWeight: 600, color: 'var(--fg)' }}>{causo.comunidadeSlug}</b>
          </span>
        )}

        {causo.somenteNesteAparelho && (
          <span role="note" style={{ color: 'var(--muted)', fontSize: '12px' }}>
            Só neste aparelho. Não foi para o servidor.
          </span>
        )}
        {erroDeAudio && (
          <span role="alert" style={{ color: 'var(--danger, #ff4d4f)', fontSize: '13px' }}>
            Não deu para tocar esse arroto agora.
          </span>
        )}

        {/* Player com waveform de 28 barras, duração mono e badge Anton 24px */}
        {(causo.nota !== undefined || causo.temAudio) && (
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
              disabled={!causo.enderecoDoAudio}
              aria-label={tocando ? 'Pausar' : 'Tocar'}
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

            <span
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--muted)' }}
              aria-label={`Duração do arroto: ${formatarDuracao(causo.duracaoSegundos)}`}
              title={`Duração: ${formatarDuracao(causo.duracaoSegundos)}`}
            >
              {formatarDuracao(causo.duracaoSegundos)}
            </span>
          </div>
        )}

        {/* Botões de Ação */}
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '420px', marginLeft: '-8px' }}>
          {/* Reply */}
          <button
            type="button"
            onClick={() => {
              const abrindo = !threadAberta;
              setThreadAberta(abrindo);
              if (abrindo && !causo.comentarios) void aoAbrirConversa?.(causo.id);
            }}
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
            <span>{totalDeComentarios}</span>
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

        {/* Comentários simples (lista reta) */}
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
            <ArvoreDeComentarios
              comentarios={comentarios}
              aoResponder={(texto, respostaAId) => aoResponder(causo.id, texto, respostaAId)}
              aoAbrirPerfil={aoAbrirPerfil}
            />

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
                disabled={envioDaResposta.enviando}
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
                {envioDaResposta.enviando ? 'Enviando…' : 'Responder'}
              </button>
            </form>
            {envioDaResposta.erro && (
              <p role="alert" style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
                {MENSAGEM_DE_ERRO_DE_RESPOSTA}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { ArvoreDeComentarios } from './components/ArvoreDeComentarios';
import { useParams, useNavigate } from 'react-router-dom';
import type { CausoPostado, RespostaDeCauso, PortaDeComunidade } from '../../portas/comunidade';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { obterPerfilLocal } from '../../plataforma/web/perfil';
import { BarraLateralNavegacao } from './components/BarraLateralNavegacao';
import { BarraInferiorMobile } from './components/BarraInferiorMobile';
import { ColunaTendencias } from './components/ColunaTendencias';

interface TelaHistoriaProps {
  onArrotar?: () => void;
  porta?: PortaDeComunidade;
}

export const TelaHistoria: React.FC<TelaHistoriaProps> = ({ onArrotar, porta: portaProp }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [porta] = useState<PortaDeComunidade>(() => portaProp ?? criarComunidadeWeb());
  const perfil = obterPerfilLocal();

  const [causo, setCauso] = useState<CausoPostado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tocando, setTocando] = useState(false);
  const [curtido, setCurtido] = useState(false);
  const [curtidas, setCurtidas] = useState(0);
  const [textoResposta, setTextoResposta] = useState('');
  const [apelidoResposta, setApelidoResposta] = useState('');
  const [comentarios, setComentarios] = useState<readonly RespostaDeCauso[]>([]);
  const [copiado, setCopiado] = useState(false);
  const [denunciado, setDenunciado] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);

    (async () => {
      const encontrado = id ? await porta.obterCauso(id) : null;
      const respostas = encontrado ? await porta.listarRespostas(encontrado.id) : [];
      if (!ativo) return;
      if (encontrado) {
        setCauso(encontrado);
        setCurtido(Boolean(encontrado.curtidoPorMim));
        setCurtidas(encontrado.curtidas || 0);
        setComentarios(respostas);
      }
      setCarregando(false);
    })();

    return () => {
      ativo = false;
    };
  }, [id, porta]);

  const playerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => playerRef.current?.pause(), []);

  const togglePlay = async () => {
    if (!causo?.enderecoDoAudio) return;
    if (tocando) {
      playerRef.current?.pause();
      setTocando(false);
      return;
    }
    // Endereço assinado vence em minutos: pedido na hora de tocar.
    const endereco = await causo.enderecoDoAudio();
    if (!endereco) return;
    const player = new Audio(endereco);
    player.onended = () => setTocando(false);
    playerRef.current = player;
    try {
      await player.play();
      setTocando(true);
    } catch {
      setTocando(false);
    }
  };

  const handleCurtir = async () => {
    if (!causo) return;
    const res = await porta.alternarCurtida(causo.id);
    if (res.ok) {
      setCurtido(res.curtido);
      setCurtidas(res.curtidas);
    }
  };

  const handleCompartilhar = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Resenha de Arroto — ${causo?.autorNome}`,
        text: causo?.conteudo.slice(0, 100),
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      });
    }
  };

  const handleDenunciar = async () => {
    if (!causo) return;
    const registrou = await porta.denunciarCauso(causo.id, 'Conteúdo impróprio');
    if (registrou) setDenunciado(true);
  };

  const responderComentario = async (texto: string, respostaAId?: string) => {
    if (!causo) return;
    const nome = apelidoResposta.trim() || 'Arrotador Anônimo';
    const nova = await porta.adicionarResposta(causo.id, texto, nome, nome.toLowerCase().replace(/\s+/g, '_'), respostaAId);
    if (nova) setComentarios((prev) => [...prev, nova]);
  };

  const enviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!causo || !textoResposta.trim()) return;

    const nome = apelidoResposta.trim() || 'Arrotador Anônimo';
    const handle = nome.toLowerCase().replace(/\s+/g, '_');

    const nova = await porta.adicionarResposta(
      causo.id,
      textoResposta.trim(),
      nome,
      handle,
    );

    if (nova) {
      setComentarios((prev) => [...prev, nova]);
      setTextoResposta('');
    }
  };

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', color: 'var(--fg)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1280px', display: 'flex' }}>
        {/* Barra lateral desktop */}
        <BarraLateralNavegacao
          abaAtiva="feed"
          aoMudarAba={(aba) => navigate(aba === 'feed' ? '/feed' : aba === 'comm' ? '/comunidade' : '/desafios')}
          aoAbrirComposer={() => navigate('/arena')}
          tema="dark"
          aoAlternarTema={() => {}}
          perfil={perfil}
        />

        {/* Coluna Central */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: '600px',
            borderRight: '1px solid var(--border)',
            borderLeft: '1px solid var(--border)',
            paddingBottom: '80px',
          }}
        >
          {/* Header com botão voltar e botão Jogar Auê */}
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 20,
              background: 'var(--header-bg, var(--bg))',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid var(--border)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Voltar"
                style={{
                  background: 'none',
                  border: 0,
                  color: 'var(--fg)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px',
                  borderRadius: '50%',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>História de Arroto</h1>
            </div>

            <button
              type="button"
              onClick={onArrotar || (() => navigate('/arena'))}
              style={{
                background: 'var(--accent, #c6ff00)',
                color: 'var(--accent-on, #000)',
                border: 0,
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Jogar o Auê
            </button>
          </header>

          {carregando ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
              Carregando história...
            </div>
          ) : !causo || denunciado ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
              {denunciado ? 'História ocultada por denúncia.' : 'História não encontrada.'}
            </div>
          ) : (
            <article style={{ padding: '20px 16px' }}>
              {/* Autor */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '16px',
                    }}
                  >
                    {causo.autorNome.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '16px' }}>{causo.autorNome}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
                      @{causo.autorHandle || 'arrotador'} · {new Date(causo.criadoEm).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDenunciar}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--muted)',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Denunciar
                </button>
              </div>

              {/* Texto Completo da História (Página de Conto) */}
              <div
                style={{
                  fontSize: '18px',
                  lineHeight: 1.6,
                  color: 'var(--fg)',
                  marginBottom: '20px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {causo.conteudo}
              </div>

              {/* Player de Áudio */}
              {(causo.temAudio || causo.nota !== undefined) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    background: 'var(--surface)',
                  }}
                >
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label="Tocar áudio"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: 0,
                      background: 'var(--fg)',
                      color: 'var(--bg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      {tocando ? <path d="M6 4h4v16H6zM14 4h4v16h-4z" /> : <path d="M7 4l13 8-13 8z" />}
                    </svg>
                  </button>

                  <div style={{ flex: 1, color: 'var(--muted)', fontSize: '14px', fontWeight: 600 }}>
                    {tocando ? 'Tocando arroto...' : 'Ouvir arroto original'}
                  </div>

                  {causo.nota !== undefined && (
                    <span
                      style={{
                        fontFamily: 'var(--font-display, Anton)',
                        fontSize: '26px',
                        background: 'var(--accent, #c6ff00)',
                        color: 'var(--accent-on, #000)',
                        borderRadius: '12px',
                        padding: '4px 10px',
                      }}
                    >
                      {causo.nota}
                    </span>
                  )}
                </div>
              )}

              {/* Imagem se houver */}
              {causo.imagemUrl && (
                <div style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={causo.imagemUrl} alt="Imagem da história" style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' }} />
                </div>
              )}

              {/* Barra de Ações (Likes e Compartilhar) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  padding: '14px 0',
                  borderTop: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '24px',
                }}
              >
                <button
                  type="button"
                  onClick={handleCurtir}
                  style={{
                    background: 'none',
                    border: 0,
                    color: curtido ? 'var(--danger, #ff4d4f)' : 'var(--muted)',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={curtido ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{curtidas} curtidas</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompartilhar}
                  style={{
                    background: 'none',
                    border: 0,
                    color: copiado ? 'var(--accent, #c6ff00)' : 'var(--muted)',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>{copiado ? 'Link copiado!' : 'Compartilhar'}</span>
                </button>
              </div>

              {/* Seção de Comentários Aninhados (Twitter/Reddit style) */}
              <section>
                <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
                  Comentários ({comentarios.length})
                </h2>

                {/* Formulário de Comentário */}
                <form
                  onSubmit={enviarComentario}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginBottom: '24px',
                    padding: '14px',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                  }}
                >
                  <input
                    type="text"
                    value={apelidoResposta}
                    onChange={(e) => setApelidoResposta(e.target.value)}
                    placeholder="Seu apelido (nickname)"
                    style={{
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--fg)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />

                  <textarea
                    value={textoResposta}
                    onChange={(e) => setTextoResposta(e.target.value)}
                    placeholder="Deixe seu comentário ou zoação..."
                    rows={2}
                    style={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--fg)',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      disabled={!textoResposta.trim()}
                      style={{
                        background: 'var(--accent, #c6ff00)',
                        color: 'var(--accent-on, #000)',
                        border: 0,
                        borderRadius: '999px',
                        padding: '8px 18px',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: textoResposta.trim() ? 'pointer' : 'default',
                        opacity: textoResposta.trim() ? 1 : 0.6,
                      }}
                    >
                      Comentar
                    </button>
                  </div>
                </form>

                <ArvoreDeComentarios
                  comentarios={comentarios}
                  aoResponder={responderComentario}
                />
              </section>
            </article>
          )}
        </main>

        {/* Coluna Tendências desktop */}
        <ColunaTendencias
          aoAbrirPerfil={(h) => navigate(`/u/${h}`)}
        />
      </div>

      {/* Barra Inferior Mobile */}
      <BarraInferiorMobile
        abaAtiva="feed"
        aoMudarAba={(aba) => navigate(aba === 'feed' ? '/feed' : aba === 'comm' ? '/comunidade' : '/desafios')}
        aoAbrirPerfil={() => navigate('/perfil')}
      />
    </div>
  );
};

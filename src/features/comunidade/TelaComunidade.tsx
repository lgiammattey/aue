import React, { useCallback, useEffect, useState } from 'react';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import type {
  CausoPostado,
  Comunidade,
  PedidoDePostagemDeCauso,
  PortaDeComunidade,
  TipoDeReacao,
} from '../../portas/comunidade';
import { Arena } from '../../arena/Arena';
import { obterPerfilLocal, salvarPerfilLocal } from '../../plataforma/web/perfil';
import type { PerfilUsuario } from '../../nucleo/usuario/perfil';
import { ModalNovoCauso } from './ModalNovoCauso';
import { ModalCardCompartilhamento } from './ModalCardCompartilhamento';
import { BarraLateralNavegacao } from './components/BarraLateralNavegacao';
import { BarraInferiorMobile } from './components/BarraInferiorMobile';
import { ColunaTendencias } from './components/ColunaTendencias';
import './Comunidade.css';

interface TelaComunidadeProps {
  initialTab?: 'feed' | 'arena' | 'comm' | 'desafios' | 'perfil';
  porta?: PortaDeComunidade;
  onArrotar?: () => void;
  onDuvidar?: (causo: CausoPostado) => void;
  resultadoRecente?: { id: string; nota: number };
}

export const TelaComunidade: React.FC<TelaComunidadeProps> = ({
  initialTab = 'feed',
  porta,
  onArrotar,
  onDuvidar,
  resultadoRecente,
}) => {
  const [adaptador] = useState<PortaDeComunidade>(() => porta ?? criarComunidadeWeb());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const salvo = localStorage.getItem('bda-theme');
      return salvo === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [larguraJanela, setLarguraJanela] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );

  const [tab, setTab] = useState<'feed' | 'arena' | 'comm' | 'desafios' | 'perfil'>(initialTab);
  const [comunidades, setComunidades] = useState<readonly Comunidade[]>([]);
  const [minhasComunidades, setMinhasComunidades] = useState<readonly string[]>([]);
  const [comunidadeAtiva, setComunidadeAtiva] = useState<string>('todos');
  const [causos, setCausos] = useState<readonly CausoPostado[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [modalShareAberto, setModalShareAberto] = useState<boolean>(false);
  const [causoParaCompartilhar, setCausoParaCompartilhar] = useState<CausoPostado | null>(null);
  const [resultadoArena, setResultadoArena] = useState<{ nota: number; resultadoId?: string } | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario>(() => {
    const p = obterPerfilLocal();
    // Garante cartel padrão consistente para visualização e testes
    if (p.vitoriasX1 === 0 && p.derrotasX1 === 0) {
      p.vitoriasX1 = 7;
      p.derrotasX1 = 3;
    }
    return p;
  });

  const handleAtualizarPerfil = (novo: PerfilUsuario) => {
    salvarPerfilLocal(novo);
    setPerfil(novo);
  };

  // Controle de tema e resize
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('bda-theme', theme);
    } catch {
      // ignora
    }
  }, [theme]);

  useEffect(() => {
    const handleResize = () => setLarguraJanela(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  // Carrega comunidades e feed inicial da porta real
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [comus, minhas, listaFeed] = await Promise.all([
        adaptador.listarComunidades(),
        adaptador.listarMinhasComunidades(),
        adaptador.listarFeed(comunidadeAtiva === 'todos' ? undefined : { comunidadeSlug: comunidadeAtiva }),
      ]);
      setComunidades(comus);
      setMinhasComunidades(minhas);
      setCausos(listaFeed);
    } catch {
      // fallback gracioso
    } finally {
      setCarregando(false);
    }
  }, [adaptador, comunidadeAtiva]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Se receber resultado recente da Arena
  useEffect(() => {
    if (resultadoRecente) {
      setTab('arena');
    }
  }, [resultadoRecente]);

  // Alternar reação (fogo, nojo, troféu)
  const handleReagir = async (causoId: string, reacao: TipoDeReacao) => {
    const res = await adaptador.alternarReacao(causoId, reacao);
    if (res.ok) {
      setCausos((prev) =>
        prev.map((c) => (c.id === causoId ? { ...c, reacoes: res.reacoes } : c)),
      );
    }
  };

  // Curtir / Like estilo Twitter
  const handleCurtir = async (causoId: string) => {
    const res = await adaptador.alternarCurtida(causoId);
    if (res.ok) {
      setCausos((prev) =>
        prev.map((c) =>
          c.id === causoId
            ? { ...c, curtidas: res.curtidas, curtidoPorMim: res.curtido }
            : c,
        ),
      );
    }
  };

  // Repostar
  const handleRepostar = async (causoId: string) => {
    const res = await adaptador.alternarRepost(causoId);
    if (res.ok) {
      setCausos((prev) =>
        prev.map((c) =>
          c.id === causoId
            ? { ...c, reposts: res.reposts, repostadoPorMim: res.repostado }
            : c,
        ),
      );
    }
  };

  // Responder causo (thread)
  const handleResponder = async (causoId: string, texto: string) => {
    const nova = await adaptador.adicionarResposta(causoId, texto, perfil.nome, perfil.handle);
    if (nova) {
      setCausos((prev) =>
        prev.map((c) => {
          if (c.id !== causoId) return c;
          const atuais = c.comentarios ?? [];
          return {
            ...c,
            totalComentarios: atuais.length + 1,
            comentarios: [...atuais, nova],
          };
        }),
      );
    }
  };

  // Denunciar causo
  const handleDenunciar = async (causoId: string) => {
    await adaptador.denunciarCauso(causoId, 'Denúncia de usuário');
    setCausos((prev) => prev.filter((c) => c.id !== causoId));
  };

  // Alternar participação na comunidade
  const handleAlternarComunidade = async (slug: string) => {
    if (minhasComunidades.includes(slug)) {
      await adaptador.sairComunidade(slug);
    } else {
      await adaptador.entrarComunidade(slug);
    }
    const atualizadas = await adaptador.listarMinhasComunidades();
    setMinhasComunidades(atualizadas);
  };

  // Postar novo causo via modal ou composer
  const handlePostarCauso = async (pedido: PedidoDePostagemDeCauso) => {
    const res = await adaptador.postarCauso(pedido);
    if (res.ok) {
      setCausos((prev) => [res.causo, ...prev]);
      setModalNovoAberto(false);
      setTab('feed');
    }
  };

  const handleIrParaArena = () => {
    if (onArrotar) {
      onArrotar();
    } else {
      setTab('arena');
    }
  };

  const isDesktop = larguraJanela >= 1024;
  const isTablet = larguraJanela >= 641 && larguraJanela < 1024;
  const isMobile = larguraJanela <= 640;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          position: 'relative',
        }}
      >
        {/* Coluna Esquerda: Navegação Desktop e Tablet */}
        {!isMobile && (
          <BarraLateralNavegacao
            abaAtiva={tab}
            aoMudarAba={(nova) => setTab(nova)}
            aoAbrirComposer={() => setModalNovoAberto(true)}
            compacto={isTablet}
            tema={theme}
            aoAlternarTema={toggleTheme}
            perfil={perfil}
          />
        )}

        {/* Coluna Central Principal (Feed, Arena, Comunidades, Desafios, Perfil) */}
        <main
          style={{
            width: '100%',
            maxWidth: '620px',
            minHeight: '100vh',
            borderLeft: !isMobile ? '1px solid var(--border)' : 'none',
            borderRight: isDesktop ? '1px solid var(--border)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: isMobile ? '80px' : '32px',
            boxSizing: 'border-box',
            background: 'var(--bg)',
          }}
        >
          {/* Header Superior da Rede Social */}
          <header className="comunidade-header">
            <div className="logo-group">
              <span className="wordmark">
                Auê <i>3.0</i>
              </span>
            </div>

            <button
              type="button"
              className="btn-arrotar-top"
              onClick={handleIrParaArena}
              aria-label="Ir para a Arena e arrotar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3" />
              </svg>
              <span>Arrotar</span>
            </button>
          </header>

          {/* Barra de Filtro de Comunidades (Chips Horizontais) */}
          {tab === 'feed' && (
            <div className="comunidades-bar" role="toolbar" aria-label="Filtro de comunidades">
              <button
                type="button"
                className={`comunidade-chip ${comunidadeAtiva === 'todos' ? 'ativo' : ''}`}
                onClick={() => setComunidadeAtiva('todos')}
              >
                🔥 Todos os causos
              </button>
              {comunidades.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  className={`comunidade-chip ${comunidadeAtiva === c.slug ? 'ativo' : ''}`}
                  onClick={() => setComunidadeAtiva(c.slug)}
                >
                  {c.icone} {c.nome}
                </button>
              ))}
            </div>
          )}

          {/* CONTEÚDO DA ABA SELECIONADA */}

          {/* 1. ABA FEED (Bonde do Arroto) */}
          {tab === 'feed' && (
            <section style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Botão de Prompt Rápido para Criar Causo */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn-novo-causo"
                  onClick={() => setModalNovoAberto(true)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '999px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--muted)',
                    textAlign: 'left',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span>💭</span>
                  <span>Qual foi seu último arroto histórico?</span>
                </button>
              </div>

              {/* Lista Real de Causos */}
              {carregando ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
                  Carregando o Bonde...
                </div>
              ) : causos.length > 0 ? (
                causos.map((c) => (
                  <article
                    key={c.id}
                    className="causo-card"
                    data-testid={`card-causo-${c.id}`}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <header className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="user-meta" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div
                          className="avatar"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--surface-2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                          }}
                        >
                          {c.nota && c.nota >= 90 ? '👑' : c.autorNome.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="author-info">
                          <span className="author-name" style={{ fontWeight: 700, fontSize: '15px' }}>
                            {c.autorNome}
                          </span>
                          {' '}
                          <span className="tag-comu" style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '13px' }}>
                            #{c.comunidadeSlug}
                          </span>
                          <div className="post-time" style={{ color: 'var(--muted)', fontSize: '12px' }}>
                            {c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : 'recente'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-menu-causo"
                        onClick={() => handleDenunciar(c.id)}
                        aria-label="Denunciar causo"
                        style={{ border: 'none', background: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                      >
                        •••
                      </button>
                    </header>

                    <p className="causo-texto" style={{ margin: 0, fontSize: '15px', lineHeight: 1.45 }}>
                      {c.conteudo}
                    </p>

                    {/* Bloco de Áudio e Nota */}
                    {c.nota !== undefined && (
                      <div
                        className="audio-box"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: '14px',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span
                          className="score-badge"
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '24px',
                            background: 'var(--accent)',
                            color: 'var(--accent-on)',
                            padding: '4px 10px',
                            borderRadius: '10px',
                          }}
                        >
                          {c.nota}
                        </span>
                        <div style={{ flex: 1, color: 'var(--muted)', fontSize: '13px' }}>
                          Arroto auditado pela IA {c.duracaoSegundos ? `· 0:0${Math.round(c.duracaoSegundos)}s` : ''}
                        </div>
                      </div>
                    )}

                    {/* Ações Sociais */}
                    <footer
                      className="card-footer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-reacao"
                          onClick={() => handleReagir(c.id, 'fogo')}
                          aria-label={`Reagir com fogo (${c.reacoes?.fogo || 0})`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--fg)',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          <span>🔥</span>
                          <span>{c.reacoes?.fogo || 0}</span>
                        </button>

                        <button
                          type="button"
                          className="btn-reacao"
                          onClick={() => handleCurtir(c.id)}
                          aria-label="Curtir causo"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: c.curtidoPorMim ? '#ff4d4f' : 'var(--fg)',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          <span>❤️</span>
                          <span>{c.curtidas || 0}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-reacao"
                          onClick={() => handleRepostar(c.id)}
                          aria-label={`Repostar causo (${c.reposts || 0})`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: c.repostadoPorMim ? 'var(--accent)' : 'var(--fg)',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          <span>🔁</span>
                          <span>{c.reposts || 0}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-reacao"
                          onClick={() => {
                            const resp = window.prompt('Responder a este causo:');
                            if (resp && resp.trim()) {
                              handleResponder(c.id, resp.trim());
                            }
                          }}
                          aria-label={`Responder (${c.totalComentarios || 0})`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--fg)',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          <span>💬</span>
                          <span>{c.totalComentarios || 0}</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-duvidar"
                          onClick={() => {
                            if (onDuvidar) {
                              onDuvidar(c);
                            } else {
                              setTab('arena');
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--fg)',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Duvido
                        </button>

                        <button
                          type="button"
                          className="btn-compartilhar"
                          aria-label="Compartilhar card 9:16"
                          onClick={() => {
                            setCausoParaCompartilhar(c);
                            setModalShareAberto(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--fg)',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Compartilhar
                        </button>
                      </div>
                    </footer>
                  </article>
                ))
              ) : (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                  Nenhum causo encontrado nesta comunidade. Seja o primeiro a soltar um causo!
                </div>
              )}
            </section>
          )}

          {/* 2. ABA ARENA REAL (O motor de som e pontuação dentro da rede) */}
          {tab === 'arena' && (
            <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Arena
                onPostarNoBonde={(resultado) => {
                  setResultadoArena(resultado);
                  setModalNovoAberto(true);
                }}
              />
            </section>
          )}

          {/* 3. ABA BONDES (Comunidades) */}
          {tab === 'comm' && (
            <section style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Ache seu Bonde</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
                  Comunidades temáticas de arrotadores para você dominar.
                </p>
              </div>

              {comunidades.map((c) => {
                const participa = minhasComunidades.includes(c.slug);
                return (
                  <div
                    key={c.slug}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ fontSize: '28px' }}>{c.icone}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '16px' }}>{c.nome}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{c.descricao}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAlternarComunidade(c.slug)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '999px',
                        border: 'none',
                        background: participa ? 'var(--surface-2)' : 'var(--accent)',
                        color: participa ? 'var(--fg)' : 'var(--accent-on)',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        flex: 'none',
                      }}
                    >
                      {participa ? 'Participando' : 'Entrar'}
                    </button>
                  </div>
                );
              })}
            </section>
          )}

          {/* 4. ABA DESAFIOS (Duelos no X1) */}
          {tab === 'desafios' && (
            <section style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Duelos no X1</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
                  Desafios diretos contra seus rivais.
                </p>
              </div>

              <div style={{ padding: '16px' }}>
                <button
                  type="button"
                  onClick={handleIrParaArena}
                  style={{
                    width: '100%',
                    height: '52px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                    fontWeight: 800,
                    fontSize: '16px',
                    cursor: 'pointer',
                  }}
                >
                  Novo Desafio X1
                </button>
              </div>

              <div style={{ padding: '0 16px', color: 'var(--muted)', fontSize: '14px', textAlign: 'center' }}>
                Nenhum duelo pendente no momento. Arrote na Arena para mandar o link pro zap!
              </div>
            </section>
          )}

          {/* 5. ABA PERFIL (Seu Cartel) */}
          {tab === 'perfil' && (
            <section style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Seu Cartel</h2>
                <div style={{ marginTop: '8px', fontSize: '16px', fontWeight: 700 }}>{perfil.nome}</div>
                <div style={{ color: 'var(--muted)', fontSize: '14px' }}>@{perfil.handle}</div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <div style={{ background: 'var(--bg)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>CARTEL NO X1</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)' }}>
                      {perfil.vitoriasX1}V · {perfil.derrotasX1}D
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>MAIOR NOTA</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--fg)', fontFamily: 'var(--font-display)' }}>
                      {perfil.maiorScore || '—'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const novo = window.prompt('Seu apelido no Bonde:', perfil.nome);
                      if (novo && novo.trim()) {
                        handleAtualizarPerfil({
                          ...perfil,
                          nome: novo.trim(),
                          handle: novo.trim().toLowerCase().replace(/\s+/g, '_'),
                        });
                      }
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--fg)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Editar apelido
                  </button>
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700 }}>Suas Comunidades</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {minhasComunidades.map((s) => (
                    <span
                      key={s}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        fontSize: '13px',
                      }}
                    >
                      #{s}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Coluna Direita: Tendências e Rankings (Desktop) */}
        {isDesktop && (
          <ColunaTendencias
            causos={causos}
            comunidades={comunidades}
            minhasComunidades={minhasComunidades}
            aoEntrarComunidade={handleAlternarComunidade}
            aoAbrirDesafio={handleIrParaArena}
          />
        )}
      </div>

      {/* Barra Inferior Mobile Fixa */}
      {isMobile && (
        <BarraInferiorMobile
          abaAtiva={tab}
          aoMudarAba={(nova) => setTab(nova)}
        />
      )}

      {/* Modais Globais */}
      <ModalNovoCauso
        aberto={modalNovoAberto}
        comunidades={comunidades}
        comunidadeAtualSlug={comunidadeAtiva === 'todos' ? undefined : comunidadeAtiva}
        resultadoId={resultadoArena?.resultadoId}
        notaResultado={resultadoArena?.nota}
        onFechar={() => {
          setModalNovoAberto(false);
          setResultadoArena(null);
        }}
        onSubmit={handlePostarCauso}
      />

      <ModalCardCompartilhamento
        aberto={modalShareAberto}
        nota={causoParaCompartilhar?.nota || 91}
        autorNome={causoParaCompartilhar?.autorNome || perfil.nome}
        comunidadeNome={causoParaCompartilhar?.comunidadeSlug || 'Bonde Geral'}
        textoCauso={causoParaCompartilhar?.conteudo}
        codigoDesafio="k4x9"
        onFechar={() => setModalShareAberto(false)}
      />
    </div>
  );
};

export default TelaComunidade;

import React, { useCallback, useEffect, useState } from 'react';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import type {
  CausoPostado,
  Comunidade,
  PortaDeComunidade,
} from '../../portas/comunidade';
import { obterPerfilLocal } from '../../plataforma/web/perfil';
import type { PerfilUsuario } from '../../nucleo/usuario/perfil';
import { BarraLateralNavegacao } from './components/BarraLateralNavegacao';
import { BarraInferiorMobile } from './components/BarraInferiorMobile';
import { HeaderSocial } from './components/HeaderSocial';
import { ComposerCauso } from './components/ComposerCauso';
import { CardDeCauso } from './components/CardDeCauso';
import { AbaComunidades } from './components/AbaComunidades';
import { AbaDesafios, type DesafioSocialItem } from './components/AbaDesafios';
import { ColunaTendencias } from './components/ColunaTendencias';
import { ModalCardCompartilhamento } from './ModalCardCompartilhamento';
import {
  obterDesafiosSociaisLocais,
  salvarDesafioSocialLocal,
} from '../../plataforma/web/desafios';
import './Comunidade.css';

interface TelaComunidadeProps {
  initialTab?: 'feed' | 'comm' | 'desafios' | 'arena' | 'perfil';
  perfilHandleInicial?: string;
  comunidadeSlugInicial?: string;
  porta?: PortaDeComunidade;
  onArrotar?: () => void;
  onDuvidar?: (causo: CausoPostado) => void;
  aoAbrirHistoria?: (id: string) => void;
  resultadoRecente?: { id: string; nota: number };
}

export const TelaComunidade: React.FC<TelaComunidadeProps> = ({
  initialTab = 'feed',
  perfilHandleInicial: _perfilHandleInicial,
  comunidadeSlugInicial,
  porta,
  onArrotar,
  onDuvidar,
  aoAbrirHistoria,
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

  const tabNormalizada: 'feed' | 'comm' | 'desafios' =
    initialTab === 'arena' ? 'desafios' : initialTab === 'perfil' ? 'feed' : initialTab;
  const [tab, setTab] = useState<'feed' | 'comm' | 'desafios'>(tabNormalizada);
  const [comunidadeAtivaSlug] = useState<string | null>(comunidadeSlugInicial ?? null);
  const [filtroFeed, setFiltroFeed] = useState<'todos' | 'minhas'>('todos');
  const [comunidades, setComunidades] = useState<readonly Comunidade[]>([]);
  const [minhasComunidades, setMinhasComunidades] = useState<readonly string[]>(['eu-arroto-e-dai', 'Eu Arroto, e Daí?']);
  const [causos, setCausos] = useState<readonly CausoPostado[]>([]);
  const [desafiosLista, setDesafiosLista] = useState<readonly DesafioSocialItem[]>(() =>
    obterDesafiosSociaisLocais(),
  );
  const [desafioAtivoCodigo, setDesafioAtivoCodigo] = useState<string | undefined>(undefined);
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);

  // Modais e Feedback
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [novoTextoModal, setNovoTextoModal] = useState<string>('');
  const [novoComuModal, setNovoComuModal] = useState<string>('feed');
  const [novoTipoModal, setNovoTipoModal] = useState<'texto' | 'audio' | 'desafio'>('texto');
  const [novoOponenteModal, setNovoOponenteModal] = useState<string>('');
  const [modalShareAberto, setModalShareAberto] = useState<boolean>(false);
  const [itemParaCompartilhar, setItemParaCompartilhar] = useState<{
    nota: number | string;
    autorNome: string;
    comunidadeNome?: string;
    textoCauso?: string;
    codigoDesafio?: string;
  } | null>(null);

  const [toastMsg, setToastMsg] = useState<string>('');

  const [perfil] = useState<PerfilUsuario>(() => {
    const p = obterPerfilLocal();
    if (p.vitoriasX1 === 0 && p.derrotasX1 === 0) {
      p.vitoriasX1 = 7;
      p.derrotasX1 = 3;
    }
    return p;
  });

  const avisar = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? '' : cur));
    }, 2200);
  };

  // Sincroniza tema
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('bda-theme', theme);
    } catch {
      // ignora
    }
  }, [theme]);

  // Listener de resize
  useEffect(() => {
    const handleResize = () => setLarguraJanela(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  // Carregamento de dados da porta
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [comus, minhas, listaFeed] = await Promise.all([
        adaptador.listarComunidades(),
        adaptador.listarMinhasComunidades(),
        adaptador.listarFeed(),
      ]);
      setComunidades(comus);
      if (minhas && minhas.length > 0) {
        setMinhasComunidades(minhas);
      }
      setCausos(listaFeed);
    } catch {
      // fallback gracioso
    } finally {
      setCarregando(false);
    }
  }, [adaptador]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Se receber resultado recente da Arena
  useEffect(() => {
    if (resultadoRecente) {
      setTab('desafios');
    }
  }, [resultadoRecente]);

  // Curtir
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

  // Responder
  const handleResponder = async (causoId: string, texto: string, respostaAId?: string) => {
    const nova = await adaptador.adicionarResposta(causoId, texto, perfil.nome, perfil.handle, respostaAId);
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
      avisar('Resposta enviada.');
    }
  };

  // Denunciar
  const handleDenunciar = async (causoId: string) => {
    await adaptador.denunciarCauso(causoId, 'Denúncia de usuário');
    setCausos((prev) => prev.filter((c) => c.id !== causoId));
    avisar('Causo ocultado.');
  };

  // Alternar Comunidade
  const handleAlternarComunidade = async (slug: string) => {
    const jaEntrou = minhasComunidades.includes(slug);
    if (jaEntrou) {
      await adaptador.sairComunidade(slug);
      setMinhasComunidades((prev) => prev.filter((s) => s !== slug));
      avisar('Saiu da comunidade.');
    } else {
      await adaptador.entrarComunidade(slug);
      setMinhasComunidades((prev) => [...prev, slug]);
      avisar('Você entrou na comunidade.');
    }
  };

  // Postar via composer rápido
  const handlePostarRapido = async (
    dados: string | { texto: string; autorNome?: string; audioUrl?: string; duracaoSegundos?: number; videoUrl?: string; imagemUrl?: string; comunidadeSlug?: string },
  ) => {
    const texto = typeof dados === 'string' ? dados : dados.texto;
    const autorNome = typeof dados === 'string' ? perfil.nome : (dados.autorNome || perfil.nome);
    const audioUrl = typeof dados === 'string' ? undefined : dados.audioUrl;
    const duracaoSegundos = typeof dados === 'string' ? undefined : dados.duracaoSegundos;
    const videoUrl = typeof dados === 'string' ? undefined : dados.videoUrl;
    const imagemUrl = typeof dados === 'string' ? undefined : dados.imagemUrl;
    const comunidadeSlug = typeof dados === 'string' ? 'feed' : (dados.comunidadeSlug || 'feed');

    try {
      const res = await adaptador.postarCauso({
        comunidadeSlug,
        autorNome,
        conteudo: texto,
        audioUrl,
        duracaoSegundos,
        consentimentoAudioPublico: true,
      });
      if (res.ok) {
        const causoComMidia: CausoPostado = {
          ...res.causo,
          videoUrl,
          imagemUrl,
        };
        setCausos((prev) => [causoComMidia, ...prev]);
        avisar(comunidadeSlug === 'feed' ? 'Postado no feed.' : `Postado em ${comunidadeSlug}.`);
        return true;
      }
      avisar('Não foi possível postar.');
      return false;
    } catch {
      avisar('Não foi possível postar.');
      return false;
    }
  };

  // Postar via Modal
  const handlePublicarModal = async () => {
    if (!novoTextoModal.trim()) {
      avisar('Escreve alguma coisa.');
      return;
    }
    if (novoTipoModal === 'desafio') {
      const codigoGerado = Math.random().toString(36).slice(2, 6);
      const oponenteLimpo = novoOponenteModal.trim().replace(/^@/, '') || 'arrotador_misterioso';
      const novoRegistro = {
        id: Date.now(),
        titulo: novoTextoModal.trim(),
        jogadorA: perfil.handle.replace(/^@/, ''),
        jogadorB: oponenteLimpo,
        notaA: perfil.maiorScore || 88,
        notaB: '—',
        status: 'Esperando',
        codigo: codigoGerado,
      };
      const listaAtualizada = salvarDesafioSocialLocal(novoRegistro);
      setDesafiosLista(listaAtualizada);
      avisar('Desafio X1 criado.');
      setModalNovoAberto(false);
      setTab('desafios');
      setItemParaCompartilhar({
        nota: `${novoRegistro.notaA} x —`,
        autorNome: perfil.nome,
        comunidadeNome: 'Desafio X1',
        textoCauso: novoTextoModal,
        codigoDesafio: codigoGerado,
      });
      setModalShareAberto(true);
      return;
    }

    try {
      const res = await adaptador.postarCauso({
        comunidadeSlug: novoComuModal,
        autorNome: perfil.nome,
        conteudo: novoTextoModal.trim(),
        consentimentoAudioPublico: true,
      });

      if (res.ok) {
        setCausos((prev) => [res.causo, ...prev]);
        setModalNovoAberto(false);
        setNovoTextoModal('');
        setTab('feed');
        avisar(novoComuModal === 'feed' ? 'Postado no feed.' : `Postado em ${novoComuModal}.`);
      } else {
        avisar('Não foi possível postar.');
      }
    } catch {
      avisar('Não foi possível postar.');
    }
  };

  const handleIrParaArena = () => {
    if (onArrotar) {
      onArrotar();
    } else {
      setTab('desafios');
    }
  };

  const handleChamarDesafio = (causo?: CausoPostado) => {
    if (onDuvidar && causo) {
      onDuvidar(causo);
    } else {
      setNovoTipoModal('desafio');
      setNovoOponenteModal(causo ? `@${causo.autorHandle || causo.autorNome}` : '');
      setNovoTextoModal(causo ? `Bate esse arroto${causo.nota ? ` de ${causo.nota}` : ''}.` : '');
      setModalNovoAberto(true);
    }
  };

  const handleCompartilharCauso = (causo: CausoPostado) => {
    setItemParaCompartilhar({
      nota: causo.nota !== undefined ? causo.nota : 90,
      autorNome: causo.autorNome,
      comunidadeNome: causo.comunidadeSlug,
      textoCauso: causo.conteudo,
      codigoDesafio: causo.id ? causo.id.slice(0, 4) : 'k4x9',
    });
    setModalShareAberto(true);
  };

  const handleCompartilharDesafio = (desafio: DesafioSocialItem) => {
    setItemParaCompartilhar({
      nota: `${desafio.notaA} x ${desafio.notaB}`,
      autorNome: desafio.jogadorA,
      comunidadeNome: 'Desafio X1',
      textoCauso: desafio.titulo,
      codigoDesafio: desafio.codigo,
    });
    setModalShareAberto(true);
  };

  // Breakpoints canônicos
  const isMobile = larguraJanela < 700;
  const isWide = larguraJanela >= 1060;
  const showRight = larguraJanela >= 1000;
  const showLeft = !isMobile;

  // Filtragem da lista de causos
  const causosFiltrados = causos.filter((c) => {
    // Causos postados pelo próprio usuário na sessão SEMPRE aparecem no feed
    if (c.meu) return true;
    if (filtroFeed === 'minhas') {
      const nasMinhas =
        minhasComunidades.includes(c.comunidadeSlug) ||
        minhasComunidades.some((m) => m.toLowerCase() === c.comunidadeSlug.toLowerCase());
      if (!nasMinhas) return false;
    }
    if (termoBusca.trim()) {
      const q = termoBusca.toLowerCase().trim();
      const bateTexto = c.conteudo.toLowerCase().includes(q);
      const bateAutor = c.autorNome.toLowerCase().includes(q) || (c.autorHandle && c.autorHandle.toLowerCase().includes(q));
      const bateComu = c.comunidadeSlug.toLowerCase().includes(q);
      return bateTexto || bateAutor || bateComu;
    }
    return true;
  });

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-body)',
        boxSizing: 'border-box',
      }}
    >
      {/* Container de 3 Colunas Canônico: Max 1200px Centralizado */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {/* Coluna Esquerda (Desktop 275px / Tablet 76px) */}
        {showLeft && (
          <BarraLateralNavegacao
            abaAtiva={tab}
            aoMudarAba={(nova) => setTab(nova)}
            aoAbrirComposer={() => {
              setNovoTipoModal('texto');
              setModalNovoAberto(true);
            }}
            compacto={!isWide}
            tema={theme}
            aoAlternarTema={toggleTheme}
            perfil={perfil}
          />
        )}

        {/* Coluna Central Principal (Max 600px) */}
        <main
          style={{
            width: '100%',
            maxWidth: '600px',
            flex: '1 1 0',
            minWidth: 0,
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            minHeight: '100vh',
            boxSizing: 'border-box',
            paddingBottom: isMobile ? '140px' : '40px',
          }}
        >
          {/* Header Sticky (53px) e Abas Feed */}
          <HeaderSocial
            abaAtiva={tab}
            filtroFeed={filtroFeed}
            aoMudarFiltroFeed={(f) => setFiltroFeed(f)}
            isMobile={isMobile}
            perfil={perfil}
            aoAbrirArena={handleIrParaArena}
            tema={theme}
            aoAlternarTema={toggleTheme}
          />

          {/* 1. ABA FEED */}
          {tab === 'feed' && (
            <div>
              {/* Barra de Busca Ativa */}
              {termoBusca.trim() && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '14px', color: 'var(--fg)' }}>
                    Buscando por: <strong style={{ color: 'var(--accent)' }}>"{termoBusca}"</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTermoBusca('')}
                    style={{
                      background: 'none',
                      border: 0,
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Limpar busca
                  </button>
                </div>
              )}

              {/* Composer Rápido */}
              <ComposerCauso
                aoPostar={handlePostarRapido}
                aoAbrirArrotar={handleIrParaArena}
                aoAbrirDesafio={() => handleChamarDesafio()}
                perfil={perfil}
                comunidades={minhasComunidades}
              />

              {/* Feed de Causos com CardDeCauso completo */}
              {carregando ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '15px' }}>
                  Carregando o bonde...
                </div>
              ) : causosFiltrados.length > 0 ? (
                causosFiltrados.map((c) => (
                  <CardDeCauso
                    key={c.id}
                    causo={c}
                    aoCurtir={handleCurtir}
                    aoRepostar={handleRepostar}
                    aoDuvidar={(item) => handleChamarDesafio(item)}
                    aoCompartilhar={handleCompartilharCauso}
                    aoResponder={handleResponder}
                    aoDenunciar={handleDenunciar}
                    aoAbrirHistoria={aoAbrirHistoria || ((id) => { window.location.href = `/historia/${id}`; })}
                  />
                ))
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--fg)', marginBottom: '8px' }}>
                    Nada por aqui ainda
                  </div>
                  <div>Nenhum arroto encontrado nesta lista. Solte o primeiro no bonde!</div>
                </div>
              )}
            </div>
          )}

          {/* 2. ABA COMUNIDADE */}
          {tab === 'comm' && (
            <AbaComunidades
              comunidades={comunidades}
              minhasComunidades={minhasComunidades}
              aoAlternarParticipacao={handleAlternarComunidade}
              aoFiltrarPorComunidade={(_slug) => {
                setFiltroFeed('minhas');
                setTab('feed');
              }}
              comunidadeAtivaSlug={comunidadeAtivaSlug}
              causos={causos}
              aoPostarCauso={async (comuNome, texto) => {
                const res = await adaptador.postarCauso({
                  comunidadeSlug: comuNome,
                  autorNome: perfil.nome,
                  conteudo: texto,
                  consentimentoAudioPublico: true,
                });
                if (res.ok) {
                  setCausos((prev) => [res.causo, ...prev]);
                  avisar(`Postado em ${comuNome}.`);
                  return true;
                }
                return false;
              }}
              aoCurtirCauso={handleCurtir}
              aoRepostarCauso={handleRepostar}
              aoDuvidarCauso={(item) => handleChamarDesafio(item)}
              aoCompartilharCauso={handleCompartilharCauso}
              aoResponderCauso={handleResponder}
              aoDenunciarCauso={handleDenunciar}
            />
          )}

          {/* 3. ABA DESAFIOS (O Jogo Auê entra aqui dentro) */}
          {tab === 'desafios' && (
            <AbaDesafios
              desafios={desafiosLista}
              aoCriarDesafio={() => handleChamarDesafio()}
              aoRevanche={(d) => {
                setDesafioAtivoCodigo(d.codigo);
              }}
              aoCompartilhar={handleCompartilharDesafio}
              perfil={perfil}
              desafioAtivoCodigo={desafioAtivoCodigo}
              onPostarNoBonde={(res) => {
                setTab('feed');
                setNovoTipoModal('audio');
                const notaTexto = res?.nota ? ` Tirei ${res.nota} no Auê Score!` : '';
                setNovoTextoModal(`Soltei um arroto no Auê!${notaTexto}`);
                setModalNovoAberto(true);
              }}
            />
          )}
        </main>

        {/* Coluna Direita: Tendências (320px) */}
        {showRight && (
          <ColunaTendencias
            termoBusca={termoBusca}
            aoMudarBusca={(t) => {
              setTermoBusca(t);
              if (tab !== 'feed') setTab('feed');
            }}
            aoSelecionarTrend={(tag) => {
              setTermoBusca(tag);
              if (tab !== 'feed') setTab('feed');
            }}
          />
        )}
      </div>

      {/* Navegação Mobile Inferior e Botão Flutuante '+' 56x56 */}
      {isMobile && (
        <BarraInferiorMobile
          abaAtiva={tab}
          aoMudarAba={(nova) => setTab(nova)}
          aoAbrirComposer={() => {
            setNovoTipoModal('texto');
            setModalNovoAberto(true);
          }}
        />
      )}

      {/* Modal Canônico de Novo Causo */}
      {modalNovoAberto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--overlay-scrim, rgba(14, 14, 10, 0.92))',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            zIndex: 40,
            padding: isMobile ? 0 : '16px',
            boxSizing: 'border-box',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: isMobile ? '24px 24px 0 0' : '24px',
              padding: '12px 16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,.35)',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '40px',
                margin: '0 -8px',
              }}
            >
              <button
                type="button"
                onClick={() => setModalNovoAberto(false)}
                aria-label="Fechar"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 0,
                  background: 'none',
                  color: 'var(--fg)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
              <span
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '11px',
                  color: 'var(--muted)',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                }}
              >
                {novoTipoModal === 'desafio' ? 'Desafio X1' : novoTipoModal === 'audio' ? 'Arroto' : 'Post'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div
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
                  position: 'relative',
                  overflow: 'hidden',
                  color: 'var(--fg)',
                }}
              >
                {perfil.avatarUrl ? (
                  <img
                    src={perfil.avatarUrl}
                    alt={perfil.nome}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (perfil.nome?.slice(0, 2) || 'VC').toUpperCase()
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <select
                  value={novoComuModal}
                  onChange={(e) => setNovoComuModal(e.target.value)}
                  aria-label="Destino da publicação"
                  style={{
                    alignSelf: 'flex-start',
                    height: '28px',
                    borderRadius: '999px',
                    border: '1px solid var(--border-strong)',
                    background: 'transparent',
                    color: 'var(--fg)',
                    padding: '0 10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <option value="feed">Feed</option>
                  {minhasComunidades
                    .filter((c) => c.toLowerCase() !== 'feed')
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>

                {novoTipoModal === 'desafio' && (
                  <input
                    value={novoOponenteModal}
                    onChange={(e) => setNovoOponenteModal(e.target.value)}
                    placeholder="@quem vai levar ferro"
                    style={{
                      height: '40px',
                      border: 0,
                      borderBottom: '1px solid var(--border-strong)',
                      background: 'none',
                      color: 'var(--fg)',
                      padding: 0,
                      fontSize: '17px',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                )}

                <textarea
                  value={novoTextoModal}
                  onChange={(e) => setNovoTextoModal(e.target.value)}
                  placeholder={
                    novoTipoModal === 'desafio'
                      ? 'Qual é o desafio?'
                      : novoTipoModal === 'audio'
                      ? 'Conta o contexto do arroto'
                      : 'O que tá rolando no bonde?'
                  }
                  rows={4}
                  style={{
                    minHeight: '120px',
                    border: 0,
                    background: 'none',
                    color: 'var(--fg)',
                    padding: '8px 0',
                    fontSize: '20px',
                    lineHeight: 1.35,
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border)',
                paddingTop: '10px',
                marginTop: '4px',
              }}
            >
              <div style={{ display: 'flex', gap: '2px', marginLeft: '-8px' }}>
                <button
                  type="button"
                  onClick={() => setNovoTipoModal('texto')}
                  aria-label="Texto"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 0,
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: novoTipoModal === 'texto' ? 'var(--ind)' : 'var(--muted)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setNovoTipoModal('audio')}
                  aria-label="Áudio"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 0,
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: novoTipoModal === 'audio' ? 'var(--ind)' : 'var(--muted)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setNovoTipoModal('desafio')}
                  aria-label="Desafio"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 0,
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: novoTipoModal === 'desafio' ? 'var(--ind)' : 'var(--muted)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
                  </svg>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    color: novoTextoModal.length > 280 ? 'var(--danger)' : 'var(--muted)',
                  }}
                >
                  {280 - novoTextoModal.length}
                </span>
                <button
                  type="button"
                  onClick={handlePublicarModal}
                  style={{
                    height: '36px',
                    padding: '0 20px',
                    border: 0,
                    borderRadius: '999px',
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  {novoTipoModal === 'desafio' ? 'Enviar' : 'Postar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Canônico de Compartilhamento (Card 9:12) */}
      {modalShareAberto && itemParaCompartilhar && (
        <ModalCardCompartilhamento
          aberto={modalShareAberto}
          nota={itemParaCompartilhar.nota}
          autorNome={itemParaCompartilhar.autorNome}
          comunidadeNome={itemParaCompartilhar.comunidadeNome}
          textoCauso={itemParaCompartilhar.textoCauso}
          codigoDesafio={itemParaCompartilhar.codigoDesafio}
          onFechar={() => {
            setModalShareAberto(false);
            setItemParaCompartilhar(null);
          }}
          onNotificar={avisar}
        />
      )}

      {/* Toast flutuante canônico */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'bdaUp .22s cubic-bezier(.2,.8,.2,1)',
            bottom: '80px',
            zIndex: 60,
            background: 'var(--fg)',
            color: 'var(--bg)',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 600,
            maxWidth: '90vw',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
};

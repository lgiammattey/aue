import React, { useCallback, useEffect, useState } from 'react';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import type { PortaDeConta } from '../../portas/conta';
import type {
  CausoPostado,
  Comunidade,
  PedidoDePostagemDeCauso,
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
import { ModalNovoCauso, type DadosDoCausoComArroto } from './ModalNovoCauso';
import { ColunaTendencias } from './components/ColunaTendencias';
import { ModalCardCompartilhamento } from './ModalCardCompartilhamento';
import { Arena } from '../../arena/Arena';
import './Comunidade.css';

type ArrotoParaPublicar = NonNullable<PedidoDePostagemDeCauso['arroto']>;

export type TabComunidade = 'feed' | 'arena' | 'comm' | 'desafios';

interface TelaComunidadeProps {
  initialTab?: TabComunidade | 'perfil';
  perfilHandleInicial?: string;
  comunidadeSlugInicial?: string;
  porta?: PortaDeComunidade;
  portaConta?: PortaDeConta;
  /** Chamado depois que a pessoa saiu da conta (a tela do app leva ao login). */
  aoSair?: () => void;
  aoEntrar?: () => void;
  onArrotar?: () => void;
  onDuvidar?: (causo: CausoPostado) => void;
  aoAbrirHistoria?: (id: string) => void;
  /** Sem handle abre o perfil de quem está jogando. */
  aoAbrirPerfil?: (handle?: string) => void;
  /** O que a Arena entregou ao tocar em POSTAR NO BONDE. */
  resultadoRecente?: { nota: number; arroto?: ArrotoParaPublicar };
}

export const TelaComunidade: React.FC<TelaComunidadeProps> = ({
  initialTab = 'feed',
  perfilHandleInicial: _perfilHandleInicial,
  comunidadeSlugInicial,
  porta,
  portaConta,
  aoSair,
  aoEntrar,
  onArrotar,
  onDuvidar,
  aoAbrirHistoria,
  aoAbrirPerfil,
  resultadoRecente,
}) => {
  const [adaptador] = useState<PortaDeComunidade>(() => porta ?? criarComunidadeWeb());
  const [conta] = useState<PortaDeConta>(() => portaConta ?? criarContaWeb());
  const [contaLogada, setContaLogada] = useState(false);

  useEffect(() => {
    let ativo = true;
    conta.estado().then((e) => {
      if (ativo) setContaLogada(e.podeParticiparSocialmente ?? (e.temSessao && !e.anonima));
    });
    return () => {
      ativo = false;
    };
  }, [conta]);

  const handleSair = async () => {
    const ok = await conta.sair();
    if (!ok) {
      avisar('Não deu para sair agora. Tenta de novo.');
      return;
    }
    setContaLogada(false);
    aoSair?.();
  };
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

  const tabNormalizada: TabComunidade =
    initialTab === 'perfil' ? 'feed' : initialTab ?? 'feed';
  const [tab, setTab] = useState<TabComunidade>(tabNormalizada);

  useEffect(() => {
    if (initialTab && initialTab !== 'perfil') {
      setTab(initialTab);
    }
  }, [initialTab]);

  const handleMudarAba = (nova: TabComunidade | 'perfil') => {
    if (nova === 'perfil') {
      aoAbrirPerfil?.();
      return;
    }
    setTab(nova);
    try {
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        const rota =
          nova === 'arena'
            ? '/arena'
            : nova === 'comm'
            ? '/comunidade'
            : nova === 'desafios'
            ? '/desafios'
            : '/feed';
        window.history.replaceState(null, '', rota);
      }
    } catch {
      // ignora
    }
  };
  const [comunidadeAtivaSlug] = useState<string | null>(comunidadeSlugInicial ?? null);
  const [filtroFeed, setFiltroFeed] = useState<'todos' | 'seguindo'>('todos');
  const [comunidades, setComunidades] = useState<readonly Comunidade[]>([]);
  const [minhasComunidades, setMinhasComunidades] = useState<readonly string[]>([]);
  const [causos, setCausos] = useState<readonly CausoPostado[]>([]);
  const [causosSeguindo, setCausosSeguindo] = useState<readonly CausoPostado[]>([]);
  const [carregandoSeguindo, setCarregandoSeguindo] = useState(false);
  const [arrotoParaPublicar, setArrotoParaPublicar] = useState<{ nota: number; arroto: ArrotoParaPublicar } | null>(
    () => (resultadoRecente?.arroto ? { nota: resultadoRecente.nota, arroto: resultadoRecente.arroto } : null),
  );
  const [desafioAtivoCodigo, setDesafioAtivoCodigo] = useState<string | undefined>(undefined);
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);
  const [falhaAoCarregar, setFalhaAoCarregar] = useState(false);

  // Modais e Feedback
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [novoTextoModal, setNovoTextoModal] = useState<string>('');
  const [novoComuModal, setNovoComuModal] = useState<string>('bonde-geral');
  const [novoTipoModal, setNovoTipoModal] = useState<'texto' | 'audio' | 'desafio'>('texto');
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

  /** A sessão anônima pode jogar e ler; participação no Bonde exige promoção. */
  const pedirPromocao = () => {
    avisar('Crie sua conta para entrar no Bonde.');
    aoEntrar?.();
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
    setFalhaAoCarregar(false);
    try {
      // O feed não depende da lista de comunidades: uma falha não derruba a outra.
      const [comus, minhas, listaFeed] = await Promise.allSettled([
        adaptador.listarComunidades(),
        adaptador.listarMinhasComunidades(),
        adaptador.listarFeed(),
      ]);
      if (comus.status === 'fulfilled') setComunidades(comus.value);
      if (minhas.status === 'fulfilled') setMinhasComunidades(minhas.value ?? []);
      if (listaFeed.status === 'rejected') throw listaFeed.reason;
      setCausos(listaFeed.value);
    } catch {
      // Falha de leitura não é lista vazia: a tela mostra o erro e o botão de tentar de novo.
      setFalhaAoCarregar(true);
    } finally {
      setCarregando(false);
    }
  }, [adaptador]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const carregarSeguindo = async () => {
    if (!contaLogada) {
      pedirPromocao();
      return;
    }
    setCarregandoSeguindo(true);
    try {
      // O contrato social devolve somente autores seguidos; não há filtro local.
      setCausosSeguindo(await adaptador.listarFeed({ seguindo: true }));
    } catch {
      avisar('Não deu para carregar quem você segue agora.');
    } finally {
      setCarregandoSeguindo(false);
    }
  };

  // Se receber resultado recente da Arena
  useEffect(() => {
    if (!resultadoRecente) return;
    if (resultadoRecente.arroto) {
      setArrotoParaPublicar({ nota: resultadoRecente.nota, arroto: resultadoRecente.arroto });
    } else {
      avisar('Esse arroto não pode ser publicado agora. Arrote de novo.');
    }
    setTab('feed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultadoRecente]);

  // Curtir
  const handleCurtir = async (causoId: string) => {
    if (!contaLogada) return pedirPromocao();
    const res = await adaptador.alternarCurtida(causoId);
    if (!res.ok) avisar('Não deu para curtir agora.');
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
    if (!contaLogada) return pedirPromocao();
    const res = await adaptador.alternarRepost(causoId);
    if (!res.ok) avisar('Não deu para repostar agora.');
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

  // Abrir a conversa: traz os comentários do servidor
  const handleAbrirConversa = async (causoId: string) => {
    let lista: Awaited<ReturnType<typeof adaptador.listarRespostas>>;
    try {
      lista = await adaptador.listarRespostas(causoId);
    } catch {
      avisar('Não deu para carregar as respostas. Tenta de novo.');
      return;
    }
    setCausos((prev) =>
      prev.map((c) =>
        c.id === causoId
          ? { ...c, comentarios: lista, totalComentarios: Math.max(c.totalComentarios, lista.length) }
          : c,
      ),
    );
  };

  // Responder
  const handleResponder = async (causoId: string, texto: string, respostaAId?: string) => {
    if (!contaLogada) return pedirPromocao();
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
    } else {
      avisar('Não deu para enviar a resposta. Tenta de novo.');
    }
  };

  // Denunciar
  const handleDenunciar = async (causoId: string) => {
    if (!contaLogada) return pedirPromocao();
    const registrou = await adaptador.denunciarCauso(causoId, 'Denúncia de usuário');
    if (!registrou) {
      avisar('Não deu para registrar a denúncia. Tenta de novo.');
      return;
    }
    setCausos((prev) => prev.filter((c) => c.id !== causoId));
    avisar('Denúncia registrada. A resenha some da sua tela.');
  };

  // Apagar resenha minha (com o áudio, quando houver)
  const handleApagar = async (causo: CausoPostado) => {
    if (!contaLogada) return pedirPromocao();
    const comAudio = Boolean(causo.temAudio);
    const confirmou = window.confirm(
      comAudio
        ? 'Apagar esta resenha e o áudio do arroto? Não tem como desfazer.'
        : 'Apagar esta resenha? Não tem como desfazer.',
    );
    if (!confirmou) return;
    const ok = await adaptador.apagarCauso(causo.id, { apagarAudio: comAudio });
    if (!ok) {
      avisar('Não deu para apagar agora. Nada foi apagado.');
      return;
    }
    setCausos((prev) => prev.filter((c) => c.id !== causo.id));
    avisar('Resenha apagada.');
  };

  // Alternar Comunidade
  const handleAlternarComunidade = async (slug: string) => {
    if (!contaLogada) return pedirPromocao();
    const jaEntrou = minhasComunidades.includes(slug);
    if (jaEntrou) {
      const saiu = await adaptador.sairComunidade(slug);
      if (!saiu) {
        avisar('Não deu para sair da comunidade agora.');
        return;
      }
      setMinhasComunidades((prev) => prev.filter((s) => s !== slug));
      avisar('Saiu da comunidade.');
    } else {
      const entrou = await adaptador.entrarComunidade(slug);
      if (!entrou) {
        avisar('Não deu para entrar na comunidade agora.');
        return;
      }
      setMinhasComunidades((prev) => [...prev, slug]);
      avisar('Você entrou na comunidade.');
    }
  };

  // Postar via composer rápido
  const handlePostarRapido = async (
    dados: string | { texto: string; autorNome?: string; videoUrl?: string; imagemUrl?: string; comunidadeSlug?: string },
  ) => {
    if (!contaLogada) {
      pedirPromocao();
      return false;
    }
    const texto = typeof dados === 'string' ? dados : dados.texto;
    const autorNome = typeof dados === 'string' ? perfil.nome : (dados.autorNome || perfil.nome);
    const videoUrl = typeof dados === 'string' ? undefined : dados.videoUrl;
    const imagemUrl = typeof dados === 'string' ? undefined : dados.imagemUrl;
    const comunidadeSlug = typeof dados === 'string' ? 'bonde-geral' : (dados.comunidadeSlug || 'bonde-geral');

    try {
      const res = await adaptador.postarCauso({
        comunidadeSlug,
        autorNome,
        conteudo: texto,
        consentimentoAudioPublico: false,
      });
      if (res.ok) {
        const causoComMidia: CausoPostado = {
          ...res.causo,
          videoUrl,
          imagemUrl,
        };
        setCausos((prev) => [causoComMidia, ...prev]);
        avisar(res.causo.somenteNesteAparelho ? 'Salvo só neste aparelho. O servidor não está configurado.' : comunidadeSlug === 'bonde-geral' ? 'Postado no feed.' : `Postado em ${comunidadeSlug}.`);
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
    if (!contaLogada) return pedirPromocao();
    if (!novoTextoModal.trim()) {
      avisar('Escreve alguma coisa.');
      return;
    }
    try {
      const res = await adaptador.postarCauso({
        comunidadeSlug: novoComuModal,
        autorNome: perfil.nome,
        conteudo: novoTextoModal.trim(),
        consentimentoAudioPublico: false,
      });

      if (res.ok) {
        setCausos((prev) => [res.causo, ...prev]);
        setModalNovoAberto(false);
        setNovoTextoModal('');
        setTab('feed');
        avisar(res.causo.somenteNesteAparelho ? 'Salvo só neste aparelho. O servidor não está configurado.' : novoComuModal === 'bonde-geral' ? 'Postado no feed.' : `Postado em ${novoComuModal}.`);
      } else {
        avisar('Não foi possível postar.');
      }
    } catch {
      avisar('Não foi possível postar.');
    }
  };

  // Publicar o arroto da Arena: o aceite vem do modal; guardar e subir o áudio
  // só acontece aqui, depois dele.
  const handlePublicarArroto = async (dados: DadosDoCausoComArroto): Promise<boolean> => {
    if (!contaLogada) {
      pedirPromocao();
      return false;
    }
    if (!arrotoParaPublicar) return false;
    const res = await adaptador.postarCauso({
      comunidadeSlug: dados.comunidadeSlug,
      autorNome: dados.autorNome,
      conteudo: dados.conteudo,
      arroto: arrotoParaPublicar.arroto,
      consentimentoAudioPublico: dados.consentimentoAudioPublico,
    });
    if (!res.ok) return false;
    setCausos((prev) => [res.causo, ...prev]);
    setArrotoParaPublicar(null);
    setTab('feed');
    avisar('Arroto publicado.');
    return true;
  };

  const handleIrParaArena = () => {
    handleMudarAba('arena');
    onArrotar?.();
  };

  // X1 só existe dentro da Arena (link de verdade, nota do servidor). Esta tela
  // não monta duelo de mentira: manda a pessoa arrotar.
  const handleChamarDesafio = (causo?: CausoPostado) => {
    if (onDuvidar && causo) {
      onDuvidar(causo);
    } else {
      handleIrParaArena();
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
  const causosFiltrados = (filtroFeed === 'seguindo' ? causosSeguindo : causos).filter((c) => {
    // Causos postados pelo próprio usuário na sessão SEMPRE aparecem no feed
    if (c.meu) return true;
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
            aoMudarAba={handleMudarAba}
            aoAbrirComposer={() => {
              setNovoTipoModal('texto');
              setModalNovoAberto(true);
            }}
            compacto={!isWide}
            aoAbrirPerfil={aoAbrirPerfil ? () => (contaLogada ? aoAbrirPerfil() : pedirPromocao()) : undefined}
            contaLogada={contaLogada}
            aoSair={handleSair}
            aoEntrar={aoEntrar}
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
            aoMudarFiltroFeed={(f) => {
              if (f === 'seguindo') {
                if (!contaLogada) {
                  pedirPromocao();
                  return;
                }
                setFiltroFeed(f);
                void carregarSeguindo();
                return;
              }
              setFiltroFeed(f);
            }}
            isMobile={isMobile}
            perfil={perfil}
            aoAbrirArena={handleIrParaArena}
            contaLogada={contaLogada}
            aoSair={handleSair}
            aoEntrar={aoEntrar}
            tema={theme}
            aoAlternarTema={toggleTheme}
          />

          {/* 1. ABA FEED */}
          {tab === 'feed' && (
            <div>
              {/* Banner de Modo Visitante */}
              {!contaLogada && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontSize: '13px',
                    color: 'var(--fg)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>👀</span>
                    <span>
                      Você está navegando como <strong>visitante</strong>.
                    </span>
                  </div>
                  {aoEntrar && (
                    <button
                      type="button"
                      onClick={aoEntrar}
                      style={{
                        border: '1px solid var(--border-strong)',
                        borderRadius: '999px',
                        background: 'var(--fg)',
                        color: 'var(--bg)',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      Entrar ou Criar conta
                    </button>
                  )}
                </div>
              )}
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
              {carregando || (filtroFeed === 'seguindo' && carregandoSeguindo) ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '15px' }}>
                  Carregando o bonde...
                </div>
              ) : falhaAoCarregar ? (
                <div role="alert" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--fg)', marginBottom: '8px' }}>
                    Não deu pra carregar
                  </div>
                  <div style={{ marginBottom: '16px' }}>O servidor não respondeu. Tenta de novo.</div>
                  <button
                    type="button"
                    onClick={() => void carregarDados()}
                    style={{ minHeight: '44px', padding: '0 20px', borderRadius: '999px', border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--fg)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Tentar de novo
                  </button>
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
                    aoAbrirConversa={handleAbrirConversa}
                    aoAbrirPerfil={aoAbrirPerfil ? (h) => aoAbrirPerfil(h) : undefined}
                    aoDenunciar={handleDenunciar}
                    aoApagar={handleApagar}
                    aoAbrirHistoria={aoAbrirHistoria || ((id) => { window.location.href = `/historia/${id}`; })}
                  />
                ))
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--fg)', marginBottom: '8px' }}>
                    Nada por aqui ainda
                  </div>
                  <div>
                    {filtroFeed === 'seguindo'
                      ? 'Você ainda não segue ninguém. Quando seguir alguém, as resenhas dela aparecem aqui.'
                      : 'Nenhum arroto encontrado nesta lista. Solte o primeiro no bonde!'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. ABA ARENA / AUÊ (O Jogo Auê dentro da coluna central de 600px) */}
          {tab === 'arena' && (
            <div style={{ width: '100%', minHeight: 'calc(100vh - 53px)', display: 'flex', flexDirection: 'column' }}>
              <Arena
                codigoDoDesafio={desafioAtivoCodigo}
                onPostarNoBonde={(res) => {
                  if (!res?.arroto) {
                    avisar('Esse arroto não pode ser publicado agora. Arrote de novo.');
                    return;
                  }
                  handleMudarAba('feed');
                  setArrotoParaPublicar({ nota: res.nota, arroto: res.arroto });
                  setNovoTipoModal('audio');
                  setModalNovoAberto(true);
                  avisar(`Nota ${res.nota}! Escolha onde postar no Bonde.`);
                }}
              />
            </div>
          )}

          {/* 3. ABA COMUNIDADE */}
          {tab === 'comm' && (
            <AbaComunidades
              comunidades={comunidades}
              minhasComunidades={minhasComunidades}
              aoAlternarParticipacao={handleAlternarComunidade}
              aoFiltrarPorComunidade={(_slug) => {
                setFiltroFeed('todos');
                setTab('feed');
              }}
              comunidadeAtivaSlug={comunidadeAtivaSlug}
              causos={causos}
              aoPostarCauso={async (comuNome, texto) => {
                if (!contaLogada) {
                  pedirPromocao();
                  return false;
                }
                const res = await adaptador.postarCauso({
                  comunidadeSlug: comuNome,
                  autorNome: perfil.nome,
                  conteudo: texto,
                  consentimentoAudioPublico: false,
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
              aoAbrirConversaCauso={handleAbrirConversa}
              aoDenunciarCauso={handleDenunciar}
            />
          )}

          {/* 3. ABA DESAFIOS (O Jogo Auê entra aqui dentro) */}
          {tab === 'desafios' && (
            <AbaDesafios
              aoCriarDesafio={() => handleChamarDesafio()}
              aoRevanche={(d) => {
                setDesafioAtivoCodigo(d.codigo);
              }}
              aoCompartilhar={handleCompartilharDesafio}
              perfil={perfil}
              desafioAtivoCodigo={desafioAtivoCodigo}
              onPostarNoBonde={(res) => {
                if (!res?.arroto) {
                  avisar('Esse arroto não pode ser publicado agora. Arrote de novo.');
                  return;
                }
                setTab('feed');
                setArrotoParaPublicar({ nota: res.nota, arroto: res.arroto });
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
          aoMudarAba={handleMudarAba}
          aoAbrirPerfil={aoAbrirPerfil ? () => (contaLogada ? aoAbrirPerfil() : pedirPromocao()) : undefined}
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
                Post
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
                  <option value="bonde-geral">Feed</option>
                  {minhasComunidades
                    .filter((c) => c.toLowerCase() !== 'bonde-geral')
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>

                <textarea
                  value={novoTextoModal}
                  onChange={(e) => setNovoTextoModal(e.target.value)}
                  placeholder="O que tá rolando no bonde?"
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
                  Postar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalNovoCauso
        aberto={arrotoParaPublicar !== null}
        comunidades={comunidades}
        comunidadeAtualSlug={comunidadeAtivaSlug ?? undefined}
        apelidoInicial={perfil.nome}
        notaResultado={arrotoParaPublicar?.nota}
        onSubmit={handlePublicarArroto}
        onFechar={() => setArrotoParaPublicar(null)}
      />

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

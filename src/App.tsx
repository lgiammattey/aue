import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { criarContaWeb } from './plataforma/web/conta';
import { criarArmazenamentoWeb } from './plataforma/web/armazenamento';
import { criarTelemetriaWeb } from './plataforma/web/telemetria';

const ArenaV2 = lazy(() => import('./arena/v2/ArenaV2').then((m) => ({ default: m.ArenaV2 })));
const EntradaArenaLocalV2 = lazy(() => import('./arena/v2/EntradaArenaLocalV2').then((m) => ({ default: m.EntradaArenaLocalV2 })));
const EntradaDueloIntegrado = lazy(() => import('./arena/v2/EntradaDueloIntegrado').then((m) => ({ default: m.EntradaDueloIntegrado })));
const ChallengeView = lazy(() => import('./features/audio/ChallengeView').then((m) => ({ default: m.ChallengeView })));
const PoliticaDePrivacidade = lazy(() => import('./features/legal/PoliticaDePrivacidade').then((m) => ({ default: m.PoliticaDePrivacidade })));
const TermosDeUso = lazy(() => import('./features/legal/TermosDeUso').then((m) => ({ default: m.TermosDeUso })));
const ComoJogar = lazy(() => import('./features/publico/ComoJogar').then((m) => ({ default: m.ComoJogar })));
const ComoArrotar = lazy(() => import('./features/publico/ComoArrotar').then((m) => ({ default: m.ComoArrotar })));
const HomeEn = lazy(() => import('./features/publico/HomeEn').then((m) => ({ default: m.HomeEn })));
const TiposDeArroto = lazy(() => import('./features/publico/TiposDeArroto').then((m) => ({ default: m.TiposDeArroto })));
const RankingDeArrotos = lazy(() => import('./features/publico/RankingDeArrotos').then((m) => ({ default: m.RankingDeArrotos })));
const TelaComunidade = lazy(() => import('./features/comunidade/TelaComunidade').then((m) => ({ default: m.TelaComunidade })));
const TelaLanding = lazy(() => import('./features/publico/TelaLanding').then((m) => ({ default: m.TelaLanding })));
const TelaNaoEncontrada = lazy(() => import('./features/publico/TelaNaoEncontrada').then((m) => ({ default: m.TelaNaoEncontrada })));
const TelaVersoesWebapp = lazy(() => import('./features/publico/TelaVersoesWebapp').then((m) => ({ default: m.TelaVersoesWebapp })));
const InicioOpenDesign = lazy(() => import('./features/novo-aue/InicioOpenDesign').then((m) => ({ default: m.InicioOpenDesign })));
const TelaPerfilOpenDesign = lazy(() => import('./features/novo-aue/TelaPerfilOpenDesign').then((m) => ({ default: m.TelaPerfilOpenDesign })));
const TelaArenaEmBreveOpenDesign = lazy(() => import('./features/novo-aue/TelaArenaEmBreveOpenDesign').then((m) => ({ default: m.TelaArenaEmBreveOpenDesign })));
const TelaRedefinirSenha = lazy(() => import('./features/conta/TelaRedefinirSenha').then((m) => ({ default: m.TelaRedefinirSenha })));
const TelaGrupos = lazy(() => import('./features/grupos/TelaGrupos').then((m) => ({ default: m.TelaGrupos })));
const ConteudoDaHome = lazy(() => import('./arena/v2/ConteudoDaHome').then((m) => ({ default: m.ConteudoDaHome })));
const TopArrotadoresDaHome = lazy(() => import('./features/novo-aue/TopArrotadoresDaHome').then((m) => ({ default: m.TopArrotadoresDaHome })));
const TelaAdministracao = lazy(() => import('./features/administracao/TelaAdministracao').then((m) => ({ default: m.TelaAdministracao })));
const TelaHistoria = lazy(() => import('./features/comunidade/TelaHistoria').then((m) => ({ default: m.TelaHistoria })));
import { FLAGS } from './shared/flags';
import { AvisoDeOffline } from './shared/components/AvisoDeOffline';
import { AvisoMaioridade } from './shared/components/AvisoMaioridade';
import { carregarSocialBar } from './plataforma/web/adsterra';
import { Arena } from './arena/Arena';
import { enderecoDoLoginComVolta } from './nucleo/comunidade/caminhoDeVolta';
import { RastreadorDePaginas } from './features/telemetria/RastreadorDePaginas';

/** Leva ao login guardando a página atual, para a pessoa voltar a ela depois de entrar. */
function useIrParaLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  return (modo: 'cadastro' | 'entrar' = 'cadastro') =>
    navigate(enderecoDoLoginComVolta(location.pathname + location.search, modo));
}

/**
 * Abertura de desafio por link direto.
 */
function EntradaPorLink() {
  const { code } = useParams<{ code: string }>();
  return <Arena codigoDoDesafio={code} />;
}

function EntradaInicial({ incluirArenaNoTopo = false }: { readonly incluirArenaNoTopo?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [destino, setDestino] = useState<'inicio' | 'perfil' | null>(null);
  const [autenticado, setAutenticado] = useState(false);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ativo = true;
    const conta = criarContaWeb();
    conta
      .estado()
      .then((e) => {
        if (ativo) {
          setAutenticado(e.temSessao && !e.anonima && !e.perfilSocialPendente);
          setDestino(e.perfilSocialPendente ? 'perfil' : 'inicio');
        }
      })
      .catch(() => {
        if (ativo) { setAutenticado(false); setDestino('inicio'); }
      });
    return () => {
      ativo = false;
    };
  }, []);

  const focarArena = useCallback(() => {
    const container = arenaRef.current;
    if (!container) return;
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const botao = container.querySelector<HTMLButtonElement>('.arena-v2__gatilho');
    botao?.focus({ preventScroll: true });
  }, []);

  if (destino === null) {
    return null;
  }

  if (destino === 'perfil') {
    return <Navigate to="/perfil?boas-vindas=1" replace />;
  }

  const volta = new URLSearchParams(location.search).get('gravar') === '1' ? '/feed?gravar=1' : '/feed';
  const exibeArena = incluirArenaNoTopo && FLAGS.arenaV2;
  const slotArena = exibeArena ? (
    <div ref={arenaRef}>
      <Suspense fallback={null}>
        <EntradaDaArena modoEmbutido />
      </Suspense>
    </div>
  ) : undefined;

  return (
    <InicioOpenDesign
      autenticado={autenticado}
      aoEntrar={() => navigate(enderecoDoLoginComVolta(volta, 'entrar'))}
      slotArena={slotArena}
      aoFocarArena={exibeArena ? focarArena : undefined}
    />
  );
}

/** A faixa +18 fala o idioma da página em que a pessoa está. */
function AvisoMaioridadeDaRota() {
  const { pathname } = useLocation();
  return <AvisoMaioridade idioma={pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pt'} />;
}

function EntradaRaiz() {
  if (FLAGS.arenaV2) {
    return <EntradaDaArena conteudoDoRepouso={<ConteudoDaHome />} />;
  }
  return <EntradaInicial incluirArenaNoTopo />;
}

function EntradaDaArena({ conteudoDoRepouso, modoEmbutido = false }: { conteudoDoRepouso?: ReactNode; modoEmbutido?: boolean } = {}) {
  const { search } = useLocation();
  const adversarioHandle = new URLSearchParams(search).get('desafiar');
  const rankingDoHero = conteudoDoRepouso && !modoEmbutido && !adversarioHandle ? <TopArrotadoresDaHome variante="liga-hero" /> : undefined;
  if (FLAGS.dueloV2) {
    return <EntradaDueloIntegrado modo="criar" conteudoDoRepouso={conteudoDoRepouso} rankingDoHero={rankingDoHero} adversarioHandle={adversarioHandle} modoEmbutido={modoEmbutido} />;
  }
  return modoEmbutido
    ? <EntradaArenaLocalV2 modoEmbutido conteudoDoRepouso={conteudoDoRepouso} adversarioHandle={adversarioHandle} />
    : <ArenaV2 conteudoDoRepouso={conteudoDoRepouso} rankingDoHero={rankingDoHero} adversarioHandle={adversarioHandle} />;
}

function DueloIndisponivel() {
  return <main><h1>Desafio indisponível.</h1><p>Este desafio ainda não está disponível neste ambiente.</p><a href="/">Voltar para a Arena</a></main>;
}

function EntradaHistoria() {
  const navigate = useNavigate();
  const irParaLogin = useIrParaLogin();
  return <TelaHistoria onArrotar={() => navigate('/arena')} aoEntrar={() => irParaLogin()} />;
}

function EntradaDesafios() {
  const navigate = useNavigate();
  const irParaLogin = useIrParaLogin();
  return (
    <TelaComunidade initialTab="desafios" onArrotar={() => navigate('/arena')} aoAbrirPerfil={(handle) => navigate(handle ? `/u/${handle}` : '/perfil')}
      aoSair={() => navigate('/login')}
      aoEntrar={() => irParaLogin()} />
  );
}

function EntradaPerfil() {
  return <TelaPerfilOpenDesign />;
}

function EntradaPerfilHandle() {
  return <TelaPerfilOpenDesign />;
}

function EntradaSeguindo() {
  return <InicioOpenDesign viewInicial="seguindo" />;
}

export function App() {
  const [telemetriaDeNavegacao] = useState(() => criarTelemetriaWeb(criarArmazenamentoWeb()));

  useEffect(() => {
    carregarSocialBar();
  }, []);

  return (
    <>
      <AvisoDeOffline />
      <Router>
        <AvisoMaioridadeDaRota />
        <RastreadorDePaginas telemetria={telemetriaDeNavegacao} />
        <Suspense fallback={null}>
        <Routes>
          {/* Hub unificado (Arena + Mural) */}
          <Route path="/" element={<EntradaRaiz />} />
          <Route path="/feed" element={<EntradaInicial incluirArenaNoTopo />} />
          <Route path="/em-alta" element={<Navigate to="/" replace />} />
          <Route path="/seguindo" element={<EntradaSeguindo />} />

          {/* Arena de Arrotos (modo foco) */}
          <Route path="/arena/em-breve" element={<TelaArenaEmBreveOpenDesign />} />
          <Route path="/arena" element={FLAGS.arenaV2 ? <EntradaDaArena /> : <TelaArenaEmBreveOpenDesign />} />

          {/* Comunidades descontinuadas — tudo vai para o Mural unificado em / */}
          <Route path="/comunidade" element={<Navigate to="/" replace />} />
          <Route path="/bondes" element={<Navigate to="/" replace />} />
          <Route path="/comm" element={<Navigate to="/" replace />} />
          <Route path="/comunidades" element={<Navigate to="/" replace />} />
          <Route path="/explorar" element={<Navigate to="/" replace />} />
          <Route path="/c/:slug" element={<Navigate to="/" replace />} />
          <Route path="/c/:slug/novo" element={<Navigate to="/" replace />} />
          <Route path="/c/:slug/t/:id" element={<Navigate to="/" replace />} />
          <Route path="/comunidade/:slug" element={<Navigate to="/" replace />} />
          <Route path="/comunidades/:slug" element={<Navigate to="/" replace />} />
          <Route path="/topico/:id" element={<Navigate to="/" replace />} />
          <Route path="/t/:id" element={<Navigate to="/" replace />} />

          {/* Desafios e Duelos X1 */}
          <Route path="/desafios" element={<EntradaDesafios />} />
          <Route path="/x1/:code" element={<EntradaPorLink />} />
          <Route path="/b/:code" element={<EntradaPorLink />} />
          <Route path="/d/:id" element={<ChallengeView />} />
          <Route path="/duelo" element={FLAGS.arenaV2 && FLAGS.dueloV2 ? <EntradaDueloIntegrado modo="responder" /> : <DueloIndisponivel />} />

          {/* Perfil e Conta */}
          <Route path="/perfil" element={<EntradaPerfil />} />
          <Route path="/u/:handle" element={<EntradaPerfilHandle />} />
          <Route path="/perfil/:handle" element={<EntradaPerfilHandle />} />
          <Route path="/login" element={<InicioOpenDesign viewInicial="auth" />} />
          <Route path="/entrar" element={<Navigate to="/login" replace />} />
          <Route path="/redefinir-senha" element={<TelaRedefinirSenha />} />

          {/* Administração */}
          <Route path="/admin" element={<TelaAdministracao />} />

          {/* Resenhas e Histórias */}
          <Route path="/resenha/:id" element={<EntradaHistoria />} />
          <Route path="/historia/:id" element={<EntradaHistoria />} />
          <Route path="/conto/:id" element={<EntradaHistoria />} />

          {/* Páginas Públicas e Legais */}
          <Route path="/como-jogar" element={<ComoJogar />} />
          <Route path="/en" element={<HomeEn />} />
          <Route path="/como-arrotar" element={<ComoArrotar />} />
          <Route path="/tipos-de-arroto" element={<TiposDeArroto />} />
          <Route path="/ranking-de-arrotos" element={<RankingDeArrotos />} />
          <Route path="/ranking" element={<Navigate to="/ranking-de-arrotos" replace />} />
          <Route path="/videos-de-arroto" element={<Navigate to="/" replace />} />
          <Route path="/videos" element={<Navigate to="/" replace />} />
          <Route path="/privacidade" element={<PoliticaDePrivacidade />} />
          <Route path="/termos" element={<TermosDeUso />} />
          <Route path="/grupos" element={<TelaGrupos />} />
          {/* A página de /g/<slug>/ é estática (ADR 0004). Quem cai aqui é grupo que saiu do ar. */}
          <Route path="/g/:slug" element={<Navigate to="/grupos" replace />} />

          {/* Ambientes de Apoio e Design */}
          <Route path="/landing" element={<TelaLanding />} />
          <Route path="/versoes" element={<TelaVersoesWebapp />} />
          <Route path="/mobile" element={<Navigate to="/" replace />} />
          <Route path="/versao-mobile" element={<Navigate to="/" replace />} />

          {/* Fallback */}
          <Route path="*" element={<TelaNaoEncontrada />} />
        </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default App;

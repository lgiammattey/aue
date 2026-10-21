import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { criarContaWeb } from './plataforma/web/conta';

const ChallengeView = lazy(() => import('./features/audio/ChallengeView').then((m) => ({ default: m.ChallengeView })));
const PoliticaDePrivacidade = lazy(() => import('./features/legal/PoliticaDePrivacidade').then((m) => ({ default: m.PoliticaDePrivacidade })));
const TermosDeUso = lazy(() => import('./features/legal/TermosDeUso').then((m) => ({ default: m.TermosDeUso })));
const ComoJogar = lazy(() => import('./features/publico/ComoJogar').then((m) => ({ default: m.ComoJogar })));
const ComoArrotar = lazy(() => import('./features/publico/ComoArrotar').then((m) => ({ default: m.ComoArrotar })));
const TiposDeArroto = lazy(() => import('./features/publico/TiposDeArroto').then((m) => ({ default: m.TiposDeArroto })));
const RankingDeArrotos = lazy(() => import('./features/publico/RankingDeArrotos').then((m) => ({ default: m.RankingDeArrotos })));
const TelaComunidade = lazy(() => import('./features/comunidade/TelaComunidade').then((m) => ({ default: m.TelaComunidade })));
const TelaLanding = lazy(() => import('./features/comunidade/TelaLanding').then((m) => ({ default: m.TelaLanding })));
const TelaNaoEncontrada = lazy(() => import('./features/publico/TelaNaoEncontrada').then((m) => ({ default: m.TelaNaoEncontrada })));
const TelaVersoesWebapp = lazy(() => import('./features/comunidade/TelaVersoesWebapp').then((m) => ({ default: m.TelaVersoesWebapp })));
const InicioOpenDesign = lazy(() => import('./features/novo-aue/InicioOpenDesign').then((m) => ({ default: m.InicioOpenDesign })));
const TelaComunidadeOpenDesign = lazy(() => import('./features/novo-aue/TelaComunidadeOpenDesign').then((m) => ({ default: m.TelaComunidadeOpenDesign })));
const TelaDiretorioOpenDesign = lazy(() => import('./features/novo-aue/TelaDiretorioOpenDesign').then((m) => ({ default: m.TelaDiretorioOpenDesign })));
const TelaPerfilOpenDesign = lazy(() => import('./features/novo-aue/TelaPerfilOpenDesign').then((m) => ({ default: m.TelaPerfilOpenDesign })));
const TelaRedefinirSenha = lazy(() => import('./features/comunidade/TelaRedefinirSenha').then((m) => ({ default: m.TelaRedefinirSenha })));
const TelaGrupos = lazy(() => import('./features/grupos/TelaGrupos').then((m) => ({ default: m.TelaGrupos })));
const TelaAdministracao = lazy(() => import('./features/administracao/TelaAdministracao').then((m) => ({ default: m.TelaAdministracao })));
const TelaHistoria = lazy(() => import('./features/comunidade/TelaHistoria').then((m) => ({ default: m.TelaHistoria })));
import { AvisoDeOffline } from './shared/components/AvisoDeOffline';
import { Arena } from './arena/Arena';
import { enderecoDoLoginComVolta } from './nucleo/comunidade/caminhoDeVolta';
import { rotasDoForum } from './features/forum/rotas';

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

function EntradaInicial() {
  const navigate = useNavigate();
  const [destino, setDestino] = useState<'inicio' | 'perfil' | null>(null);
  const [autenticado, setAutenticado] = useState(false);

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

  if (destino === null) {
    return null;
  }

  if (destino === 'perfil') {
    return <Navigate to="/perfil?boas-vindas=1" replace />;
  }

  return <InicioOpenDesign autenticado={autenticado} aoEntrar={() => navigate(enderecoDoLoginComVolta('/', 'entrar'))} />;
}

function EntradaArena() {
  const navigate = useNavigate();
  const irParaLogin = useIrParaLogin();
  return (
    <TelaComunidade
      initialTab="arena"
      onArrotar={() => navigate('/arena')}
      aoAbrirHistoria={(id) => navigate(`/historia/${id}`)}
      aoAbrirPerfil={(handle) => navigate(handle ? `/u/${handle}` : '/perfil')}
      aoSair={() => navigate('/login')}
      aoEntrar={() => irParaLogin()}
    />
  );
}

function EntradaPrincipal() {
  const navigate = useNavigate();
  const irParaLogin = useIrParaLogin();
  const { state } = useLocation();
  const [perfilPendente, setPerfilPendente] = useState<boolean | null>(null);

  useEffect(() => {
    let ativo = true;
    criarContaWeb().estado().then(
      (conta) => {
        if (ativo) setPerfilPendente(Boolean(conta.perfilSocialPendente));
      },
      () => {
        if (ativo) setPerfilPendente(false);
      },
    );
    return () => {
      ativo = false;
    };
  }, []);

  if (perfilPendente === null) return null;
  if (perfilPendente) return <Navigate to="/perfil?boas-vindas=1" replace />;

  return (
    <TelaComunidade
      initialTab="feed"
      resultadoRecente={state?.resultadoRecente}
      onArrotar={() => navigate('/arena')}
      aoAbrirHistoria={(id) => navigate(`/historia/${id}`)}
      aoAbrirPerfil={(handle) => navigate(handle ? `/u/${handle}` : '/perfil')}
      aoSair={() => navigate('/login')}
      aoEntrar={() => irParaLogin()}
    />
  );
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

function EntradaEmAlta() {
  return <InicioOpenDesign viewInicial="emAlta" />;
}

/** Mantém links antigos de comunidades vivos, levando-os ao endereço novo equivalente. */
function AliasDeComunidade() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  return <Navigate to={`/c/${slug}${location.search}`} replace />;
}

export function App() {
  return (
    <>
      <AvisoDeOffline />
      <Router>
        <Suspense fallback={null}>
        <Routes>
          {/* Feed e Entrada Inteligente */}
          <Route path="/" element={<EntradaInicial />} />
          <Route path="/feed" element={<EntradaPrincipal />} />
          <Route path="/em-alta" element={<EntradaEmAlta />} />
          <Route path="/seguindo" element={<EntradaSeguindo />} />

          {/* Arena de Arrotos */}
          <Route path="/arena" element={<EntradaArena />} />

          {/* Comunidades (Open Design 1:1) */}
          <Route path="/comunidade" element={<Navigate to="/comunidades" replace />} />
          <Route path="/bondes" element={<Navigate to="/comunidades" replace />} />
          <Route path="/comm" element={<Navigate to="/comunidades" replace />} />
          <Route path="/comunidades" element={<TelaDiretorioOpenDesign />} />
          <Route path="/c/:slug" element={<TelaComunidadeOpenDesign />} />
          <Route path="/c/:slug/novo" element={<TelaComunidadeOpenDesign abrirCompositor />} />
          <Route path="/c/:slug/t/:id" element={<TelaComunidadeOpenDesign />} />
          {/* Sub-rotas do fórum como /explorar */}
          {rotasDoForum({ incluirRaizesDaComunidade: false, incluirTopico: false })}
          <Route path="/comunidade/:slug" element={<AliasDeComunidade />} />
          <Route path="/comunidades/:slug" element={<AliasDeComunidade />} />

          {/* Desafios e Duelos X1 */}
          <Route path="/desafios" element={<EntradaDesafios />} />
          <Route path="/x1/:code" element={<EntradaPorLink />} />
          <Route path="/b/:code" element={<EntradaPorLink />} />
          <Route path="/d/:id" element={<ChallengeView />} />

          {/* Perfil e Conta */}
          <Route path="/perfil" element={<EntradaPerfil />} />
          <Route path="/u/:handle" element={<EntradaPerfilHandle />} />
          <Route path="/perfil/:handle" element={<EntradaPerfilHandle />} />
          <Route path="/login" element={<InicioOpenDesign viewInicial="auth" />} />
          <Route path="/entrar" element={<Navigate to="/login" replace />} />
          <Route path="/redefinir-senha" element={<TelaRedefinirSenha />} />

          {/* Administração: a autorização real fica na RPC; esta rota não entra na navegação pública. */}
          <Route path="/admin" element={<TelaAdministracao />} />

          {/* Resenhas e Histórias */}
          <Route path="/resenha/:id" element={<EntradaHistoria />} />
          <Route path="/historia/:id" element={<EntradaHistoria />} />
          <Route path="/conto/:id" element={<EntradaHistoria />} />

          {/* Páginas Públicas e Legais */}
          <Route path="/como-jogar" element={<ComoJogar />} />
          <Route path="/como-arrotar" element={<ComoArrotar />} />
          <Route path="/tipos-de-arroto" element={<TiposDeArroto />} />
          <Route path="/ranking-de-arrotos" element={<RankingDeArrotos />} />
          <Route path="/ranking" element={<Navigate to="/ranking-de-arrotos" replace />} />
          <Route path="/videos-de-arroto" element={<Navigate to="/c/arrotos-youtube" replace />} />
          <Route path="/videos" element={<Navigate to="/c/arrotos-youtube" replace />} />
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

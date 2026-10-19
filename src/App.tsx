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
const VideosDeArroto = lazy(() => import('./features/publico/VideosDeArroto').then((m) => ({ default: m.VideosDeArroto })));
const TelaLogin = lazy(() => import('./features/comunidade/TelaLogin').then((m) => ({ default: m.TelaLogin })));
const TelaVersoesWebapp = lazy(() => import('./features/comunidade/TelaVersoesWebapp').then((m) => ({ default: m.TelaVersoesWebapp })));
const TelaPerfil = lazy(() => import('./features/perfil/TelaPerfil').then((m) => ({ default: m.TelaPerfil })));
const TelaRedefinirSenha = lazy(() => import('./features/comunidade/TelaRedefinirSenha').then((m) => ({ default: m.TelaRedefinirSenha })));
const TelaGrupos = lazy(() => import('./features/grupos/TelaGrupos').then((m) => ({ default: m.TelaGrupos })));
const TelaHistoria = lazy(() => import('./features/comunidade/TelaHistoria').then((m) => ({ default: m.TelaHistoria })));
import { AvisoDeOffline } from './shared/components/AvisoDeOffline';
import { Arena } from './arena/Arena';

/**
 * Abertura de desafio por link direto.
 */
function EntradaPorLink() {
  const { code } = useParams<{ code: string }>();
  return <Arena codigoDoDesafio={code} />;
}

function EntradaInicial() {
  const navigate = useNavigate();
  const [estaLogado, setEstaLogado] = useState<boolean | null>(null);

  useEffect(() => {
    let ativo = true;
    const conta = criarContaWeb();
    conta
      .estado()
      .then((e) => {
        if (ativo) {
          setEstaLogado(e.temSessao && !e.anonima);
        }
      })
      .catch(() => {
        if (ativo) setEstaLogado(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  if (estaLogado === null) {
    return null;
  }

  if (estaLogado) {
    return <EntradaPrincipal />;
  }

  return (
    <TelaLanding
      onEntrarSemConta={() => navigate('/feed')}
      onArrotar={() => navigate('/arena')}
    />
  );
}

function EntradaArena() {
  const navigate = useNavigate();
  return (
    <TelaComunidade
      initialTab="arena"
      onArrotar={() => navigate('/arena')}
      aoAbrirHistoria={(id) => navigate(`/historia/${id}`)}
      aoAbrirPerfil={(handle) => navigate(handle ? `/u/${handle}` : '/perfil')}
      aoSair={() => navigate('/login')}
      aoEntrar={() => navigate('/login?modo=cadastro')}
    />
  );
}

function EntradaPrincipal() {
  const navigate = useNavigate();
  const { state } = useLocation();
  return (
    <TelaComunidade
      initialTab="feed"
      resultadoRecente={state?.resultadoRecente}
      onArrotar={() => navigate('/arena')}
      aoAbrirHistoria={(id) => navigate(`/historia/${id}`)}
      aoAbrirPerfil={(handle) => navigate(handle ? `/u/${handle}` : '/perfil')}
      aoSair={() => navigate('/login')}
      aoEntrar={() => navigate('/login?modo=cadastro')}
    />
  );
}

function EntradaHistoria() {
  const navigate = useNavigate();
  return <TelaHistoria onArrotar={() => navigate('/arena')} aoEntrar={() => navigate('/login?modo=cadastro')} />;
}

function EntradaBondes() {
  const navigate = useNavigate();
  return (
    <TelaComunidade initialTab="comm" onArrotar={() => navigate('/arena')} aoAbrirPerfil={(handle) => navigate(handle ? `/u/${handle}` : '/perfil')}
      aoSair={() => navigate('/login')}
      aoEntrar={() => navigate('/login?modo=cadastro')} />
  );
}

function EntradaDesafios() {
  const navigate = useNavigate();
  return (
    <TelaComunidade initialTab="desafios" onArrotar={() => navigate('/arena')} aoAbrirPerfil={(handle) => navigate(handle ? `/u/${handle}` : '/perfil')}
      aoSair={() => navigate('/login')}
      aoEntrar={() => navigate('/login?modo=cadastro')} />
  );
}

function EntradaPerfil() {
  return <EntradaDoPerfil />;
}

function EntradaPerfilHandle() {
  const { handle } = useParams<{ handle: string }>();
  return <EntradaDoPerfil handle={handle} />;
}

function EntradaDoPerfil({ handle }: { handle?: string }) {
  const navigate = useNavigate();
  return (
    <TelaPerfil
      handle={handle}
      aoVoltar={() => navigate('/feed')}
      aoArrotar={() => navigate('/arena')}
      aoAbrirHistoria={(id) => navigate(`/historia/${id}`)}
      aoAbrirPerfil={(h) => navigate(`/u/${h}`)}
      aoEntrar={(modo) => navigate(modo === 'cadastro' ? '/login?modo=cadastro' : '/login')}
    />
  );
}

function EntradaComunidadeSlug() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  return (
    <TelaComunidade
      initialTab="comm"
      comunidadeSlugInicial={slug}
      onArrotar={() => navigate('/arena')}
      aoAbrirPerfil={(handle) => navigate(handle ? `/u/${handle}` : '/perfil')}
      aoSair={() => navigate('/login')}
      aoEntrar={() => navigate('/login?modo=cadastro')}
    />
  );
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

          {/* Arena de Arrotos */}
          <Route path="/arena" element={<EntradaArena />} />

          {/* Comunidades (Singular, Plural e Aliases) */}
          <Route path="/comunidade" element={<EntradaBondes />} />
          <Route path="/comunidades" element={<EntradaBondes />} />
          <Route path="/bondes" element={<EntradaBondes />} />
          <Route path="/comm" element={<Navigate to="/comunidade" replace />} />
          <Route path="/c/:slug" element={<EntradaComunidadeSlug />} />
          <Route path="/comunidade/:slug" element={<EntradaComunidadeSlug />} />
          <Route path="/comunidades/:slug" element={<EntradaComunidadeSlug />} />

          {/* Desafios e Duelos X1 */}
          <Route path="/desafios" element={<EntradaDesafios />} />
          <Route path="/x1/:code" element={<EntradaPorLink />} />
          <Route path="/b/:code" element={<EntradaPorLink />} />
          <Route path="/d/:id" element={<ChallengeView />} />

          {/* Perfil e Conta */}
          <Route path="/perfil" element={<EntradaPerfil />} />
          <Route path="/u/:handle" element={<EntradaPerfilHandle />} />
          <Route path="/perfil/:handle" element={<EntradaPerfilHandle />} />
          <Route path="/login" element={<TelaLogin />} />
          <Route path="/redefinir-senha" element={<TelaRedefinirSenha />} />

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
          <Route path="/videos-de-arroto" element={<VideosDeArroto />} />
          <Route path="/videos" element={<Navigate to="/videos-de-arroto" replace />} />
          <Route path="/privacidade" element={<PoliticaDePrivacidade />} />
          <Route path="/termos" element={<TermosDeUso />} />
          <Route path="/grupos" element={<TelaGrupos />} />
          {/* A página de /g/<slug>/ é estática (ADR 0004). Quem cai aqui é grupo que saiu do ar. */}
          <Route path="/g/:slug" element={<Navigate to="/grupos" replace />} />

          {/* Ambientes de Apoio e Design */}
          <Route path="/landing" element={<TelaLanding />} />
          <Route path="/versoes" element={<TelaVersoesWebapp />} />

          {/* Fallback */}
          <Route path="*" element={<EntradaPrincipal />} />
        </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default App;

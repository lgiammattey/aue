import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';

const ChallengeView = lazy(() => import('./features/audio/ChallengeView').then((m) => ({ default: m.ChallengeView })));
const PoliticaDePrivacidade = lazy(() => import('./features/legal/PoliticaDePrivacidade').then((m) => ({ default: m.PoliticaDePrivacidade })));
const TermosDeUso = lazy(() => import('./features/legal/TermosDeUso').then((m) => ({ default: m.TermosDeUso })));
const ComoJogar = lazy(() => import('./features/publico/ComoJogar').then((m) => ({ default: m.ComoJogar })));
const ComoArrotar = lazy(() => import('./features/publico/ComoArrotar').then((m) => ({ default: m.ComoArrotar })));
const TelaComunidade = lazy(() => import('./features/comunidade/TelaComunidade').then((m) => ({ default: m.TelaComunidade })));
const TelaLanding = lazy(() => import('./features/comunidade/TelaLanding').then((m) => ({ default: m.TelaLanding })));
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
  const jaVisitou = (() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      return Boolean(
        localStorage.getItem('aue.visitou') ||
        localStorage.getItem('aue.usuario.perfil.v1') ||
        localStorage.getItem('aue.causos.v2')
      );
    } catch {
      return false;
    }
  })();

  if (jaVisitou) {
    return <EntradaPrincipal />;
  }

  return (
    <TelaLanding
      onEntrarSemConta={() => {
        try { localStorage.setItem('aue.visitou', 'true'); } catch {}
        navigate('/feed');
      }}
      onArrotar={() => {
        try { localStorage.setItem('aue.visitou', 'true'); } catch {}
        navigate('/arena');
      }}
    />
  );
}

function EntradaArena() {
  const navigate = useNavigate();
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--bg, #000000)' }}>
      {/* Botão de retorno rápido para o Feed */}
      <button
        type="button"
        className="voltar-pro-feed"
        onClick={() => navigate('/feed')}
        aria-label="Voltar para o Feed"
      >
        <span aria-hidden="true">←</span>
        <span>Voltar pro Feed</span>
      </button>

      <Arena
        onPostarNoBonde={(resultado) => {
          // Sem o arroto inteiro não há o que publicar com nota e áudio: o Bonde
          // avisa em vez de postar um causo "com nota" que o servidor não conhece.
          navigate('/feed', { state: { resultadoRecente: resultado } });
        }}
      />
    </div>
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
      aoEntrar={() => navigate('/login')}
    />
  );
}

function EntradaHistoria() {
  const navigate = useNavigate();
  return <TelaHistoria onArrotar={() => navigate('/arena')} />;
}

function EntradaBondes() {
  const navigate = useNavigate();
  return (
    <TelaComunidade initialTab="comm" onArrotar={() => navigate('/arena')} aoAbrirPerfil={(handle) => navigate(handle ? `/u/${handle}` : '/perfil')}
      aoSair={() => navigate('/login')}
      aoEntrar={() => navigate('/login')} />
  );
}

function EntradaDesafios() {
  const navigate = useNavigate();
  return (
    <TelaComunidade initialTab="desafios" onArrotar={() => navigate('/arena')} aoAbrirPerfil={(handle) => navigate(handle ? `/u/${handle}` : '/perfil')}
      aoSair={() => navigate('/login')}
      aoEntrar={() => navigate('/login')} />
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
      aoEntrar={() => navigate('/login')}
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
          {/*
            Auê 3.0 / Bonde do Arroto - Feed, Comunidade e Desafios (com o Jogo Auê)
            Desktop em 3 colunas, Tablet com ícones, Mobile com barra inferior.
          */}
          <Route path="/" element={<EntradaInicial />} />
          <Route path="/feed" element={<EntradaPrincipal />} />
          <Route path="/arena" element={<EntradaArena />} />
          <Route path="/bondes" element={<EntradaBondes />} />
          <Route path="/c/:slug" element={<EntradaComunidadeSlug />} />
          <Route path="/comunidade/:slug" element={<EntradaComunidadeSlug />} />
          <Route path="/desafios" element={<EntradaDesafios />} />
          <Route path="/perfil" element={<EntradaPerfil />} />
          <Route path="/perfil/:handle" element={<EntradaPerfilHandle />} />
          <Route path="/u/:handle" element={<EntradaPerfilHandle />} />
          <Route path="/comunidade" element={<EntradaBondes />} />
          <Route path="/landing" element={<TelaLanding />} />
          <Route path="/login" element={<TelaLogin />} />
          <Route path="/redefinir-senha" element={<TelaRedefinirSenha />} />
          <Route path="/versoes" element={<TelaVersoesWebapp />} />
          <Route path="/historia/:id" element={<EntradaHistoria />} />
          <Route path="/conto/:id" element={<EntradaHistoria />} />

          {/* Duelos e batalhas */}
          <Route path="/b/:code" element={<EntradaPorLink />} />
          <Route path="/d/:id" element={<ChallengeView />} />

          {/* Páginas públicas e legais */}
          <Route path="/privacidade" element={<PoliticaDePrivacidade />} />
          <Route path="/termos" element={<TermosDeUso />} />
          <Route path="/como-jogar" element={<ComoJogar />} />
          <Route path="/como-arrotar" element={<ComoArrotar />} />
          <Route path="/grupos" element={<TelaGrupos />} />
          {/* A página de /g/<slug>/ é estática (ADR 0004). Quem cai aqui é grupo que saiu do ar. */}
          <Route path="/g/:slug" element={<Navigate to="/grupos" replace />} />

          {/* Fallback */}
          <Route path="*" element={<EntradaPrincipal />} />
        </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default App;

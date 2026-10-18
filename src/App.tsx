import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';

import { ChallengeView } from './features/audio/ChallengeView';
import { PoliticaDePrivacidade } from './features/legal/PoliticaDePrivacidade';
import { TermosDeUso } from './features/legal/TermosDeUso';
import { ComoJogar } from './features/publico/ComoJogar';
import { ComoArrotar } from './features/publico/ComoArrotar';
import { TelaComunidade } from './features/comunidade/TelaComunidade';
import { TelaLanding } from './features/comunidade/TelaLanding';
import { TelaLogin } from './features/comunidade/TelaLogin';
import { TelaVersoesWebapp } from './features/comunidade/TelaVersoesWebapp';
import { TelaHistoria } from './features/comunidade/TelaHistoria';
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
        onClick={() => navigate('/feed')}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 9999,
          background: 'var(--surface-2, #1c1c1e)',
          color: 'var(--fg, #ffffff)',
          border: '1px solid var(--border-strong, #3a3a3c)',
          borderRadius: '999px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '13px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
        aria-label="Voltar para o Feed"
      >
        <span aria-hidden="true">←</span>
        <span>Voltar pro Feed</span>
      </button>

      <Arena
        onPostarNoBonde={(resultado) => {
          navigate('/feed', { state: { resultadoRecente: resultado } });
        }}
      />
    </div>
  );
}

function EntradaPrincipal() {
  const navigate = useNavigate();
  return (
    <TelaComunidade
      initialTab="feed"
      onArrotar={() => navigate('/arena')}
      aoAbrirHistoria={(id) => navigate(`/historia/${id}`)}
    />
  );
}

function EntradaHistoria() {
  const navigate = useNavigate();
  return <TelaHistoria onArrotar={() => navigate('/arena')} />;
}

function EntradaBondes() {
  const navigate = useNavigate();
  return <TelaComunidade initialTab="comm" onArrotar={() => navigate('/arena')} />;
}

function EntradaDesafios() {
  const navigate = useNavigate();
  return <TelaComunidade initialTab="desafios" onArrotar={() => navigate('/arena')} />;
}

function EntradaPerfil() {
  const navigate = useNavigate();
  return <TelaComunidade initialTab="feed" onArrotar={() => navigate('/arena')} />;
}

function EntradaPerfilHandle() {
  const navigate = useNavigate();
  return <TelaComunidade initialTab="feed" onArrotar={() => navigate('/arena')} />;
}

function EntradaComunidadeSlug() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  return (
    <TelaComunidade
      initialTab="comm"
      comunidadeSlugInicial={slug}
      onArrotar={() => navigate('/arena')}
    />
  );
}

export function App() {
  return (
    <>
      <AvisoDeOffline />
      <Router>
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

          {/* Fallback */}
          <Route path="*" element={<EntradaPrincipal />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;

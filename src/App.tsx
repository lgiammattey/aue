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
import { AvisoDeOffline } from './shared/components/AvisoDeOffline';
import { Arena } from './arena/Arena';

/**
 * Abertura de desafio por link direto.
 */
function EntradaPorLink() {
  const { code } = useParams<{ code: string }>();
  return <Arena codigoDoDesafio={code} />;
}

function EntradaPrincipal() {
  const navigate = useNavigate();
  return <TelaComunidade initialTab="feed" onArrotar={() => navigate('/arena')} />;
}

function EntradaArena() {
  const navigate = useNavigate();
  return <TelaComunidade initialTab="arena" onArrotar={() => navigate('/arena')} />;
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
  return <TelaComunidade initialTab="perfil" onArrotar={() => navigate('/arena')} />;
}

export function App() {
  return (
    <>
      <AvisoDeOffline />
      <Router>
        <Routes>
          {/*
            Auê 3.0 / Bonde do Arroto - Implementação 1:1 do Protótipo
            Desktop em 3 colunas, Tablet com ícones, Mobile com barra inferior.
          */}
          <Route path="/" element={<EntradaPrincipal />} />
          <Route path="/feed" element={<EntradaPrincipal />} />
          <Route path="/arena" element={<EntradaArena />} />
          <Route path="/bondes" element={<EntradaBondes />} />
          <Route path="/desafios" element={<EntradaDesafios />} />
          <Route path="/perfil" element={<EntradaPerfil />} />
          <Route path="/comunidade" element={<EntradaPrincipal />} />
          <Route path="/landing" element={<TelaLanding />} />
          <Route path="/login" element={<TelaLogin />} />
          <Route path="/versoes" element={<TelaVersoesWebapp />} />

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

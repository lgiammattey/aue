import { lazy, Suspense, useEffect, useState } from 'react';
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
const TelaAdministracao = lazy(() => import('./features/administracao/TelaAdministracao').then((m) => ({ default: m.TelaAdministracao })));
const TelaHistoria = lazy(() => import('./features/comunidade/TelaHistoria').then((m) => ({ default: m.TelaHistoria })));
import { FLAGS } from './shared/flags';
import { AvisoDeOffline } from './shared/components/AvisoDeOffline';
import { AvisoMaioridade } from './shared/components/AvisoMaioridade';
import { analyticsArenaV2Em } from './plataforma/web/analyticsArenaV2';
import { definirIdiomaETitulo, marcarPaginaNaoIndexavel } from './plataforma/web/documento';
import { InicioM05 } from './features/m05/InicioM05';
import type { AnexoRascunho } from './features/novo-aue/ModalCompositor';
import { AnuncioM05 } from './features/m05/AnuncioM05';
import { areaDaNavegacaoM05 } from './features/m05/areaDaNavegacaoM05';
import { MolduraM05, NavegacaoM05 } from './features/m05/NavegacaoM05';
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

type RascunhoDaArena = Extract<AnexoRascunho, { tipo: 'audio' }>;
type AoPublicarDaArena = (audio: Blob, nota: number | null, duracaoMs: number) => void;

function EntradaInicial({ rascunho, aoFecharRascunho }: {
  readonly rascunho: RascunhoDaArena | null;
  readonly aoFecharRascunho: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
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

  const solicitouPublicar = new URLSearchParams(location.search).get('publicar') === '1';
  if (rascunho && solicitouPublicar && !autenticado) {
    return <Navigate to={enderecoDoLoginComVolta('/feed?publicar=1', 'entrar')} replace />;
  }
  const volta = location.pathname + location.search;
  return (
    <InicioOpenDesign
      autenticado={autenticado}
      aoEntrar={() => navigate(enderecoDoLoginComVolta(volta, 'entrar'))}
      experienciaM05
      anexoDaArena={solicitouPublicar ? rascunho : null}
      aoFecharAnexoDaArena={aoFecharRascunho}
    />
  );
}

function EntradaRaiz() {
  const { search } = useLocation();
  const parametros = new URLSearchParams(search);
  if (parametros.get('gravar') === '1') return <Navigate to={`/feed${search}`} replace />;
  if (parametros.has('desafiar')) return <Navigate to={`/arena${search}`} replace />;

  return (
    <MolduraM05>
      <InicioM05>
        <Suspense fallback={null}><ConteudoDaHome comAnuncio={false} /></Suspense>
      </InicioM05>
    </MolduraM05>
  );
}

function ArenaEmIngles({ aoPublicarAudio }: { readonly aoPublicarAudio: AoPublicarDaArena }) {
  useEffect(() => definirIdiomaETitulo('en', 'Record a burp | Auê'), []);
  return (
    <MolduraM05 idioma="en">
      <ArenaV2 experienciaM05 idioma="en" aoPublicarAudio={aoPublicarAudio} telemetria={analyticsArenaV2Em} conteudoAposResultado={<AnuncioM05 area="resultado" idioma="en" />} />
    </MolduraM05>
  );
}

function EntradaDaArena({ aoPublicarAudio }: { readonly aoPublicarAudio: AoPublicarDaArena }) {
  const { search } = useLocation();
  const parametros = new URLSearchParams(search);
  const adversarioHandle = parametros.get('desafiar');
  if (parametros.get('lang') === 'en') return <ArenaEmIngles aoPublicarAudio={aoPublicarAudio} />;
  if (!FLAGS.arenaV2) return <TelaArenaEmBreveOpenDesign />;

  const conteudoAposResultado = <AnuncioM05 area="resultado" />;
  return (
    <MolduraM05>
      {FLAGS.dueloV2
        ? <EntradaDueloIntegrado experienciaM05 modo="criar" aoPublicarAudio={aoPublicarAudio} conteudoAposResultado={conteudoAposResultado} adversarioHandle={adversarioHandle} />
        : <EntradaArenaLocalV2 experienciaM05 aoPublicarAudio={aoPublicarAudio} conteudoAposResultado={conteudoAposResultado} adversarioHandle={adversarioHandle} />}
    </MolduraM05>
  );
}

function EntradaDisputas() {
  useEffect(() => marcarPaginaNaoIndexavel('Disputas | Auê'), []);
  return (
    <MolduraM05>
      {FLAGS.arenaV2 && FLAGS.dueloV2
        ? <EntradaDueloIntegrado experienciaM05 modo="criar" telaInicial="meus" />
        : <DueloIndisponivel />}
    </MolduraM05>
  );
}

function DueloIndisponivel() {
  return <main className="m05-estado"><h1>Desafio indisponível.</h1><p>Este desafio ainda não está disponível neste ambiente.</p><a href="/arena">Voltar para a Arena</a></main>;
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

function EntradaSeguindo() {
  return <InicioOpenDesign viewInicial="seguindo" experienciaM05 />;
}

export function App() {
  const [telemetriaDeNavegacao] = useState(() => criarTelemetriaWeb(criarArmazenamentoWeb()));

  return (
    <>
      <AvisoDeOffline />
      <Router>
        <RastreadorDePaginas telemetria={telemetriaDeNavegacao} />
        <RotasDoApp />
      </Router>
    </>
  );
}

function RotasDoApp() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [rascunho, setRascunho] = useState<RascunhoDaArena | null>(null);
  const caminho = pathname.replace(/\/+$/, '') || '/';
  const ingles = caminho === '/en' || (caminho === '/arena' && new URLSearchParams(search).get('lang') === 'en');
  const temNavegacao = areaDaNavegacaoM05(caminho) !== null;

  useEffect(() => {
    const params = new URLSearchParams(search);
    const naPublicacao = caminho === '/feed' && params.get('publicar') === '1';
    const entrando = caminho === '/login' && params.get('volta') === '/feed?publicar=1';
    const concluindoPerfil = caminho === '/perfil' && params.get('boas-vindas') === '1';
    if (!naPublicacao && !entrando && !concluindoPerfil) setRascunho(null);
  }, [caminho, search]);

  const publicarDaArena: AoPublicarDaArena = (audio, _nota, duracaoMs) => {
    setRascunho({ tipo: 'audio', arquivo: audio, duracaoMs });
    navigate('/feed?publicar=1');
  };
  const fecharRascunho = () => {
    setRascunho(null);
    if (new URLSearchParams(search).get('publicar') === '1') navigate('/feed', { replace: true });
  };

  return (
    <div className={temNavegacao ? 'm05-app' : 'app-rotas'}>
      <AvisoMaioridade idioma={ingles ? 'en' : 'pt'} />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<EntradaRaiz />} />
          <Route path="/feed" element={<EntradaInicial rascunho={rascunho} aoFecharRascunho={fecharRascunho} />} />
          <Route path="/em-alta" element={<Navigate to="/" replace />} />
          <Route path="/seguindo" element={<EntradaSeguindo />} />

          {/* Arena de Arrotos (modo foco) */}
          <Route path="/arena/em-breve" element={<TelaArenaEmBreveOpenDesign />} />
          <Route path="/arena" element={<EntradaDaArena aoPublicarAudio={publicarDaArena} />} />

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
          <Route path="/disputas" element={<EntradaDisputas />} />
          <Route path="/desafios" element={<EntradaDesafios />} />
          <Route path="/x1/:code" element={<EntradaPorLink />} />
          <Route path="/b/:code" element={<EntradaPorLink />} />
          <Route path="/d/:id" element={<ChallengeView />} />
          <Route path="/duelo" element={FLAGS.arenaV2 && FLAGS.dueloV2 ? <MolduraM05><EntradaDueloIntegrado experienciaM05 modo="responder" /></MolduraM05> : <DueloIndisponivel />} />

          {/* Perfil e Conta */}
          <Route path="/perfil" element={<TelaPerfilOpenDesign experienciaM05 />} />
          <Route path="/u/:handle" element={<TelaPerfilOpenDesign experienciaM05 />} />
          <Route path="/perfil/:handle" element={<TelaPerfilOpenDesign experienciaM05 />} />
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
          <Route path="/en" element={<MolduraM05 idioma="en"><HomeEn /></MolduraM05>} />
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
      {temNavegacao && <NavegacaoM05 mobile idioma={ingles ? 'en' : 'pt'} />}
    </div>
  );
}

export default App;
